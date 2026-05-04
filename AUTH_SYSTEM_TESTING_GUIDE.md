# Advanced Auth System - Testing Guide

**Date**: May 4, 2026  
**Purpose**: Comprehensive testing of the Advanced Authentication System with real data

---

## 🎯 Overview

This guide provides two methods to test the Advanced Auth System:
1. **Automated Test Script** (Node.js) - Comprehensive automated testing
2. **Manual Test Script** (Bash/curl) - Manual API testing with curl commands

Both scripts test all auth endpoints with real data for all user roles.

---

## 📋 Prerequisites

### 1. Server Running
```bash
# Start MongoDB
mongod

# Start Redis
redis-server

# Start Backend Server
cd backend
npm run dev
```

Server should be running on `http://localhost:5000`

### 2. Dependencies Installed
```bash
cd backend
npm install axios  # For automated test script
```

### 3. Tools Installed (for manual testing)
- `curl` - HTTP client
- `jq` - JSON processor (optional, for pretty output)

Install jq:
```bash
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq

# Windows (Git Bash)
# Download from https://stedolan.github.io/jq/
```

---

## 🤖 Method 1: Automated Test Script (Recommended)

### Run Comprehensive Tests

```bash
cd backend
node scripts/testAuthSystem.js
```

### What It Tests

**11 Test Suites**:
1. ✅ User Registration (All 5 Roles)
   - DONOR, NGO, MERCHANT, GOVERNMENT, BENEFICIARY
   - Email verification token generation
   - Auto-approval for DONOR
   - Pending approval for others

2. ✅ Email Verification
   - Token validation
   - Email marked as verified
   - Token expiry handling

3. ✅ User Login
   - All roles can login after approval
   - Access and refresh tokens generated
   - Session creation with device tracking

4. ✅ Get Current User (/me)
   - Authenticated endpoint
   - User profile retrieval

5. ✅ Refresh Access Token
   - Valid refresh token generates new access token
   - Session lastUsedAt updated

6. ✅ Get Active Sessions
   - View all active sessions
   - Device and IP tracking

7. ✅ Password Reset Flow
   - Request reset token
   - Reset password with token
   - Login with new password
   - All sessions revoked

8. ✅ Logout (Single Device)
   - Session removed from database
   - Refresh token revoked

9. ✅ Logout All Devices
   - All sessions cleared
   - Force re-login on all devices

10. ✅ Security Tests
    - Invalid password rejected
    - Non-existent user rejected
    - Invalid refresh token rejected
    - Invalid verification token rejected

11. ✅ Session Limit
    - Maximum 5 sessions per user
    - Oldest session removed when limit exceeded

### Expected Output

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
  → MERCHANT pending admin approval
✅ Register GOVERNMENT - User ID: 6745a1b2c3d4e5f6g7h8i9j3
  → GOVERNMENT pending admin approval
✅ Register BENEFICIARY - User ID: 6745a1b2c3d4e5f6g7h8i9j4
  → BENEFICIARY pending admin approval

============================================================
  TEST 2: Email Verification
============================================================
✅ Email Verification DONOR
✅ Email Verification NGO
✅ Email Verification MERCHANT
✅ Email Verification GOVERNMENT
✅ Email Verification BENEFICIARY

... (more tests)

============================================================
  TEST SUMMARY
============================================================

Total Tests: 45
Passed: 45
Failed: 0
Success Rate: 100.00%
```

### Test Results

The script will:
- ✅ Create test users for all 5 roles
- ✅ Test all auth endpoints
- ✅ Verify security features
- ✅ Clean up test data automatically
- ✅ Print detailed test results
- ✅ Exit with code 0 (success) or 1 (failure)

---

## 🔧 Method 2: Manual Test Script (Bash/curl)

### Run Manual Tests

```bash
cd backend
./scripts/testAuthCurl.sh
```

### What It Tests

**15 Manual Tests**:
1. Register DONOR
2. Register NGO
3. Verify Email
4. Login DONOR
5. Get Current User
6. Get Active Sessions
7. Refresh Access Token
8. Request Password Reset
9. Reset Password
10. Login with New Password
11. Logout (Single Device)
12. Try Revoked Refresh Token
13. Login Again
14. Logout All Devices
15. Security Tests

### Expected Output

```
========================================
  Advanced Auth System - API Tests
========================================

TEST 1: Register DONOR
{
  "success": true,
  "data": {
    "user": {
      "_id": "6745a1b2c3d4e5f6g7h8i9j0",
      "name": "Test Donor",
      "email": "testdonor@example.com",
      "role": "DONOR",
      "verificationStatus": "APPROVED"
    },
    "emailVerificationToken": "abc123..."
  }
}
✓ DONOR registered
Email Verification Token: abc123...

... (more tests)

========================================
  Test Summary
========================================
✓ All auth endpoints tested
✓ Registration working for all roles
✓ Email verification working
✓ Login/Logout working
✓ Token refresh working
✓ Password reset working
✓ Session management working
✓ Security validations working
```

---

## 🧪 Individual Endpoint Testing

### 1. Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "role": "DONOR"
  }'
```

### 2. Verify Email

```bash
curl -X POST http://localhost:5000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_EMAIL_VERIFICATION_TOKEN"
  }'
```

### 3. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### 4. Get Current User

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. Refresh Token

```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

### 6. Get Sessions

```bash
curl -X GET http://localhost:5000/api/auth/sessions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 7. Forgot Password

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

### 8. Reset Password

```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_RESET_TOKEN",
    "newPassword": "NewSecurePass123!"
  }'
```

### 9. Logout

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

### 10. Logout All Devices

```bash
curl -X POST http://localhost:5000/api/auth/logout-all \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 📊 Test Data

### Test Users Created

| Role | Email | Password | Auto-Approved |
|------|-------|----------|---------------|
| DONOR | donor@test.com | TestPass123! | ✅ Yes |
| NGO | ngo@test.com | TestPass123! | ❌ No (requires admin) |
| MERCHANT | merchant@test.com | TestPass123! | ❌ No (requires admin) |
| GOVERNMENT | govt@test.com | TestPass123! | ❌ No (requires admin) |
| BENEFICIARY | beneficiary@test.com | TestPass123! | ❌ No (requires admin) |

### Test Scenarios

1. **Registration**:
   - DONOR auto-approved (can login immediately)
   - Other roles pending admin approval
   - Email verification token generated

2. **Email Verification**:
   - Token validated and email marked as verified
   - Token expires after 24 hours

3. **Login**:
   - Access token (15 min expiry)
   - Refresh token (7 day expiry)
   - Session created with device info

4. **Token Refresh**:
   - New access token generated
   - Session lastUsedAt updated

5. **Password Reset**:
   - Reset token generated (1 hour expiry)
   - Password updated
   - All sessions revoked

6. **Logout**:
   - Single device: specific session removed
   - All devices: all sessions cleared

7. **Security**:
   - Invalid credentials rejected
   - Invalid tokens rejected
   - Session limit enforced (max 5)

---

## ✅ Success Criteria

### All Tests Should Pass

- ✅ All 5 roles can register
- ✅ Email verification works
- ✅ Login generates tokens
- ✅ Token refresh works
- ✅ Sessions tracked correctly
- ✅ Password reset works
- ✅ Logout revokes tokens
- ✅ Security validations work
- ✅ Session limit enforced

### Expected Results

1. **Registration**: 201 Created
2. **Email Verification**: 200 OK
3. **Login**: 200 OK with tokens
4. **Get Me**: 200 OK with user data
5. **Refresh**: 200 OK with new access token
6. **Get Sessions**: 200 OK with session list
7. **Forgot Password**: 200 OK
8. **Reset Password**: 200 OK
9. **Logout**: 200 OK
10. **Logout All**: 200 OK

### Security Tests

- ❌ Invalid password: 401 Unauthorized
- ❌ Non-existent user: 401 Unauthorized
- ❌ Invalid refresh token: 401 Unauthorized
- ❌ Revoked token: 401 Unauthorized
- ❌ Invalid verification token: 400 Bad Request

---

## 🐛 Troubleshooting

### Server Not Running

```bash
# Check if server is running
curl http://localhost:5000/api/system/health

# If not, start the server
cd backend
npm run dev
```

### MongoDB Not Connected

```bash
# Check MongoDB status
mongod --version

# Start MongoDB
mongod
```

### Redis Not Running

```bash
# Check Redis status
redis-cli ping

# Start Redis
redis-server
```

### Test Script Fails

```bash
# Check Node.js version (should be 18+)
node --version

# Install dependencies
cd backend
npm install

# Check for syntax errors
npm run lint
```

### jq Not Installed (for manual tests)

```bash
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq

# Or run without jq (remove | jq '.' from commands)
```

---

## 📝 Notes

### Test Data Cleanup

- Automated script cleans up test data automatically
- Manual script creates test users that remain in database
- To clean up manually:

```bash
# Connect to MongoDB
mongosh

# Use AidFlow database
use aidflow

# Delete test users
db.users.deleteMany({ email: /test\.com$/ })
```

### Token Storage

- Access tokens: Short-lived (15 minutes)
- Refresh tokens: Long-lived (7 days)
- All tokens stored as SHA-256 hashes
- Never store plain text tokens

### Session Management

- Maximum 5 sessions per user
- Oldest session removed when limit exceeded
- Sessions expire after 7 days
- Device and IP tracked for each session

---

## 🎯 Next Steps

After successful testing:

1. ✅ Verify all tests pass
2. ✅ Check audit logs in database
3. ✅ Review session data
4. ✅ Test with frontend integration
5. ✅ Deploy to staging environment
6. ✅ Run tests in staging
7. ✅ Deploy to production

---

**Testing Guide Created**: May 4, 2026  
**Status**: ✅ **READY FOR TESTING**
