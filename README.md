AID-FLOW/
│
├── ai-agents/                          # Autonomous AI intelligence layer
│   ├── eligibility_agent/              # Determines beneficiary eligibility
│   │   └── main.py
│   ├── fraud_agent/                    # Detects misuse, anomalies, fake claims
│   ├── risk_agent/                     # Risk & confidence scoring
│   ├── shared/                         # Shared schemas & utilities
│   └── venv/                           # Python virtual environment
│
├── backend/                            # Core backend (System Brain)
│   ├── src/
│   │   ├── config/                     # Environment & system configuration
│   │   │
│   │   ├── controllers/                # API controllers (thin layer)
│   │   │   ├── auth.controller.js
│   │   │   ├── donation.controller.js
│   │   │   └── audit.controller.js
│   │   │
│   │   ├── middlewares/                # Security & access control
│   │   │   ├── auth.middleware.js
│   │   │   └── role.middleware.js
│   │   │
│   │   ├── models/                     # Database models (MongoDB)
│   │   │   ├── User.model.js
│   │   │   ├── Donation.model.js
│   │   │   ├── Campaign.model.js
│   │   │   └── Beneficiary.model.js
│   │   │
│   │   ├── routes/                     # API route definitions
│   │   │   ├── auth.routes.js
│   │   │   ├── donation.routes.js
│   │   │   ├── campaign.routes.js
│   │   │   └── audit.routes.js
│   │   │
│   │   ├── services/                   # Core business logic engines
│   │   │   ├── policy.engine.js        # Rules & governance engine
│   │   │   ├── wallet.engine.js        # Controlled wallet logic
│   │   │   ├── workflow.engine.js      # End-to-end execution orchestration
│   │   │   └── audit.service.js        # Audit log generation
│   │   │
│   │   ├── utils/                      # Utility helpers
│   │   │   ├── hash.util.js
│   │   │   └── logger.js
│   │   │
│   │   └── app.js                      # Express app bootstrap
│   │
│   ├── server.js                       # Backend entry point
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
│
├── blockchain/                         # Blockchain audit & transparency layer
│   ├── contracts/
│   │   └── AidFlowAudit.sol             # Immutable audit smart contract
│   │
│   ├── scripts/
│   │   └── deploy.js                   # Smart contract deployment
│   │
│   ├── test/
│   │   └── AidFlowAudit.test.js
│   │
│   ├── hardhat.config.js
│   ├── package.json
│   ├── package-lock.json
│   └── README.md
│
├── frontend/
│   └── aidflow-ui/                     # Frontend (React)
│       ├── public/
│       ├── src/
│       │   ├── components/             # Shared UI components
│       │   │   ├── Navbar.jsx
│       │   │   ├── Footer.jsx
│       │   │   └── Loader.jsx
│       │   │
│       │   ├── hooks/                  # Custom React hooks
│       │   │   └── useAuth.js
│       │   │
│       │   ├── modules/                # Role-based dashboards
│       │   │   ├── admin/
│       │   │   │   ├── AdminDashboard.jsx
│       │   │   │   ├── AuditLogs.jsx
│       │   │   │   └── PolicyBuilder.jsx
│       │   │   │
│       │   │   ├── donor/
│       │   │   │   ├── DonorDashboard.jsx
│       │   │   │   ├── Donate.jsx
│       │   │   │   └── DonationHistory.jsx
│       │   │   │
│       │   │   └── ngo/
│       │   │       ├── NGODashboard.jsx
│       │   │       ├── Campaigns.jsx
│       │   │       └── Beneficiaries.jsx
│       │   │
│       │   ├── pages/
│       │   │   ├── Login.jsx
│       │   │   ├── Register.jsx
│       │   │   └── NotFound.jsx
│       │   │
│       │   ├── services/               # API & blockchain clients
│       │   │   ├── api.js
│       │   │   ├── auth.service.js
│       │   │   └── blockchain.service.js
│       │   │
│       │   ├── utils/
│       │   │   ├── constants.js
│       │   │   └── formatters.js
│       │   │
│       │   ├── App.jsx
│       │   ├── main.jsx
│       │   └── index.css
│       │
│       ├── .env
│       ├── .env.example
│       └── package.json
│
├── docs/                               # Documentation & research material
│
├── docker-compose.yml                  # Multi-service orchestration
├── README.md                           # Main project documentation
└── .gitignore



