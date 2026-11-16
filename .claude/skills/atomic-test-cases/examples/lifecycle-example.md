# FlightRequest lifecycle: example

## Shared setup

- **Passing draft:** Operator A is `ACTIVE` with an `authorisation_level` at or above the zone's `required_authorisation_level`, is logged in, and owns a `DRAFT` request that passes all four gates:
  - pilot `rating` covers the zone's `zone_class`, and the certification is current at `window_start` (certified less than 18 months before it)
  - aircraft weight band is in the zone's `permitted_bands`, with no other `APPROVED` or `UNDER_REVIEW` request for the same aircraft overlapping this window
  - zone is an `active` zone from the catalogue, and `requested_altitude_metres` is at or below the zone's `ceiling_metres`
  - `window_start` is between 6 hours and 60 days from now, the window lasts 15–240 minutes, and no part of it falls inside the zone's curfew
- **Failing draft:** Passing draft, with `requested_altitude_metres` 1 m above the zone's `ceiling_metres`
- **Under review request:** Passing draft, submitted by operator A
- **Rejected request:** Failing draft, submitted by operator A
- **Reviewer call:** Send the `X-Reviewer-Id` header set to a reviewer identity label (`docs/03-api-contract.md` Authentication & authorisation)

## API-FR-0XX: Submit of a passing draft moves it to UNDER_REVIEW

- **ID:** API-FR-0XX
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Passing draft
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/submit`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `state` in the `GET` response is `UNDER_REVIEW`

## API-FR-0XX: Submit of a failing draft returns 422

- **ID:** API-FR-0XX
- **Doc ref:** `docs/03-api-contract.md` Error semantics; `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Failing draft
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/submit`
- **Expected result:** The response status is `422`

## API-FR-0XX: Submit of a failing draft moves it to REJECTED

- **ID:** API-FR-0XX
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Failing draft
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/submit`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `state` in the `GET` response is `REJECTED`

## API-FR-0XX: Submit from REJECTED returns 409

- **ID:** API-FR-0XX
- **Doc ref:** `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Rejected request
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/submit`
- **Expected result:** The response status is `409`

## API-FR-0XX: Submit from REJECTED leaves the state unchanged

- **ID:** API-FR-0XX
- **Doc ref:** `docs/02-state-machine.md` States
- **Preconditions:**
  - Rejected request
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/submit`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `state` in the `GET` response is `REJECTED`

## API-FR-0XX: Reject without X-Reviewer-Id has a defined status

- **ID:** API-FR-0XX
- **Doc ref:** `docs/03-api-contract.md` Reviewer; `docs/03-api-contract.md` Error semantics
- **Preconditions:**
  - Under review request
  - The caller has no `X-Reviewer-Id` header and no session
- **Steps:**
  1. Send `POST /api/v1/flight-requests/{id}/reject` with a non-empty `note`
- **Expected result:** BLOCKED: `docs/03-api-contract.md` says both `400` (Reviewer section) and `401` (Error semantics) for a missing `X-Reviewer-Id`

## DB-FR-0XX: Reject writes a ReviewAction row

- **ID:** DB-FR-0XX
- **Doc ref:** `docs/03-api-contract.md` Reviewer
- **Preconditions:**
  - Under review request
- **Steps:**
  1. Using Reviewer call, send `POST /api/v1/flight-requests/{id}/reject` with a non-empty `note`
  2. Read the `ReviewAction` rows for this request
- **Expected result:** One row has `action` `REJECT`

## DB-FR-0XX: The audit row names the actor

- **ID:** DB-FR-0XX
- **Doc ref:** `docs/01-data-model.md` AuditLog
- **Preconditions:**
  - Passing draft
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/cancel`
  2. Read the `AuditLog` rows where `entity_id` is this request
- **Expected result:** BLOCKED: the value `actor` holds for an operator action is undefined (`docs/01-data-model.md` AuditLog)
