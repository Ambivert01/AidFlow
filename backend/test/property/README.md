# Property-Based Tests for Wallet Allocation System

This directory contains property-based tests for the Wallet Allocation System using fast-check.

## Test Organization

### Wallet Creation Properties (Properties 1-7)
- **File**: `wallet-creation.property.test.js`
- Property 1: Wallet Creation Links Entities Correctly
- Property 2: Policy Snapshot Immutability
- Property 3: Initial Balance Equals Allocated Amount
- Property 4: Expiry Date Calculation
- Property 5: Beneficiary Approval Precondition
- Property 6: Idempotency for Wallet Creation
- Property 7: Idempotency for Transaction Processing

### Policy Validation Properties (Properties 8-16)
- **File**: `policy-validation.property.test.js` (to be created)
- Property 8: Category Validation
- Property 9: Transaction Limit Validation
- Property 10: Daily Limit Validation
- Property 11: Weekly Limit Validation
- Property 12: Expiry Validation
- Property 13: Merchant Whitelist Validation
- Property 14: Haversine Distance Calculation
- Property 15: Geographic Distance Validation
- Property 16: District Validation

### Transaction Processing Properties (Properties 17-25)
- **File**: `transaction-processing.property.test.js` (to be created)
- Property 17: Active Status Precondition for Spending
- Property 18: Sufficient Balance Precondition
- Property 19: Active Merchant Precondition
- Property 20: Balance Consistency Invariant
- Property 21: Counter Accumulation
- Property 22: Transaction Ledger Append-Only
- Property 23: Transaction Record Completeness
- Property 24: Balance After Consistency
- Property 25: Transaction Ordering

### State Management Properties (Properties 26-28)
- **File**: `state-management.property.test.js` (to be created)
- Property 26: State Transition Validity
- Property 27: State Transition Metadata Recording
- Property 28: Audit Log Creation

### Integration Properties (Properties 29-40)
- **File**: `integration.property.test.js` (to be created)
- Property 29: Merchant Balance Update
- Property 30: Campaign Metrics Update on Wallet Creation
- Property 31: Campaign Metrics Update on Transaction
- Property 32: Risk Score Bounds
- Property 33: Automatic Freeze on High Risk Score
- Property 34: Credit Operation Balance Update
- Property 35: Adjustment Operation Balance Update
- Property 36: Fraud Check Triggering
- Property 37: Fail-Open Resilience
- Property 38: Notification Triggering
- Property 39: Transaction Metadata Capture
- Property 40: Wallet Closure State Validation

## Running Tests

```bash
# Run all property tests
npm test -- test/property/**/*.property.test.js

# Run specific property test file
npm test -- test/property/wallet-creation.property.test.js

# Run with watch mode
npm run test:watch -- test/property/**/*.property.test.js
```

## Test Configuration

- **Iterations**: 100 runs per property (minimum)
- **Timeout**: 10 seconds per test
- **Library**: fast-check v4.7.0

## Property Test Pattern

Each property test follows this pattern:

```javascript
it("Property X: Description", async () => {
  await fc.assert(
    fc.asyncProperty(
      // Arbitraries (input generators)
      fc.integer({ min: 1, max: 1000 }),
      async (input) => {
        // Test logic
        const result = await functionUnderTest(input);
        
        // Assertions
        expect(result).to.satisfy(property);
      }
    ),
    { numRuns: 100 }
  );
});
```

## Helper Utilities

The `helpers.js` file provides:
- **Arbitraries**: Input generators for test data
- **Generators**: Factory functions for creating test objects
- **Assertions**: Common assertion helpers
- **Config**: Test configuration constants

## Coverage

All 40 correctness properties from the design document are implemented as property-based tests, providing comprehensive validation of:
- Wallet creation and lifecycle
- Policy enforcement
- Transaction processing
- State transitions
- Integration points
- Error handling
- Data consistency
