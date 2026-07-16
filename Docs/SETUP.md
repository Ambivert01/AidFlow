# AidFlow — Local Development Setup

Complete guide to running the full AidFlow stack on your own machine.
For production deployment on Render, see `DEPLOYMENT.md`.

---

## What You Need Running

AidFlow has 8 processes that all need to be up for full functionality:

| # | Process | Command | Port |
|---|---|---|---|
| 1 | Redis | `redis-server` | 6379 |
| 2 | Backend API | `cd backend && npm run dev` | 5000 |
| 3 | Backend Workers | `cd backend && npm run workers` | — |
| 4 | Eligibility Agent | `cd ai-agents/eligibility_agent && uvicorn main:app --port 8001` | 8001 |
| 5 | Fraud Agent | `cd ai-agents/fraud_agent && uvicorn main:app --port 8002` | 8002 |
| 6 | Risk Agent | `cd ai-agents/risk_agent && uvicorn main:app --port 8003` | 8003 |
| 7 | Proof Agent | `cd ai-agents/proof_agent && uvicorn main:app --port 8004` | 8004 |
| 8 | Frontend | `cd frontend && npm run dev` | 5173 |
| — | Blockchain (optional) | `cd blockchain && npx hardhat node` | 8545 |

**You don't need all 8 running to do something useful.**
Frontend + Backend + MongoDB alone gets you through registration, login, and browsing.
Donations, AI checks, wallet creation, and blockchain verification need workers + all 4 agents.

---

## Section 0 — Security: Rotate These First

If you received this codebase as an archive/zip (not a fresh clone), the `.env` files
may contain real credentials that are now compromised. Rotate them before doing anything:

**1. MongoDB Atlas password**
Go to Atlas dashboard → Database Access → edit the `aidflow_admin` user → change password.
Update `MONGO_URI` in both `backend/.env` and `ai-agents/proof_agent/.env`.

**2. JWT_SECRET**
```bash
openssl rand -hex 64
```
Paste into `backend/.env`. This invalidates all existing login sessions (expected for a fresh setup).

**3. QR_SECRET**
```bash
openssl rand -hex 32
```
Must be DIFFERENT from JWT_SECRET. The app refuses to boot if they match.

**4. PII_HASH_SECRET**
```bash
openssl rand -hex 32
```
Used to HMAC-hash Aadhaar/phone numbers before storing. Without this, falls back to plain
SHA-256 which is reversible via rainbow tables for 12-digit Aadhaar numbers.

**5. BLOCKCHAIN_PRIVATE_KEY**
The default value in `backend/.env` is the publicly known Hardhat test account #0 key
(`0xac0974...`). Fine for local dev against a local Hardhat node, but never use it on
any real network (testnet or mainnet).

---

## Section 1 — Prerequisites

Check you have everything before starting:

| Tool | Min Version | How to check | Install if missing |
|---|---|---|---|
| Node.js | 20+ (tested on 22/24) | `node -v` | https://nodejs.org |
| npm | 10+ | `npm -v` | comes with Node |
| Python | 3.10+ (3.11+ recommended) | `python3 --version` | https://python.org |
| Redis | 6.x / 7.x | `redis-cli ping` → `PONG` | see below |
| Tesseract OCR | any recent | `tesseract --version` | see below |
| git | any | `git --version` | https://git-scm.com |

### Install Redis

```bash
# Ubuntu/Debian
sudo apt-get install -y redis-server
redis-server --daemonize yes

# macOS
brew install redis
brew services start redis

# Windows
# Download from: https://github.com/tporadowski/redis/releases
```

### Install Tesseract OCR

Tesseract is a **system binary** — it cannot be installed via pip.
It is required by `proof_agent` for receipt OCR. Without it, proof validation
degrades gracefully (flags `OCR_FAILED`) instead of crashing, but receipt amount
verification won't work.

```bash
# Ubuntu/Debian
sudo apt-get install -y tesseract-ocr

# macOS
brew install tesseract

# Windows
# https://github.com/UB-Mannheim/tesseract/wiki
```

---

## Section 2 — Clone and Install

### Clone

```bash
git clone <your-repo-url> aidflow
cd aidflow
```

This is a monorepo-by-folder — each subdirectory has its own `package.json` or `requirements.txt`
and must be installed separately. There is no root-level `npm install` that does everything.

### Install all dependencies

```bash
# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..

# Blockchain
cd blockchain && npm install && cd ..
```

### Install AI agent dependencies

Each agent is a separate Python service with its own virtual environment:

```bash
cd ai-agents
for agent in eligibility_agent fraud_agent risk_agent proof_agent; do
  cd $agent
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
  deactivate
  cd ..
done
cd ..
```

The `start-agents.sh` script also handles this automatically on first run.

---

## Section 3 — Environment Variables

Four `.env` files need to be created from their examples:

```bash
cp backend/.env.example        backend/.env
cp frontend/.env.example       frontend/.env
cp blockchain/.env.example     blockchain/.env
cp ai-agents/proof_agent/.env.example  ai-agents/proof_agent/.env
```

Only `proof_agent` needs a `.env` among the AI agents —
`eligibility_agent`, `fraud_agent`, and `risk_agent` are stateless rule engines with no secrets.

### backend/.env — all variables explained

```env
# Server
PORT=5000
NODE_ENV=development   # change to "production" on Render — gates security behavior

# CORS — comma-separated, no trailing slash, exact match required
FRONTEND_URL=http://localhost:5173,http://localhost:5174

# MongoDB — must be a replica set (use Atlas, not a plain local mongod)
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/aidflow?retryWrites=true&w=majority

# JWT — signs access + refresh tokens
JWT_SECRET=<openssl rand -hex 64>
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# QR wallet payment tokens — MUST differ from JWT_SECRET
# App refuses to boot if QR_SECRET === JWT_SECRET
QR_SECRET=<openssl rand -hex 32>

# Aadhaar/phone hashing at rest
PII_HASH_SECRET=<openssl rand -hex 32>

# Redis — local dev uses HOST+PORT, production uses REDIS_URL (see DEPLOYMENT.md)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# AI Agents — 4 separate Python FastAPI services
AI_ELIGIBILITY_URL=http://localhost:8001   # checks beneficiary eligibility
AI_FRAUD_URL=http://localhost:8002         # detects donation fraud patterns
AI_RISK_URL=http://localhost:8003          # scores donation risk level
AI_PROOF_URL=http://localhost:8004         # OCR + image hash for proof of distribution

# File storage — LOCAL for dev, S3 for production (Render filesystem is ephemeral)
STORAGE_TYPE=LOCAL
UPLOAD_PATH=./uploads/proofs
BACKEND_PUBLIC_URL=http://localhost:5000   # used to build absolute URLs for uploaded files

# Blockchain — local Hardhat node for dev
RPC_URL=http://127.0.0.1:8545
AUDIT_CONTRACT_ADDRESS=<filled after deploy, see Section 7>
BLOCKCHAIN_PRIVATE_KEY=<one of the Hardhat test account keys printed by npx hardhat node>
```

### frontend/.env

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_CHAIN_ID=31337            # Hardhat default chain ID
VITE_BLOCKCHAIN_EXPLORER=http://localhost:8545
VITE_APP_NAME=AidFlow
```

> VITE_* vars are baked into the bundle at build time — changing them requires a rebuild.

### blockchain/.env

```env
PRIVATE_KEY=<one of Hardhat test account private keys>
RPC_URL=http://127.0.0.1:8545
AUDIT_CONTRACT_ADDRESS=<filled after deploy>
ETHERSCAN_API_KEY=             # only needed for mainnet contract verification
```

### ai-agents/proof_agent/.env

```env
AI_PROOF_PORT=8004
MONGO_URI=<same connection string as backend/.env>
```

---

## Section 4 — MongoDB Setup

**Why you must use a replica set:**
This app uses multi-document transactions (donation approval, beneficiary registration,
wallet creation). A plain standalone `mongod` will throw:
```
Transaction numbers are only allowed on a replica set member
```
the first time any of those flows runs.

### Option A — MongoDB Atlas (recommended)

Atlas clusters are always replica sets. Free M0 tier is enough for local dev.

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free cluster
3. Database Access → create a user with read/write permissions
4. Network Access → Add IP → your current IP (or `0.0.0.0/0` for convenience in dev)
5. Connect → Drivers → copy connection string
6. Replace `<password>` and add `/aidflow` before `?`:
   ```
   mongodb+srv://user:password@cluster.mongodb.net/aidflow?retryWrites=true&w=majority
   ```
7. Paste into `backend/.env` MONGO_URI **and** `ai-agents/proof_agent/.env` MONGO_URI
   — both services use the same database

### Option B — Local MongoDB with replica set

```bash
mongod --replSet rs0 --dbpath /path/to/data --port 27017 --fork --logpath /tmp/mongod.log

# Once, in a mongo shell:
mongosh
rs.initiate()
```

Use this connection string:
```
MONGO_URI=mongodb://localhost:27017/aidflow?replicaSet=rs0
```

No migrations needed — Mongoose creates collections and indexes on first write.

---

## Section 5 — Run the Backend

Two processes — both required for end-to-end functionality.

**Terminal 1 — API server:**
```bash
cd backend
npm run dev        # nodemon, auto-restarts on file changes
# or: npm start    # plain node, no auto-restart
```

**Terminal 2 — Background workers:**
```bash
cd backend
npm run workers
```

Workers handle: donation processing, AI evaluation dispatch, fraud detection,
blockchain anchoring, wallet creation, wallet expiry, settlement, recurring donations,
notifications. These are all async (queued jobs) — they do not happen in the API
request/response cycle.

**Confirm it's running:**
```bash
curl http://localhost:5000/health
# → {"status":"OK","service":"AidFlow Backend","timestamp":"..."}
```

**Create admin account (first time only):**
```bash
node scripts/createAdmin.js
```

---

## Section 6 — Run the Frontend

```bash
cd frontend
npm run dev
```

Opens at `http://localhost:5173`. Make sure `VITE_API_BASE_URL` in `frontend/.env`
points to your running backend (`http://localhost:5000/api`).

---

## Section 7 — Run AI Agents

### All 4 at once (recommended)

```bash
cd ai-agents
./start-agents.sh
```

This creates a venv per agent on first run, installs dependencies, and launches all 4 in the
background. Logs land in `ai-agents/<agent_name>.log`. Stop them with `./stop-agents.sh`.

### One at a time (useful for debugging a specific agent)

```bash
# Eligibility — port 8001
cd ai-agents/eligibility_agent
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8001

# Fraud — port 8002
cd ai-agents/fraud_agent
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8002

# Risk — port 8003
cd ai-agents/risk_agent
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8003

# Proof — port 8004 (also needs Tesseract and .env)
cd ai-agents/proof_agent
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8004
```

### What each agent does

| Agent | Port | Purpose |
|---|---|---|
| eligibility_agent | 8001 | Checks if a beneficiary meets eligibility criteria (age, location, need category) |
| fraud_agent | 8002 | Detects fraud patterns in donations (unusual amounts, velocity, suspicious sources) |
| risk_agent | 8003 | Scores overall risk level for a donation by combining multiple signals |
| proof_agent | 8004 | OCR on uploaded receipt images + image hashing to verify proof of fund distribution |

### Health checks

```bash
curl http://localhost:8001/health
curl http://localhost:8002/health
curl http://localhost:8003/health
curl http://localhost:8004/health
```

---

## Section 8 — Blockchain (Optional for Local Dev)

The app runs without a blockchain connection — `blockchainConfig` falls back to mock mode
and logs a warning. Donations and proofs just won't get a real on-chain anchor.

If you want real local blockchain anchoring:

**Terminal A — Start local Hardhat chain:**
```bash
cd blockchain
npx hardhat node
```

This prints 20 funded test accounts with private keys. Copy one private key into:
- `blockchain/.env` → `PRIVATE_KEY`
- `backend/.env` → `BLOCKCHAIN_PRIVATE_KEY`

**Terminal B — Deploy the contract:**
```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```

Output:
```
AidFlowAudit deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

Copy this address into **both**:
- `blockchain/.env` → `AUDIT_CONTRACT_ADDRESS`
- `backend/.env` → `AUDIT_CONTRACT_ADDRESS`

Restart the backend after updating `AUDIT_CONTRACT_ADDRESS`.

**Important:** Every time you restart `npx hardhat node`, the chain resets.
You must redeploy and update both addresses again. Previously anchored data becomes
unverifiable against the new chain — this is normal for local dev.

**Run contract tests:**
```bash
cd blockchain
npx hardhat test
```

---

## Section 9 — Default Credentials

```bash
cd backend
node scripts/createAdmin.js
```

Creates one account:

| Role | Email | Password |
|---|---|---|
| Admin | admin@aidflow.com | Admin@123 |

**Change this password immediately** if this is anything other than a throwaway local database.

Every other role (Donor, NGO, Government, Beneficiary, Merchant) has no default account.
Register through the app or use the seed scripts below.

---

## Section 10 — Seed Data

Two scripts for different purposes:

### Quick seed — `npm run seed`

**Wipes all existing data.** Creates exactly one account per role, all pre-approved,
password `Admin@123`. No campaigns, no donations — just bare accounts for quick login testing.

```bash
cd backend
npm run seed
```

### Full lifecycle demo — `npm run seed:demo`

Comprehensive realistic data. Safe to re-run (only touches `@aidflow-demo.test` emails,
won't wipe your existing data).

Walks the entire system end to end:
- Registers all 6 roles
- Admin approves NGO, Merchant, Government
- Creates and approves a campaign
- Registers beneficiaries (NGO-driven + self-apply paths)
- Fires donations (including one shaped to trigger fraud escalation)
- Runs NGO approval, wallet creation, merchant QR payment
- Uploads proof of distribution
- Checks blockchain anchor + public audit trail

```bash
cd backend
npm run seed:demo
```

**Requires workers and AI agents to be running** for all steps to complete.
If they're not running, the script tells you which steps were skipped and
prints credentials for what it did manage to create.

---

## Section 11 — Quick Start Reference

Minimum to get the app running from scratch:

```bash
# 1. Start Redis
redis-server

# 2. Start Backend API (new terminal)
cd backend && npm run dev

# 3. Start Workers (new terminal)
cd backend && npm run workers

# 4. Start all AI agents (new terminal)
cd ai-agents && ./start-agents.sh

# 5. Start Frontend (new terminal)
cd frontend && npm run dev

# 6. Optional: Start blockchain (new terminal)
cd blockchain && npx hardhat node
# then in another terminal:
cd blockchain && npx hardhat run scripts/deploy.js --network localhost
```

Open `http://localhost:5173` — login with `admin@aidflow.com` / `Admin@123`.

---

## Section 12 — Troubleshooting

### `Transaction numbers are only allowed on a replica set member`
MongoDB is not a replica set. Use Atlas (Section 4A) or start local Mongo with `--replSet` (Section 4B).

### `QR_SECRET must not be the same value as JWT_SECRET`
Intentional boot-time safety check. Generate two different values with `openssl rand -hex 32`.

### Donations stuck at `PENDING` or `AI_CHECK_PENDING` forever
Workers (`npm run workers`) are not running, or one of the 4 AI agents is not reachable.
Check `ai-agents/*.log` and the workers terminal output.

### Proof photo uploads work but photos 404 in the browser
`BACKEND_PUBLIC_URL` in `backend/.env` is wrong or not set.
The frontend needs an absolute URL to fetch files from the backend origin.

### CORS errors in browser console
`FRONTEND_URL` in `backend/.env` must exactly match what the browser shows in the address bar
(protocol + host + port, no trailing slash). Add multiple origins comma-separated.

### `getBlockchainStatus` always shows "not anchored"
No Hardhat node running, no contract deployed, or you restarted the node without redeploying.
If `AUDIT_CONTRACT_ADDRESS` / `BLOCKCHAIN_PRIVATE_KEY` are blank, blockchain anchoring is skipped silently.

### Proof OCR always fails / flags `OCR_FAILED`
Tesseract binary is not installed on the OS — see Section 1. It's not a pip package.
The agent degrades gracefully but won't verify receipt amounts without it.

### Port already in use
`lsof -i :PORT` (macOS/Linux) to find what's using it and kill it, or change the port in `.env`.

### WebSocket connection fails in browser
Backend serves WebSocket on the same port as HTTP (`ws://localhost:5000`), not a separate port.
Make sure nothing is proxying HTTP while blocking the WebSocket upgrade.

### Backend won't start — missing env vars error
`validateEnv()` in `backend/src/config/env.config.js` checks required vars at boot.
The error message lists exactly which vars are missing — check `backend/.env` against `.env.example`.

---

## Section 13 — Docker (Alternative to Manual Setup)

If you prefer Docker over running 8 terminals manually:

```bash
# From repo root
docker compose --env-file backend/.env up --build
```

This starts: Redis, Backend API, Background Worker, all 4 AI agents, Frontend.

**Not included in docker-compose (by design):**
- MongoDB — use Atlas (managed replica set, not a single-node container)
- Blockchain node — use a real testnet or run `npx hardhat node` separately

See `docker-compose.yml` for full configuration and comments on each service.

For production deployment on Render, see `DEPLOYMENT.md`.
