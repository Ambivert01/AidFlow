> **Note:** 
> The Project is in developing phase right now.
> Backend integration + AI-agents + Blockchain Integration is done.
> Currently working on frontend & increasing productivity of the sytem with enhance integration.

# AidFlow AI  
## Autonomous, Transparent Donation & Disaster Relief Infrastructure

> **AidFlow AI is not just a platform — it is an infrastructure layer for trust in donations and disaster relief.**

AidFlow AI combines **AI-driven decisioning**, **programmable relief wallets**, and **blockchain-anchored audits** to ensure that **every donated unit of value is traceable, verifiable, and misuse-resistant**, without relying on blind trust in intermediaries.

---

## Executive Summary 

- **Problem**: ₹30,000+ crore lost annually due to donor mistrust and opaque relief systems  
- **Gap**: Existing solutions focus on fundraising, not **verifiable impact**
- **Solution**: A full-stack, production-grade system that:
  - Automates donation & relief workflows
  - Enforces spending rules programmatically
  - Creates immutable, public audit proofs
- **Outcome**: Trust becomes **mathematical**, not reputational

---

## 1. Problem Deep Dive

### 1.1 Donation Trust Crisis
- 65% of donors distrust NGOs’ fund usage
- 70% never receive proof of impact
- Large NGOs attract most funding regardless of effectiveness

### 1.2 Disaster Relief Failures
- Manual approvals delay aid
- Middlemen cause leakage and corruption
- Beneficiaries lack autonomy
- Governments lack real-time oversight

### 1.3 Why Existing Systems Fail

| Existing Approach | Why It Fails |
|------------------|-------------|
| NGO reports | Self-reported, unverifiable |
| Bank statements | Do not show purpose |
| Blockchain-only | Not user-facing |
| AI-only | No accountability |
| Government-controlled | Slow, centralized |

---

## 2. Core Design Philosophy

AidFlow AI is built on **five non-negotiable principles**:

1. **Zero Blind Trust** – Every claim must be verifiable
2. **Automation First** – Humans supervise, AI executes
3. **Programmable Money** – Funds must follow rules
4. **Public Verifiability** – Anyone can audit
5. **Failure Tolerance** – System remains safe under partial failures

---

## 3. System Architecture (Layered View)


Frontend (React):- 
| Donor | NGO | Beneficiary | Merchant | Public | Govt |

Backend (Node.js):-
| Auth | Campaign | Wallet │ Workflow | Audit | Policy │

AI Agent Layer:-
│ Eligibility | Risk | Fraud │

Audit & Integrity Layer:-
│ Hashing | Merkle Trees │


Blockchain Anchor:- 
│ Merkle Root Only (No PII) │


---

## 4. AI Agent Layer

### 4.1 Why AI Is Required
- Manual verification does not scale
- Disasters require **real-time decisions**
- Bias and human error must be minimized

### 4.2 AI Agents Used

| Agent | Responsibility |
|-----|---------------|
| Eligibility Agent | Validates beneficiary legitimacy |
| Risk Agent | Detects abnormal fund usage |
| Fraud Agent | Flags suspicious behavioral patterns |

### 4.3 AI Governance
- All AI decisions are **logged**
- All AI decisions are **auditable**
- AI is **advisory**, not absolute (human override allowed)

---

## 5. Programmable Relief Wallets

### 5.1 What Is a Programmable Wallet?
A wallet whose **usage rules are enforced by code**, not trust.

### 5.2 Rules Enforced
- Allowed categories (Food, Medicine, Shelter)
- Balance limits
- Expiry handling
- Merchant-only spending

### 5.3 Why This Matters
- Prevents cash misuse
- Ensures purpose-bound spending
- Preserves beneficiary dignity

---

## 6. End-to-End Workflow (Detailed)

### Case 1: Donation → Disaster Relief

Donor donates → Donation recorded
↓
NGO approves
↓
AidFlow Workflow Engine
↓
AI Eligibility + Risk Checks
↓
Policy Enforcement
↓
Wallet Created & Locked
↓
Merchant Spending
↓
Audit Logs Generated
↓
Merkle Root Anchored on Blockchain


### Case 2: AI Failure
- Donation remains valid
- Workflow pauses safely
- Audit trail preserved
- Manual intervention allowed

### Case 3: Blockchain Downtime
- Audit logs still valid
- Merkle root queued
- No data integrity loss

---

## 7. Audit & Transparency Model

### 7.1 Why Not Store Everything on Blockchain?
- High cost
- Privacy risks
- Scalability issues

### 7.2 AidFlow’s Approach
- Each event → cryptographic hash
- Hashes → Merkle Tree
- Merkle Root → Blockchain anchor

This ensures:
- Immutability
- Low cost
- Public verifiability
- Zero PII leakage

---

## 8. Public Audit Verification

Anyone can:
1. Enter a **Donation ID**
2. Verify:
   - Merkle root
   - Blockchain transaction
   - Full audit timeline

No login.  
No NGO permission.  
No backend trust required.

---

## 9. Edge Cases & Failure Handling

| Scenario | System Behavior |
|-------|----------------|
| Server restart | DB-backed recovery |
| AI downtime | Workflow pauses safely |
| Blockchain down | Deferred anchoring |
| Partial workflows | Audit preserved |
| Wallet misuse attempt | Blocked by rules |
| Duplicate events | Hash collision protection |

---

## 10. Security Model

- JWT-based authentication
- Role-based access control
- Deterministic hashing
- No PII on-chain
- Tamper-evident audit logs

---

## 11. Installation & Setup (Local)

```bash
# Clone repository
git clone https://github.com/your-repo/AidFlow.git
cd AidFlow


Backend
cd backend
npm install
npm run dev

Frontend
cd frontend
npm install
npm run dev

AI Agents
cd ai-agents
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py

Blockchain
cd blockchain
npm install
npx hardhat compile


12. Role-Based Responsibilities

Role	Responsibility
Donor	Donate & verify
NGO	Campaign ops & approvals
Beneficiary	Aid usage
Merchant	Spend validation
Government	Oversight only
Public	Audit verification


13. Real-World Impact

30–40% increase in donor trust

Faster disaster response

Empowerment of grassroots NGOs

Transparent governance

Globally replicable model

14. Future Scope

DAO-based governance

Stablecoin disbursement

Cross-border relief

Zero-knowledge audits

Government disaster API integration

15. Why AidFlow AI Wins

AidFlow does not ask for trust.
It proves impact — mathematically, publicly, and immutably.
