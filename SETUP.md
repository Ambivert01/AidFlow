# AidFlow — Local Development Setup

Everything you need to run the full stack on your own machine: backend API, background workers, frontend, all 4 AI agents, and the local blockchain. This doc is local-dev only — see `DEPLOYMENT.md` for production.

The system has **5 moving parts** that all need to be running at once for full functionality:

| # | Service | Default port | Started with |
|---|---|---|---|
| 1 | MongoDB | — (Atlas cloud, or local) | — |
| 2 | Redis | 6379 | `redis-server` |
| 3 | Backend API | 5000 | `npm run dev` |
| 4 | Backend workers | — (background process) | `npm run workers` |
| 5 | 4x AI agents | 8001–8004 | `./start-agents.sh` |
| 6 | Blockchain node | 8545 | `npx hardhat node` |
| 7 | Frontend | 5173 | `npm run dev` |

You don't need all 7 running to do *something* useful — the frontend + backend + MongoDB alone will get you through registration, login, and browsing. But donations, beneficiary eligibility, fraud checks, wallet creation, and blockchain verification all depend on the workers and AI agents actually being up, since those steps are asynchronous (queued jobs, not direct calls).

---

## 1. Requirements

| Tool | Version | Notes |
|---|---|---|
| Node.js | 20+ (tested on 22) | for backend, frontend, blockchain |
| Python | 3.10+ | for the 4 AI agents |
| MongoDB | 6.0+ | Atlas (recommended) or local — **must support transactions**, see §5 |
| Redis | any recent 6.x/7.x | job queues |
| Tesseract OCR | any recent | **system package**, not pip-installable — needed by `proof_agent` for receipt OCR. Without it, proof validation degrades gracefully (flags `OCR_FAILED`) rather than crashing, but won't verify amounts |
| git | any | |

Installing Tesseract:
```bash
# Ubuntu/Debian
sudo apt-get install -y tesseract-ocr

# macOS
brew install tesseract

# Windows
# https://github.com/UB-Mannheim/tesseract/wiki
```

---

## 2. Clone

```bash
git clone <your-repo-url> aidflow
cd aidflow
```

The project is a monorepo-by-folder, not a workspaces monorepo — each of `backend/`, `frontend/`, `blockchain/`, and `ai-agents/*` has its own `package.json`/`requirements.txt` and gets installed separately.

---

## 3. Install

```bash
# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..

# Blockchain
cd blockchain && npm install && cd ..

# AI agents — each is a separate Python service with its own venv.
# start-agents.sh (§8) does this automatically, but to do it by hand:
cd ai-agents
for agent in eligibility_agent fraud_agent risk_agent proof_agent; do
  cd $agent
  python3 -m venv venv
  source venv/bin/activate   # Windows: venv\Scripts\activate
  pip install -r requirements.txt
  deactivate
  cd ..
done
cd ..
```

---

## 4. Environment Variables

Four `.env` files, each copied from its `.env.example`:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp blockchain/.env.example blockchain/.env
cp ai-agents/proof_agent/.env.example ai-agents/proof_agent/.env
```

**Security note:** if you obtained this codebase from an existing archive/zip rather than a fresh clone, check whether `backend/.env` and `ai-agents/proof_agent/.env` already contain filled-in values. If they do, treat every one of those values as compromised and rotate them (see the production checklist in `DEPLOYMENT.md` — rotating `JWT_SECRET` invalidates all existing sessions, which is fine for a dev environment but plan around it in production). Only `eligibility_agent`, `fraud_agent`, and `risk_agent` don't need their own `.env` — they're stateless rule engines with no secrets.

### backend/.env

| Variable | Purpose | Notes |
|---|---|---|
| `PORT` | API server port | default `5000` |
| `NODE_ENV` | `development` locally | gates a few behaviors — see below |
| `FRONTEND_URL` | comma-separated allowed CORS origins | e.g. `http://localhost:5173,http://localhost:5174` |
| `MONGO_URI` | MongoDB connection string | see §5 |
| `JWT_SECRET` | signs access/refresh tokens | generate: `openssl rand -hex 64` |
| `JWT_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | token lifetimes | defaults `7d` / `30d` |
| `QR_SECRET` | signs wallet QR payment tokens | generate: `openssl rand -hex 32`. **Must differ from `JWT_SECRET`** — `validateEnv()` refuses to boot if they match, since a stolen QR token could otherwise be replayed as a login token |
| `PII_HASH_SECRET` | HMAC key for hashing Aadhaar/phone before storage | generate: `openssl rand -hex 32` |
| `REDIS_HOST` / `REDIS_PORT` | queue backend | `127.0.0.1` / `6379` locally |
| `AI_ELIGIBILITY_URL` / `AI_FRAUD_URL` / `AI_RISK_URL` / `AI_PROOF_URL` | where each AI agent lives | `http://localhost:8001`–`8004` locally |
| `STORAGE_TYPE` | `LOCAL` or `S3` | `LOCAL` for dev |
| `UPLOAD_PATH` | where local files land | `./uploads/proofs` |
| `BACKEND_PUBLIC_URL` | the backend's own reachable base URL | `http://localhost:5000` locally. Used to build absolute URLs for locally-stored files (proof photos etc) — the frontend and backend run on different origins with no dev proxy, so a bare relative path would 404 against the wrong server |
| `RPC_URL` | blockchain node URL | `http://127.0.0.1:8545` for local Hardhat |
| `AUDIT_CONTRACT_ADDRESS` | deployed contract address | see §9, changes every time you redeploy to a fresh local node |
| `BLOCKCHAIN_PRIVATE_KEY` | wallet that submits anchor transactions | **never use a real-money wallet here in dev** — use one of Hardhat's printed test-account keys (§9) |

### frontend/.env

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | `http://localhost:5000/api` locally |
| `VITE_CHAIN_ID` | `31337` (Hardhat's default local chain ID) |
| `VITE_BLOCKCHAIN_EXPLORER` | `http://localhost:8545` locally (there's no real explorer for a local chain) |
| `VITE_APP_NAME` | display name |

### blockchain/.env

| Variable | Purpose |
|---|---|
| `PRIVATE_KEY` | deployer key — one of Hardhat's local test keys is fine |
| `RPC_URL` | `http://127.0.0.1:8545` for local |
| `AUDIT_CONTRACT_ADDRESS` | filled in *after* you deploy (§9) |
| `ETHERSCAN_API_KEY` | only needed if verifying a contract on a real network — leave blank for local |

### ai-agents/proof_agent/.env

| Variable | Purpose |
|---|---|
| `AI_PROOF_PORT` | `8004` |
| `MONGO_URI` | same database as the backend, so proof records stay consistent |

---

## 5. Database Setup

**Recommended: MongoDB Atlas** (free tier is enough for dev). Atlas clusters are *always* replica sets, which matters because this backend uses multi-document transactions (donation approval, beneficiary registration, wallet creation) — those require a replica set to work at all. A standalone `mongod` with no replica set will throw `Transaction numbers are only allowed on a replica set member` the first time any of those flows runs.

1. Create a free cluster at mongodb.com
2. Create a database user, allow your IP (or `0.0.0.0/0` for dev convenience only)
3. Copy the connection string into `backend/.env`'s `MONGO_URI` and `ai-agents/proof_agent/.env`'s `MONGO_URI` — **same database for both**

**If you'd rather run MongoDB locally**, it must be a replica set:
```bash
mongod --replSet rs0 --dbpath /path/to/data
# then, once, in a mongo shell:
rs.initiate()
```
and use `MONGO_URI=mongodb://localhost:27017/aidflow?replicaSet=rs0`.

No migrations to run — Mongoose creates collections/indexes on first write.

---

## 6. Run Backend

Two separate processes — both needed for the app to actually work end to end, not just boot.

```bash
cd backend

# Terminal 1: the API server
npm run dev          # nodemon, auto-restarts on change
# or: npm start       # plain node, no auto-restart

# Terminal 2: the background workers (donation processing, AI evaluation
# dispatch, fraud detection, blockchain anchoring, wallet expiry, settlement,
# recurring donations, notifications)
npm run workers
```
Confirm it's up: `curl http://localhost:5000/health` → `{"status":"OK",...}`

If this is a completely fresh database, create the admin account:
```bash
node scripts/createAdmin.js
```
See §11 for the credentials this creates.

---

## 7. Run Frontend

```bash
cd frontend
npm run dev
```
Opens on `http://localhost:5173`. Make sure `VITE_API_BASE_URL` in `frontend/.env` points at your running backend.

---

## 8. Run AI Agents

All 4 at once (recommended):
```bash
cd ai-agents
./start-agents.sh
```
This creates a venv per agent (first run only), installs dependencies, and launches all 4 in the background. Logs land in `ai-agents/<agent_name>.log`. Stop them with `./stop-agents.sh`.

Manually, one at a time (useful for watching a specific agent's output):
```bash
cd ai-agents/eligibility_agent && source venv/bin/activate && uvicorn main:app --port 8001
cd ai-agents/fraud_agent       && source venv/bin/activate && uvicorn main:app --port 8002
cd ai-agents/risk_agent        && source venv/bin/activate && uvicorn main:app --port 8003
cd ai-agents/proof_agent       && source venv/bin/activate && uvicorn main:app --port 8004
```

Each exposes a health check: `curl http://localhost:8001/health` (swap the port).

---

## 9. Blockchain

```bash
cd blockchain

# Terminal: local chain (keep running)
npx hardhat node
```
This prints 20 funded test accounts with their private keys — copy one (not the first one if you want to keep the deployer separate from a "user" account, but it doesn't matter for local dev) into `blockchain/.env`'s `PRIVATE_KEY` and `backend/.env`'s `BLOCKCHAIN_PRIVATE_KEY`.

```bash
# Separate terminal: deploy the contract to that local node
npx hardhat run scripts/deploy.js --network localhost
```
This prints the deployed contract address — copy it into **both** `blockchain/.env`'s `AUDIT_CONTRACT_ADDRESS` and `backend/.env`'s `AUDIT_CONTRACT_ADDRESS`. Restart the backend after changing this.

**Every time you restart `npx hardhat node`, the chain resets and you must redeploy** — the address changes and any previously-anchored data becomes unverifiable against the new chain. This is normal for local dev; it doesn't happen on a real testnet/mainnet deployment (see `DEPLOYMENT.md`).

If you skip this section entirely, the app still works — donations/proofs just won't get a real blockchain anchor. `getBlockchainStatus()` degrades to reporting "not yet anchored" rather than erroring.

---

## 10. Default Credentials

`node scripts/createAdmin.js` creates exactly one account:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@aidflow.com` | `Admin@123` |

**Change this password immediately if this is anything other than a throwaway local database.**

Every other role has no default account — register through the app itself (`/register` for donor/beneficiary, `/request-access` for NGO/merchant/government, then approve via the admin account above), or use one of the seed scripts below to get a full set of test accounts in one shot.

---

## 11. Seed Data

Two different scripts, for two different purposes:

**`npm run seed`** (`scripts/seed.js`) — fast, minimal. **Wipes all existing data** and creates exactly one account per role (admin/government/NGO/donor/beneficiary/merchant), all pre-approved, password `Admin@123` for all. No campaigns, no donations, nothing beyond bare accounts. Use this when you just want to log in as each role quickly and don't care about realistic data.

**`npm run seed:demo`** (`scripts/seedFullLifecycleDemo.js`) — comprehensive, realistic, and safe to re-run (only touches its own data, tagged under the `@aidflow-demo.test` email domain — doesn't wipe anything else in your database). Walks the *entire* system end to end using the real service layer, not raw inserts: registers every role, gets NGO/merchant/government approved by admin, creates and approves a campaign, registers beneficiaries through both the NGO-driven and self-apply paths, fires donations (including one shaped to trigger AI fraud escalation to government review), runs them through NGO approval and wallet creation, executes a merchant QR payment, uploads a proof of distribution, and checks the blockchain-anchor + public audit trail.

```bash
cd backend
npm run seed:demo
```

This one needs the workers (§6) and AI agents (§8) actually running to complete every step — if they're not, it doesn't fail, it tells you exactly which steps were skipped and why, then prints login credentials for everything it did manage to create. Read the comment block at the top of `scripts/seedFullLifecycleDemo.js` for the full list of what it exercises.

---

## 12. Troubleshooting

**`Transaction numbers are only allowed on a replica set member`**
Your MongoDB isn't a replica set. See §5 — use Atlas, or run local Mongo with `--replSet`.

**Backend won't boot: `QR_SECRET must not be the same value as JWT_SECRET`**
Intentional safety check (`validateEnv()` in `config/env.config.js`). Generate two different random values.

**Donations/beneficiaries stay stuck at `PENDING`/`AI_CHECK_PENDING` forever**
The workers process (`npm run workers`) isn't running, or one of the 4 AI agents isn't reachable at the URL configured in `backend/.env`. Check `ai-agents/*.log` and the worker terminal's output.

**Proof upload works but the photo doesn't display / 404s**
Check `STORAGE_TYPE=LOCAL` and `BACKEND_PUBLIC_URL` are set correctly in `backend/.env` — the frontend needs an absolute, reachable URL to the backend, not a relative path.

**CORS errors in the browser console**
`FRONTEND_URL` in `backend/.env` must include the exact origin the frontend is actually running on (protocol + host + port). Comma-separate multiple origins, no trailing slashes.

**`getBlockchainStatus` always shows "not anchored"**
Either no Hardhat node is running, no contract is deployed, `AUDIT_CONTRACT_ADDRESS`/`BLOCKCHAIN_PRIVATE_KEY` aren't set, or you restarted the Hardhat node (which resets the chain) without redeploying and updating the address. See §9.

**Proof OCR always fails / flags `OCR_FAILED`**
Tesseract isn't installed on the host OS (see §1) — it's a system binary, not a pip package. The agent degrades gracefully rather than crashing, but won't verify receipt amounts until it's installed.

**Port already in use**
Something else is bound to 5000/5173/6379/8001-8004/8545. `lsof -i :PORT` (macOS/Linux) to find and kill it, or change the port in the relevant `.env`.

**Websocket connection fails in the browser**
The backend serves WebSocket on the same port as the HTTP API (`ws://localhost:5000`), not a separate port — make sure nothing is proxying HTTP but blocking the WS upgrade.
