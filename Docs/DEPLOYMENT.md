# AidFlow — Complete Render Deployment Guide

This document covers the **complete, step-by-step production deployment** of AidFlow on Render.
It was written based on the actual deployment process and includes every issue encountered and how to fix it.

---

## Overview — What You Are Deploying

AidFlow has 7 moving parts that all need to be connected:

| # | Service | Platform | Cost |
|---|---|---|---|
| 1 | MongoDB Atlas | External (cloud) | Free M0 tier |
| 2 | Redis (Key Value) | Render | Free tier |
| 3 | Backend API + Workers | Render Web Service | Starter $7/mo |
| 4 | Eligibility AI Agent | Render Web Service | Free tier |
| 5 | Fraud AI Agent | Render Web Service | Free tier |
| 6 | Risk AI Agent | Render Web Service | Free tier |
| 7 | Proof AI Agent | Render Web Service | Free tier (Docker) |
| 8 | Frontend | Render Static Site | Free tier |
| — | Blockchain Contract | Polygon Amoy testnet | Free (testnet) |

**Workers note:** Background workers run in-process with the backend (same service, same Starter plan).
The `STANDALONE_WORKERS` env var controls this — when not set, workers start automatically with the server.
This saves $7/mo vs running a separate Background Worker service.

---

## Prerequisites

Before starting, make sure you have:

- Node.js 20+ installed locally
- Git repo pushed to GitHub
- `blockchain/` dependencies installed: `cd blockchain && npm install`

---

## Step 1 — Deploy Smart Contract (One-Time)

The blockchain contract is deployed **once** to Polygon Amoy testnet.
It never needs to be redeployed unless you want to reset the audit trail.

### 1a. Update hardhat.config.js for testnet support

The file at `blockchain/hardhat.config.js` must include Amoy network config:

```javascript
require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {},
    amoy: {
      url: process.env.RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};
```

### 1b. Generate a fresh deployer wallet

Run this from the `blockchain/` directory (after `npm install`):

```bash
node -e "const {ethers} = require('ethers'); const w = ethers.Wallet.createRandom(); console.log('Address:', w.address); console.log('Private Key:', w.privateKey)"
```

Output will look like:
```
Address: 0xba51BCfc1f082Ff4a8A9f587DaF87A796b40C2f6
Private Key: 0xcf0f8f6e...
```

**Save both values. The private key is your BLOCKCHAIN_PRIVATE_KEY for the backend.**
Never use the publicly known Hardhat default key (`0xac0974...`) on any real network.

### 1c. Get a free RPC endpoint from Alchemy

**Why Alchemy?**
Polygon Amoy is a public testnet. You need an RPC endpoint to send transactions to it.
Alchemy provides free RPC access with 300M compute units/month — more than enough.

**Steps:**
1. Go to [https://alchemy.com](https://alchemy.com) → Sign up (free)
2. Dashboard → **Create new app**
3. Chain: **Polygon** → Network: **Polygon Amoy**
4. Click your app → **API Key** tab → copy the **HTTPS** URL

It looks like:
```
https://polygon-amoy.g.alchemy.com/v2/your-api-key-here
```

### 1d. Get free testnet MATIC (gas money)

Your deployer wallet needs MATIC to pay gas for the contract deployment.

1. Go to [https://faucet.polygon.technology](https://faucet.polygon.technology)
2. Select network: **Amoy**
3. Paste your wallet **address** from step 1b
4. Click **Submit** — you'll receive ~0.5 MATIC (enough for dozens of deploys)
5. Verify it arrived: [https://amoy.polygonscan.com/address/YOUR_ADDRESS](https://amoy.polygonscan.com)

### 1e. Fill in blockchain/.env

```env
PRIVATE_KEY=0xcf0f8f6e...   # your wallet private key from step 1b
RPC_URL=https://polygon-amoy.g.alchemy.com/v2/your-key   # from step 1c
AUDIT_CONTRACT_ADDRESS=     # leave blank — fill after deploy
ETHERSCAN_API_KEY=          # leave blank for testnet
```

### 1f. Deploy the contract

```bash
cd blockchain
npx hardhat run scripts/deploy.js --network amoy
```

Expected output:
```
Deploying AidFlowAudit contract...
AidFlowAudit deployed to: 0x93698A8482B349Cb5Dcd1511f3b1041678770344
```

Fill in `blockchain/.env` with the deployed address:
```env
AUDIT_CONTRACT_ADDRESS=0x93698A8482B349Cb5Dcd1511f3b1041678770344
```

Verify on block explorer: [https://amoy.polygonscan.com](https://amoy.polygonscan.com) → paste contract address.

**Save these three values for later (backend env vars):**
```
RPC_URL=https://polygon-amoy.g.alchemy.com/v2/your-key
AUDIT_CONTRACT_ADDRESS=0x93698A8482B349Cb5Dcd1511f3b1041678770344
BLOCKCHAIN_PRIVATE_KEY=0xcf0f8f6e...
```

---

## Step 2 — MongoDB Atlas Setup

**Why Atlas?**
This app uses MongoDB multi-document transactions (donation approval, wallet creation).
Transactions require a **replica set** — Atlas clusters are always replica sets.
A plain single-node `mongod` will throw `Transaction numbers are only allowed on a replica set member`.

### 2a. Create a free cluster

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) → Sign up / log in
2. **Create a new project** → name it `AidFlow`
3. **Build a Database** → choose **M0 Free** tier
4. Provider: AWS → Region: pick closest to you
5. Cluster name: `aidflow-cluster` → **Create**

### 2b. Create a database user

1. Left sidebar → **Database Access** → **Add New Database User**
2. Authentication: **Password**
3. Username: `aidflow_admin`
4. Password: **Autogenerate Secure Password** → **Copy** it
5. Role: **Atlas Admin**
6. **Add User**

### 2c. Allow all IPs (required for Render)

Render uses dynamic IPs — you cannot whitelist a specific one.

1. Left sidebar → **Network Access** → **Add IP Address**
2. Click **Allow Access from Anywhere** → confirms `0.0.0.0/0`
3. **Confirm**

### 2d. Get the connection string

1. Left sidebar → **Database** → **Connect** on your cluster
2. **Drivers** → Driver: Node.js → Version: 5.5 or later
3. Copy the connection string and **add the database name** before `?`:

```
mongodb+srv://aidflow_admin:YOUR_PASSWORD@aidflow-cluster.xxxxx.mongodb.net/aidflow?retryWrites=true&w=majority
```

**Save this — it goes into MONGO_URI in backend AND proof_agent env vars.**

---

## Step 3 — Redis (Key Value) on Render

### 3a. Create Key Value instance

1. Render Dashboard → **New +** → **Key Value**
2. Name: `aidflow-redis`
3. Region: same as your other services (e.g. Oregon US West)
4. Plan: **Free**
5. **Create Key Value**

### 3b. Copy the Internal URL

After it creates (~1 min):
1. Click on `aidflow-redis`
2. Copy the **Internal Redis URL** — looks like:
   ```
   redis://red-xxxxxxxxxxxxxxxxxx:6379
   ```

### 3c. Set max memory policy

Render → `aidflow-redis` → **Settings** → **Max Memory Policy** → set to **noeviction**

**Why noeviction?**
BullMQ stores queued jobs in Redis. If Redis runs out of memory and starts evicting keys,
it can silently drop queued donations/jobs. `noeviction` makes it return an error instead
so you know what happened rather than silently losing data.

**Save the Internal URL as REDIS_URL for backend env vars.**

---

## Step 4 — Backend API + Workers

### 4a. Code change required — Redis config

Render gives a single `REDIS_URL` but the original code used `REDIS_HOST` + `REDIS_PORT`.
This was fixed in `backend/src/config/redis.config.js`:

```javascript
// Reads from process.env directly (not env object) because this file is
// imported very early — before dotenv finishes injecting values.
const REDIS_URL = process.env.REDIS_URL;
const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379", 10);

export const redisConnection = REDIS_URL
  ? new IORedis(REDIS_URL, { maxRetriesPerRequest: null })
  : new IORedis({ host: REDIS_HOST, port: REDIS_PORT, maxRetriesPerRequest: null });
```

**Why process.env directly?**
`app.js` → `queue-dashboard.js` → queues → `redis.config.js` — this import chain runs
before `dotenv.config()` has finished. Reading from `process.env` directly works because
Node resolves it lazily at access time, not at import time.

### 4b. Workers run in-process (no separate service needed)

Workers are started inside `server.js` automatically when `STANDALONE_WORKERS` is not set:

```javascript
if (process.env.STANDALONE_WORKERS !== "true") {
  // imports and starts all workers + scheduler in the same process
}
```

This means one Starter service runs both the API and all workers.
If you later want to scale workers independently, set `STANDALONE_WORKERS=true` on the backend
and create a separate Background Worker service with start command `node src/workers/index.js`.

### 4c. Create Web Service on Render

**Important:** Render detects the `backend/Dockerfile` and defaults to Docker runtime.
Docker runtime does NOT inject Render dashboard env vars the same way — use **Node runtime**.

If Render forces Docker (because it detects the Dockerfile):
- Temporarily rename `backend/Dockerfile` to `backend/Dockerfile.bak`, push, create service, then rename back.
- Or: delete the service and recreate — Render asks "use Dockerfile?" — select No.

**New +** → **Web Service** → connect GitHub repo

| Setting | Value |
|---|---|
| Name | `aidflow-backend` |
| Root Directory | `backend` |
| Runtime | `Node` (NOT Docker) |
| Build Command | `npm ci --omit=dev` |
| Start Command | `node server.js` |
| Plan | Starter ($7/mo) — free tier sleeps, unacceptable for a backend |

### 4d. Environment Variables

Set ALL of these in Render → `aidflow-backend` → **Environment**:

```
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://aidflow-frontend.onrender.com

MONGO_URI=mongodb+srv://aidflow_admin:PASSWORD@cluster.mongodb.net/aidflow?retryWrites=true&w=majority

JWT_SECRET=<generate: openssl rand -hex 64>
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
QR_SECRET=<generate: openssl rand -hex 32>
PII_HASH_SECRET=<generate: openssl rand -hex 32>

REDIS_URL=redis://red-xxxxxxxxxxxxxxxxxx:6379

AI_ELIGIBILITY_URL=https://aidflow-eligibility-agent.onrender.com
AI_FRAUD_URL=https://aidflow-fraud-agent.onrender.com
AI_RISK_URL=https://aidflow-risk-agent.onrender.com
AI_PROOF_URL=https://aidflow-proof-agent.onrender.com

STORAGE_TYPE=LOCAL
UPLOAD_PATH=./uploads/proofs
BACKEND_PUBLIC_URL=https://YOUR-BACKEND-URL.onrender.com

RPC_URL=https://polygon-amoy.g.alchemy.com/v2/your-key
AUDIT_CONTRACT_ADDRESS=0x93698A8482B349Cb5Dcd1511f3b1041678770344
BLOCKCHAIN_PRIVATE_KEY=0xcf0f8f6e...
```

**Generate secrets locally:**
```bash
openssl rand -hex 64   # for JWT_SECRET
openssl rand -hex 32   # for QR_SECRET
openssl rand -hex 32   # for PII_HASH_SECRET
```

QR_SECRET must NOT equal JWT_SECRET — the app refuses to boot if they match.

### 4e. Verify successful deploy

Build log should end with:
```
MongoDB connected
[DonationWorker] Worker started and listening for jobs
Wallet expiry worker started
Fraud detection worker started
BLOCKCHAIN_READY contract=0x93698...
Workers started in-process
AidFlow server running on port 5000
Your service is live
```

Health check:
```
https://YOUR-BACKEND-URL.onrender.com/health
```

Expected response:
```json
{"status":"OK","service":"AidFlow Backend","timestamp":"..."}
```

**Note your actual backend URL** — Render may assign `aidflow-XXXX.onrender.com` instead of
`aidflow-backend.onrender.com`. Update `BACKEND_PUBLIC_URL` and `VITE_API_BASE_URL` with the real URL.

---

## Step 5 — 4 AI Agents

Each agent is a separate Web Service. Three are lightweight Python services (free tier).
One (proof_agent) uses Docker because it needs the Tesseract OCR system package.

### Agent 1 — Eligibility Agent

**New +** → **Web Service** → same repo

| Setting | Value |
|---|---|
| Name | `aidflow-eligibility-agent` |
| Root Directory | `ai-agents/eligibility_agent` |
| Runtime | `Python 3` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn main:app --host 0.0.0.0 --port 8001` |
| Plan | Free |

No environment variables needed.

**What it does:** Checks if a beneficiary meets eligibility criteria (age, location, need category).

### Agent 2 — Fraud Agent

| Setting | Value |
|---|---|
| Name | `aidflow-fraud-agent` |
| Root Directory | `ai-agents/fraud_agent` |
| Runtime | `Python 3` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn main:app --host 0.0.0.0 --port 8002` |
| Plan | Free |

No environment variables needed.

**What it does:** Detects fraud patterns in donations (unusual amounts, velocity, source patterns).

### Agent 3 — Risk Agent

| Setting | Value |
|---|---|
| Name | `aidflow-risk-agent` |
| Root Directory | `ai-agents/risk_agent` |
| Runtime | `Python 3` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn main:app --host 0.0.0.0 --port 8003` |
| Plan | Free |

No environment variables needed.

**What it does:** Scores overall risk level for a donation (combines multiple signals).

### Agent 4 — Proof Agent (Docker)

**Why Docker?**
`proof_agent` needs `tesseract-ocr` — a system binary not installable via pip.
The `Dockerfile` at `ai-agents/proof_agent/Dockerfile` already installs it via `apt-get`.
Render's Docker runtime handles this automatically.

| Setting | Value |
|---|---|
| Name | `aidflow-proof-agent` |
| Root Directory | `ai-agents/proof_agent` |
| Runtime | `Docker` |
| Plan | Free |

**Environment Variables for proof_agent:**
```
MONGO_URI=mongodb+srv://aidflow_admin:PASSWORD@cluster.mongodb.net/aidflow?retryWrites=true&w=majority
AI_PROOF_PORT=8004
```

**What it does:** OCR on uploaded receipt images + image hashing to verify proof of fund distribution.

### Verify all 4 agents

After deploy:
```
https://aidflow-eligibility-agent.onrender.com/health
https://aidflow-fraud-agent.onrender.com/health
https://aidflow-risk-agent.onrender.com/health
https://aidflow-proof-agent.onrender.com/health
```

Each should return `{"status":"ok"}` or similar.

**Free tier sleep warning:**
Free tier services sleep after 15 minutes of inactivity.
First request after sleep takes ~30 seconds to wake up.
This means the first donation after a quiet period may take longer to process — not an error.

### Update backend with agent URLs

After all agents deploy, go to Render → `aidflow-backend` → **Environment** and confirm:
```
AI_ELIGIBILITY_URL=https://aidflow-eligibility-agent.onrender.com
AI_FRAUD_URL=https://aidflow-fraud-agent.onrender.com
AI_RISK_URL=https://aidflow-risk-agent.onrender.com
AI_PROOF_URL=https://aidflow-proof-agent.onrender.com
```

---

## Step 6 — Frontend (Static Site)

### 6a. Create Static Site

**New +** → **Static Site** → same repo

| Setting | Value |
|---|---|
| Name | `aidflow-frontend` |
| Root Directory | `frontend` |
| Build Command | `npm ci && npm run build` |
| Publish Directory | `dist` |
| Plan | Free |

### 6b. Environment Variables

**Critical: VITE_* vars are baked into the bundle at BUILD TIME — not runtime.**
Changing these requires a full redeploy of the frontend.

```
VITE_API_BASE_URL=https://YOUR-BACKEND-URL.onrender.com/api
VITE_CHAIN_ID=80002
VITE_BLOCKCHAIN_EXPLORER=https://amoy.polygonscan.com
VITE_APP_NAME=AidFlow
```

Replace `YOUR-BACKEND-URL` with your actual backend Render URL from Step 4.

### 6c. Fix client-side routing (required)

React Router handles routing on the client. Without this fix, refreshing any page
other than `/` returns a 404 from the static file server.

Render → `aidflow-frontend` → **Redirects/Rewrites** tab:
- Source: `/*`
- Destination: `/index.html`
- Action: `Rewrite`
- **Save**

### 6d. Update backend CORS

Render → `aidflow-backend` → **Environment**:
```
FRONTEND_URL=https://aidflow-frontend.onrender.com
```

**Save Changes** → **Manual Deploy** the backend.

If you skip this, the browser will see CORS errors on every API call.

---

## Step 7 — Create Admin Account

The admin account must be created once against the production database.

**Option A — Run locally (recommended)**

Your local machine connects to the same Atlas database.
Make sure your local `backend/.env` has the correct `MONGO_URI`, then:

```bash
cd backend
node scripts/createAdmin.js
```

Output:
```
Admin already exists
```
or
```
Admin created successfully
```

**Option B — Via Render start command (if no local access)**

Render → `aidflow-backend` → Settings → Start Command:
```
node scripts/createAdmin.js && node server.js
```

Deploy once → script runs → immediately change Start Command back to `node server.js` → redeploy.

**Default credentials (change immediately after first login):**
```
Email:    admin@aidflow.com
Password: Admin@123
```

---

## Step 8 — Final Verification Checklist

### Backend
- [ ] `https://YOUR-BACKEND.onrender.com/health` returns `{"status":"OK"}`
- [ ] Build log shows `MongoDB connected`
- [ ] Build log shows `Workers started in-process`
- [ ] Build log shows `BLOCKCHAIN_READY`

### Frontend
- [ ] `https://aidflow-frontend.onrender.com` loads the app
- [ ] Login with `admin@aidflow.com` / `Admin@123` works
- [ ] No CORS errors in browser console (F12 → Console)
- [ ] Refreshing `/donor` or `/admin` does not return 404

### AI Agents
- [ ] All 4 `/health` endpoints return OK
- [ ] Backend env vars point to correct agent URLs

### Blockchain
- [ ] Contract visible on [https://amoy.polygonscan.com](https://amoy.polygonscan.com)
- [ ] `AUDIT_CONTRACT_ADDRESS` in backend matches deployed address

---

## Environment Variables — Full Reference

### backend (Render dashboard)

| Variable | Value | Notes |
|---|---|---|
| `NODE_ENV` | `production` | Gates security behavior — password reset token hidden |
| `PORT` | `5000` | Render overrides this but keep it set |
| `FRONTEND_URL` | `https://aidflow-frontend.onrender.com` | Exact match, no trailing slash |
| `MONGO_URI` | Atlas connection string | Must include `/aidflow` database name |
| `JWT_SECRET` | `openssl rand -hex 64` | Never reuse dev value |
| `JWT_EXPIRES_IN` | `7d` | Access token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | `30d` | Refresh token lifetime |
| `QR_SECRET` | `openssl rand -hex 32` | Must differ from JWT_SECRET |
| `PII_HASH_SECRET` | `openssl rand -hex 32` | For Aadhaar/phone hashing |
| `REDIS_URL` | Render Internal URL | From Key Value service |
| `AI_ELIGIBILITY_URL` | `https://aidflow-eligibility-agent.onrender.com` | |
| `AI_FRAUD_URL` | `https://aidflow-fraud-agent.onrender.com` | |
| `AI_RISK_URL` | `https://aidflow-risk-agent.onrender.com` | |
| `AI_PROOF_URL` | `https://aidflow-proof-agent.onrender.com` | |
| `STORAGE_TYPE` | `LOCAL` or `S3` | S3 recommended — LOCAL files lost on redeploy |
| `BACKEND_PUBLIC_URL` | `https://YOUR-BACKEND.onrender.com` | Only used when STORAGE_TYPE=LOCAL |
| `RPC_URL` | Alchemy Amoy HTTPS URL | From Step 1c |
| `AUDIT_CONTRACT_ADDRESS` | Deployed contract address | From Step 1f |
| `BLOCKCHAIN_PRIVATE_KEY` | Wallet private key | From Step 1b |

### ai-agents/proof_agent (Render dashboard)

| Variable | Value | Notes |
|---|---|---|
| `MONGO_URI` | Same Atlas URI as backend | Same database |
| `AI_PROOF_PORT` | `8004` | |

### frontend (build-time vars)

| Variable | Value | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | `https://YOUR-BACKEND.onrender.com/api` | Baked at build time |
| `VITE_CHAIN_ID` | `80002` | Polygon Amoy chain ID |
| `VITE_BLOCKCHAIN_EXPLORER` | `https://amoy.polygonscan.com` | |
| `VITE_APP_NAME` | `AidFlow` | |

---

## Code Changes Made During Deployment

These changes are already in the codebase — documented here for reference.

### 1. Redis URL support (`backend/src/config/redis.config.js`)

**Problem:** Original code used `REDIS_HOST` + `REDIS_PORT` separately.
Render's Key Value service provides a single `REDIS_URL`.

**Fix:** Config now checks `REDIS_URL` first, falls back to `REDIS_HOST`/`REDIS_PORT`.
Also reads from `process.env` directly (not the `env` object) to avoid a dotenv timing issue
where the config file loads before dotenv finishes injecting values.

### 2. Workers in-process (`backend/server.js`)

**Problem:** Background Worker service costs $7/mo extra on Render.

**Fix:** Workers now start in the same process as the API server when `STANDALONE_WORKERS` is not set.
Set `STANDALONE_WORKERS=true` + run a separate Background Worker service if you need independent scaling.

### 3. Hardhat testnet config (`blockchain/hardhat.config.js`)

**Problem:** Original config only had `hardhat: {}` network.

**Fix:** Added `amoy` and `sepolia` network configs reading from `.env`.

---

## Troubleshooting

### `MongoDB connection failed` on Render

1. Check `MONGO_URI` in Render env vars — must include `/aidflow` before `?`
2. Check Atlas → Network Access → `0.0.0.0/0` is allowed
3. Check Atlas → Database Access → username and password are correct
4. Error `bad auth: Authentication failed` = wrong username or password in URI

### `injecting env (0) from .env`

This is normal on Render — dotenv finds no `.env` file in the container (correctly excluded by
`.dockerignore`) and reads 0 vars from it. Render injects vars directly into `process.env` —
they are available regardless of this log line.

### CORS errors in browser console

`FRONTEND_URL` in backend must exactly match the frontend URL:
- Correct: `https://aidflow-frontend.onrender.com`
- Wrong: `https://aidflow-frontend.onrender.com/` (trailing slash)

### Render uses Docker instead of Node runtime

Render auto-detects `Dockerfile` in the root directory of the service.
Temporarily rename it to deploy with Node runtime:
```bash
mv backend/Dockerfile backend/Dockerfile.bak
git add -A && git commit -m "temp: rename Dockerfile" && git push
```
Create the service, then restore:
```bash
mv backend/Dockerfile.bak backend/Dockerfile
git add -A && git commit -m "restore: Dockerfile" && git push
```

### AI agents return 502 / timeout on first request

Free tier services sleep after 15 min of inactivity. First request wakes them up (~30 sec).
This is expected behavior — not a bug. Subsequent requests are fast.

### Refreshing `/donor` or any non-root route returns 404

The Redirects/Rewrites rule is not set. Add it:
Render → `aidflow-frontend` → Redirects/Rewrites → `/*` → `/index.html` → Rewrite.

### `QR_SECRET must not be the same value as JWT_SECRET`

Generate two different values:
```bash
openssl rand -hex 64  # JWT_SECRET
openssl rand -hex 32  # QR_SECRET (different value)
```

### Blockchain shows "not anchored"

- `AUDIT_CONTRACT_ADDRESS` must match the contract deployed in Step 1f
- `RPC_URL` must point to Polygon Amoy (not mainnet, not localhost)
- `BLOCKCHAIN_PRIVATE_KEY` wallet must have MATIC for gas

---

## Upgrading Storage to S3 (Recommended for Production)

Currently `STORAGE_TYPE=LOCAL` — uploaded proof photos are stored on Render's filesystem
which is ephemeral (wiped on every redeploy).

To switch to S3:

1. Create an S3 bucket in AWS Console
2. Create an IAM user with S3 read/write permissions, get access keys
3. Update Render backend env vars:

```
STORAGE_TYPE=S3
S3_BUCKET=aidflow-proofs
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

4. Update proof_agent env vars with same AWS credentials
5. Redeploy backend and proof_agent

---

## Scaling Notes

- **Backend API**: Stateless (JWT auth) — scale horizontally behind a load balancer.
  WebSocket note: if you run multiple replicas, add Redis pub/sub for broadcast notifications.
- **Workers**: BullMQ naturally load-balances across multiple worker processes pulling from
  the same Redis queue. Add more workers if queue depth grows during high traffic.
- **AI Agents**: eligibility/fraud/risk are stateless — trivial to scale.
  proof_agent is heavier (OCR) — scale it independently if needed.
- **MongoDB**: Atlas handles read replicas and auto-scaling on paid tiers.
- **Frontend**: Static CDN — no scaling needed.

---

## Monitoring

### Built-in health endpoints

```
GET https://YOUR-BACKEND.onrender.com/health
GET https://aidflow-eligibility-agent.onrender.com/health
GET https://aidflow-fraud-agent.onrender.com/health
GET https://aidflow-risk-agent.onrender.com/health
GET https://aidflow-proof-agent.onrender.com/health
```

Wire these into Render's built-in health checks or a free UptimeRobot monitor.

### Queue health

BullMQ queues are visible at:
```
https://YOUR-BACKEND.onrender.com/admin/queues
```

This shows queue depth and failed jobs — useful for catching stuck donations before users report them.

### Logs

Backend uses `pino` structured JSON logs. View them in Render → service → **Logs** tab.
For persistent log storage, set up a log drain to Better Stack or Axiom (both have free tiers).
