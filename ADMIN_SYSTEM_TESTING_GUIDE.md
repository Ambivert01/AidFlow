# Admin System End-to-End Testing Guide

**Date**: May 4, 2026  
**Admin Credentials**: admin@aidflow.com / admin@aidflow.com

---

## 🚀 Quick Start

### Step 1: Seed Test Data

```bash
cd backend
node scripts/seedAdminTestData.js
```

This will create comprehensive test data including:
- 5 pending users (3 NGOs, 2 Merchants, 1 Government)
- 2 approved NGOs with campaigns
- 5 donors with donations
- 2 approved merchants
- 3 fraud cases (OPEN, INVESTIGATING, RESOLVED)
- 2 fraud alerts
- 2 AI decision logs
- 3 beneficiaries with wallets (1 frozen)
- 4 audit logs

### Step 2: Start the Server

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Step 3: Login as Admin

1. Navigate to: http://localhost:3000/login
2. Email: `admin@aidflow.com`
3. Password: `admin@aidflow.com`
4. Click "Login"

---

## 📋 Test Scenarios

### 1. Pending User Approval/Rejection ✅

**Test Case 1.1: View Pending Requests**
1. Navigate to Admin Dashboard
2. Click "Pending Requests" or go to `/admin/pending`
3. **Expected**: See 5 pending users:
   - Green Earth Foundation (NGO)
   - Hope for Children (NGO)
   - Raj Medical Store (MERCHANT)
   - Fresh Groceries (MERCHANT)
   - State Welfare Department (GOVERNMENT)

**Test Case 1.2: Approve NGO User**
1. Find "Green Earth Foundation" in the list
2. Click "Approve KYC"
3. **Expected**: Success message, user removed from pending list
4. Verify in User Directory that user is now APPROVED

**Test Case 1.3: Approve Merchant User (with category)**
1. Find "Raj Medical Store" in the list
2. Click "Approve KYC"
3. **Expected**: Modal appears asking for:
   - Merchant/Shop Name (pre-filled)
   - Authorized Policy Category (dropdown)
4. Select category: "MEDICINE"
5. Click "Confirm & Activate Merchant"
6. **Expected**: Success message, merchant profile created

**Test Case 1.4: Reject User**
1. Find "Fresh Groceries" in the list
2. Click "Reject"
3. Enter rejection reason: "Incomplete KYC documents"
4. **Expected**: Success message, user removed from pending list

**Test Case 1.5: Approve Government User**
1. Find "State Welfare Department"
2. Click "Approve KYC"
3. **Expected**: Success message, user approved

---

### 2. Campaign Approval/Rejection ✅

**Test Case 2.1: View Pending Campaigns**
1. Navigate to Admin Dashboard
2. Look for "Pending Campaigns" section
3. **Expected**: See 2 pending campaigns:
   - "Feed 1000 Families This Winter" (Food for All Foundation)
   - "School Supplies for Rural Children" (Education First)

**Test Case 2.2: Approve Campaign**
1. Find "Feed 1000 Families This Winter"
2. Click "Approve Campaign"
3. **Expected**: 
   - Success message
   - Campaign status changes to ACTIVE
   - NGO receives notification
   - Workflow initialized
   - Audit log created

**Test Case 2.3: Reject Campaign**
1. Find "School Supplies for Rural Children"
2. Click "Reject Campaign"
3. Enter rejection reason: "Budget breakdown not detailed enough"
4. **Expected**:
   - Success message
   - Campaign status changes to REJECTED
   - NGO receives notification with reason
   - Audit log created

---

### 3. Fraud Case Management ✅

**Test Case 3.1: View Fraud Cases**
1. Navigate to `/admin/fraud`
2. **Expected**: See 3 fraud cases:
   - Case 1: OPEN - Suspicious transaction pattern (Risk: 85)
   - Case 2: INVESTIGATING - Unusual donation amount (Risk: 72)
   - Case 3: RESOLVED - Campaign description suspicious (Risk: 45)

**Test Case 3.2: View Fraud Statistics**
1. On Fraud Management page, check statistics panel
2. **Expected**: See:
   - Total Cases: 3
   - Open Cases: 1
   - Investigating: 1
   - Resolved: 1
   - Confirmed Fraud: 0

**Test Case 3.3: Filter Fraud Cases**
1. Click "OPEN" filter
2. **Expected**: See only 1 case (suspicious transaction pattern)
3. Click "INVESTIGATING" filter
4. **Expected**: See only 1 case (unusual donation amount)
5. Click "RESOLVED" filter
6. **Expected**: See only 1 case (campaign description)

**Test Case 3.4: Assign Fraud Case**
1. Find the OPEN case (suspicious transaction pattern)
2. Click "Assign to Investigator"
3. Select investigator (admin user)
4. **Expected**:
   - Case status changes to INVESTIGATING
   - Assigned investigator shown
   - Audit log created

**Test Case 3.5: Add Investigation Note**
1. Open the INVESTIGATING case
2. Click "Add Note"
3. Enter note: "Contacted donor via email. Awaiting verification documents."
4. **Expected**:
   - Note added to case
   - Timestamp and author shown

**Test Case 3.6: Resolve Fraud Case**
1. Open the INVESTIGATING case
2. Click "Resolve Case"
3. Select decision: "FALSE_POSITIVE"
4. Enter notes: "Donor verified. Legitimate transactions from family members."
5. Enter action taken: "No action required. Case closed."
6. Click "Resolve"
7. **Expected**:
   - Case status changes to RESOLVED
   - Resolution details saved
   - Audit log created
   - Statistics updated

**Test Case 3.7: Resolve as Confirmed Fraud**
1. Assign the remaining OPEN case to yourself
2. Click "Resolve Case"
3. Select decision: "CONFIRMED_FRAUD"
4. Enter notes: "Confirmed fraudulent activity. Multiple fake accounts detected."
5. Enter action taken: "User account suspended. Donations refunded."
6. **Expected**:
   - Case marked as CONFIRMED_FRAUD
   - Statistics show 1 confirmed fraud

---

### 4. AI Decision Override ✅

**Test Case 4.1: Navigate to AI Override**
1. Navigate to `/admin/ai-override`
2. **Expected**: See AI Override form with warning message

**Test Case 4.2: Override Fraud Detection Decision**
1. Get a donation ID from the fraud case (check database or fraud case details)
2. Fill form:
   - Entity Type: "DONATION"
   - Entity ID: [paste donation ID]
   - Decision Type: "FRAUD_DETECTION"
   - Override Decision: "APPROVED"
   - Reason: "Manual review completed. Transaction verified as legitimate."
3. Click "Override AI Decision"
4. **Expected**:
   - Success message
   - AI decision log updated with override
   - Donation status updated
   - Audit log created

**Test Case 4.3: Override Risk Assessment**
1. Get another donation ID
2. Fill form:
   - Entity Type: "DONATION"
   - Entity ID: [paste donation ID]
   - Decision Type: "RISK_ASSESSMENT"
   - Override Decision: "FLAGGED"
   - Reason: "Additional verification required based on new information."
3. Click "Override AI Decision"
4. **Expected**:
   - Success message
   - Risk assessment updated
   - Audit log created

**Test Case 4.4: View Override in Audit Logs**
1. Navigate to Audit Logs page
2. Filter by event type: "AI_DECISION_OVERRIDDEN"
3. **Expected**: See your override actions logged

---

### 5. User Management ✅

**Test Case 5.1: View User Directory**
1. Navigate to `/admin/users`
2. **Expected**: See all users with:
   - Name/Email
   - Role badge
   - Verification status
   - Active/Suspended status
   - Join date

**Test Case 5.2: Filter Users by Role**
1. Select "NGO" from role filter
2. **Expected**: See only NGO users
3. Select "MERCHANT" from role filter
4. **Expected**: See only merchant users
5. Select "DONOR" from role filter
6. **Expected**: See only donor users

**Test Case 5.3: Filter Users by Status**
1. Select "APPROVED" from status filter
2. **Expected**: See only approved users
3. Select "PENDING" from status filter
4. **Expected**: See only pending users

**Test Case 5.4: Suspend User**
1. Find an active NGO user
2. Click "Suspend"
3. Confirm action
4. **Expected**:
   - User status changes to "Suspended"
   - User cannot login
   - Success message shown

**Test Case 5.5: Restore User**
1. Find the suspended user
2. Click "Restore"
3. Confirm action
4. **Expected**:
   - User status changes to "Active"
   - User can login again
   - Success message shown

---

### 6. Bulk User Actions ✅

**Test Case 6.1: Bulk Approve Users (API Test)**

Using curl or Postman:

```bash
# Login first to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@aidflow.com",
    "password": "admin@aidflow.com"
  }'

# Copy the accessToken from response

# Bulk approve users
curl -X POST http://localhost:5000/api/admin/users/bulk-approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "userIds": ["USER_ID_1", "USER_ID_2"]
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "success": ["USER_ID_1", "USER_ID_2"],
    "failed": []
  }
}
```

**Test Case 6.2: Bulk Reject Users (API Test)**

```bash
curl -X POST http://localhost:5000/api/admin/users/bulk-reject \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "userIds": ["USER_ID_3"],
    "reason": "Incomplete documentation"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "success": ["USER_ID_3"],
    "failed": []
  }
}
```

---

### 7. System Health Monitoring ✅

**Test Case 7.1: View System Health**
1. Navigate to `/admin/system`
2. **Expected**: See:
   - Database Status: "connected" (green)
   - Total Users count
   - Active Users count
   - Total Donations count
   - Total Campaigns count
   - Active Campaigns count
   - Open Fraud Cases count
   - Last updated timestamp

**Test Case 7.2: Auto-Refresh**
1. Stay on System Health page
2. Wait 30 seconds
3. **Expected**: Page auto-refreshes with updated data

**Test Case 7.3: View Blockchain Anchors**
1. Scroll down to "Recent Blockchain Anchors" section
2. **Expected**: See list of blockchain anchor records (if any exist)
3. Each record shows:
   - Transaction hash
   - Entity type
   - Entity ID
   - Anchored timestamp

---

### 8. Merchant Management ✅

**Test Case 8.1: View Merchants**
1. Navigate to Admin Dashboard
2. Look for Merchants section
3. **Expected**: See 2 approved merchants:
   - City Medical Store (MEDICINE)
   - Fresh Food Mart (FOOD)

**Test Case 8.2: Update Merchant Category**
1. Find "City Medical Store"
2. Click "Edit" or "Update"
3. Change category to "HEALTHCARE"
4. **Expected**: Category updated successfully

**Test Case 8.3: Ban Merchant**
1. Find "Fresh Food Mart"
2. Click "Ban Merchant"
3. Enter reason: "Violation of platform policies"
4. **Expected**:
   - Merchant status changes to BANNED
   - Merchant cannot accept payments
   - Audit log created

---

### 9. Wallet Management ✅

**Test Case 9.1: View Frozen Wallet**
1. Navigate to wallet management section
2. **Expected**: See 3 wallets, 1 with status "FROZEN"

**Test Case 9.2: Freeze Wallet (API Test)**

```bash
curl -X PATCH http://localhost:5000/api/admin/wallets/WALLET_ID/freeze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "reason": "Suspicious spending pattern detected"
  }'
```

**Expected**: Wallet frozen, beneficiary cannot spend

**Test Case 9.3: View Freeze Reason**
1. Check frozen wallet details
2. **Expected**: See:
   - Freeze reason
   - Frozen by (admin name)
   - Frozen at (timestamp)

---

### 10. Audit Logs ✅

**Test Case 10.1: View All Audit Logs**
1. Navigate to Audit Logs page
2. **Expected**: See chronological list of all admin actions

**Test Case 10.2: Filter by Event Category**
1. Select "AUTH" category
2. **Expected**: See only authentication-related events (user approvals, etc.)
3. Select "CAMPAIGN" category
4. **Expected**: See only campaign-related events
5. Select "FRAUD" category
6. **Expected**: See only fraud-related events

**Test Case 10.3: Filter by Entity Type**
1. Select "User" entity type
2. **Expected**: See only user-related logs
3. Select "Campaign" entity type
4. **Expected**: See only campaign-related logs

**Test Case 10.4: Filter by Actor Role**
1. Select "ADMIN" actor role
2. **Expected**: See only actions performed by admins

**Test Case 10.5: Verify Audit Trail**
1. Perform an action (e.g., approve a user)
2. Navigate to Audit Logs
3. **Expected**: See the action logged with:
   - Event type
   - Timestamp
   - Actor (admin user)
   - Entity details
   - Payload data

---

## 🧪 Advanced Test Scenarios

### Scenario A: Complete User Onboarding Flow

1. View pending NGO request
2. Approve NGO
3. NGO creates campaign
4. View pending campaign
5. Approve campaign
6. Verify workflow initialized
7. Check audit logs for all actions

### Scenario B: Fraud Investigation Workflow

1. View open fraud case
2. Assign to investigator
3. Add investigation notes
4. Review AI decision
5. Override AI decision if needed
6. Resolve case with decision
7. Verify audit trail

### Scenario C: Merchant Lifecycle

1. View pending merchant request
2. Approve with category assignment
3. Merchant profile created
4. Merchant accepts payments
5. Suspicious activity detected
6. Ban merchant
7. Verify audit logs

### Scenario D: System Monitoring

1. View system health
2. Check all metrics
3. Review blockchain anchors
4. Check fraud statistics
5. Review audit logs
6. Verify all systems operational

---

## 📊 Expected Data After Seeding

### Users
- **Admin**: 1 (admin@aidflow.com)
- **Pending**: 5 (3 NGOs, 2 Merchants, 1 Government)
- **Approved NGOs**: 2
- **Approved Donors**: 5
- **Approved Merchants**: 2

### Campaigns
- **Pending**: 2
- **Active**: 1 (with donations)

### Donations
- **Total**: 5
- **Amount**: ₹450,000 total

### Fraud Cases
- **Open**: 1
- **Investigating**: 1
- **Resolved**: 1

### Fraud Alerts
- **Open**: 2

### Wallets
- **Total**: 3
- **Frozen**: 1

### Audit Logs
- **Total**: 4+ (increases with each action)

---

## 🐛 Troubleshooting

### Issue: "Cannot find admin user"
**Solution**: Run the seed script again. It will create the admin user if missing.

### Issue: "No pending users showing"
**Solution**: Check if users were already approved. Run seed script with `--clear` flag.

### Issue: "Fraud cases not showing"
**Solution**: Verify donations were created. Fraud cases depend on donation IDs.

### Issue: "System health shows disconnected"
**Solution**: Check MongoDB connection. Restart backend server.

### Issue: "Blockchain anchors empty"
**Solution**: This is normal. Blockchain anchoring happens asynchronously. The section will populate over time.

---

## ✅ Testing Checklist

Use this checklist to track your testing progress:

- [ ] Login as admin
- [ ] View admin dashboard statistics
- [ ] Approve pending NGO user
- [ ] Approve pending merchant user (with category)
- [ ] Reject pending user
- [ ] Approve pending campaign
- [ ] Reject pending campaign
- [ ] View fraud cases list
- [ ] Filter fraud cases by status
- [ ] Assign fraud case to investigator
- [ ] Add investigation note
- [ ] Resolve fraud case (FALSE_POSITIVE)
- [ ] Resolve fraud case (CONFIRMED_FRAUD)
- [ ] Override AI decision
- [ ] View user directory
- [ ] Filter users by role
- [ ] Filter users by status
- [ ] Suspend user
- [ ] Restore user
- [ ] Bulk approve users (API)
- [ ] Bulk reject users (API)
- [ ] View system health
- [ ] View blockchain anchors
- [ ] Update merchant details
- [ ] Ban merchant
- [ ] View frozen wallet
- [ ] Freeze wallet (API)
- [ ] View audit logs
- [ ] Filter audit logs by category
- [ ] Filter audit logs by entity type
- [ ] Verify audit trail for actions

---

## 📝 Notes

- All test data is safe to modify/delete
- Seed script can be run multiple times (clears previous test data)
- Admin user is never deleted by seed script
- All passwords for test users: `password123`
- Admin password: `admin@aidflow.com`

---

## 🚀 Next Steps After Testing

1. Document any bugs found
2. Test edge cases
3. Verify error handling
4. Test with production-like data volumes
5. Performance testing with large datasets
6. Security testing (authorization checks)
7. Integration testing with other modules

---

**Happy Testing! 🎉**
