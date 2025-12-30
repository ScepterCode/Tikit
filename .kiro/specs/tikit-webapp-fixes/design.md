# Tikit Webapp Fixes and Missing Tests - Design Document

## Overview

This document outlines the design for completing the remaining property-based tests and fixing any incomplete functionality in the Tikit webapp. The focus is on ensuring comprehensive test coverage and validating system correctness through property-based testing.

## Architecture

All tests will follow the existing architecture and testing patterns established in the main Tikit webapp. Tests will use:
- **Vitest** for unit and property-based tests
- **fast-check** for property-based test generation
- **Playwright** for integration tests (if needed)

## Components and Interfaces

### Backend Test Services

All property-based tests will be added to existing service test files:
- `apps/backend/src/services/auth.service.test.ts` - JWT token generation tests
- `apps/backend/src/services/security.service.test.ts` - Security breach response tests
- `apps/backend/src/services/organizer.service.test.ts` - Attendee export and broadcast tests
- `apps/backend/src/middleware/rbac.test.ts` - RBAC permission tests

### Frontend Test Services

Frontend property-based tests will be added to:
- `apps/frontend/src/services/offlineScanQueue.test.ts` - Offline scan queueing tests

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 45: JWT token generation
*For any* valid user credentials, when a JWT token is generated, verifying that token should return the original user ID and role information
**Validates: Requirements 1.1, 1.2, 1.3**

### Property 48: Security breach response
*For any* detected security breach, the affected account should be locked and remain inaccessible until manual review
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 34: Attendee export completeness
*For any* event with N attendees, the exported attendee data should contain exactly N records with all required fields (name, phone, tier, payment status)
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 35: Broadcast delivery completeness
*For any* WhatsApp broadcast to N recipients, the sum of successful and failed deliveries should equal N
**Validates: Requirements 4.1, 4.2, 4.3**

### Property 36: Role-based access control
*For any* user role and protected action, the system should only allow access if the role has the required permission
**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

### Property 52: Offline scan queueing
*For any* set of scan requests made while offline, all requests should be processed when connectivity is restored
**Validates: Requirements 6.1, 6.2, 6.3**

## Error Handling

All tests should handle errors gracefully:
- Invalid inputs should be rejected with clear error messages
- Network failures should be simulated and handled
- Edge cases (empty lists, null values, etc.) should be tested

## Testing Strategy

### Property-Based Testing Configuration

- Minimum 100 iterations per property test
- Use custom generators for domain-specific data
- Tag each test with format: `**Feature: tikit-webapp-fixes, Property {number}: {property_text}**`

### Test Implementation Approach

1. **JWT Token Generation (Property 45)**:
   - Generate random user credentials
   - Create JWT token
   - Verify token and check user information matches
   - Test token expiration

2. **Security Breach Response (Property 48)**:
   - Simulate security breach detection
   - Verify account is locked
   - Attempt login and verify denial
   - Check notification was sent

3. **Attendee Export Completeness (Property 34)**:
   - Create event with random number of attendees
   - Export attendee data
   - Verify record count matches
   - Verify all required fields present

4. **Broadcast Delivery Completeness (Property 35)**:
   - Create broadcast with random recipients
   - Send broadcast
   - Verify sent + failed = total recipients
   - Check delivery tracking

5. **RBAC Permission Testing (Property 36)**:
   - Generate random role and action combinations
   - Attempt action with role
   - Verify permission enforcement
   - Test all role/action combinations

6. **Offline Scan Queueing (Property 52)**:
   - Simulate offline state
   - Queue random scan requests
   - Restore connectivity
   - Verify all requests processed

### Unit Testing Balance

- Focus property tests on universal properties
- Use unit tests for specific edge cases
- Avoid redundant testing between unit and property tests

## Implementation Notes

### Existing Code Integration

All tests will integrate with existing services and infrastructure:
- Use existing database connections and test setup
- Leverage existing mock utilities
- Follow established testing patterns

### Test Data Generation

Use fast-check generators for:
- User credentials (phone numbers, passwords)
- Event data (titles, dates, capacities)
- Ticket data (QR codes, tiers, statuses)
- Role and permission combinations

### Performance Considerations

- Tests should complete within reasonable time (< 30 seconds per property)
- Use appropriate shrinking strategies for failing tests
- Optimize generators for common cases
