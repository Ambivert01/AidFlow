# Proof System Deployment Checklist

## Pre-Deployment Checklist

### Environment Variables

Ensure the following environment variables are set in `.env`:

- [ ] `AI_PROOF_URL` - URL of the AI proof validation agent (default: `http://localhost:8004`)
- [ ] `STORAGE_TYPE` - Storage type: `LOCAL` or `S3`
- [ ] `UPLOAD_PATH` - Local upload path (if using LOCAL storage)
- [ ] `S3_BUCKET` - S3 bucket name (if using S3 storage)
- [ ] `S3_REGION` - S3 region (if using S3 storage)
- [ ] `AWS_ACCESS_KEY_ID` - AWS access key (if using S3 storage)
- [ ] `AWS_SECRET_ACCESS_KEY` - AWS secret key (if using S3 storage)
- [ ] `REDIS_HOST` - Redis host for queue management
- [ ] `REDIS_PORT` - Redis port
- [ ] `MONGO_URI` - MongoDB connection string
- [ ] `RPC_URL` - Blockchain RPC URL (optional, for blockchain anchoring)
- [ ] `AUDIT_CONTRACT_ADDRESS` - Audit contract address (optional)
- [ ] `BLOCKCHAIN_PRIVATE_KEY` - Blockchain private key (optional)

### Dependencies

- [ ] Install Node.js dependencies: `npm install` (in `backend/` directory)
- [ ] Install Python dependencies for AI agent: `pip install -r requirements.txt` (in `ai-agents/proof_agent/` directory)
- [ ] Install Tesseract OCR: `sudo apt-get install tesseract-ocr` (Linux) or `brew install tesseract` (macOS)

### Database

- [ ] MongoDB is running and accessible
- [ ] Database indexes are created (automatically created on first run)
- [ ] Proof collection exists with proper schema

### Redis

- [ ] Redis is running and accessible
- [ ] Redis connection is configured correctly
- [ ] Queue workers can connect to Redis

### File Storage

- [ ] If using LOCAL storage: `backend/uploads/proofs/` directory exists and is writable
- [ ] If using S3 storage: S3 bucket exists and credentials are valid

### AI Validation Agent

- [ ] AI proof agent is running on port 8004
- [ ] Health check endpoint responds: `curl http://localhost:8004/health`
- [ ] Agent can connect to MongoDB for duplicate detection
- [ ] Tesseract OCR is installed and accessible

### Blockchain (Optional)

- [ ] Blockchain RPC endpoint is accessible (if using blockchain anchoring)
- [ ] Audit contract is deployed and address is configured
- [ ] Private key has sufficient gas for transactions
- [ ] Test blockchain connection with a sample transaction

---

## Deployment Steps

### 1. Start AI Validation Agent

```bash
cd ai-agents/proof_agent
python main.py
```

**Verify:** Agent is running on port 8004 and health check responds.

### 2. Start Backend Server

```bash
cd backend
npm start
```

**Verify:** Server is running on configured port (default: 5000).

### 3. Start Queue Workers

```bash
cd backend
node src/workers/index.js
```

**Verify:** All workers started successfully (check logs for "All workers started").

### 4. Verify Queue Workers

Check that the following workers are running:

- [ ] `proof-validation` worker
- [ ] `blockchain-anchor` worker (for proofs)
- [ ] Other workers (donation, fraud, etc.)

### 5. Test Proof Upload

```bash
curl -X POST http://localhost:5000/api/proof/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "campaignId=CAMPAIGN_ID" \
  -F "proofType=PURCHASE_RECEIPT" \
  -F "files=@test_invoice.jpg"
```

**Expected:** Proof uploaded successfully with status `UNDER_VALIDATION`.

### 6. Monitor AI Validation

Check logs for:

- [ ] `PROOF_VALIDATION_STARTED` log entry
- [ ] `AI_VALIDATION_RESPONSE` log entry
- [ ] `PROOF_AI_VALIDATION_COMPLETE` log entry

**Expected:** Proof status transitions to `AI_VERIFIED`, `FLAGGED`, or `REJECTED`.

### 7. Verify Blockchain Anchoring (if enabled)

Check logs for:

- [ ] `PROOF_BLOCKCHAIN_ANCHOR_STARTED` log entry
- [ ] `PROOF_BLOCKCHAIN_ANCHORED` log entry with transaction hash

**Expected:** Proof has `blockchainTxHash` field populated.

### 8. Test Proof Retrieval

```bash
curl -X GET http://localhost:5000/api/proof/campaign/CAMPAIGN_ID
```

**Expected:** Returns list of verified proofs for the campaign.

### 9. Test Donor Timeline

```bash
curl -X GET http://localhost:5000/api/proof/donor/DONOR_ID \
  -H "Authorization: Bearer DONOR_JWT_TOKEN"
```

**Expected:** Returns donor's proof timeline grouped by campaign.

### 10. Test Proof Verification

```bash
curl -X GET http://localhost:5000/api/proof/PROOF_ID/verify
```

**Expected:** Returns verification status (`VALID` or `TAMPERED`).

---

## Post-Deployment Verification

### Functional Tests

- [ ] Proof upload works with valid files
- [ ] Proof upload rejects invalid file types
- [ ] Proof upload rejects oversized files (>50MB)
- [ ] AI validation processes proofs correctly
- [ ] Blockchain anchoring works (or gracefully degrades)
- [ ] Campaign proof retrieval returns verified proofs only
- [ ] Donor timeline shows correct campaigns and proofs
- [ ] Proof hash verification detects tampering
- [ ] Manual review workflow works for admins
- [ ] Notifications are sent on proof rejection and verification

### Performance Tests

- [ ] Proof upload completes in <3 seconds for files <10MB
- [ ] Campaign proof retrieval completes in <1 second for campaigns with up to 100 proofs
- [ ] Donor timeline retrieval completes in <2 seconds for donors with up to 50 donations
- [ ] AI validation completes in <30 seconds per proof
- [ ] Queue workers process jobs without delays

### Security Tests

- [ ] Authentication is required for protected endpoints
- [ ] Authorization checks prevent unauthorized access
- [ ] NGO can only upload proofs for their own campaigns
- [ ] Donor can only view their own timeline
- [ ] Admin role is required for manual review
- [ ] Rate limiting prevents abuse
- [ ] File upload validation prevents malicious files

### Error Handling Tests

- [ ] AI agent unavailability flags proofs for manual review
- [ ] Blockchain unavailability doesn't block proof verification
- [ ] File storage errors return appropriate error messages
- [ ] Invalid campaign ID returns 404
- [ ] Unauthorized access returns 401/403
- [ ] Invalid file type returns 400

---

## Monitoring and Alerts

### Metrics to Monitor

- [ ] Proof upload rate (proofs per hour)
- [ ] AI validation time (average, p95, p99)
- [ ] AI validation success rate (verified/flagged/rejected)
- [ ] Blockchain anchoring success rate
- [ ] Queue job processing time
- [ ] Queue job failure rate
- [ ] File storage usage
- [ ] API response times

### Alerts to Configure

- [ ] AI agent unavailable for >5 minutes
- [ ] Blockchain service unavailable for >10 minutes
- [ ] Queue job failure rate >10%
- [ ] Proof upload failure rate >5%
- [ ] File storage >80% full
- [ ] API response time >3 seconds (p95)

### Log Monitoring

Monitor logs for:

- [ ] `PROOF_VALIDATION_ERROR` - AI validation failures
- [ ] `PROOF_BLOCKCHAIN_ANCHOR_ERROR` - Blockchain anchoring failures
- [ ] `FILE_STORAGE_ERROR` - File storage failures
- [ ] `PROOF_FLAGGED_DUE_TO_AI_ERROR` - AI service unavailability
- [ ] `DONOR_NOTIFICATION_ERROR` - Notification failures

---

## Rollback Plan

If issues are detected after deployment:

1. **Stop queue workers** to prevent further processing
2. **Revert code changes** to previous stable version
3. **Restart services** with previous version
4. **Verify system stability** with basic tests
5. **Investigate root cause** before re-deploying

---

## Known Limitations

1. **AI Validation** - Requires Tesseract OCR to be installed on the server
2. **Blockchain Anchoring** - Optional feature, system works without it
3. **File Storage** - LOCAL storage is not recommended for production (use S3)
4. **Rate Limiting** - Default limits may need adjustment based on traffic
5. **Duplicate Detection** - Only detects exact duplicates, not similar images

---

## Support Contacts

- **Backend Team:** [backend-team@aidflow.com]
- **AI Team:** [ai-team@aidflow.com]
- **DevOps Team:** [devops-team@aidflow.com]

---

## Deployment Date

**Deployed on:** _________________

**Deployed by:** _________________

**Version:** _________________

**Notes:** _________________
