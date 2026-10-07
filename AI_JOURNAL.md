# AI Journal

## AI investigation

- Mapped the Next.js frontend, Spring Boot BFF, Claims Service and Docker infrastructure by runtime responsibility.
- Traced authentication, claim creation, persistence, Kafka/CDC and WebSocket flows.
- Connected seven exploratory observations to relevant production code and separated confirmed evidence from assumptions.
- Confirmed claim statuses and transition rules from the domain implementation.
- Inspected the available JUnit, Vitest, Testing Library and Playwright tooling.
- Implemented and ran focused unit, component and Playwright tests after explicit user direction.
- Reviewed the generated tests critically for false positives, brittleness, shared state and runner conflicts.

## AI recommendations

- Prioritise token leakage, false logout, possible cross-request token contamination and broken BFF error propagation.
- Use the lowest test level that can expose each risk.
- Keep the implemented suite deliberately small: domain transition tests, logout component tests and one happy-path Playwright workflow.
- Preserve correct expectations when tests expose known defects.
- Defer Redis, Kafka, concurrency and dedicated backend integration automation under the assessment timebox.
- Consolidate findings with the same root cause rather than repeat them as unrelated headline defects.

## Human contribution and accepted decisions

The user explicitly:

- Required a risk-based strategy optimised for business value and panel explainability rather than test count or coverage.
- Required unit, component and integration/E2E thinking while keeping MUST IMPLEMENT small.
- Directed implementation of focused claim-transition unit tests without changing production behaviour.
- Directed implementation of logout component tests based on user-observable behaviour.
- Directed implementation of the Playwright happy-path claim workflow against Docker Compose.
- Required test execution evidence and reviewer-friendly explanations after implementation.
- Accepted consolidation of related 400/403-to-500 findings into one headline defect.
- Accepted moving Redis and dependency-audit work out of the main automated scope while retaining the evidence as follow-up observations.
- Required honest reporting: implemented, failing, passing and deferred coverage must remain clearly distinguished.

## Decisions changed or rejected by the user

None explicitly recorded. No human decision has been inferred for this section.

## Current automation evidence

- Backend unit tests: **2 passed**.
- Logout component tests: **2 failed**, reproducing BUG-02.
- Playwright claim workflow: **1 passed** against the running Compose stack.
- No standalone backend Testcontainers integration suite is claimed.
