# FlightRequest lifecycle: illegal transitions

## Shared setup

- **Passing draft:** Operator A is `ACTIVE` at `authorisation_level` `L1`, is logged in, and owns a `DRAFT` request that passes all four gates:
  - pilot `rating` is `R_BASIC`, and `certified_on` is 1 month ago
  - aircraft `mtom_grams` is 500 (band `C0`), with no other `APPROVED` or `UNDER_REVIEW` request
  - `zone_code` is `DNI-OPN-1`, and `requested_altitude_metres` is 100
  - `window_start` is 24 hours from now, and `window_end` is 1 hour later
- **Failing draft:** Passing draft, with `requested_altitude_metres` 121, above the `DNI-OPN-1` ceiling of 120 m
- **Under review request:** Passing draft, submitted by operator A
- **Approved request:** Under review request, approved by a reviewer
- **Rejected request:** Failing draft, submitted by operator A
- **Cancelled request:** Passing draft, cancelled by operator A
- **Completed request:** Operator A owns a request in `COMPLETED`, seeded directly in the test data, because `docs/03-api-contract.md` lists no completion endpoint
- **Submitted request:** Operator A owns a request in `SUBMITTED`, seeded directly in the test data, because this state never rests through normal calls
- **Reviewer call:** Send the `X-Reviewer-Id` header with the value `reviewer-1`

## API-FR-026: Submit from SUBMITTED returns 409

- **ID:** API-FR-026
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Submitted request
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/submit`
- **Expected result:** The response status is `409`

## API-FR-027: Submit from UNDER_REVIEW returns 409

- **ID:** API-FR-027
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Under review request
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/submit`
- **Expected result:** The response status is `409`

## API-FR-028: Submit from APPROVED returns 409

- **ID:** API-FR-028
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Approved request
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/submit`
- **Expected result:** The response status is `409`

## API-FR-029: Submit from REJECTED returns 409

- **ID:** API-FR-029
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Rejected request
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/submit`
- **Expected result:** The response status is `409`

## API-FR-030: Submit from CANCELLED returns 409

- **ID:** API-FR-030
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Cancelled request
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/submit`
- **Expected result:** The response status is `409`

## API-FR-031: Submit from COMPLETED returns 409

- **ID:** API-FR-031
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Completed request
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/submit`
- **Expected result:** The response status is `409`

## API-FR-032: Approve from DRAFT returns 409

- **ID:** API-FR-032
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Passing draft
- **Steps:**
  1. Using Reviewer call, send `POST /api/v1/flight-requests/{id}/approve`
- **Expected result:** The response status is `409`

## API-FR-033: Approve from SUBMITTED returns 409

- **ID:** API-FR-033
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Submitted request
- **Steps:**
  1. Using Reviewer call, send `POST /api/v1/flight-requests/{id}/approve`
- **Expected result:** The response status is `409`

## API-FR-034: Approve from APPROVED returns 409

- **ID:** API-FR-034
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Approved request
- **Steps:**
  1. Using Reviewer call, send `POST /api/v1/flight-requests/{id}/approve`
- **Expected result:** The response status is `409`

## API-FR-035: Approve from REJECTED returns 409

- **ID:** API-FR-035
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Rejected request
- **Steps:**
  1. Using Reviewer call, send `POST /api/v1/flight-requests/{id}/approve`
- **Expected result:** The response status is `409`

## API-FR-036: Approve from CANCELLED returns 409

- **ID:** API-FR-036
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Cancelled request
- **Steps:**
  1. Using Reviewer call, send `POST /api/v1/flight-requests/{id}/approve`
- **Expected result:** The response status is `409`

## API-FR-037: Approve from COMPLETED returns 409

- **ID:** API-FR-037
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Completed request
- **Steps:**
  1. Using Reviewer call, send `POST /api/v1/flight-requests/{id}/approve`
- **Expected result:** The response status is `409`

## API-FR-038: Reject from DRAFT returns 409

- **ID:** API-FR-038
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Passing draft
- **Steps:**
  1. Using Reviewer call, send `POST /api/v1/flight-requests/{id}/reject` with a non-empty `note`
- **Expected result:** The response status is `409`

## API-FR-039: Reject from SUBMITTED returns 409

- **ID:** API-FR-039
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Submitted request
- **Steps:**
  1. Using Reviewer call, send `POST /api/v1/flight-requests/{id}/reject` with a non-empty `note`
- **Expected result:** The response status is `409`

## API-FR-040: Reject from APPROVED returns 409

- **ID:** API-FR-040
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Approved request
- **Steps:**
  1. Using Reviewer call, send `POST /api/v1/flight-requests/{id}/reject` with a non-empty `note`
- **Expected result:** The response status is `409`

## API-FR-041: Reject from REJECTED returns 409

- **ID:** API-FR-041
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Rejected request
- **Steps:**
  1. Using Reviewer call, send `POST /api/v1/flight-requests/{id}/reject` with a non-empty `note`
- **Expected result:** The response status is `409`

## API-FR-042: Reject from CANCELLED returns 409

- **ID:** API-FR-042
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Cancelled request
- **Steps:**
  1. Using Reviewer call, send `POST /api/v1/flight-requests/{id}/reject` with a non-empty `note`
- **Expected result:** The response status is `409`

## API-FR-043: Reject from COMPLETED returns 409

- **ID:** API-FR-043
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Completed request
- **Steps:**
  1. Using Reviewer call, send `POST /api/v1/flight-requests/{id}/reject` with a non-empty `note`
- **Expected result:** The response status is `409`

## API-FR-044: Cancel from REJECTED returns 409

- **ID:** API-FR-044
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Rejected request
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/cancel`
- **Expected result:** The response status is `409`

## API-FR-045: Cancel from CANCELLED returns 409

- **ID:** API-FR-045
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Cancelled request
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/cancel`
- **Expected result:** The response status is `409`

## API-FR-046: Cancel from COMPLETED returns 409

- **ID:** API-FR-046
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Completed request
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/cancel`
- **Expected result:** The response status is `409`

## API-FR-047: Submit from UNDER_REVIEW leaves the state unchanged

- **ID:** API-FR-047
- **Doc ref:** `docs/03-api-contract.md` Error semantics
- **Preconditions:**
  - Under review request
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/submit`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `state` in the `GET` response is `UNDER_REVIEW`

## API-FR-048: Submit from APPROVED leaves the state unchanged

- **ID:** API-FR-048
- **Doc ref:** `docs/03-api-contract.md` Error semantics
- **Preconditions:**
  - Approved request
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/submit`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `state` in the `GET` response is `APPROVED`

## API-FR-049: Submit from REJECTED leaves the state unchanged

- **ID:** API-FR-049
- **Doc ref:** `docs/02-state-machine.md` States
- **Preconditions:**
  - Rejected request
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/submit`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `state` in the `GET` response is `REJECTED`

## API-FR-050: Submit from CANCELLED leaves the state unchanged

- **ID:** API-FR-050
- **Doc ref:** `docs/02-state-machine.md` States
- **Preconditions:**
  - Cancelled request
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/submit`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `state` in the `GET` response is `CANCELLED`

## API-FR-051: Submit from COMPLETED leaves the state unchanged

- **ID:** API-FR-051
- **Doc ref:** `docs/02-state-machine.md` States
- **Preconditions:**
  - Completed request
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/submit`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `state` in the `GET` response is `COMPLETED`

## API-FR-052: Approve from DRAFT leaves the state unchanged

- **ID:** API-FR-052
- **Doc ref:** `docs/03-api-contract.md` Error semantics
- **Preconditions:**
  - Passing draft
- **Steps:**
  1. Using Reviewer call, send `POST /api/v1/flight-requests/{id}/approve`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `state` in the `GET` response is `DRAFT`

## API-FR-053: Approve from APPROVED leaves the state unchanged

- **ID:** API-FR-053
- **Doc ref:** `docs/03-api-contract.md` Error semantics
- **Preconditions:**
  - Approved request
- **Steps:**
  1. Using Reviewer call, send `POST /api/v1/flight-requests/{id}/approve`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `state` in the `GET` response is `APPROVED`

## API-FR-054: Approve from REJECTED leaves the state unchanged

- **ID:** API-FR-054
- **Doc ref:** `docs/02-state-machine.md` States
- **Preconditions:**
  - Rejected request
- **Steps:**
  1. Using Reviewer call, send `POST /api/v1/flight-requests/{id}/approve`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `state` in the `GET` response is `REJECTED`

## API-FR-055: Approve from CANCELLED leaves the state unchanged

- **ID:** API-FR-055
- **Doc ref:** `docs/02-state-machine.md` States
- **Preconditions:**
  - Cancelled request
- **Steps:**
  1. Using Reviewer call, send `POST /api/v1/flight-requests/{id}/approve`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `state` in the `GET` response is `CANCELLED`

## API-FR-056: Approve from COMPLETED leaves the state unchanged

- **ID:** API-FR-056
- **Doc ref:** `docs/02-state-machine.md` States
- **Preconditions:**
  - Completed request
- **Steps:**
  1. Using Reviewer call, send `POST /api/v1/flight-requests/{id}/approve`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `state` in the `GET` response is `COMPLETED`

## API-FR-057: Reject from DRAFT leaves the state unchanged

- **ID:** API-FR-057
- **Doc ref:** `docs/03-api-contract.md` Error semantics
- **Preconditions:**
  - Passing draft
- **Steps:**
  1. Using Reviewer call, send `POST /api/v1/flight-requests/{id}/reject` with a non-empty `note`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `state` in the `GET` response is `DRAFT`

## API-FR-058: Reject from APPROVED leaves the state unchanged

- **ID:** API-FR-058
- **Doc ref:** `docs/03-api-contract.md` Error semantics
- **Preconditions:**
  - Approved request
- **Steps:**
  1. Using Reviewer call, send `POST /api/v1/flight-requests/{id}/reject` with a non-empty `note`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `state` in the `GET` response is `APPROVED`

## API-FR-059: Reject from REJECTED leaves the state unchanged

- **ID:** API-FR-059
- **Doc ref:** `docs/02-state-machine.md` States
- **Preconditions:**
  - Rejected request
- **Steps:**
  1. Using Reviewer call, send `POST /api/v1/flight-requests/{id}/reject` with a non-empty `note`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `state` in the `GET` response is `REJECTED`

## API-FR-060: Reject from CANCELLED leaves the state unchanged

- **ID:** API-FR-060
- **Doc ref:** `docs/02-state-machine.md` States
- **Preconditions:**
  - Cancelled request
- **Steps:**
  1. Using Reviewer call, send `POST /api/v1/flight-requests/{id}/reject` with a non-empty `note`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `state` in the `GET` response is `CANCELLED`

## API-FR-061: Reject from COMPLETED leaves the state unchanged

- **ID:** API-FR-061
- **Doc ref:** `docs/02-state-machine.md` States
- **Preconditions:**
  - Completed request
- **Steps:**
  1. Using Reviewer call, send `POST /api/v1/flight-requests/{id}/reject` with a non-empty `note`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `state` in the `GET` response is `COMPLETED`

## API-FR-062: Cancel from REJECTED leaves the state unchanged

- **ID:** API-FR-062
- **Doc ref:** `docs/02-state-machine.md` States
- **Preconditions:**
  - Rejected request
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/cancel`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `state` in the `GET` response is `REJECTED`

## API-FR-063: Cancel from CANCELLED leaves the state unchanged

- **ID:** API-FR-063
- **Doc ref:** `docs/02-state-machine.md` States
- **Preconditions:**
  - Cancelled request
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/cancel`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `state` in the `GET` response is `CANCELLED`

## API-FR-064: Cancel from COMPLETED leaves the state unchanged

- **ID:** API-FR-064
- **Doc ref:** `docs/02-state-machine.md` States
- **Preconditions:**
  - Completed request
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/cancel`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `state` in the `GET` response is `COMPLETED`

## API-FR-065: Complete from DRAFT returns 409

- **ID:** API-FR-065
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Passing draft
- **Steps:**
  1. Call the maintenance completion endpoint
- **Expected result:** BLOCKED: `docs/02-state-machine.md` requires `409`, but `docs/03-api-contract.md` lists no completion endpoint to call

## API-FR-066: Complete from SUBMITTED returns 409

- **ID:** API-FR-066
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Submitted request
- **Steps:**
  1. Call the maintenance completion endpoint
- **Expected result:** BLOCKED: `docs/02-state-machine.md` requires `409`, but `docs/03-api-contract.md` lists no completion endpoint to call

## API-FR-067: Complete from UNDER_REVIEW returns 409

- **ID:** API-FR-067
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Under review request
- **Steps:**
  1. Call the maintenance completion endpoint
- **Expected result:** BLOCKED: `docs/02-state-machine.md` requires `409`, but `docs/03-api-contract.md` lists no completion endpoint to call

## API-FR-068: Complete from REJECTED returns 409

- **ID:** API-FR-068
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Rejected request
- **Steps:**
  1. Call the maintenance completion endpoint
- **Expected result:** BLOCKED: `docs/02-state-machine.md` requires `409`, but `docs/03-api-contract.md` lists no completion endpoint to call

## API-FR-069: Complete from CANCELLED returns 409

- **ID:** API-FR-069
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Cancelled request
- **Steps:**
  1. Call the maintenance completion endpoint
- **Expected result:** BLOCKED: `docs/02-state-machine.md` requires `409`, but `docs/03-api-contract.md` lists no completion endpoint to call

## API-FR-070: Complete from COMPLETED returns 409

- **ID:** API-FR-070
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Completed request
- **Steps:**
  1. Call the maintenance completion endpoint
- **Expected result:** BLOCKED: `docs/02-state-machine.md` requires `409`, but `docs/03-api-contract.md` lists no completion endpoint to call
