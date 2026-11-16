# FlightRequest lifecycle: legal transitions

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
- **Submitted request:** Operator A owns a request in `SUBMITTED`, seeded directly in the test data, because this state never rests through normal calls
- **Reviewer call:** Send the `X-Reviewer-Id` header with the value `reviewer-1`

## API-FR-001: Submit of a passing draft moves it to UNDER_REVIEW

- **ID:** API-FR-001
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Passing draft
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/submit`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `state` in the `GET` response is `UNDER_REVIEW`

## API-FR-002: Submit of a failing draft returns 422

- **ID:** API-FR-002
- **Doc ref:** `docs/03-api-contract.md` Error semantics; `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Failing draft
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/submit`
- **Expected result:** The response status is `422`

## API-FR-003: Submit of a failing draft moves it to REJECTED

- **ID:** API-FR-003
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Failing draft
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/submit`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `state` in the `GET` response is `REJECTED`

## API-FR-004: Submit of a failing draft names the failing gate

- **ID:** API-FR-004
- **Doc ref:** `docs/03-api-contract.md` The 422 body; `docs/06-business-rules.md` §1.3
- **Preconditions:**
  - Failing draft
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/submit`
- **Expected result:** `failing_gate` in the response is `ZONE`

## API-FR-005: Submit of a draft above the ZONE altitude ceiling cites ZC-2026.1 §2

- **ID:** API-FR-005
- **Doc ref:** `docs/06-business-rules.md` §6
- **Preconditions:**
  - Failing draft
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/submit`
- **Expected result:** `rule_reference` in the response is `ZC-2026.1 §2`

## API-FR-006: A rejected draft keeps its failing gate

- **ID:** API-FR-006
- **Doc ref:** `docs/02-state-machine.md` States
- **Preconditions:**
  - Rejected request
- **Steps:**
  1. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `failing_gate` in the `GET` response is `ZONE`

## API-FR-007: A rejected draft has a rejection reason

- **ID:** API-FR-007
- **Doc ref:** `docs/02-state-machine.md` States
- **Preconditions:**
  - Rejected request
- **Steps:**
  1. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `rejection_reason` in the `GET` response is populated

## API-FR-008: A submitted request is not left at rest in SUBMITTED

- **ID:** API-FR-008
- **Doc ref:** `docs/02-state-machine.md` States; `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Passing draft
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/submit`
  2. As operator A, send `GET /api/v1/flight-requests?state=SUBMITTED`
- **Expected result:** The list does not include this request

## API-FR-009: Submit by another operator returns 403

- **ID:** API-FR-009
- **Doc ref:** `docs/03-api-contract.md` Authentication & authorisation
- **Preconditions:**
  - Passing draft
  - Operator B is logged in and does not own the request
- **Steps:**
  1. As operator B, send `POST /api/v1/flight-requests/{id}/submit`
- **Expected result:** The response status is `403`

## API-FR-010: Submit with no session returns 401

- **ID:** API-FR-010
- **Doc ref:** `docs/03-api-contract.md` Authentication & authorisation
- **Preconditions:**
  - Passing draft
  - The caller has no session and no `X-Reviewer-Id` header
- **Steps:**
  1. Send `POST /api/v1/flight-requests/{id}/submit`
- **Expected result:** The response status is `401`

## API-FR-011: Approve moves UNDER_REVIEW to APPROVED

- **ID:** API-FR-011
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Under review request
- **Steps:**
  1. Using Reviewer call, send `POST /api/v1/flight-requests/{id}/approve`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `state` in the `GET` response is `APPROVED`

## API-FR-012: Approve without X-Reviewer-Id has a defined status

- **ID:** API-FR-012
- **Doc ref:** `docs/03-api-contract.md` Reviewer; `docs/03-api-contract.md` Error semantics
- **Preconditions:**
  - Under review request
  - The caller has no `X-Reviewer-Id` header and no session
- **Steps:**
  1. Send `POST /api/v1/flight-requests/{id}/approve`
- **Expected result:** BLOCKED: `docs/03-api-contract.md` says both `400` (Reviewer section) and `401` (Error semantics) for a missing `X-Reviewer-Id`

## API-FR-013: Reject with a note moves UNDER_REVIEW to REJECTED

- **ID:** API-FR-013
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Under review request
- **Steps:**
  1. Using Reviewer call, send `POST /api/v1/flight-requests/{id}/reject` with a non-empty `note`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `state` in the `GET` response is `REJECTED`

## API-FR-014: A reviewer rejection populates the rejection reason

- **ID:** API-FR-014
- **Doc ref:** `docs/02-state-machine.md` States; `docs/01-data-model.md` FlightRequest
- **Preconditions:**
  - Under review request
- **Steps:**
  1. Using Reviewer call, send `POST /api/v1/flight-requests/{id}/reject` with a non-empty `note`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `rejection_reason` in the `GET` response is populated

## API-FR-015: A reviewer rejection leaves failing_gate empty

- **ID:** API-FR-015
- **Doc ref:** `docs/01-data-model.md` FlightRequest
- **Preconditions:**
  - Under review request
- **Steps:**
  1. Using Reviewer call, send `POST /api/v1/flight-requests/{id}/reject` with a non-empty `note`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `failing_gate` in the `GET` response is not populated

## API-FR-016: Reject without a note has a defined status

- **ID:** API-FR-016
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle; `docs/03-api-contract.md` Reviewer
- **Preconditions:**
  - Under review request
- **Steps:**
  1. Using Reviewer call, send `POST /api/v1/flight-requests/{id}/reject` with no `note`
- **Expected result:** BLOCKED: `note` is required, but no doc names the status for a missing one (`docs/03-api-contract.md` Reviewer)

## API-FR-017: Reject without X-Reviewer-Id has a defined status

- **ID:** API-FR-017
- **Doc ref:** `docs/03-api-contract.md` Reviewer; `docs/03-api-contract.md` Error semantics
- **Preconditions:**
  - Under review request
  - The caller has no `X-Reviewer-Id` header and no session
- **Steps:**
  1. Send `POST /api/v1/flight-requests/{id}/reject` with a non-empty `note`
- **Expected result:** BLOCKED: `docs/03-api-contract.md` says both `400` (Reviewer section) and `401` (Error semantics) for a missing `X-Reviewer-Id`

## API-FR-018: Cancel moves DRAFT to CANCELLED

- **ID:** API-FR-018
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Passing draft
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/cancel`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `state` in the `GET` response is `CANCELLED`

## API-FR-019: Cancel moves a seeded SUBMITTED request to CANCELLED

- **ID:** API-FR-019
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Submitted request
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/cancel`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `state` in the `GET` response is `CANCELLED`

## API-FR-020: Cancel moves UNDER_REVIEW to CANCELLED

- **ID:** API-FR-020
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Under review request
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/cancel`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `state` in the `GET` response is `CANCELLED`

## API-FR-021: Cancel moves APPROVED to CANCELLED outside the deadline

- **ID:** API-FR-021
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle; `docs/06-business-rules.md` §5
- **Preconditions:**
  - Approved request
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/cancel`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `state` in the `GET` response is `CANCELLED`

## API-FR-022: Cancel of APPROVED inside the deadline returns 409

- **ID:** API-FR-022
- **Doc ref:** `docs/02-state-machine.md` Rules that affect the state machine; `docs/06-business-rules.md` §5
- **Preconditions:**
  - Approved request
  - The current time is 1 hour 59 minutes before `window_start`, set by a controlled clock or seeded times
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/cancel`
- **Expected result:** The response status is `409`

## API-FR-023: Cancel by another operator returns 403

- **ID:** API-FR-023
- **Doc ref:** `docs/03-api-contract.md` Authentication & authorisation
- **Preconditions:**
  - Under review request
  - Operator B is logged in and does not own the request
- **Steps:**
  1. As operator B, send `POST /api/v1/flight-requests/{id}/cancel`
- **Expected result:** The response status is `403`

## API-FR-024: Complete moves APPROVED to COMPLETED

- **ID:** API-FR-024
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle; `docs/03-api-contract.md` Flight requests
- **Preconditions:**
  - Approved request
- **Steps:**
  1. Call the maintenance completion endpoint
- **Expected result:** BLOCKED: `docs/02-state-machine.md` requires a maintenance endpoint, but `docs/03-api-contract.md` lists no path or permissions

## API-FR-025: APPROVED is not completed by elapsed time

- **ID:** API-FR-025
- **Doc ref:** `docs/02-state-machine.md` States
- **Preconditions:**
  - Approved request
  - The current time is after `window_end`, set by a controlled clock or seeded times
- **Steps:**
  1. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `state` in the `GET` response is `APPROVED`

## DB-FR-001: Approve writes a ReviewAction row

- **ID:** DB-FR-001
- **Doc ref:** `docs/03-api-contract.md` Reviewer; `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Under review request
- **Steps:**
  1. Using Reviewer call, send `POST /api/v1/flight-requests/{id}/approve`
  2. Read the `ReviewAction` rows for this request
- **Expected result:** One row has `action` `APPROVE`

## DB-FR-002: Reject writes a ReviewAction row

- **ID:** DB-FR-002
- **Doc ref:** `docs/03-api-contract.md` Reviewer
- **Preconditions:**
  - Under review request
- **Steps:**
  1. Using Reviewer call, send `POST /api/v1/flight-requests/{id}/reject` with a non-empty `note`
  2. Read the `ReviewAction` rows for this request
- **Expected result:** One row has `action` `REJECT`

## DB-FR-003: Reject stores the note

- **ID:** DB-FR-003
- **Doc ref:** `docs/01-data-model.md` ReviewAction
- **Preconditions:**
  - Under review request
- **Steps:**
  1. Using Reviewer call, send `POST /api/v1/flight-requests/{id}/reject` with `note` `Test note`
  2. Read the `ReviewAction` rows for this request
- **Expected result:** The `note` of the `REJECT` row is `Test note`

## DB-FR-004: Submit writes an AuditLog row for UNDER_REVIEW

- **ID:** DB-FR-004
- **Doc ref:** `docs/01-data-model.md` AuditLog
- **Preconditions:**
  - Passing draft
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/submit`
  2. Read the `AuditLog` rows where `entity_id` is this request
- **Expected result:** A row has `to_state` `UNDER_REVIEW`

## DB-FR-005: Approve writes an AuditLog row for APPROVED

- **ID:** DB-FR-005
- **Doc ref:** `docs/01-data-model.md` AuditLog
- **Preconditions:**
  - Under review request
- **Steps:**
  1. Using Reviewer call, send `POST /api/v1/flight-requests/{id}/approve`
  2. Read the `AuditLog` rows where `entity_id` is this request
- **Expected result:** A row has `to_state` `APPROVED`

## DB-FR-006: Reject writes an AuditLog row for REJECTED

- **ID:** DB-FR-006
- **Doc ref:** `docs/01-data-model.md` AuditLog
- **Preconditions:**
  - Under review request
- **Steps:**
  1. Using Reviewer call, send `POST /api/v1/flight-requests/{id}/reject` with a non-empty `note`
  2. Read the `AuditLog` rows where `entity_id` is this request
- **Expected result:** A row has `to_state` `REJECTED`

## DB-FR-007: Cancel writes an AuditLog row for CANCELLED

- **ID:** DB-FR-007
- **Doc ref:** `docs/01-data-model.md` AuditLog
- **Preconditions:**
  - Passing draft
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/cancel`
  2. Read the `AuditLog` rows where `entity_id` is this request
- **Expected result:** A row has `to_state` `CANCELLED`

## DB-FR-008: Submit records its audit steps

- **ID:** DB-FR-008
- **Doc ref:** `docs/01-data-model.md` AuditLog; `docs/02-state-machine.md` States
- **Preconditions:**
  - Passing draft
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/submit`
  2. Read the `AuditLog` rows where `entity_id` is this request
- **Expected result:** BLOCKED: the docs don't say whether the transient `SUBMITTED` step gets its own row, so the `from_state` values are undefined (`docs/01-data-model.md` AuditLog)

## DB-FR-009: Each state change writes a defined number of rows

- **ID:** DB-FR-009
- **Doc ref:** `docs/02-state-machine.md` Implementation note
- **Preconditions:**
  - Under review request
- **Steps:**
  1. Using Reviewer call, send `POST /api/v1/flight-requests/{id}/approve`
  2. Read the `AuditLog` rows where `entity_id` is this request
- **Expected result:** BLOCKED: the docs describe both an application write and a database trigger, and don't say whether one or two rows result (`docs/02-state-machine.md` Implementation note)

## DB-FR-010: The audit row names the actor

- **ID:** DB-FR-010
- **Doc ref:** `docs/01-data-model.md` AuditLog
- **Preconditions:**
  - Passing draft
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/cancel`
  2. Read the `AuditLog` rows where `entity_id` is this request
- **Expected result:** BLOCKED: the value `actor` holds for an operator action is undefined (`docs/01-data-model.md` AuditLog)
