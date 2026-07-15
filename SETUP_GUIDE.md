# AidFlow — Setup Guide (Post-Fix Build)

This package contains the fixed codebase: backend, frontend, AI agents, and
blockchain contracts, plus the new "Field Ledger" visual redesign applied
to the frontend. It corresponds to everything described in
`CHANGELOG_FIXES.md`.

---

## 0. Security — rotate these before you do anything else

The originally uploaded codebase had real credentials committed in
`.env` files. They are still present in this package's `backend/.env` and
`ai-agents/proof_agent/.env` so your local setup keeps working out of the
box, but **you must rotate them** before using real data or deploying
anywhere:

1. **MongoDB Atlas** — go to your Atlas dashboard → Database Access → change
   the password for the `aidflow_backend` user. Update `MONGO_URI` in both
   `backend/.env` and `ai-agents/proof_agent/.env` with the new password.
2. **JWT_SECRET** — generate a new one: `openssl rand -hex 64`, paste into
   `backend/.env`. This invalidates all existing login sessions (expected).
3. **QR_SECRET** — generate a new one: `openssl rand -hex 32`. Must be
   different from `JWT_SECRET` — the app will refuse to start if they match.
4. **BLOCKCHAIN_PRIVATE_KEY** — the current value is the **publicly known
   default Hardhat test account #0 key**. It's fine for local development
   against your own local Hardhat node (see step 5 below) but must never be
   used on any network where real value could move.
5. **PII_HASH_SECRET** — generate one: `openssl rand -hex 32`. Used to hash
   Aadhaar/phone numbers at rest.

---

## 1. Prerequisites

| Tool | Version | Check |
|---|---|---|
| Node.js | 20+ | `node -v` |
| npm | 10+ | `npm -v` |
| Python | 3.11+ | `python3 --version` |
| MongoDB | Atlas (cloud) or local 6+ | — |
| Redis | 7+ | `redis-cli ping` → `PONG` |
| Tesseract OCR | any recent | `tesseract --version` |

**Install Tesseract** (required for proof-receipt OCR; the app degrades
gracefully without it, but receipt amount verification won't work):
```bash
# Ubuntu/Debian
sudo apt-get install -y tesseract-ocr
# macOS
brew install tesseract
# Windows: https://github.com/UB-Mannheim/tesseract/wiki
```

**Install Redis** if you don't have it:
```bash
# Ubuntu/Debian
sudo apt-get install -y redis-server && redis-server --daemonize yes
# macOS
brew install redis && brew services start redis
```

---

## 2. Backend setup

```bash
cd backend
npm install
```

Your `.env` is already filled in for local dev (see Section 0 for what to
rotate). Verify it matches `.env.example`'s shape if you ever recreate it.

**Start MongoDB connection check + the API server:**
```bash
npm run dev
# or: node server.js
```
The server validates required env vars at boot (`validateEnv()`) and will
fail loudly with a clear message if something required is missing — this
is intentional, not a bug.

**Start the background workers** (separate process — donation processing,
AI evaluation, fraud detection, proof validation, blockchain anchoring,
settlements, wallet expiry, recurring donations):
```bash
npm run workers
# or: node src/workers/index.js
```
Both `npm run dev` and `npm run workers` need to be running simultaneously
for the app to function end-to-end — the API server handles requests, the
workers process the async queues.

---

## 3. AI Agents setup (4 separate Python services)

Each agent is a standalone FastAPI service. Run each in its own terminal
(or use a process manager / Docker Compose if you have one set up).

```bash
cd ai-agents

# Eligibility agent — port 8001
cd eligibility_agent
python3 -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001
```

Repeat the same pattern for the other three, each in a fresh terminal:
```bash
cd ai-agents/fraud_agent   && pip install -r requirements.txt && uvicorn main:app --port 8002
cd ai-agents/risk_agent    && pip install -r requirements.txt && uvicorn main:app --port 8003
cd ai-agents/proof_agent   && pip install -r requirements.txt && uvicorn main:app --port 8004
```

The `proof_agent` additionally needs:
- **Tesseract OCR** installed at the system level (see Section 1) — without
  it, OCR-based receipt validation gracefully degrades (flags `OCR_FAILED`)
  rather than crashing.
- Its own `.env` with a `MONGO_URI` (same database as the backend) — see
  Section 0 for the rotation note. A `.env.example` is provided alongside it.
- `boto3` (included in `requirements.txt`) if you plan to validate proofs
  stored on S3 rather than locally — also needs AWS credentials configured
  via the standard boto3 chain if so.

All four agents currently restrict CORS to `http://localhost:5000` (the
backend) by default via `ALLOWED_ORIGINS` — set this env var if your
backend runs elsewhere.

---

## 4. Blockchain setup (optional for local dev — the app runs in mock mode without it)

The backend will run fine without a real blockchain connection — the
`blockchain.config.js` falls back to mock mode and logs a warning. If you
want real on-chain anchoring locally:

```bash
cd blockchain
npm install

# Terminal A: start a local Hardhat blockchain
npx hardhat node
# This prints 20 funded test accounts - account #0's private key is the
# BLOCKCHAIN_PRIVATE_KEY already in backend/.env.

# Terminal B: deploy the AidFlowAudit contract to the local node
npx hardhat run scripts/deploy.js --network localhost
# Copy the deployed contract address into backend/.env as
# AUDIT_CONTRACT_ADDRESS (it should already match the default Hardhat
# first-deploy address: 0x5FbDB2315678afecb367f032d93F642f64180aa3 — but
# verify after running deploy.js, since this only holds if your node's
# deployment order hasn't changed).
```

Run the test suite to confirm the contract works:
```bash
npx hardhat test
```

---

## 5. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173` (Vite default). `.env` already points at
`http://localhost:5000/api` for the backend — adjust `VITE_API_BASE_URL` if
your backend runs elsewhere.

**Note on the redesign:** this build includes a complete visual redesign
("Field Ledger" design system — see `CHANGELOG_FIXES.md` Checkpoint 6-8 for
details). All existing component class names and CSS variable names were
preserved exactly, so this is a drop-in visual change with no JSX API
breakage — verified via an automated import/class-usage audit across the
entire `src/` tree.

A genuinely critical, **pre-existing** bug was also found and fixed here:
`@import "tailwindcss"` was missing from the project's CSS entirely, which
means Tailwind utility classes (used in ~15-20 files) had likely never
actually applied any styling before this fix, regardless of the redesign.

---

## 6. Running everything together (quick reference)

You need **7 processes** running simultaneously for full functionality:

| # | Process | Command | Port |
|---|---|---|---|
| 1 | Redis | `redis-server` | 6379 |
| 2 | Backend API | `cd backend && npm run dev` | 5000 |
| 3 | Backend workers | `cd backend && npm run workers` | — |
| 4 | Eligibility agent | `cd ai-agents/eligibility_agent && uvicorn main:app --port 8001` | 8001 |
| 5 | Fraud agent | `cd ai-agents/fraud_agent && uvicorn main:app --port 8002` | 8002 |
| 6 | Risk agent | `cd ai-agents/risk_agent && uvicorn main:app --port 8003` | 8003 |
| 7 | Proof agent | `cd ai-agents/proof_agent && uvicorn main:app --port 8004` | 8004 |
| 8 | Frontend | `cd frontend && npm run dev` | 5173 |
| — | Blockchain (optional) | `cd blockchain && npx hardhat node` | 8545 |

MongoDB Atlas is cloud-hosted so nothing to run locally for that, assuming
you're using the existing `MONGO_URI` (after rotating its password per
Section 0).

A `start-agents.sh` convenience script is included in `ai-agents/` to launch
all four Python agents from one terminal — see that file for usage.

---

## 7. Verifying it's working

1. Visit `http://localhost:5173` — you should see the new Field Ledger
   homepage (ink-dark hero, paper-warm body, live stats ticker).
2. Register as a donor, then separately register an NGO via "Request
   Access" → an admin (you'll need to manually promote a user to ADMIN
   role in MongoDB directly, or use whatever seed script your project has)
   approves it.
3. Create a campaign as the NGO → approve it as admin → it should appear
   on the public campaigns page.
4. Donate as the donor → check the backend workers terminal for log lines
   showing the AI risk evaluation pipeline running (fraud agent → risk
   agent) → donation should land in the NGO's pending review queue.
5. Visit `/public-audit` and use the "Verify a File Hash" tab — this was
   previously built but never wired up; it's now live.

---

## 8. What's in `CHANGELOG_FIXES.md`

A complete, checkpoint-by-checkpoint log of every bug found and fixed
across this session — 54+ files touched, organized by backend logic,
security, AI agent integration, blockchain, missing workflows, and the
frontend redesign. Worth reading if you want to understand *why* something
changed, not just *that* it changed.
