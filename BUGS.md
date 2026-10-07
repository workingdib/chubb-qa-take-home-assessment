# Defect Report

## Headline findings

### BUG-01: Full Authorization bearer token is logged

- **Severity:** High
- **Actual:** The full JWT appears in Claims Service debug logs.
- **Expected:** Authorization values are redacted; only header presence may be logged.
- **Evidence:** Confirmed during exploratory testing. `RequestLoggingFilter` truncates the token once, then logs every complete request header.
- **Impact:** Anyone with log access may impersonate a user until the token expires; secrets may spread to central logging and backups.
- **Relevant code:** Claims Service `RequestLoggingFilter`.

### BUG-02: Logout is rejected and cookies remain

- **Severity:** High
- **Actual:** `POST /api/auth/logout` returns 403. The UI redirects and clears local state, but authentication cookies remain.
- **Expected:** Logout returns 204, clears cookies and prevents further protected access.
- **Evidence:** Confirmed during exploratory testing and reproduced by component tests. `AppHeader` omits CSRF, ignores non-success status and clears local state anyway.
- **Impact:** The user believes they logged out while the authenticated session remains usable.
- **Relevant code:** UI `AppHeader` and `bff-client`; BFF `SecurityConfig` and `AuthController`.

### BUG-03: Expected client errors are exposed as server errors

- **Severity:** Medium
- **Actual:** Validations and access denials return 500 at the public boundary.
- **Expected:** Preserve the documented 400/403 response and Problem Detail.
- **Impact:** Users receive misleading retry behaviour, clients cannot handle errors correctly and monitoring records false server failures.

Confirmed examples:

| Scenario | Expected | Actual | Primary cause |
|---|---:|---:|---|
| Future incident date | 400 | 500 | BFF wraps the Claims Service 400 in `IllegalStateException` |
| Claim owned by another user | 403 | 500 | BFF wraps the Claims Service 403; no data disclosure was observed |
| `SUBMITTED -> APPROVED` | 400 | 500 | Claims Service does not map `InvalidStatusTransitionException` |

Relevant code: Claims `Claim`, `ClaimStatus`, `GetClaimUseCase`, `ClaimExceptionHandler`; BFF `ClaimsServiceAdapter`.

### BUG-04: Redis dashboard cache cannot deserialize its value

- **Severity:** Medium-Low
- **Actual:** `dashboard:stats` is stored, but reading it produces a `LinkedHashMap`/`DashboardStats` type failure and falls back to PostgreSQL.
- **Expected:** A repeated dashboard request reads a typed value and reports a cache hit.
- **Evidence:** Confirmed during exploratory testing. The exact serializer correction still requires a focused Redis round-trip test.
- **Impact:** The application remains available, but caching provides no performance benefit and database load increases.
- **Relevant code:** Claims `RedisConfig`, `DashboardStatsCache`, `DashboardStats`.

## Security scan observation

### OBS-01: Frontend dependency vulnerabilities require triage

- `npm audit` reported 27 vulnerabilities.
- The count is confirmed; production reachability and individual severity are not.
- Treat this as an untriaged software-composition finding, not 27 confirmed exploitable defects.
- Relevant files: `demo-app-ui/package.json`, `demo-app-ui/package-lock.json`.

