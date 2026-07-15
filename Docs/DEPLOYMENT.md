# AidFlow — Production Deployment

Production guidance only — see `SETUP.md` for local development. Nothing in this codebase is deployed anywhere today; everything below is a practical, reasoned recommendation for this specific stack (Node/Express API + background workers, 4 Python FastAPI microservices, MongoDB, Redis, a Solidity contract, and a static React build) rather than a description of an existing setup. Where a choice is genuinely yours to make (which host, which chain), that's called out explicitly instead of presented as the only option.

---

## 1. Hosting Platform

Six independent pieces to place. They don't need to live on the same platform.

| Piece | What it needs | Reasonable options |
|---|---|---|
| Backend API | long-running Node process, WebSocket support | Railway, Render, Fly.io, or a plain VPS |
| Backend workers | long-running Node process, **no public ingress needed** | same platform as the API, separate service/process |
| 4 AI agents | long-running Python processes (or one container each) | same platform, or bundle onto one small VM given how lightweight 3 of the 4 are |
| Frontend | static file hosting | Vercel, Netlify, Cloudflare Pages, or nginx serving the `dist/` build |
| MongoDB | replica set (transactions are used throughout) | **MongoDB Atlas** — strongly recommended over self-hosting; a managed replica set with automated backups and no operational burden |
| Redis | persistent-enough for queue durability | Upstash, Redis Cloud, or your host's managed Redis add-on |

**Why not one big VM running everything:** it works, and `docker-compose.yml` in this repo will get you there in an evening — but the API, workers, and each AI agent scale independently in practice (a fraud spike hits the fraud agent and workers, not the frontend), and keeping them as separate deployable units means a bad deploy to one doesn't take down the others.

**On the blockchain specifically:** local dev uses a throwaway Hardhat chain that resets on restart — obviously wrong for production. For a real deployment, point `RPC_URL` at an actual network:
- **Staging/testing:** a public testnet (Polygon Amoy, Sepolia) via a free RPC provider (Alchemy, Infura, or the chain's own public RPC)
- **Production:** either a low-fee L2 mainnet (Polygon, Base) if genuine on-chain settlement finality matters to you, or continue treating this as an internal audit log anchor rather than a public-facing chain, in which case a permissioned/private chain you control is also reasonable — this is a product decision, not a technical constraint

Whichever you choose, `BLOCKCHAIN_PRIVATE_KEY` needs real funds (however small) to pay gas, and the deploy step (§7/§9) runs once against that network, not on every deploy.

---

## 2. Build Command

| Service | Command | Output |
|---|---|---|
| Frontend | `npm ci && npm run build` | static files in `frontend/dist/` — deploy this directory |
| Backend | `npm ci --omit=dev` | no build step, runs directly from source |
| Workers | (same install as backend, different start command) | — |
| AI agents | `pip install -r requirements.txt` | no build step |
| Blockchain | `npx hardhat compile` | only needed once, before the one-time deploy — not part of the app's regular build/deploy cycle |

Frontend `VITE_*` env vars are **compiled into the static bundle at build time**, not read at runtime — if you change `VITE_API_BASE_URL`, you must rebuild and redeploy the frontend, not just restart it.

---

## 3. Environment Variables

Same variables as `SETUP.md` §4, with these production-specific changes:

| Variable | Local dev | Production |
|---|---|---|
| `NODE_ENV` | `development` | `production` — **this isn't cosmetic.** It gates a real security behavior: the password-reset endpoint only includes the raw reset token in its API response when `NODE_ENV !== "production"` (there's no email-sending integration in this codebase yet — see the checklist in §9). Forgetting to set this in production reopens a full account-takeover path. |
| `FRONTEND_URL` | `http://localhost:5173` | your real frontend domain(s), comma-separated, `https://` |
| `MONGO_URI` | local/dev Atlas cluster | production Atlas cluster — **separate cluster from staging/dev**, not just a different database name on the same one |
| `JWT_SECRET`, `QR_SECRET`, `PII_HASH_SECRET` | dev-generated | **freshly generated for production**, never reused from dev/staging. If any of these were ever committed to version control at any point in this project's history, rotate them regardless of environment — see §9. |
| `RPC_URL`, `AUDIT_CONTRACT_ADDRESS`, `BLOCKCHAIN_PRIVATE_KEY` | local Hardhat | your real network's RPC endpoint, the contract address from your one-time production deploy, and a wallet key holding real (if small) funds for gas |
| `STORAGE_TYPE` | `LOCAL` | `S3` strongly recommended — see below |
| `BACKEND_PUBLIC_URL` | `http://localhost:5000` | your real API domain, `https://` — only read when `STORAGE_TYPE=LOCAL`; irrelevant if you switch to S3 |
| `AI_*_URL` variables | `localhost:800x` | the internal/private URLs of each deployed agent — these don't need to be publicly reachable, only reachable from the backend and workers |

**Switch `STORAGE_TYPE` to `S3` in production.** Local disk storage means uploaded proof photos live on one specific server's filesystem — they won't survive a redeploy on most platforms (ephemeral containers), won't be reachable if you run multiple backend replicas, and won't get backed up. Set `S3_BUCKET` and `S3_REGION`, and configure AWS credentials via your platform's standard mechanism (IAM role if on AWS, or standard AWS credential env vars otherwise) rather than hardcoding keys in `.env`.

Store all of these in your platform's secret manager (Railway/Render env var UI, AWS Secrets Manager, etc.) — never commit a production `.env` file. See §9 for what to do about the `.env` files already present in this codebase's history.

---

## 4. Domain

Suggested structure, adjust to taste:

```
app.yourdomain.com        -> frontend
api.yourdomain.com        -> backend API (+ WebSocket, same origin)
```

The AI agents and Redis don't need public domains at all — they should only be reachable from inside your private network/VPC, not exposed to the internet. If your hosting platform doesn't offer private networking between services, put them behind a firewall rule or security group that only allows traffic from the backend/worker instances.

Set `FRONTEND_URL=https://app.yourdomain.com` in the backend, and `VITE_API_BASE_URL=https://api.yourdomain.com/api` when building the frontend.

---

## 5. SSL

If you're on Railway, Render, Vercel, Netlify, Fly.io, etc.: this is handled automatically — nothing to configure.

If you're self-hosting on a VPS behind nginx: use [Certbot](https://certbot.eff.org/) with Let's Encrypt.
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```
This edits your nginx config in place and sets up auto-renewal. Verify with `sudo certbot renew --dry-run`.

---

## 6. Reverse Proxy

Only relevant if self-hosting (a managed platform handles this for you). One important detail specific to this app: **the backend serves WebSocket on the same port as the HTTP API**, so your proxy must forward the WebSocket upgrade, not just plain HTTP.

```nginx
server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;

        # Required for the WebSocket connection (donation.websocket.service.js)
        # to actually work through this proxy - without these two headers
        # the upgrade handshake fails silently and clients fall back to
        # polling or just don't get real-time updates.
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

The frontend's own `nginx.conf` (in this repo, used by its Dockerfile) is a separate, simpler config for serving the static SPA build — no proxying needed there, just the client-side-routing fallback.

---

## 7. Docker (optional)

Dockerfiles exist for every service in this repo:
```
backend/Dockerfile              (also used for the worker process, different CMD)
frontend/Dockerfile             (multi-stage: vite build -> nginx)
ai-agents/eligibility_agent/Dockerfile
ai-agents/fraud_agent/Dockerfile
ai-agents/risk_agent/Dockerfile
ai-agents/proof_agent/Dockerfile   (includes the tesseract-ocr system package)
```
plus a root `docker-compose.yml` wiring all of them together with Redis. Read the comment block at the top of `docker-compose.yml` — it deliberately excludes MongoDB and the blockchain node, with the reasoning inline (managed Atlas over a containerized single-node Mongo; a real network over a local Hardhat chain that resets on restart).

```bash
docker compose --env-file backend/.env up --build
```

For an actual production deploy, most platforms (Railway, Render, Fly.io) can build directly from these Dockerfiles per-service rather than needing compose at all — point each service at its subdirectory.

---

## 8. CI/CD

`.github/workflows/ci.yml` runs on every push/PR: backend (syntax-checks every file, then the real test suite against Redis + a MongoDB replica-set service container), frontend (lint + build), each AI agent (dependency install + import check), and the Solidity contract (compile).

**This has been verified to actually run correctly locally** (I ran the backend test suite myself while writing this and fixed the workflow based on what it actually needed — it turned out to require both Redis and a MongoDB replica set, not just Redis as first assumed). **It has not been run inside GitHub Actions itself** — the MongoDB replica-set initialization step is the part most likely to need a small adjustment on a real run; everything else should work as written.

Add a deploy job once you've picked a platform, gated on the others passing:
```yaml
deploy:
  needs: [backend, frontend, ai-agents, blockchain]
  if: github.ref == 'refs/heads/main'
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    # your platform's deploy action/CLI goes here
```

---

## 9. Production Checklist

Compiled from everything found and fixed across the full audit of this codebase — not a generic checklist, a specific one for this app's actual history.

**Security — do these before anything else goes live:**
- [ ] `NODE_ENV=production` is actually set. This gates the password-reset token fix directly (§3) — verify by hitting `/auth/forgot-password` in a staging environment with `NODE_ENV=production` set and confirming the response does *not* include a `resetToken` field.
- [ ] `JWT_SECRET`, `QR_SECRET`, and `PII_HASH_SECRET` are freshly generated for production, and `QR_SECRET !== JWT_SECRET` (the app refuses to boot otherwise, but worth stating explicitly here).
- [ ] If this codebase was ever obtained with `backend/.env` or `ai-agents/proof_agent/.env` already populated with real-looking values (rather than the blank `.env.example` templates), **treat every value in them as compromised and rotate all of it** — regardless of which environment you're deploying to. Check `SETUP.md` §4's security note.
- [ ] `backend/.gitignore` and `ai-agents/.gitignore` exist and exclude `.env` (added during this audit — previously there was no `.gitignore` in either location at all, meaning `.env` files had no protection from being committed). Confirm neither file has ever actually been committed to your git history; if one has, rotating the secrets in it isn't optional even after adding `.gitignore` now, since the old values remain in history.
- [ ] `STORAGE_TYPE=S3`, not `LOCAL` (§3).
- [ ] `BLOCKCHAIN_PRIVATE_KEY` is a real, dedicated wallet key — never a Hardhat default test key (those are publicly known to everyone who has ever installed Hardhat).
- [ ] A real e-commerce/payment gateway integration if donations are meant to move real money — the current donation flow assumes payment already succeeded (marked with a `// TODO` in the source) rather than integrating one. Confirm this matches your actual intent before accepting real donor payments.
- [ ] A real transactional email provider if you want password-reset emails to actually send — none is integrated yet (§3's `NODE_ENV` note is the safety net for its absence, not a substitute for having one).

**Correctness:**
- [ ] MongoDB is a genuine replica set (`SETUP.md` §5) — transactions throughout the app will throw otherwise.
- [ ] All 4 AI agents are reachable from the backend/workers at the URLs configured in `AI_*_URL`, and each responds on its `/health` endpoint.
- [ ] The blockchain contract is deployed to the network you actually configured in `RPC_URL`, and `AUDIT_CONTRACT_ADDRESS` matches.
- [ ] `FRONTEND_URL` includes every real origin the frontend is served from, exactly (protocol + host, no trailing slash) — a mismatch here silently breaks every API call with a CORS error that's easy to mistake for a backend outage.

**Operational:**
- [ ] Both the API process *and* the worker process are running as separate, independently-monitored services — the worker isn't optional, most of the app's actual business logic (AI evaluation, wallet creation, blockchain anchoring, notifications) happens there asynchronously, not in the API request/response cycle.
- [ ] `node scripts/createAdmin.js` has been run once against the production database, and its default password (`Admin@123`) has been changed immediately after first login.

---

## 10. Monitoring

**Already built in, use it:**
- `GET /health` on the backend, `GET /health` on each of the 4 AI agents — wire these into whatever uptime check your platform offers (most have this built in; otherwise a free tier of UptimeRobot/Better Uptime works fine).
- The backend logs via `pino` (structured JSON logs) — point your platform's log drain at stdout, or add a `pino-transport` to ship to a log aggregator (Better Stack, Axiom, or your platform's built-in log viewer) if you want retention/search beyond what your host keeps by default.
- `AuditLog` and `FraudAlert`/`FraudCase` collections are the app's own domain-level audit trail — the admin dashboard's Fraud Management and Audit Logs pages surface these already; worth periodically checking even without a formal alerting pipeline on top.

**Worth adding if you don't have an APM/error-tracking tool already:** Sentry (or similar) on the backend and frontend both — this codebase doesn't have one wired in, and the worker process failing silently in the background is exactly the kind of thing that's easy to miss without one (several of the bugs found during this project's audit were silent failures with no visible error to a user — exactly the failure mode error tracking is for).

**Queue health:** BullMQ (used for all the async job processing — donations, AI evaluation, blockchain anchoring, settlement, wallet expiry) doesn't have a dashboard wired in by default. [Bull Board](https://github.com/felixmohr/bull-board) or Redis Insight against your Redis instance will show queue depth and failed jobs — useful for noticing "the AI agent has been down for an hour and 200 donations are stuck" before a user reports it.

---

## 11. Scaling Notes

- **Backend API**: stateless (JWT auth, no server-side sessions), so horizontal scaling behind a load balancer is straightforward — run N replicas, no sticky sessions needed. The WebSocket connections are the one exception worth knowing about: if you scale to multiple API replicas, a client's WebSocket connection sticks to whichever replica it connected to, so a broadcast-style notification would need a shared pub/sub layer (Redis pub/sub) to reach clients connected to a *different* replica than the one that triggered the event. This isn't wired up currently — fine at one replica, worth revisiting before running several.
- **Workers**: also horizontally scalable — BullMQ workers pulling from the same Redis queue naturally load-balance jobs across as many worker processes as you run. Start with 1, add more if queue depth (via Bull Board) shows a backlog during traffic spikes (e.g., a large disaster response driving a donation surge).
- **AI agents**: `eligibility_agent`, `fraud_agent`, and `risk_agent` are small, stateless, rule-based FastAPI services with no database of their own — cheap to run multiple replicas of behind a simple round-robin, if the worker throughput above ever demands it. `proof_agent` is heavier (OCR, image hashing) and the more likely one to need its own replica count tuned independently of the other three.
- **MongoDB**: Atlas handles read replicas and (on paid tiers) auto-scaling storage/compute — start on the smallest tier that supports replica sets and watch actual usage before upgrading.
- **Redis**: queue-only usage here (not caching session data or anything latency-critical beyond job dispatch), so a modest managed tier goes a long way. Watch memory usage if donation volume gets very high, since completed job records accumulate until BullMQ's cleanup settings prune them.
- **Frontend**: a static build behind a CDN scales close to infinitely without any real effort — this is the one piece of the stack you're unlikely to ever need to think about again once it's deployed.
