# Risk-Based Test Strategy

## Objective

Provide explainable confidence in the core claim journey and highest-value business rules within a 2-3 hour assessment. Risk coverage takes priority over test count and code coverage.

## System under test

- Next.js/React frontend with Zustand and an OpenAPI-generated BFF client.
- Spring Boot BFF handling authentication, authorization and downstream calls.
- Spring Boot Claims Service owning claim rules and PostgreSQL persistence.
- Kafka/WebSocket realtime flow and Redis dashboard caching.
- Keycloak authentication and Docker Compose infrastructure.

## Implemented automation

### Unit - implemented and passing

`ClaimStatusTransitionTest` contains two pure JUnit 5 tests:

- `SUBMITTED -> UNDER_REVIEW` succeeds and records `ClaimStatusChanged`.
- `SUBMITTED -> APPROVED` throws and leaves status, timestamp and events unchanged.

Result: **2 passed**.

### Component - implemented and exposing BUG-02

`AppHeader` logout tests use Vitest and React Testing Library:

- Successful logout must send CSRF and then clear client state.
- A rejected logout must leave the user signed in and avoid navigation.

Result: **2 failed as expected on the current application**. The request omits CSRF and a 403 still clears local state.

### Integration/E2E - implemented and passing

The Playwright workflow exercises the running Docker Compose stack:

- Login as the seeded claimant.
- Complete the three-step claim wizard.
- Require claim creation to return 201 and `SUBMITTED`.
- Verify the server-issued claim appears in My Claims.

Result: **1 passed**.

The Playwright test provides integrated browser-to-database coverage. A separate backend Testcontainers integration suite was not implemented.

## Why these tests

- Domain transitions are cheapest and most deterministic at unit level.
- Logout coordination belongs at component level because it spans user action, HTTP response and client state.
- The primary claim journey requires the deployed UI, authentication, BFF, Claims Service and persistence stack.

## Deliberately deferred

- Separate API tests for future-date, ownership and invalid-transition HTTP mapping.
- Redis serialization with Testcontainers.
- Kafka publication/failure and WebSocket delivery.
- Concurrent BFF bearer-token contamination.
- Optimistic-locking/lost-update behaviour.
- Keycloak/database split-brain signup.
- Dependency remediation pending audit triage.

These remain documented risks rather than claimed automated coverage.

## Execution notes

- Keep correct expectations for known defects; do not change assertions to accept 500 responses.
- Playwright uses unique claim markers but leaves created claims in the local database because no supported cleanup endpoint exists.
- Vitest and Playwright discovery should be isolated before CI adoption.
- Component failures should be linked to BUG-02 or temporarily marked as expected failures so a permanently red baseline does not hide new regressions.

