# Integration Test Suite Documentation

## Overview

This comprehensive integration test suite validates the security, authentication, and voting functionality of the startup bootcamp platform. The tests ensure robust data integrity and secure workflows across all team and admin operations.

## Test Architecture

### Framework & Setup
- **Testing Framework**: Vitest with Supertest for HTTP testing
- **Database**: Isolated test database with full cleanup
- **Authentication**: Session-based testing with cookie management
- **Coverage**: Complete API endpoint validation

### Test Environment
- Dedicated test database isolation
- Full Express app setup with middleware
- Session management with secure cookies
- Comprehensive cleanup between test runs

## Test Suites

### Suite 1: Team Authentication & Session Management
Validates the secure token-based authentication system for teams.

**Test 1.1: Successful Login with Token**
- Verifies teams can authenticate with valid access tokens
- Confirms session cookie creation and security
- Validates proper response structure

**Test 1.2: Failed Login with Invalid Token**
- Ensures unauthorized access is properly blocked
- Validates error handling for invalid tokens
- Confirms 401 Unauthorized responses

**Test 1.3: Successful Logout**
- Tests session termination functionality
- Verifies session cleanup and security
- Confirms proper logout workflow

### Suite 2: Admin Controls for Voting
Ensures only administrators can control voting lifecycle and results visibility.

**Test 2.1: Admin Can Open Voting**
- Validates admin privilege verification
- Tests voting state management
- Confirms database state changes

**Test 2.2: Non-Admin Cannot Open Voting**
- Prevents unauthorized voting control
- Tests both unauthenticated and team-level access
- Validates proper security boundaries

**Test 2.3: Admin Can Reveal Results**
- Controls results visibility timing
- Ensures admin-only access to result controls
- Validates celebratory reveal workflow

### Suite 3: Voting Logic and Security
Comprehensive validation of voting rules and anti-fraud measures.

**Test 3.1: Voting is Blocked When Closed**
- Enforces voting window controls
- Prevents premature or late submissions
- Validates temporal security boundaries

**Test 3.2: Secure Vote Submission**
- Tests complete voting workflow
- Validates vote persistence and integrity
- Confirms proper data structure

**Test 3.3: Prevent Self-Voting**
- Blocks teams from voting for themselves
- Validates business rule enforcement
- Ensures fair competition integrity

**Test 3.4: Prevent Duplicate Voting**
- One vote per team enforcement
- Database constraint validation
- Anti-fraud protection testing

### Suite 4: Results Visibility
Controls the dramatic reveal of competition results.

**Test 4.1: Results are Hidden by Default**
- Ensures results remain private until reveal
- Validates access control enforcement
- Maintains competition suspense

**Test 4.2: Results are Visible After Reveal**
- Confirms results accessibility post-reveal
- Validates celebration timing control
- Tests complete workflow integration

## Security Features Validated

### Authentication Security
- ✅ Token-based team authentication
- ✅ Session management and persistence
- ✅ Secure logout and cleanup
- ✅ Invalid token handling

### Authorization Controls
- ✅ Admin-only voting controls
- ✅ Admin-only results management
- ✅ Team-level access restrictions
- ✅ Proper privilege separation

### Business Rule Enforcement
- ✅ Voting window controls
- ✅ Self-voting prevention
- ✅ Duplicate voting prevention
- ✅ Results visibility timing

### Data Integrity
- ✅ Vote persistence validation
- ✅ Database state management
- ✅ Transaction integrity
- ✅ Cleanup and isolation

## Running the Tests

### Prerequisites
```bash
# Install test dependencies
npm install vitest supertest @types/supertest

# Ensure test database is available
export DATABASE_URL="your_test_database_url"
```

### Execution
```bash
# Run all integration tests
NODE_ENV=test npx vitest run --config vitest.config.ts server/tests/voting.test.ts

# Run with watch mode for development
NODE_ENV=test npx vitest server/tests/voting.test.ts

# Use the test runner script
node scripts/run-tests.js
```

### Test Data Management
- Automatic cleanup before and after test runs
- Isolated test cohort: `TEST_COHORT`
- Three test teams with unique access tokens
- Admin user for privilege testing

## Implementation Notes

### Session Management
The test suite properly handles Express sessions with:
- Session cookie extraction and management
- Persistent authentication across requests
- Proper session cleanup testing

### Database Isolation
Tests use dedicated test data:
- Unique cohort tag prevents pollution
- Complete cleanup ensures repeatability
- Transaction isolation for parallel testing

### Error Handling
Comprehensive validation of:
- HTTP status codes
- Error message content
- Security boundary enforcement
- Business rule violations

## Expected Outcomes

All tests validate critical security and business requirements:

1. **Authentication Security**: Teams can only access with valid tokens
2. **Admin Controls**: Only administrators can manage voting lifecycle
3. **Voting Integrity**: Business rules prevent fraud and ensure fairness
4. **Results Security**: Dramatic reveal timing is properly controlled
5. **Data Integrity**: All operations maintain database consistency

This test suite provides high confidence in the platform's security, reliability, and user experience for the complete bootcamp workflow from team authentication through celebratory results reveal.