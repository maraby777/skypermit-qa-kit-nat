# FlightRequest gate rules

## Shared setup

- **Passing draft:** Operator A is `ACTIVE` at `authorisation_level` `L1`, is logged in, and owns a `DRAFT` request that passes all four gates:
  - pilot `rating` is `R_BASIC`, and `certified_on` is 1 month ago
  - aircraft `mtom_grams` is 500 (band `C0`), with no other `APPROVED` or `UNDER_REVIEW` request
  - `zone_code` is `DNI-OPN-1` (zone class `OPEN`, no curfew), and `requested_altitude_metres` is 100
  - `window_start` is 24 hours from now, and `window_end` is 1 hour later
- **Short lead time draft:** Passing draft, with `window_start` 5 hours 59 minutes from now and `window_end` 1 hour later
- **Short duration draft:** Passing draft, with `window_end` 14 minutes after `window_start`
- **Long duration draft:** Passing draft, with `window_end` 241 minutes after `window_start`

## API-FR-071: Submit 5 h 59 min before window_start fails the TIME_WINDOW gate

- **ID:** API-FR-071
- **Doc ref:** `docs/06-business-rules.md` §1.4 (Minimum lead time); `docs/03-api-contract.md` The `422` body
- **Preconditions:**
  - Short lead time draft
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/submit`
- **Expected result:** `failing_gate` in the `422` response body is `TIME_WINDOW`

## API-FR-072: Submit 5 h 59 min before window_start cites TSD-4 §2.1 for the TIME_WINDOW gate

- **ID:** API-FR-072
- **Doc ref:** `docs/06-business-rules.md` §6 (`TIME_WINDOW`, Lead time too short); `docs/03-api-contract.md` The `422` body
- **Preconditions:**
  - Short lead time draft
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/submit`
- **Expected result:** `rule_reference` in the `422` response body is `TSD-4 §2.1`

## API-FR-073: Submit 6 h 1 min before window_start passes the TIME_WINDOW lead-time rule

- **ID:** API-FR-073
- **Doc ref:** `docs/06-business-rules.md` §1.4 (Minimum lead time: ≥ 6 hours); `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Passing draft, with `window_start` 6 hours 1 minute from now and `window_end` 1 hour later
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/submit`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `state` in the `GET` response is `UNDER_REVIEW`

## API-FR-076: Submit 59 days 23 h 59 min before window_start passes the TIME_WINDOW advance-booking rule

- **ID:** API-FR-076
- **Doc ref:** `docs/06-business-rules.md` §1.4 (Maximum advance booking: ≤ 60 days); `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Passing draft, with `window_start` 59 days 23 hours 59 minutes from now and `window_end` 1 hour later
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/submit`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `state` in the `GET` response is `UNDER_REVIEW`

## API-FR-077: Submit with a 14-minute window fails the TIME_WINDOW gate

- **ID:** API-FR-077
- **Doc ref:** `docs/06-business-rules.md` §1.4 (Duration: 15–240 minutes, inclusive); `docs/01-data-model.md` FlightRequest (`failing_gate`)
- **Preconditions:**
  - Short duration draft
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/submit`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `failing_gate` in the `GET` response is `TIME_WINDOW`

## API-FR-078: Submit with a 14-minute window cites TSD-4 §3 for the TIME_WINDOW gate

- **ID:** API-FR-078
- **Doc ref:** `docs/06-business-rules.md` §6 (`TIME_WINDOW`, Duration out of range); `docs/01-data-model.md` FlightRequest (`rule_reference`)
- **Preconditions:**
  - Short duration draft
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/submit`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `rule_reference` in the `GET` response is `TSD-4 §3`

## API-FR-079: Submit with a 15-minute window passes the TIME_WINDOW duration rule

- **ID:** API-FR-079
- **Doc ref:** `docs/06-business-rules.md` §1.4 (Duration: 15–240 minutes, inclusive at both ends); `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Passing draft, with `window_end` 15 minutes after `window_start`
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/submit`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `state` in the `GET` response is `UNDER_REVIEW`

## API-FR-080: Submit with a 240-minute window passes the TIME_WINDOW duration rule

- **ID:** API-FR-080
- **Doc ref:** `docs/06-business-rules.md` §1.4 (Duration: 15–240 minutes, inclusive at both ends); `docs/02-state-machine.md` Request Lifecycle
- **Preconditions:**
  - Passing draft, with `window_end` 240 minutes after `window_start`
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/submit`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `state` in the `GET` response is `UNDER_REVIEW`

## API-FR-081: Submit with a 241-minute window fails the TIME_WINDOW gate

- **ID:** API-FR-081
- **Doc ref:** `docs/06-business-rules.md` §1.4 (Duration: 15–240 minutes, inclusive); `docs/01-data-model.md` FlightRequest (`failing_gate`)
- **Preconditions:**
  - Long duration draft
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/submit`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `failing_gate` in the `GET` response is `TIME_WINDOW`

## API-FR-082: Submit with a 241-minute window cites TSD-4 §3 for the TIME_WINDOW gate

- **ID:** API-FR-082
- **Doc ref:** `docs/06-business-rules.md` §6 (`TIME_WINDOW`, Duration out of range); `docs/01-data-model.md` FlightRequest (`rule_reference`)
- **Preconditions:**
  - Long duration draft
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/submit`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** `rule_reference` in the `GET` response is `TSD-4 §3`

## API-FR-083: Submit with window_end equal to window_start, TIME_WINDOW gate outcome

- **ID:** API-FR-083
- **Doc ref:** `docs/06-business-rules.md` §1.4 (Duration: "`window_end` strictly after `window_start`"); `docs/01-data-model.md` FlightRequest (`window_end` "must be after `window_start`")
- **Preconditions:**
  - Passing draft, with `window_end` equal to `window_start`
- **Steps:**
  1. As operator A, send `POST /api/v1/flight-requests/{id}/submit`
  2. Send `GET /api/v1/flight-requests/{id}` as operator A
- **Expected result:** BLOCKED: the docs don't say whether `window_end` equal to `window_start` fails the `TIME_WINDOW` gate at submit (`06` §1.4) or is refused earlier as a field constraint on the record (`01` FlightRequest, `400` in `03` Error semantics)
