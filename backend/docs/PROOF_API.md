# Proof System API Documentation

## Overview

The Proof System API provides endpoints for uploading, validating, and retrieving proof of aid delivery. This system is the core trust and transparency layer of AidFlow, enabling NGOs to upload proof of aid delivery, AI-powered validation, blockchain anchoring, and donor transparency.

**Base URL:** `/api/proof`

**Authentication:** Most endpoints require JWT authentication via Bearer token in the `Authorization` header.

---

## Endpoints

### 1. Upload Proof

Upload proof files for a campaign with metadata.

**Endpoint:** `POST /api/proof/upload`

**Authentication:** Required (NGO role)

**Authorization:** NGO must own the campaign

**Content-Type:** `multipart/form-data`

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| campaignId | string | Yes | Campaign ID (MongoDB ObjectId) |
| proofType | string | Yes | Type of proof: `PURCHASE_RECEIPT`, `AID_DELIVERY`, `BENEFICIARY_CONFIRMATION`, `MERCHANT_INVOICE`, `FIELD_REPORT`, `OTHER` |
| beneficiaryId | string | No | Beneficiary ID (MongoDB ObjectId) |
| merchantId | string | No | Merchant ID (MongoDB ObjectId) |
| transactionId | string | No | Transaction ID (MongoDB ObjectId) |
| location | object | No | Location object with `lat` and `lng` |
| capturedAt | string | No | ISO 8601 timestamp when proof was captured |
| metadata | object | No | Additional metadata |
| idempotencyKey | string | No | Idempotency key for duplicate prevention (24-hour window) |
| files | file[] | Yes | Array of files (max 5 files, max 50MB per file) |

**Allowed File Types:**
- Images: `image/jpeg`, `image/png`, `image/jpg`, `image/webp`
- Videos: `video/mp4`, `video/mpeg`, `video/quicktime`
- Documents: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

**Example Request:**

```bash
curl -X POST http://localhost:5000/api/proof/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "campaignId=507f1f77bcf86cd799439011" \
  -F "proofType=PURCHASE_RECEIPT" \
  -F "beneficiaryId=507f1f77bcf86cd799439012" \
  -F "merchantId=507f1f77bcf86cd799439013" \
  -F "location[lat]=28.6139" \
  -F "location[lng]=77.2090" \
  -F "capturedAt=2024-01-15T10:30:00Z" \
  -F "idempotencyKey=unique-key-123" \
  -F "files=@invoice1.jpg" \
  -F "files=@invoice2.jpg"
```

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "Proof uploaded successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "campaign": "507f1f77bcf86cd799439011",
    "beneficiary": "507f1f77bcf86cd799439012",
    "merchant": "507f1f77bcf86cd799439013",
    "proofType": "PURCHASE_RECEIPT",
    "files": [
      {
        "fileUrl": "https://storage.example.com/proofs/invoice1.jpg",
        "fileType": "IMAGE",
        "mimeType": "image/jpeg",
        "size": 245678,
        "checksum": "a3b2c1d4e5f6..."
      }
    ],
    "location": {
      "lat": 28.6139,
      "lng": 77.2090
    },
    "capturedAt": "2024-01-15T10:30:00.000Z",
    "status": "UNDER_VALIDATION",
    "hash": "a3b2c1d4e5f6...",
    "createdAt": "2024-01-15T10:35:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid input, missing required fields, or invalid file type
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - User is not an NGO or doesn't own the campaign
- `404 Not Found` - Campaign not found
- `413 Payload Too Large` - File size exceeds 50MB
- `500 Internal Server Error` - File storage failure or server error

---

### 2. Get Campaign Proofs

Retrieve all verified proofs for a campaign (public endpoint).

**Endpoint:** `GET /api/proof/campaign/:campaignId`

**Authentication:** Not required (public)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number for pagination |
| limit | number | 20 | Number of proofs per page (max 100) |

**Example Request:**

```bash
curl -X GET "http://localhost:5000/api/proof/campaign/507f1f77bcf86cd799439011?page=1&limit=20"
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "proofs": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "campaign": "507f1f77bcf86cd799439011",
        "beneficiary": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "John Doe"
        },
        "merchant": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "ABC Store"
        },
        "proofType": "PURCHASE_RECEIPT",
        "files": [
          {
            "fileUrl": "https://storage.example.com/proofs/invoice1.jpg",
            "fileType": "IMAGE"
          }
        ],
        "capturedAt": "2024-01-15T10:30:00.000Z",
        "status": "AI_VERIFIED",
        "aiValidation": {
          "verified": true,
          "confidenceScore": 0.92
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid campaign ID format
- `500 Internal Server Error` - Server error

---

### 3. Get Donor Proof Timeline

Retrieve proof timeline for a donor (all campaigns they've donated to).

**Endpoint:** `GET /api/proof/donor/:donorId`

**Authentication:** Required (Donor role)

**Authorization:** Donor can only view their own timeline

**Example Request:**

```bash
curl -X GET http://localhost:5000/api/proof/donor/507f1f77bcf86cd799439015 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "campaignId": "507f1f77bcf86cd799439011",
        "campaignTitle": "Food Relief for Flood Victims",
        "donationAmount": 5000,
        "donationDate": "2024-01-10T08:00:00.000Z",
        "proofCount": 12,
        "proofs": [
          {
            "proofId": "507f1f77bcf86cd799439014",
            "proofType": "PURCHASE_RECEIPT",
            "files": [
              {
                "fileUrl": "https://storage.example.com/proofs/invoice1.jpg",
                "fileType": "IMAGE"
              }
            ],
            "capturedAt": "2024-01-15T10:30:00.000Z",
            "aiValidation": {
              "confidenceScore": 0.92
            }
          }
        ]
      }
    ]
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid donor ID format
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - User is not authorized to view this timeline
- `500 Internal Server Error` - Server error

---

### 4. Verify Proof Hash

Verify the integrity of a proof by comparing stored hash with current file hash.

**Endpoint:** `GET /api/proof/:proofId/verify`

**Authentication:** Not required (public)

**Example Request:**

```bash
curl -X GET http://localhost:5000/api/proof/507f1f77bcf86cd799439014/verify
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "proofId": "507f1f77bcf86cd799439014",
    "storedHash": "a3b2c1d4e5f6...",
    "currentHash": "a3b2c1d4e5f6...",
    "blockchainTxHash": "0x1234567890abcdef...",
    "verificationStatus": "VALID",
    "anchoredAt": "2024-01-15T10:40:00.000Z"
  }
}
```

**Verification Status:**
- `VALID` - File hash matches stored hash (proof is authentic)
- `TAMPERED` - File hash doesn't match stored hash (proof may have been tampered with)

**Error Responses:**

- `400 Bad Request` - Invalid proof ID format
- `404 Not Found` - Proof not found
- `500 Internal Server Error` - Verification error or server error

---

### 5. Submit Manual Review

Admin endpoint to manually approve or reject a flagged proof.

**Endpoint:** `POST /api/proof/:proofId/review`

**Authentication:** Required (Admin role)

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| decision | string | Yes | Review decision: `APPROVED` or `REJECTED` |
| reason | string | No | Reason for the decision |

**Example Request:**

```bash
curl -X POST http://localhost:5000/api/proof/507f1f77bcf86cd799439014/review \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "APPROVED",
    "reason": "Verified with beneficiary directly"
  }'
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Proof review submitted successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "status": "APPROVED",
    "manualReview": {
      "reviewedBy": "507f1f77bcf86cd799439016",
      "decision": "APPROVED",
      "reason": "Verified with beneficiary directly",
      "reviewedAt": "2024-01-15T11:00:00.000Z"
    }
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid input, proof not flagged, or invalid decision
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - User is not an admin
- `404 Not Found` - Proof not found
- `500 Internal Server Error` - Server error

---

## Proof Status Flow

```
UPLOADED → UNDER_VALIDATION → AI_VERIFIED → (blockchain anchored)
                            ↓
                         FLAGGED → MANUAL_REVIEW → APPROVED/REJECTED
                            ↓
                         REJECTED
```

**Status Descriptions:**

- `UPLOADED` - Proof files uploaded, awaiting validation
- `UNDER_VALIDATION` - AI validation in progress
- `AI_VERIFIED` - AI validation passed, proof is verified
- `FLAGGED` - AI flagged for manual review (suspicious patterns detected)
- `APPROVED` - Manually approved by admin after being flagged
- `REJECTED` - Rejected by AI or admin (invalid proof)

---

## AI Validation

The AI validation agent performs the following checks:

1. **Duplicate Detection** - Perceptual hashing to detect duplicate files
2. **OCR Validation** - Extract text from invoices/receipts for validation
3. **Metadata Validation** - Verify location (within 50km of campaign) and timestamp (within campaign period)
4. **Fraud Pattern Detection** - Detect repeated vendors, cross-campaign reuse

**AI Decision Thresholds:**

- `VERIFIED` - Confidence > 0.8 AND Fraud Probability < 0.3
- `REJECTED` - Fraud Probability > 0.6
- `FLAGGED` - All other cases (requires manual review)

---

## Blockchain Anchoring

Verified proofs (AI_VERIFIED or APPROVED status) are automatically anchored to the blockchain for immutability and transparency.

**Blockchain Transaction Hash:** Stored in `blockchainTxHash` field after successful anchoring.

**Graceful Degradation:** If blockchain service is unavailable, proofs remain verified without blockchain anchor.

---

## Notifications

The system automatically sends notifications:

1. **Proof Rejected** - NGO receives HIGH priority notification when proof is rejected
2. **Proof Verified** - All donors who donated to the campaign receive NORMAL priority notification when proof is verified

---

## Rate Limiting

All proof endpoints are rate-limited to prevent abuse:

- **Upload:** 10 requests per minute per user
- **Retrieval:** 100 requests per minute per IP

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (invalid input) |
| 401 | Unauthorized (missing or invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 413 | Payload Too Large (file size exceeded) |
| 429 | Too Many Requests (rate limit exceeded) |
| 500 | Internal Server Error |

---

## Best Practices

1. **Idempotency Keys** - Always use idempotency keys for proof uploads to prevent duplicate submissions
2. **File Optimization** - Compress images before upload to reduce file size and upload time
3. **Location Accuracy** - Provide accurate GPS coordinates for better validation
4. **Proof Types** - Use the most specific proof type for better categorization
5. **Error Handling** - Implement retry logic with exponential backoff for transient errors

---

## Support

For API support or questions, contact the AidFlow development team.
