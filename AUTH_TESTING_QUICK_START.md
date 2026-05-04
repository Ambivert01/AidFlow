# Auth System Testing - Quick Start Guide

**Ready to test the Advanced Authentication System!** 🚀

---

## ⚡ Quick Start (3 Steps)

### Step 1: Start Services

```bash
# Terminal 1: Start MongoDB
mongod

# Terminal 2: Start Redis
redis-server

# Terminal 3: Start Backend
cd backend
npm run dev
```

### Step 2: Run Automated Tests

```bash
# In Terminal 4
cd backend
node scripts/testAuthSystem.js
```

### Step 3: View Results

You'll see:
- ✅ 45+ tests executed
- ✅ All roles tested (DONOR, NGO, MERCHANT, GOVERNMENT, BENEFICIARY)
- ✅ All auth endpoints verified
- ✅ Security features validated
- ✅ Success rate: 100%

---

## 🎯 What Gets Tested

### User Registration (All 5 Roles)
- ✅ DONOR (auto-approved)
- ✅ NGO (pending approval)
- ✅ MERCHANT (pending approval)
- ✅ GOVERNMENT (pending approval)
- ✅ BENEFICIARY (pending approval)

### Email Verification
- ✅ Token generation
- ✅ Token validation
- ✅ Email marked as verified

### Login & Sessions
- ✅ Login with credentials
- ✅ Access token (15 min)
- ✅ Refresh token (7 days)
- ✅ Session creation with device tracking

### Token Management
- ✅ Refresh access token
- ✅ Token expiry validation
- ✅ Token revocation

### Password Reset
- ✅ Request reset token
- ✅ Reset password
- ✅ Login with new password
- ✅ All sessions revoked

### Session Management
- ✅ View active sessions
- ✅ Logout single device
- ✅ Logout all devices
- ✅ Session limit (max 5)

### Security
- ✅ Invalid password rejected
- ✅ Non-existent user rejected
- ✅ Invalid tokens rejected
- ✅ Revoked tokens rejected

---

## 📊 Expected Output

```
🚀 Starting Advanced Auth System Tests

============================================================
  TEST 1: User Registration (All Roles)
============================================================
✅ Register DONOR - User ID: 6745a1b2c3d4e5f6g7h8i9j0
  → DONOR auto-approved (can login immediately)
✅ Register NGO - User ID: 6745a1b2c3d4e5f6g7h8i9j1
  → NGO pending admin approval
✅ Register MERCHANT - User ID: 6745a1b2c3d4e5f6g7h8i9j2
✅ Register GOVERNMENT - User ID: 6745a1b2c3d4e5f6g7h8i9j3
✅ Register BENEFICIARY - User ID: 6745a1b2c3d4e5f6g7h8i9j4

============================================================
  TEST 2: Email Verification
============================================================
✅ Email Verification DONOR
✅ Email Verification NGO
✅ Email Verification MERCHANT
✅ Email Verification GOVERNMENT
✅ Email Verification BENEFICIARY

============================================================
  TEST 3: User Login
============================================================
ℹ️  Approving NGO, MERCHANT, GOVERNMENT, BENEFICIARY users...
✅ All users approved
✅ Login DONOR - Access token length: 180
  → Refresh token length: 180
✅ Login NGO - Access token length: 180
✅ Login MERCHANT - Access token length: 180
✅ Login GOVERNMENT - Access token length: 180
✅ Login BENEFICIARY - Access token length: 180

... (more tests)

============================================================
  TEST SUMMARY
============================================================

Total Tests: 45
Passed: 45
Failed: 0
Success Rate: 100.00%
```

---

## 🔧 Alternative: Manual Testing

If you prefer manual testing with curl:

```bash
cd backend
./scripts/testAuthCurl.sh
```

This will:
- Run 15 manual tests
- Show JSON responses
- Test all endpoints
- Verify security features

---

## 📝 Test Data

### Test Users Created

| Role | Email | Password |
|------|-------|----------|
| DONOR | donor@test.com | TestPass123! |
| NGO | ngo@test.com | TestPass123! |
| MERCHANT | merchant@test.com | TestPass123! |
| GOVERNMENT | govt@test.com | TestPass123! |
| BENEFICIARY | beneficiary@test.com | TestPass123! |

**Note**: Test data is automatically cleaned up after tests complete.

---

## ✅ Success Indicators

You'll know the system is working when:

1. ✅ All 5 roles can register
2. ✅ Email verification tokens generated
3. ✅ DONOR can login immediately
4. ✅ Other roles require admin approval
5. ✅ Access and refresh tokens generated
6. ✅ Token refresh works
7. ✅ Sessions tracked with device info
8. ✅ Password reset works
9. ✅ Logout revokes tokens
10. ✅ Security validations pass

---

## 🐛 Troubleshooting

### "Connection refused"
→ Make sure backend server is running on port 5000

### "MongoDB connection failed"
→ Start MongoDB: `mongod`

### "Redis connection failed"
→ Start Redis: `redis-server`

### "Module not found"
→ Install dependencies: `cd backend && npm install`

---

## 📚 Full Documentation

For detailed testing guide, see:
- `AUTH_SYSTEM_TESTING_GUIDE.md` - Complete testing documentation
- `ADVANCED_AUTH_SYSTEM_COMPLETE.md` - Implementation details

---

## 🎯 What's Next

After successful testing:

1. ✅ Integrate with frontend
2. ✅ Add email service (SMTP/SendGrid)
3. ✅ Deploy to staging
4. ✅ Run tests in staging
5. ✅ Deploy to production

---

**Quick Start Guide Created**: May 4, 2026  
**Status**: ✅ **READY TO TEST**

Run the tests now:
```bash
cd backend
node scripts/testAuthSystem.js
```
