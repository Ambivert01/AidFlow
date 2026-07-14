# AidFlow — Documentation-vs-Codebase Gap Analysis & Roadmap
_Compiled from: PROJECT_DOCUMENTATION.md (9,410 lines / 119 sections), AIDFLOW.odt (5,626 lines, original vision doc), and a full audit of `aidflow-fixed_1` (443 files: backend, frontend, ai-agents, blockchain)._

_AIDFLOW.pdf and AidFlow.pdf are print exports of the ODT and the .md respectively — same content, so they were cross-checked but not treated as separate sources._

---

## 0. How the two documents relate (read this first)

These two docs are **not duplicates** — they're two different layers, and treating them as equally literal specs would send fixes in the wrong direction:

- **AIDFLOW.odt** is the original hackathon-style vision/pitch document (mixed Hindi/English). It explicitly frames itself as the *pre-code design phase* ("next phase is ONLY implementation & iteration") and includes many aspirational "Phase 2/3" and "ADD-ON" ideas — NLP-based donor-intent parsing, DAO governance, zero-knowledge proofs, real stablecoins on Polygon/Base, satellite-data-driven eligibility, digital-twin simulation. The document itself labels these as future/stretch goals.
- **PROJECT_DOCUMENTATION.md** is the practical master spec the actual codebase was built against — no NLP, no DAO, no ZKP, no real stablecoin. It matches the real architecture (MongoDB, JWT, Node/Express, Python FastAPI microservice agents, Hardhat-based blockchain anchoring, React/Vite).

**Conclusion used throughout this report:** the codebase should be judged against PROJECT_DOCUMENTATION.md's Section C–H (roles, features, workflows, DB, API, security) as ground truth, using the ODT for philosophy/intent and for the concrete rules it states outside the "ADD-ON" sections (wallet constraints, merchant rules, tech stack, folder layout — all of which match the real code closely). Findings below don't chase the ODT's stretch-goal features; they focus on gaps between the *practical* spec and what's actually wired up.

---

## 1. Baseline state confirmed

A prior session (documented in `CHANGELOG_FIXES.md`, 15 checkpoints, 90+ bugs) already did substantial work. I verified rather than assumed:

- **Backend**: zero syntax errors across all files (`node --check`, full sweep).
- **Frontend**: the entire import graph from `App.jsx` bundles cleanly with esbuild (all ~140 files resolve, no broken imports).
- **AI agents**: zero Python syntax errors across all 4 agents.
- **Blockchain**: contract only stores hash/timestamp/campaignId, no PII, no business logic — matches docs.
- Core donation pipeline, policy engine, and eligibility-scoring logic are genuinely well-built and match the documented state machines (not stubs).

**Sandbox limitation, stated plainly:** this container has no MongoDB (not installable — no `mongod` package via apt, and MongoDB's binary CDN isn't in the network allowlist) and no Redis running by default. I could not spin up a live end-to-end run with real HTTP requests hitting a real database in this chat. What I did instead — and what the findings below are based on — is rigorous **static/logical verification**: tracing every route → controller → service → model → validator chain by hand, cross-referencing enums and schemas across layers, and confirming with syntax/bundle checks. For true live-data, click-through testing you'll want your local machine (`SETUP_GUIDE.md` has the steps) or I can continue tracing additional flows the same way in follow-up turns.

---

## 2. Role-by-role lifecycle coverage

| Role | Registration | Approval gate | Login block if unapproved | Core workflow wired | Dashboard |
|---|---|---|---|---|---|
| Donor | ✅ `/auth/register` | Auto-approved | N/A | ✅ Donate → AI risk check → wallet funding | ✅ |
| NGO | ✅ `/access/request` | ✅ Admin approval | ✅ (was already correct) | ✅ Campaign → beneficiary review → wallet | ✅ |
| Merchant | ✅ `/access/request` | ✅ Admin approval | ✅ | ✅ QR scan → payment → settlement | ✅ |
| Government | ✅ `/access/request` | ✅ Admin approval | ✅ | ✅ Escalation review, fraud monitor | ✅ |
| Admin | (seeded, not self-registered) | N/A | N/A | ✅ Approvals, overrides, audit | ✅ |
| **Beneficiary** | ❌ **was completely broken** (see §4) | N/A (not required) | N/A | ❌ was unreachable | ✅ (existed, but unreachable) |

Beneficiary was the one role where the full "click first, register, get approved, use the product" chain the user described actually could not happen — see §4 for the fix.

---

## 3. Findings by category

### Security
1. **[FIXED]** Session revocation gap: `authenticate.middleware.js` checked `isActive` on every request but never re-checked `verificationStatus`. An NGO/Merchant/Government account that was `APPROVED` and later `REJECTED` by an admin kept full API access until their JWT naturally expired — rejection didn't actually cut anyone off in real time. Fixed by re-validating `verificationStatus` for roles that require approval, on every authenticated request.
2. Role-selection at registration is properly locked down at the Zod-schema level (`/auth/register` only ever accepted `DONOR`, now `DONOR`+`BENEFICIARY`; `/access/request` only ever accepts `NGO`/`MERCHANT`/`GOVERNMENT`) — no privilege-escalation path exists to self-assign `ADMIN`. Confirmed safe, no change needed.
3. Aadhaar and phone are SHA-256 hashed before storage in the `Beneficiary` model, never stored in plaintext — matches the documented privacy design.

### Logic
1. **[FIXED]** `Beneficiary.user` bug: when an NGO registered a beneficiary, the service stamped the **NGO's own** `User._id` into the `Beneficiary.user` field (meant to link a beneficiary to *their own* login account). Harmless today only because the route requiring that field (`GET /beneficiaries/me`) is gated to `BENEFICIARY` role, so an NGO account could never hit it — but it was polluting a field whose entire purpose is to support self-service later, which is exactly the feature that turned out to be missing. Fixed as part of §4.
2. `rejectUser` (admin) has no guard preventing rejection of an already-approved account (unlike `approveUser`, which does check). This is actually correct behavior (admins should be able to revoke), but it's what made the session-revocation gap in §Security matter in practice — now closed together.

### UX
1. Beneficiary empty-dashboard state told users "an NGO must assign you" with no way to act — a dead end for anyone who self-registered. Added a direct "Apply to a campaign" call-to-action.
2. `BeneficiaryDashboard.jsx` uses a different CSS variable set (`--color-ink`, `--color-steel`, `--color-paper-alt`) than the rest of the app (`--color-text`, `--color-text-muted`, `--color-surface`). Both resolve today (checked `index.css` — the alternate names exist as an older palette layer) but it's a visible seam between "old theme" and "new theme" pages. Flagged for the UI redesign pass (§6).

### Broken Integrations
1. **[FIXED - the big one]** `BeneficiarySelfApply.jsx` called `POST /beneficiaries` with just `{campaignId}`. That route is `authorize("NGO")`-only and requires a full registration payload (name, phone, location, household). A logged-in beneficiary hitting it would get a 403, and it's moot anyway because...
2. **[FIXED]** ...there was **no way for a human to ever become a `BENEFICIARY`-role user** in the first place. `/auth/register` was hardcoded to `role: DONOR` on the frontend and schema-locked to `[DONOR]` on the backend; `/access/request` only accepts `NGO`/`MERCHANT`/`GOVERNMENT`. The `authorize("BENEFICIARY")` routes (`/beneficiaries/me`, `/beneficiaries/apply`, wallet routes, appeals) were fully built on both ends but structurally unreachable. This is the single largest gap between the documented workflow ("Beneficiary Registration → AI Eligibility → Manual Review → Wallet") and what the code could actually do.
3. Notification triggers are wired for admin actions, proof verification, wallet events, and fraud/expiry workers — but **not** from `donation.service.js`, `ngo.service.js` (campaign approve/reject), or the merchant settlement path. Several documented notification types (donation received, campaign approved, beneficiary approved, payment successful) likely never fire. Not fixed yet — flagged for Phase 2 (§7).

### Refactoring / Dead Code / Duplicates
1. **[FIXED]** `engines/wallet.engine.js` (90 lines, a full `WalletEngine` class) had **zero importers anywhere in the codebase**, including tests. `wallet.service.js` reimplements the same logic directly instead of using it. Confirmed via exhaustive grep before removing — deleted rather than left to rot, since keeping a parallel "looks canonical but isn't" implementation around is exactly the kind of thing that causes future bugs when someone edits the wrong copy.
2. `engines/policy.engine.js` and `engines/workflow.engine.js` **are** genuinely used (by `wallet.service.js` and by `fraud.worker.js` respectively) — confirmed real, not dead.
3. `ai-agents/shared/schemas.py` is a 0-byte empty file with no importers. Harmless, low priority, noted for a future cleanup pass rather than touched now.

### AI Map
- `eligibility_agent`, `fraud_agent`, `risk_agent` are genuine rule-based scoring engines with explainability output (flags + reasons), not stubs — matches the documented "explainable, rule-based-first" design philosophy in both docs.
- `proof_agent` (419 lines) is the most substantial agent — real perceptual-hash and OCR-based proof verification, consistent with `CHANGELOG_FIXES.md`'s claim of the most fix work happening there.
- No LLM/NLP-based intent parsing exists anywhere (correctly — that's an ODT "future" idea, not part of the practical spec).

### Blockchain Map
- Single Solidity contract, `onlyOwner`-gated writes, stores only `hash + timestamp + campaignId` — no PII, no funds custody on-chain. Matches the documented "anchor, don't custody" design.
- `hardhat.config.js` only defines the in-memory `hardhat` network (fine for local dev/testing; confirm your deployment config for staging/prod separately — didn't find one to audit in this bundle).
- Centralization note (not a bug, just worth naming): a single owner EOA controls all writes. The ODT itself lists DAO governance as future work, so this is expected at this stage, not a regression.

### Missing Workflows
1. **[FIXED]** Beneficiary self-service registration → application → status tracking → wallet, end to end (§4).
2. Notification completeness for donation/campaign/merchant events (Phase 2, not yet done).
3. Not yet independently traced this session: full merchant settlement reconciliation, government escalation dashboard depth, and campaign-approval-requires-NGO-approved edge case. Recommended next in §7.

---

## 4. What was actually fixed this session (Phase 1)

All changes are in the repackaged codebase. Every file was syntax-checked (`node --check` for backend, full esbuild bundle of the frontend import graph from `App.jsx`) after editing — zero errors.

**Backend**
- `constants/roles.constants.js` — `SELF_REGISTER_ROLES` now includes `BENEFICIARY`.
- `modules/auth/auth.validator.js` — `/auth/register` accepts `role: BENEFICIARY` (plus optional `phone`).
- `modules/auth/auth.service.js` — persists `phone` at registration (needed to prefill the apply form).
- `modules/beneficiary/beneficiary.service.js` — refactored beneficiary creation into one shared internal function used by both NGO-driven registration and the new self-apply path; fixed the `user` field bug; added `applyAsBeneficiary()`.
- `modules/beneficiary/beneficiary.controller.js` — added `applyAsBeneficiary` handler.
- `modules/beneficiary/beneficiary.routes.js` — added `POST /beneficiaries/apply` (`authorize("BENEFICIARY")`).
- `middlewares/authenticate.middleware.js` — re-checks `verificationStatus` on every request for roles requiring approval (session-revocation fix).
- `engines/wallet.engine.js` — removed (confirmed dead).

**Frontend**
- `pages/Register.jsx` — added a "I want to donate" / "I need aid" toggle; posts the correct role; collects phone for beneficiaries.
- `services/beneficiary.service.js` — `applyToCampaign` now calls the correct endpoint with the full payload.
- `modules/beneficiary/BeneficiarySelfApply.jsx` — rebuilt with a complete application form (identity, location, household, displacement/income signals) mirroring the NGO-side form, plus live application-status tracking.
- `modules/beneficiary/BeneficiaryDashboard.jsx` — empty state now has a working "Apply to a campaign" CTA instead of a dead end.

**End-to-end path this unlocks**, traceable in code from the entry point:
`Register.jsx` ("I need aid" tab) → `POST /auth/register {role: BENEFICIARY}` → auto-login → redirect to `/beneficiary` → empty-state CTA → `/beneficiary/apply` → `POST /beneficiaries/apply` → AI eligibility job queued → NGO review queue → approve/reject → wallet issuance on approval → visible back on `/beneficiary` dashboard and `/beneficiary/apply` status card.

---

## 5. What I deliberately did *not* change

- Any of the ODT's "ADD-ON"/Phase-2/3 ideas (NLP parsing, DAO, ZKP, real stablecoins, satellite data, digital twins) — out of scope for "fix what's broken," and the source doc itself doesn't ask for them yet.
- Wide-reaching schema changes, new collections, or anything touching money movement logic beyond what was needed for the beneficiary fix — kept the blast radius small on a first pass, per "don't break the system."
- Full UI redesign — see §6 for the proposed direction; a 60+ page visual overhaul needs its own dedicated pass(es), not a rushed side-effect of a logic-fixing session.

---

## 6. UI redesign — proposed direction (not yet executed)

I read the actual component code (Register.jsx, RegisterBeneficiary.jsx, BeneficiaryDashboard.jsx, etc.) rather than guessing. Current state: CSS-variable-driven design system, mostly consistent, but with at least two competing palettes live at once (`--color-primary/text/surface` vs `--color-ink/steel/paper-alt`), heavy inline `style={{}}` blocks instead of utility classes, and minimal motion beyond a couple of `animate-fade-up` classes.

For a proper redesign I'd want to lock in, with you, before touching 60+ pages:
- One unified color system + type scale (single source of truth, no second palette)
- A small motion vocabulary (page-transition, card hover/lift, list stagger, success/error micro-feedback) applied consistently rather than page-by-page
- A distinct visual identity per role (donor / NGO / beneficiary / merchant / government / admin should *feel* different at a glance, the way the vision doc's "public trust" framing implies) while sharing the same underlying components

I did not start restyling pages yet because doing it well means agreeing on direction first — I can propose 2-3 concrete visual directions (with an actual rendered mockup of one flagship page each, e.g. the donor dashboard) next turn if you'd like, then apply the chosen direction systematically role-by-role so nothing gets half-migrated.

---

## 7. Recommended next phases

1. ~~**Phase 2 — Donation → Campaign → Wallet chain**~~ **DONE** — see §8.
2. ~~**Phase 3 — Merchant flow**~~ **DONE** — see §9.
3. ~~**Phase 4 — Government + Admin oversight**~~ **DONE** — see §10.
4. ~~**Extended trace**~~ **DONE** — see §11.
5. ~~**Phase 5 — UI redesign (2 passes)**~~ **DONE** — see §12.
6. ~~**Phase 6 — Infrastructure sweep**~~ **DONE** — see §13, found the most severe issue of the audit.

Remaining: continued page-by-page UI polish has hit diminishing returns (each sweep is finding less). True live-data testing needs a real environment (§6 constraint). Say "continue" for another pass, or point me anywhere specific.

---

## 8. Phase 2 findings (Donation → Campaign → Wallet chain)

**Verified solid, not touched:** the AI integration layer is genuinely well-built - I cross-checked `ai.service.js`'s request/response shapes against the *actual* Pydantic schemas in `fraud_agent` and `risk_agent` (not just their mock fallbacks) and every field matches exactly. Donation creation, idempotency handling, and the campaign-creation NGO-approval guard were already correct.

**Fixed this session:**

1. **Government escalation dead end (most severe bug found so far).** A donation escalated to government and then approved there was stamped `APPROVED_BY_GOVT` - a status the NGO's review queue never recognized. The donation could never be assigned to a beneficiary or turned into a wallet; the donor's money was permanently stuck. Fixed by including `APPROVED_BY_GOVT` in the NGO-actionable status set everywhere that set is checked.
2. **Double-counted campaign financials.** `approveDonation()` incremented `Campaign.totalAllocated`/`totalWalletsCreated` itself *and* called `createWallet()`, which does the same increment internally - every approved donation inflated the campaign's public transparency numbers by 2x. Removed the redundant increment.
3. **Second donation to an already-funded beneficiary always failed.** `createWallet()` only accepts beneficiaries with status `APPROVED`; approving their first donation flips them to `ACTIVE`, so any subsequent donation allocated to the same beneficiary hit a wrong "beneficiary not approved" error instead of topping up their existing wallet via the already-built (but never-called-from-here) `creditWallet()`. Fixed by checking for an existing active wallet first.
4. **Donors received zero notifications, ever.** Not for AI block, government escalation, NGO approval, or NGO rejection. `DONATION_SUCCESS` existed as a notification type in the schema with no code path that ever used it. Added donor notifications at every real decision point, plus an NGO notification when a government-cleared donation needs action. Added `DONATION_REJECTED`/`DONATION_ESCALATED` notification types to distinguish outcomes the single existing type couldn't.

---

## 9. Phase 3 findings (Merchant flow: QR generate → scan → confirm → settlement)

This is the best-built chain in the codebase. QR payment tokens are signed with a dedicated secret kept separate from the JWT auth secret (so a stolen QR token can't be replayed as a login token or vice versa), and the settlement worker/scheduler wiring - fixed in an earlier checkpoint before this session - correctly closes the loop from "merchant accrues pendingBalance" to "actually gets paid out weekly." I traced generate → scan → confirm → debit → settle end to end and it holds together.

**Fixed this session:**

1. **Beneficiaries got zero confirmation their payment succeeded.** `confirmPayment()` correctly deducted the wallet and recorded everything server-side, but never notified the beneficiary - `TRANSACTION_SUCCESS` was the *third* notification type this audit found defined in the schema with no code path ever using it (after `DONATION_SUCCESS` twice in Phase 2). Added a notification on every successful payment.

**Flagged, not fixed (lower priority, judgment calls rather than bugs):**

2. Merchant `location` (address/ward/district/lat/lng) is never collected anywhere - the admin's merchant-approval form only asks for shop name and category. Nothing breaks because of this (`policy.engine.js`'s geo-fence/district checks no-op gracefully when location data is absent), but it does mean those checks - and "find merchants near me" discovery - can never actually activate. Worth adding to the approval form if geo-fencing matters to you.
3. `POST /wallet/qr` and `POST /payments/qr` are two routes calling the identical underlying function; the frontend only uses the latter. Harmless duplication, easy future cleanup.

**Verified solid, not touched:** merchant suspension/ban takes effect immediately on the very next scan (checked live from the database, not cached) - the same real-time-revocation principle fixed for user auth in Phase 1 was already correctly implemented here.

---

## 10. Phase 4 findings (Government/Admin oversight + blockchain anchoring)

This phase covered the two areas you emphasized most - fraud oversight and blockchain trust - and found the two most severe bugs of the entire audit. Both are the same underlying failure mode as everything else found this session (a schema and a writer that quietly don't agree with each other), just with much higher stakes given what they're supposed to protect.

1. **Fraud alerts were never actually saved, at all.** The fraud-detection worker's calls to `FraudAlert.create()` didn't match the real schema in three separate ways (missing two required fields, wrong-case enum value, several field names that don't exist on the model) - every call threw, silently swallowed by the worker's outer error handler. Worse: because the throw happened *before* the wallet's `.save()` call in the auto-freeze branch, **automatic wallet freezing on high fraud risk was silently not taking effect either**, alongside zero fraud alerts ever existing anywhere. Fixed with a schema-correct builder.
2. **A fully-built admin fraud-investigation feature was permanently empty.** `FraudCase` - a separate, richer model with a complete assign/notes/resolve workflow and a polished matching admin page (`FraudManagement.jsx`) - had zero code anywhere that ever created a record in it. The feature was 100% built and 100% disconnected from any real data source. Fixed by having the fraud worker create both records together.
3. **Donation blockchain anchoring never anchored a single donation.** The queue consumer only knew how to handle proof-anchoring jobs (checked for a `proofId` field); donation-anchoring jobs - the only kind that actually ever got queued - fell through to a generic fallback that ran a real anchor transaction but never wrote the result back to the donation itself. `Donation.blockchainHash`/`blockchainAnchored` - what the donor-facing "verify on blockchain" screen reads - were never set by anything. Given this project's own stated purpose is donor-verifiable blockchain transparency, this was the single highest-stakes bug found this session. Fixed with a real donation-anchoring branch that writes the result back to the specific donation.
4. **The public "is blockchain anchoring operational" status was also broken, separately.** Even where anchoring *was* already correctly wired (the proof path), the audit log entries it created never populated the dedicated `merkleRoot`/`blockchainAnchor.txHash` fields that the public transparency page's status check queries - everything went into a generic `payload` blob instead. Fixed `createAuditLog()` to persist these properly and updated all three anchor call sites to use it.

**Verified, not touched:** admin campaign approve/reject and government campaign pause/close are a clean separation of concerns (onboarding gate vs. ongoing oversight), not an accidental duplicate like the fraud models above.

---

## 11. Extended trace findings (notifications, AI override, remaining workers)

Went wider rather than deeper this pass - checking areas not yet touched for the same "quietly disconnected" pattern found repeatedly above.

1. **Every notification added since Phase 2 was invisible to 5 of 6 roles.** The only place notifications were ever displayed was inside the NGO dashboard - there was no notification UI anywhere in the shared layout every other role uses, even though the backend endpoints were already generic and ready for any role. Added a global notification bell to the shared navbar so donors, beneficiaries, merchants, government, and admin can now all actually see what's been sent to them.
2. **`markNotificationRead` had no ownership check** - any authenticated user could mark any notification as read by ID. Scoped it to the requesting user's own notifications and fixed a null-crash on a not-found ID along the way.
3. **The admin AI Override feature didn't work for any input.** It required a matching AI-decision log record that, in practice, only ever gets created for one narrow case (campaign risk evaluation) - not the donation/fraud/beneficiary overrides the form was actually built for. Every submission 404'd. Made the log lookup best-effort rather than a hard requirement, and added real entity-mutation handling for beneficiary overrides (previously a silent no-op even in the hypothetical success case). Removed campaign/merchant from the override options rather than guess at undefined behavior.
4. **Verified solid:** the proof-of-distribution pipeline (upload → AI validation → manual review → donor notification) traced end to end with no issues. The trust engine's fraud-penalty factor reads from `FraudAlert`, so the Checkpoint 19 fix now has real effect on trust scores, not just the fraud dashboard. Wallet expiry and recurring-donation workers are both correctly wired and running.
5. **Flagged, not fixed:** recurring donations have a fully working backend (subscribe endpoint + hourly cron processor) but zero frontend UI to create or manage one. Deliberately deferred to avoid building it once now and rebuilding it during the Phase 5 redesign.

---

## 12. Phase 5 findings (UI redesign, part 1)

**Important recalibration before this phase:** I don't have a way to take real screenshots in this sandbox (no headless browser available, and the one I tried to install pulls from a CDN outside the network allowlist), so this phase is based on careful code reading rather than visual QA. I'd recommend actually running the app locally at some point to visually confirm these changes look right, since I can't do that verification myself here.

What I found on inspection: the app already has a genuinely distinctive, well-considered design system ("Field Ledger") consistently applied everywhere - zero pages still on generic unmigrated defaults. This wasn't the "start from scratch" situation the request implied; redesigning from zero would have thrown away real work. So this phase focused on finding what's actually missing or inconsistent rather than rebuilding:

1. **Zero page-transition animation anywhere in the app.** Every single route change was an instant hard-cut. Given everything else about the visual system was solid, this is likely the single biggest lever for "smoothness" - fixed once at the routing layer so all 80+ pages benefit without individual changes.
2. **The public audit page and the donor's donation-timeline page - the two most important "prove it yourself" moments in the whole product - weren't using the app's own signature verification element** (a rotated ink-stamp motif that exists in the CSS and is used in a handful of places, but not these two). Added it, plus a real blockchain-hash verification card on the timeline page (meaningful now that Checkpoint 19's backend fix actually populates that data).
3. **A toast notification system existed and was correctly wired at the app root, but used in exactly one file.** Everywhere else fell back to native `alert()`/`confirm()`/`prompt()` - jarring, unstyled browser popups that break the crafted look every time they appear. Built a proper styled replacement and converted all 16 call sites across 8 files.
4. Fixed one real bug found along the way (an invalid Tailwind class silently breaking an emoji's size) and removed leftover debug `console.log` calls from two files.
5. **A sweep for off-palette colors found exactly 2 genuine leaks** (out of 86 files) - two components using raw Tailwind `purple-*` classes instead of the closed Field Ledger palette. Remapped both to existing semantic tokens rather than introducing a new color. Also fixed one CSS variable reference that pointed at a name that was never actually defined, silently falling back to a slightly-off gray.

**Not yet done:** a full page-by-page pass applying the same level of attention to every remaining dashboard and form (there are 80+ files total). The system-level fixes above (transitions, dialogs) already benefit every page automatically; what's left is more individual, page-by-page polish for anything that still feels flat or generic on closer inspection.

**Part 2 (same session, continued):** caught 2 more native dialogs the first sweep's grep pattern missed (`window.prompt()` and bare `confirm()` - different call shapes than what was searched for), converted both. Verified the admin System Health page shows genuinely live data rather than being a fabricated status display. Re-swept for off-palette colors across *all* Tailwind color families (not just gray/blue) and confirmed the earlier 2 leaks were the only ones. Added category color-coding to the merchant transaction list, which was rendering every aid category (food/medicine/shelter/water) in the same color - a real scanability miss on a page that's specifically a mixed list.

---

## 13. Phase 6 findings (infrastructure sweep) — the most severe issue of the audit

Deliberately moved off UI (diminishing returns) and into layers not yet checked: file storage, appeal authorization, and the password reset flow.

1. **CRITICAL SECURITY — full unauthenticated account takeover, any account, including admins.** The password-reset endpoint returned the raw reset token directly in its own API response (the code's own comment read `// Remove this in production`). Since no real email-sending integration exists anywhere in this codebase, this was the *only* place the token ever went. Anyone who knew or could guess a user's email could call the forgot-password endpoint, read the token straight out of the JSON response, and immediately reset that account's password - no access to the victim's inbox needed at all. This is likely the single highest-severity finding across the entire audit. Fixed by gating the token to non-production environments and logging it server-side instead of putting it on the wire.
2. **Uploaded proof-of-distribution files were completely unreachable.** No route ever served the local upload directory, and even after fixing that, the stored URLs were relative - which would still 404 given the frontend and backend run on different origins with no dev proxy configured. Fixed both: added the missing static route, and switched to returning absolute, backend-rooted URLs.
3. **Access-control gap:** any authenticated beneficiary could submit an appeal on behalf of *any other* beneficiary's rejected application, just by knowing their record ID - the appeal endpoint never checked the record belonged to the requester. Fixed.

Given finding #1, if this codebase has ever been deployed anywhere with real user data, treat this as a priority to patch and consider whether any accounts may have already been affected.

---

## 14. Honest coverage accounting (frontend files, and what "done" means here)

Asked directly, so answered directly: of 88 `.jsx` files, roughly 20 received individual, targeted edits where a real problem was found. The rest were not each individually redesigned. What *does* cover all 88 automatically: the page-transition system, the dialog system, and notification visibility - those are structural fixes at the routing/layout layer, so every page benefits without needing a per-file touch. What's genuinely NOT done: a page-by-page pass asking "does this specific screen's layout, copy, and structure hold up" for the ~65 files that were verified clean of the *specific* failure patterns hunted for (off-palette colors, native dialogs, missing tokens) but weren't given the deeper design-review treatment the flagship pages got.

On backend/blockchain/AI integration: yes, genuinely verified at the field level, not assumed. All 4 AI agents (eligibility, fraud, risk, proof) had their real HTTP request/response schemas cross-checked line-by-line against what the Node backend actually sends and reads - not just their mock fallbacks. Blockchain anchoring was broken (Checkpoint 19) and is now fixed and verified against the actual schema fields the public status page reads.

## 15. Full-lifecycle demo & verification script

`backend/scripts/seedFullLifecycleDemo.js` - built in response to the request for one script that exercises literally everything: account creation for all 6 roles, admin approval, campaign creation and approval, both beneficiary registration paths, AI eligibility evaluation, donations (normal, repeat-to-same-beneficiary, rejected, and deliberately escalated), government review, merchant QR payment, proof upload, fraud case resolution, blockchain anchoring, and public audit-trail queries.

It calls the real service layer (not raw database inserts), so running it is an actual integration exercise, not just data population. **I could not execute it myself** - this sandbox has no MongoDB available (confirmed by trying: no local package exists, and `mongodb-memory-server`'s binary download is blocked by network policy, tested directly). What I did instead: cross-checked every single service-function call in the script against that function's real signature and return shape by reading the source, not from memory - this caught and fixed one real bug in the script itself along the way (see Checkpoint 25). It's written to tell you exactly what happened when you run it: each step is individually reported as done, skipped (with the specific reason - almost always "the worker process or an AI agent isn't running"), or failed (a real problem worth investigating).

Run it with `cd backend && node scripts/seedFullLifecycleDemo.js` once your MongoDB, Redis, worker process, and AI agents are all running per `SETUP_GUIDE.md`. Safe to re-run - it clears its own previous demo data first (everything under the `@aidflow-demo.test` email domain).

