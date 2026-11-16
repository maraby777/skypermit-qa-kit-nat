# Login

## E2E-PO-005: Registering logs the operator in

- **ID:** E2E-PO-005
- **Doc ref:** `docs/04-frontend-spec.md` Operator portal
- **Preconditions:**
  - No account exists for the email used
- **Steps:**
  1. Open `/register`
  2. Complete and submit the registration form
- **Expected result:** The operator is logged in

## E2E-PO-006: A new operator starts at L1

- **ID:** E2E-PO-006
- **Doc ref:** `docs/04-frontend-spec.md` Operator portal
- **Preconditions:**
  - No account exists for the email used
- **Steps:**
  1. Open `/register`
  2. Complete and submit the registration form
- **Expected result:** The new operator's `authorisation_level` is `L1`

## UI-PO-002: The registration form has no authorisation level field

- **ID:** UI-PO-002
- **Doc ref:** `docs/04-frontend-spec.md` Operator portal
- **Preconditions:**
  - The user is logged out
- **Steps:**
  1. Open `/register`
- **Expected result:** No `authorisation_level` field is shown
