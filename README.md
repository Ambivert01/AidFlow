# AidFlow AI

> A Unified, Autonomous, AI-Powered Infrastructure for Transparent Donations & Disaster Relief

AidFlow AI is a production-grade humanitarian platform that transforms donations and disaster relief
into transparent, autonomous, and verifiable financial workflows. Every contribution is traceable
from donor intent to real-world impact — powered by AI agents, blockchain auditing, programmable
wallets, and rule-based policy automation.

---

## Live Demo

| Service | URL |
|---|---|
| Frontend | https://aidflow-frontend.onrender.com |
| Backend API | https://aidflow-75gb.onrender.com |
| API Docs (Swagger) | https://aidflow-75gb.onrender.com/docs |
| Health Check | https://aidflow-75gb.onrender.com/health |

**Default admin login:** `admin@aidflow.com` / `Admin@123`

---

## The Problem

Traditional donation and disaster relief platforms:

- Have no transparency after donations are made
- Rely on human approvals causing delays
- Have no end-to-end audit trail
- Are vulnerable to fund leakage and corruption
- Give donors no visibility into real-world impact

Most platforms collect funds but cannot prove how they were actually used.

---

## The Solution

AidFlow replaces trust-based humanitarian execution with a programmable, AI-driven infrastructure:

- **Policies** define fund allocation rules
- **AI agents** automate eligibility, fraud detection, and risk scoring
- **Blockchain** guarantees immutable auditability
- **Programmable wallets** enforce purpose-bound spending (food, medicine, shelter only)

---

## Key Features

### Transparent Donation Tracking
Every donation is tracked from contribution to beneficiary with a full audit trail.

### AI-Powered Decision Engine
Four specialized AI agents handle the entire verification pipeline:
- **Eligibility Agent** — verifies beneficiary criteria
- **Fraud Agent** — detects suspicious donation patterns
- **Risk Agent** — scores overall donation risk
- **Proof Agent** — OCR + image hashing to verify proof of fund distribution

### Blockchain Audit Layer
Critical events are hashed into Merkle Trees and anchored on Polygon Amoy testnet.
Anyone can verify the audit trail without NGO approval via the public audit page.

### Programmable Relief Wallets
Beneficiary wallets are purpose-bound — funds can only be spent on approved categories.
Misuse is prevented before it happens, not detected after.

### Multi-Role Platform
Six distinct roles with tailored dashboards and workflows:

| Role | Capabilities |
|---|---|
| **Donor** | Donate, track impact, view audit trail |
| **NGO** | Create campaigns, manage beneficiaries, approve distributions |
| **Government** | Oversight, fraud case review, policy management |
| **Beneficiary** | Receive wallet, use QR code at merchants |
| **Merchant** | Accept QR payments, upload proof of distribution |
| **Admin** | Full system administration, user approval, audit access |

### Dynamic Trust Engine
Trust is computed from verifiable evidence — organizations earn credibility through
proven impact, not brand recognition.

### Real-Time Public Audit
Live blockchain-anchored audit trail accessible to anyone at `/public-audit`.

---

## Architecture

```
Browser (React + Vite)
         │
         │ HTTPS / WebSocket
         ▼
   Express Backend (Node.js)
         │
    ┌────┴─────────────────────────────┐
    │                                  │
    ▼                                  ▼
BullMQ Workers                   Policy Engine
(async job processing)           Workflow Engine
    │                                  │
    ├── Eligibility Agent (FastAPI)     │
    ├── Fraud Agent (FastAPI)           │
    ├── Risk Agent (FastAPI)            │
    └── Proof Agent (FastAPI + OCR)     │
                                       ▼
                              Blockchain (Solidity)
                              Polygon Amoy Testnet

Shared Infrastructure:
  MongoDB Atlas (replica set — transactions)
  Redis (BullMQ job queues)
```

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 7, Tailwind CSS 4, Zustand, Socket.io client |
| **Backend** | Node.js 20+, Express 5, BullMQ, Socket.io, Mongoose, JWT, Zod |
| **AI Agents** | Python 3.11+, FastAPI, Uvicorn, pytesseract, Pillow, imagehash |
| **Blockchain** | Solidity 0.8.28, Hardhat, Ethers.js 6, OpenZeppelin, Merkle Trees |
| **Database** | MongoDB Atlas (replica set required for transactions) |
| **Queue** | Redis (via Render Key Value), BullMQ |
| **Deployment** | Render (Web Service + Static Site), Polygon Amoy testnet |

---

## Folder Structure

```
AidFlow/
├── frontend/               React + Vite frontend
├── backend/                Node.js + Express API + BullMQ workers
│   ├── src/
│   │   ├── modules/        Feature modules (auth, donation, campaign, etc.)
│   │   ├── workers/        BullMQ background job processors
│   │   ├── engines/        Policy engine, trust engine, workflow engine
│   │   ├── config/         DB, Redis, blockchain, AI config
│   │   └── middlewares/    Auth, rate limit, validation, logging
│   └── scripts/            Seed scripts, admin creation
├── ai-agents/
│   ├── eligibility_agent/  FastAPI — beneficiary eligibility checks
│   ├── fraud_agent/        FastAPI — donation fraud detection
│   ├── risk_agent/         FastAPI — donation risk scoring
│   └── proof_agent/        FastAPI + OCR — proof of distribution validation
├── blockchain/             Solidity contracts, Hardhat config, deploy scripts
└── Docs/
    ├── SETUP.md            Local development guide
    └── DEPLOYMENT.md       Production deployment guide (Render)
```

---

## Quick Start (Local Dev)

```bash
# 1. Clone
git clone https://github.com/Ambivert01/AidFlow.git
cd AidFlow

# 2. Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd blockchain && npm install && cd ..

# 3. Set up environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp blockchain/.env.example blockchain/.env
cp ai-agents/proof_agent/.env.example ai-agents/proof_agent/.env
# Edit each .env file with your values

# 4. Start Redis
redis-server

# 5. Start backend API + workers (dono ek saath — alag terminal nahi chahiye workers ke liye)
cd backend && npm run dev

# 6. Start AI agents (new terminal)
cd ai-agents && ./start-agents.sh

# 7. Start frontend (new terminal)
cd frontend && npm run dev
```

Open `http://localhost:5173` — create admin account first:

```bash
cd backend && node scripts/createAdmin.js
```

Login: `admin@aidflow.com` / `Admin@123`

For a full set of test accounts across all 6 roles, run the demo seed:

```bash
cd backend && npm run seed:demo
```

This creates realistic data — campaign, beneficiaries, donations, audit trail — and prints credentials for every role. See **[Docs/SETUP.md — Section 10](Docs/SETUP.md)** for details.

For complete setup instructions including MongoDB, blockchain, and troubleshooting,
see **[Docs/SETUP.md](Docs/SETUP.md)**.

---

## Deployment

AidFlow is deployed on Render. The stack runs as:

- **Backend API + Workers** — Render Web Service (Node, Starter plan)
- **4 AI Agents** — Render Web Services (Python / Docker, Free plan)
- **Frontend** — Render Static Site (Free plan)
- **Redis** — Render Key Value (Free plan)
- **MongoDB** — MongoDB Atlas M0 (Free tier, external)
- **Blockchain** — Polygon Amoy testnet (contract deployed once)

For the complete step-by-step production deployment guide including:
- Generating a deployer wallet
- Getting free RPC from Alchemy
- Getting testnet MATIC from faucet
- Deploying the smart contract
- Setting up MongoDB Atlas
- Creating all Render services with correct env vars
- Troubleshooting common deploy errors

See **[Docs/DEPLOYMENT.md](Docs/DEPLOYMENT.md)**.

---

## Documentation

| Document | Contents |
|---|---|
| [Docs/SETUP.md](Docs/SETUP.md) | Local dev setup — prerequisites, install, env vars, running all services, seed data, troubleshooting |
| [Docs/DEPLOYMENT.md](Docs/DEPLOYMENT.md) | Render production deployment — all 8 steps from contract deploy to live frontend |

---

## Roadmap

- [x] Donation Transparency Platform
- [x] Blockchain Audit Layer (Polygon Amoy)
- [x] AI Verification Engine (4 agents)
- [x] Multi-Role Architecture (6 roles)
- [x] Queue-Based Background Processing (BullMQ)
- [x] Programmable Relief Wallets
- [x] Dynamic Trust Engine
- [x] Production Deployment on Render
- [ ] Stablecoin Integration
- [ ] Zero-Knowledge Proof Verification
- [ ] DAO Governance
- [ ] Predictive Disaster Response AI
- [ ] Global Humanitarian Protocol

---

## License

MIT License — see LICENSE file for details.

---

Developed by the AidFlow AI Team. Contributions and feature suggestions welcome.

If you found this project useful, consider giving it a ⭐ on GitHub.
