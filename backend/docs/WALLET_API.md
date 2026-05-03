# Wallet Allocation System API Documentation

## Overview

The Wallet Allocation System provides programmable fund distribution with policy enforcement, fraud detection, and complete audit trails. This API enables NGOs to create wallets for approved beneficiaries, beneficiaries to spend funds at approved merchants, and administrators to manage wallet lifecycle.

## Base URL

```
http://localhost:5000/api/wallet
```

## Authentication

All endpoints require JWT authentication via Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Rate Limiting

- **Spending operations**: 10 requests per minute per beneficiary
- **Other operations**: 100 requests per minute

## Idempotency

Wallet creation and spending operations support idempotency via the `Idempotency-Key` header or `idempotencyKey` field in request body. Idempotency keys are valid for 24 hours.

---

## Endpoints

### 1. Create Wallet

Creates a new wallet for an approved beneficiary.

**Endpoint**: `POST /api/wallet/create`

**Authorization**: NGO role required

**Request Headers**:
```
Authorization: Bearer <jwt_token>
Idempotency-Key: <unique_key> (optional)
Content-Type: application/json
```

**Request Body**:
```json
{
  "beneficiaryId": "507f1f77bcf86cd799439011",
  "campaignId": "507f1f77bcf86cd799439012",
  "amount": 5000,
  "idempotencyKey": "unique-key-123" (optional),
  "policy": {
    "allowedMerchants": ["507f1f77bcf86cd799439013"],
    "maxDistanceKm": 50,
    "allowedDistricts": ["District A", "District B"]
  } (optional)
}
```

**Response 201 Created**:
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "beneficiary": "507f1f77bcf86cd799439011",
    "campaign": "507f1f77bcf86cd799439012",
    "createdBy": "507f1f77bcf86cd799439015",
    "balance": 5000,
    "initialAmount": 5000,
    "status": "ACTIVE",
    "policy": {
      "allowedCategories": ["FOOD", "MEDICINE", "SHELTER"],
      "maxPerTransaction": 1000,
      "dailyLimit": 2000,
      "weeklyLimit": 5000,
      "expiresAt": "2024-02-15T00:00:00.000Z",
      "maxDistanceKm": 50,
      "allowedDistricts": ["District A", "District B"],
      "allowedMerchants": ["507f1f77bcf86cd799439013"]
    },
    "createdAt": "2024-02-01T10:30:00.000Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: BENEFICIARY_NOT_APPROVED - Beneficiary status is not APPROVED
- `404 Not Found`: BENEFICIARY_NOT_FOUND - Beneficiary does not exist
- `404 Not Found`: Campaign not found
- `409 Conflict`: WALLET_ALREADY_EXISTS - Wallet already exists for this beneficiary-campaign pair

---

### 2. Spend Wallet

Process a spending transaction at a merchant.

**Endpoint**: `POST /api/wallet/spend`

**Authorization**: BENEFICIARY role required

**Rate Limit**: 10 requests per minute

**Request Headers**:
```
Authorization: Bearer <jwt_token>
Idempotency-Key: <unique_key> (optional)
Content-Type: application/json
```

**Request Body**:
```json
{
  "walletId": "507f1f77bcf86cd799439014",
  "merchantId": "507f1f77bcf86cd799439013",
  "amount": 500,
  "category": "FOOD",
  "location": {
    "lat": 28.6139,
    "lng": 77.2090
  },
  "idempotencyKey": "spend-key-456" (optional),
  "deviceId": "device-123" (optional),
  "ipAddress": "192.168.1.1" (optional)
}
```

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "transactionId": "tx-789",
    "balanceAfter": 4500,
    "timestamp": "2024-02-01T11:00:00.000Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: WALLET_NOT_ACTIVE - Wallet status is not ACTIVE
- `400 Bad Request`: INSUFFICIENT_BALANCE - Wallet balance is less than transaction amount
- `400 Bad Request`: INVALID_MERCHANT - Merchant status is not ACTIVE
- `403 Forbidden`: CATEGORY_NOT_ALLOWED - Spending category not in allowedCategories
- `403 Forbidden`: AMOUNT_EXCEEDS_LIMIT - Transaction amount exceeds maxPerTransaction
- `403 Forbidden`: DAILY_LIMIT_EXCEEDED - Daily spending would exceed dailyLimit
- `403 Forbidden`: WEEKLY_LIMIT_EXCEEDED - Weekly spending would exceed weeklyLimit
- `403 Forbidden`: WALLET_EXPIRED - Current time is past wallet expiryDate
- `403 Forbidden`: MERCHANT_TOO_FAR - Distance exceeds maxDistanceKm
- `403 Forbidden`: DISTRICT_NOT_ALLOWED - Merchant district not in allowedDistricts
- `404 Not Found`: WALLET_NOT_FOUND - Wallet does not exist
- `429 Too Many Requests`: Rate limit exceeded

---

### 3. Credit Wallet

Add additional funds to an existing wallet.

**Endpoint**: `POST /api/wallet/:walletId/credit`

**Authorization**: NGO role required

**Request Body**:
```json
{
  "amount": 2000
}
```

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "balance": 6500,
    "transactions": [
      {
        "type": "CREDIT",
        "amount": 2000,
        "balanceAfter": 6500,
        "timestamp": "2024-02-01T12:00:00.000Z",
        "metadata": {
          "creditedBy": "507f1f77bcf86cd799439015"
        }
      }
    ]
  }
}
```

**Error Responses**:
- `400 Bad Request`: WALLET_NOT_ACTIVE - Wallet status is not ACTIVE
- `400 Bad Request`: INVALID_AMOUNT - Amount is zero or negative
- `404 Not Found`: WALLET_NOT_FOUND - Wallet does not exist

---

### 4. Adjust Wallet

Make balance adjustments (positive or negative).

**Endpoint**: `POST /api/wallet/:walletId/adjust`

**Authorization**: ADMIN role required

**Request Body**:
```json
{
  "amount": -100,
  "reason": "Correction for duplicate transaction"
}
```

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "balance": 6400,
    "transactions": [
      {
        "type": "ADJUSTMENT",
        "amount": -100,
        "balanceAfter": 6400,
        "timestamp": "2024-02-01T13:00:00.000Z",
        "metadata": {
          "adjustmentReason": "Correction for duplicate transaction",
          "adjustedBy": "507f1f77bcf86cd799439016"
        }
      }
    ]
  }
}
```

**Error Responses**:
- `400 Bad Request`: INVALID_ADJUSTMENT - Adjustment would result in negative balance
- `404 Not Found`: WALLET_NOT_FOUND - Wallet does not exist

---

### 5. Close Wallet

Close a wallet and record remaining balance.

**Endpoint**: `POST /api/wallet/:walletId/close`

**Authorization**: ADMIN role required

**Request Body**:
```json
{
  "reason": "Campaign ended, beneficiary relocated"
}
```

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "status": "CLOSED",
    "closedBy": "507f1f77bcf86cd799439016",
    "closedAt": "2024-02-01T14:00:00.000Z",
    "closeReason": "Campaign ended, beneficiary relocated",
    "remainingBalanceAtClosure": 6400
  }
}
```

**Error Responses**:
- `400 Bad Request`: INVALID_STATE_TRANSITION - Wallet status is not ACTIVE or EXPIRED
- `404 Not Found`: WALLET_NOT_FOUND - Wallet does not exist

---

### 6. Freeze Wallet

Suspend wallet operations due to suspicious activity.

**Endpoint**: `POST /api/wallet/:walletId/freeze`

**Authorization**: ADMIN or GOVERNMENT role required

**Request Body**:
```json
{
  "reason": "Suspicious spending pattern detected"
}
```

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "status": "SUSPENDED",
    "freezeReason": "Suspicious spending pattern detected",
    "frozenBy": "507f1f77bcf86cd799439016",
    "frozenAt": "2024-02-01T15:00:00.000Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: WALLET_NOT_ACTIVE - Wallet status is not ACTIVE
- `400 Bad Request`: WALLET_ALREADY_FROZEN - Wallet is already in SUSPENDED state
- `404 Not Found`: WALLET_NOT_FOUND - Wallet does not exist

---

### 7. Unfreeze Wallet

Restore wallet to active status.

**Endpoint**: `POST /api/wallet/:walletId/unfreeze`

**Authorization**: ADMIN or GOVERNMENT role required

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "status": "ACTIVE",
    "freezeReason": null
  }
}
```

**Error Responses**:
- `400 Bad Request`: WALLET_NOT_FROZEN - Wallet is not in SUSPENDED state
- `404 Not Found`: WALLET_NOT_FOUND - Wallet does not exist

---

### 8. Get My Wallet

Retrieve wallet details for authenticated beneficiary.

**Endpoint**: `GET /api/wallet`

**Authorization**: BENEFICIARY role required

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "balance": 4500,
    "status": "ACTIVE",
    "policy": {
      "allowedCategories": ["FOOD", "MEDICINE", "SHELTER"],
      "maxPerTransaction": 1000,
      "dailyLimit": 2000,
      "weeklyLimit": 5000,
      "expiresAt": "2024-02-15T00:00:00.000Z"
    },
    "dailySpent": 500,
    "weeklySpent": 500,
    "totalSpent": 500,
    "campaign": {
      "title": "Flood Relief 2024",
      "disasterType": "FLOOD"
    },
    "createdAt": "2024-02-01T10:30:00.000Z"
  }
}
```

**Error Responses**:
- `404 Not Found`: BENEFICIARY_NOT_FOUND - Beneficiary profile not found
- `404 Not Found`: WALLET_NOT_FOUND - No wallet found for beneficiary

---

### 9. Get Transaction History

Retrieve paginated transaction history.

**Endpoint**: `GET /api/wallet/transactions?page=1&limit=50`

**Authorization**: BENEFICIARY role required

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Page size (default: 50)

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "type": "DEBIT",
        "amount": 500,
        "category": "FOOD",
        "merchant": "507f1f77bcf86cd799439013",
        "merchantName": "Local Grocery Store",
        "balanceAfter": 4500,
        "timestamp": "2024-02-01T11:00:00.000Z",
        "metadata": {
          "beneficiaryLocation": { "lat": 28.6139, "lng": 77.2090 },
          "merchantLocation": { "lat": 28.6140, "lng": 77.2091 },
          "distance": 0.15
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1
    }
  }
}
```

**Error Responses**:
- `404 Not Found`: BENEFICIARY_NOT_FOUND - Beneficiary profile not found
- `404 Not Found`: WALLET_NOT_FOUND - No wallet found for beneficiary

---

## Data Models

### Wallet Status

- `ACTIVE`: Wallet is operational and can process transactions
- `SUSPENDED`: Wallet is frozen due to suspicious activity or admin action
- `EXPIRED`: Wallet has passed its expiry date
- `CLOSED`: Wallet is permanently closed

### Transaction Types

- `CREDIT`: Funds added to wallet
- `DEBIT`: Funds spent at merchant
- `ADJUSTMENT`: Admin balance correction

### Spending Categories

- `FOOD`: Food and groceries
- `MEDICINE`: Medical supplies and pharmaceuticals
- `SHELTER`: Housing and shelter materials
- `WATER`: Water and sanitation
- `OTHER`: Other approved categories

---

## Error Codes

### Validation Errors (400)
- `BENEFICIARY_NOT_APPROVED`
- `WALLET_NOT_ACTIVE`
- `INSUFFICIENT_BALANCE`
- `INVALID_MERCHANT`
- `INVALID_AMOUNT`
- `INVALID_ADJUSTMENT`
- `WALLET_ALREADY_FROZEN`
- `WALLET_NOT_FROZEN`
- `INVALID_STATE_TRANSITION`

### Policy Violation Errors (403)
- `CATEGORY_NOT_ALLOWED`
- `AMOUNT_EXCEEDS_LIMIT`
- `DAILY_LIMIT_EXCEEDED`
- `WEEKLY_LIMIT_EXCEEDED`
- `WALLET_EXPIRED`
- `MERCHANT_NOT_ALLOWED`
- `MERCHANT_TOO_FAR`
- `DISTRICT_NOT_ALLOWED`

### Not Found Errors (404)
- `BENEFICIARY_NOT_FOUND`
- `WALLET_NOT_FOUND`
- `MERCHANT_NOT_FOUND`

### Conflict Errors (409)
- `WALLET_ALREADY_EXISTS`

### Service Errors (503)
- `SERVICE_UNAVAILABLE`
- `OPERATION_TIMEOUT`

---

## Notifications

The system sends notifications for the following events:
- Wallet created
- Low balance (below 20% of initial amount)
- Fraud detected / wallet frozen
- Wallet expired
- Wallet credited
- Wallet adjusted
- Wallet closed

---

## Audit Trail

All wallet operations are logged to blockchain for immutability:
- WALLET_CREATED
- WALLET_SPENT
- WALLET_FROZEN
- WALLET_UNFROZEN
- WALLET_EXPIRED
- WALLET_CLOSED
- WALLET_CREDITED
- WALLET_ADJUSTED

---

## Best Practices

1. **Always use idempotency keys** for wallet creation and spending operations
2. **Implement retry logic** with exponential backoff for transient errors
3. **Validate beneficiary approval status** before wallet creation
4. **Monitor rate limits** to avoid 429 errors
5. **Handle policy violations gracefully** with user-friendly error messages
6. **Store transaction receipts** for audit purposes
7. **Implement proper error handling** for all error codes
8. **Use HTTPS** for all API communications
9. **Rotate JWT tokens** regularly for security
10. **Monitor wallet expiry dates** and notify beneficiaries in advance

---

## Support

For API support, contact: support@aidflow.org

For technical documentation, visit: https://docs.aidflow.org
