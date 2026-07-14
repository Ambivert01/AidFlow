# Campaign Discovery System - Property-Based Test Suite

This directory contains comprehensive property-based tests for the Campaign Discovery System, validating all 10 correctness properties defined in the design document.

## Overview

Property-based testing validates universal properties that should hold for all valid inputs, rather than testing specific examples. This approach helps discover edge cases and ensures system robustness.

## Test Files

### 1. `campaign.discovery.property.test.js`
Tests the core discovery service functionality:

- **Property 1: Campaign Discovery Filtering Accuracy** - Validates that filters work correctly
- **Property 2: Campaign Sorting Correctness** - Ensures proper sorting behavior  
- **Property 6: Input Validation and Error Handling** - Tests graceful error handling
- **Property 8: Active Campaign Retrieval** - Validates only active campaigns are returned
- **Property 9: Real-Time Search Filtering** - Tests search functionality

### 2. `campaign.parser.property.test.js`
Tests the campaign data parser:

- **Property 5: Campaign Data Parser Round-Trip** - Validates consistent data formatting

### 3. `trust.engine.property.test.js`
Tests the trust engine integration:

- **Property 3: Trust Score Integration and Calculation** - Validates trust score calculations
- **Property 7: Cache Invalidation and Performance** - Tests caching behavior

## Running Tests

### Run All Property-Based Tests
```bash
npm run test:property
```

### Run Discovery Tests Only
```bash
npm run test:discovery
```

### Run All Tests (Unit + Property-Based)
```bash
npm run test:all
```

### Watch Mode for Development
```bash
npm run test:watch
```

## Test Configuration

- **Timeout**: 60 seconds per test suite
- **Property Iterations**: 100+ iterations per property (configurable)
- **Test Data**: Automatically generated and cleaned up
- **Database**: Uses test database with automatic cleanup

## Property Descriptions

### Property 1: Campaign Discovery Filtering Accuracy
**Validates**: Requirements 1.2, 1.3, 1.4, 1.5, 1.6

For any valid filter criteria F and campaign set C:
- All returned campaigns must satisfy filter F
- No campaigns satisfying F should be excluded (completeness)
- Filter combinations should work correctly (intersection)

### Property 2: Campaign Sorting Correctness
**Validates**: Requirements 3.1, 3.2, 3.3, 3.4

For any valid sort criteria S and campaign set C:
- Returned campaigns must be in correct order according to S
- Sort stability: campaigns with equal sort values maintain relative order
- Multiple sort criteria work correctly (primary, secondary ordering)

### Property 3: Trust Score Integration and Calculation
**Validates**: Requirements 2.1, 2.4, 9.1, 9.2, 9.5

For any valid entity E and trust calculation parameters P:
- Trust score should be in range [0, 100]
- Trust score should be deterministic for same inputs
- Batch processing should return same results as individual calculations

### Property 5: Campaign Data Parser Round-Trip
**Validates**: Requirements 8.1, 8.2, 8.3, 8.4

For any valid campaign data D:
- parse(D) should return valid formatted data
- Parsed data should maintain essential information
- Formatting should be consistent and predictable

### Property 6: Input Validation and Error Handling
**Validates**: Requirements 7.4, 8.5, 9.1, 9.2

For any input I (valid or invalid):
- Invalid inputs should be rejected with appropriate error messages
- System should handle edge cases gracefully
- No crashes or undefined behavior for invalid inputs

### Property 7: Cache Invalidation and Performance
**Validates**: Requirements 6.4, 2.5

For any cache operation O and data D:
- Cache invalidation should work correctly
- Performance should meet targets (sub-500ms response times)
- Cache hit ratio should exceed 80% for repeated queries

### Property 8: Active Campaign Retrieval
**Validates**: Requirements 1.1

For any discovery query Q:
- Only campaigns with status "ACTIVE" should be returned
- No inactive campaigns should appear in results

### Property 9: Real-Time Search Filtering
**Validates**: Requirements 4.4, 4.5

For any search term T and campaign set C:
- Search should find campaigns matching T in title or description
- Search should be case-insensitive
- Search should handle special characters gracefully

## Test Data Management

Tests automatically:
- Create test campaigns with predictable naming (`TEST_*`)
- Create test NGO users for campaign ownership
- Clean up all test data after completion
- Use separate test database to avoid conflicts

## Debugging Failed Tests

When property-based tests fail:

1. **Check the failing input**: The test framework will show the specific input that caused the failure
2. **Reproduce manually**: Use the failing input to reproduce the issue
3. **Check edge cases**: Property-based tests often reveal edge cases
4. **Verify assumptions**: Ensure the property definition matches the actual requirements

## Performance Considerations

- Tests run with realistic data volumes (up to 50 campaigns per test)
- Cache operations are tested under load
- Response time targets are validated (500ms)
- Memory usage is monitored during batch operations

## Integration with CI/CD

These tests are designed to run in continuous integration:
- Deterministic results (no flaky tests)
- Automatic cleanup prevents test pollution
- Clear pass/fail criteria
- Detailed error reporting for debugging

## Adding New Properties

To add a new property test:

1. Define the property in the design document
2. Create a test function following the existing pattern
3. Use `fc.assert()` with appropriate generators
4. Include cleanup logic for test data
5. Document the property in this README

## Troubleshooting

### Common Issues

**Database Connection Errors**
- Ensure MongoDB is running
- Check database configuration in test environment

**Timeout Errors**
- Increase timeout for complex properties
- Check for infinite loops in test logic

**Memory Issues**
- Reduce number of test iterations
- Ensure proper cleanup of test data

**Cache Errors**
- Verify Redis is running for cache tests
- Check cache configuration

### Getting Help

For issues with property-based tests:
1. Check the test output for specific error messages
2. Review the property definition in the design document
3. Verify the test environment setup
4. Check for recent changes to the tested code