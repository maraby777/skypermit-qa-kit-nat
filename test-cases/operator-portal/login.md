# Operator login

## Shared setup

- **Operator A:** an `ACTIVE` operator registered through `POST /api/v1/operators`, whose email and password the tester knows. Use a separate client for registration, because registering also signs that client in
- **Operator B:** a second `ACTIVE` operator, registered the same way, who owns one pilot and one `DRAFT` request
- **Logged-out client:** an API client with no session cookie and no `X-Reviewer-Id` header
- **Logged-in client:** a logged-out client that has logged in as operator A through `POST /api/v1/auth/login`, and sends the returned session cookie on later calls
- **Logged-out browser:** a browser with no session for the portal
- **Logged-in browser:** a browser that has logged in as operator A through `/login`

## API-PO-001: A valid login sets a session cookie

- **ID:** API-PO-001
- **Doc ref:** `docs/03-api-contract.md` Authentication & authorisation
- **Preconditions:**
  - Logged-out client
  - Operator A
- **Steps:**
  1. Send `POST /api/v1/auth/login` with operator A's email and password
- **Expected result:** The response has a `Set-Cookie` header that sets the session cookie

## API-PO-002: Status code of a valid login

- **ID:** API-PO-002
- **Doc ref:** `docs/03-api-contract.md` Authentication & authorisation
- **Preconditions:**
  - Logged-out client
  - Operator A
- **Steps:**
  1. Send `POST /api/v1/auth/login` with operator A's email and password
- **Expected result:** BLOCKED: the success status of `POST /auth/login` is not stated (`03` Authentication & authorisation)

## API-PO-003: After login, /auth/me returns the logged-in operator

- **ID:** API-PO-003
- **Doc ref:** `docs/03-api-contract.md` Authentication & authorisation
- **Preconditions:**
  - Logged-in client
- **Steps:**
  1. Send `GET /api/v1/auth/me`
- **Expected result:** `email` in the response is operator A's email

## API-PO-004: /auth/me without a session returns 401

- **ID:** API-PO-004
- **Doc ref:** `docs/03-api-contract.md` Authentication & authorisation
- **Preconditions:**
  - Logged-out client
- **Steps:**
  1. Send `GET /api/v1/auth/me`
- **Expected result:** The response status is `401`

## API-PO-005: /auth/me with only a reviewer header

- **ID:** API-PO-005
- **Doc ref:** `docs/03-api-contract.md` Authentication & authorisation; `docs/03-api-contract.md` Error semantics
- **Preconditions:**
  - Logged-out client
  - The request carries `X-Reviewer-Id: reviewer-1`
- **Steps:**
  1. Send `GET /api/v1/auth/me`
- **Expected result:** BLOCKED: `/auth/me` says `401` when not logged in, but the `401` definition excludes callers with `X-Reviewer-Id` (`03` Authentication & authorisation, Error semantics)

## API-PO-006: Status code for a wrong password

- **ID:** API-PO-006
- **Doc ref:** `docs/03-api-contract.md` Authentication & authorisation
- **Preconditions:**
  - Logged-out client
  - Operator A
- **Steps:**
  1. Send `POST /api/v1/auth/login` with operator A's email and a different password
- **Expected result:** BLOCKED: the status for wrong credentials is not stated (`03` Authentication & authorisation)

## API-PO-007: A wrong password creates no session

- **ID:** API-PO-007
- **Doc ref:** `docs/03-api-contract.md` Authentication & authorisation
- **Preconditions:**
  - Logged-out client
  - Operator A
- **Steps:**
  1. Send `POST /api/v1/auth/login` with operator A's email and a different password
  2. Send `GET /api/v1/auth/me`
- **Expected result:** BLOCKED: the docs state that login sets a cookie, but not that a failed login sets none (`03` Authentication & authorisation)

## API-PO-008: Status code for an unknown email

- **ID:** API-PO-008
- **Doc ref:** `docs/03-api-contract.md` Authentication & authorisation
- **Preconditions:**
  - Logged-out client
  - No operator is registered with the email used
- **Steps:**
  1. Send `POST /api/v1/auth/login` with that email and any password
- **Expected result:** BLOCKED: the status for wrong credentials is not stated (`03` Authentication & authorisation)

## API-PO-009: An unknown email creates no session

- **ID:** API-PO-009
- **Doc ref:** `docs/03-api-contract.md` Authentication & authorisation
- **Preconditions:**
  - Logged-out client
  - No operator is registered with the email used
- **Steps:**
  1. Send `POST /api/v1/auth/login` with that email and any password
  2. Send `GET /api/v1/auth/me`
- **Expected result:** BLOCKED: the docs state that login sets a cookie, but not that a failed login sets none (`03` Authentication & authorisation)

## API-PO-010: A login body that isn't valid JSON returns 400

- **ID:** API-PO-010
- **Doc ref:** `docs/03-api-contract.md` Error semantics
- **Preconditions:**
  - Logged-out client
- **Steps:**
  1. Send `POST /api/v1/auth/login` with the body `{not json`
- **Expected result:** The response status is `400`

## API-PO-011: Login without a password

- **ID:** API-PO-011
- **Doc ref:** `docs/03-api-contract.md` Authentication & authorisation; `docs/03-api-contract.md` Error semantics
- **Preconditions:**
  - Logged-out client
  - Operator A
- **Steps:**
  1. Send `POST /api/v1/auth/login` with operator A's email and no `password` field
- **Expected result:** BLOCKED: not stated whether a missing field counts as a malformed body (`400`) or failed credentials (`03` Error semantics)

## API-PO-012: Login without an email

- **ID:** API-PO-012
- **Doc ref:** `docs/03-api-contract.md` Authentication & authorisation; `docs/03-api-contract.md` Error semantics
- **Preconditions:**
  - Logged-out client
- **Steps:**
  1. Send `POST /api/v1/auth/login` with a password and no `email` field
- **Expected result:** BLOCKED: not stated whether a missing field counts as a malformed body (`400`) or failed credentials (`03` Error semantics)

## API-PO-013: Login by a suspended operator

- **ID:** API-PO-013
- **Doc ref:** `docs/05-open-questions.md` §1
- **Preconditions:**
  - Logged-out client
  - Operator A, with `status` `SUSPENDED`
- **Steps:**
  1. Send `POST /api/v1/auth/login` with operator A's email and password
- **Expected result:** BLOCKED: the suspended precondition lists create, submit and approve, not login, and its response is open (`05` §1)

## API-PO-014: After logout, /auth/me returns 401

- **ID:** API-PO-014
- **Doc ref:** `docs/03-api-contract.md` Authentication & authorisation
- **Preconditions:**
  - Logged-in client
- **Steps:**
  1. Send `POST /api/v1/auth/logout`
  2. Send `GET /api/v1/auth/me`
- **Expected result:** The status of the `GET /auth/me` response is `401`

## API-PO-015: Status code of a logout

- **ID:** API-PO-015
- **Doc ref:** `docs/03-api-contract.md` Authentication & authorisation
- **Preconditions:**
  - Logged-in client
- **Steps:**
  1. Send `POST /api/v1/auth/logout`
- **Expected result:** BLOCKED: the success status of `POST /auth/logout` is not stated (`03` Authentication & authorisation)

## API-PO-016: Logout without a session

- **ID:** API-PO-016
- **Doc ref:** `docs/03-api-contract.md` Authentication & authorisation
- **Preconditions:**
  - Logged-out client
- **Steps:**
  1. Send `POST /api/v1/auth/logout`
- **Expected result:** BLOCKED: logout without a session is not defined (`03` Authentication & authorisation)

## API-PO-017: An operator-scoped endpoint without a session returns 401

- **ID:** API-PO-017
- **Doc ref:** `docs/03-api-contract.md` Authentication & authorisation
- **Preconditions:**
  - Logged-out client
- **Steps:**
  1. Send `GET /api/v1/pilots`
- **Expected result:** The response status is `401`

## API-PO-018: After login, the pilot list includes the operator's own pilot

- **ID:** API-PO-018
- **Doc ref:** `docs/03-api-contract.md` Registry
- **Preconditions:**
  - Logged-in client
  - Operator A owns a pilot
- **Steps:**
  1. Send `GET /api/v1/pilots`
- **Expected result:** Operator A's pilot is in the list

## API-PO-019: After login, the pilot list leaves out another operator's pilot

- **ID:** API-PO-019
- **Doc ref:** `docs/03-api-contract.md` Registry
- **Preconditions:**
  - Logged-in client
  - Operator B
- **Steps:**
  1. Send `GET /api/v1/pilots`
- **Expected result:** Operator B's pilot is not in the list

## API-PO-020: Reading another operator's pilot returns 403

- **ID:** API-PO-020
- **Doc ref:** `docs/03-api-contract.md` Authentication & authorisation
- **Preconditions:**
  - Logged-in client
  - Operator B
- **Steps:**
  1. Send `GET /api/v1/pilots/{id}` with the ID of operator B's pilot
- **Expected result:** The response status is `403`

## API-PO-021: An operator_id query can't widen the request list

- **ID:** API-PO-021
- **Doc ref:** `docs/03-api-contract.md` Authentication & authorisation
- **Preconditions:**
  - Logged-in client
  - Operator B
- **Steps:**
  1. Send `GET /api/v1/flight-requests?operator_id={operator B's id}`
- **Expected result:** Operator B's request is not in the list

## UI-PO-001: Logged out, the login link is shown

- **ID:** UI-PO-001
- **Doc ref:** `docs/04-frontend-spec.md` Two contracts to hold exactly
- **Preconditions:**
  - Logged-out browser
- **Steps:**
  1. Open the operator portal
- **Expected result:** `operator-login-link` is visible

## UI-PO-002: Logged out, the register link is shown

- **ID:** UI-PO-002
- **Doc ref:** `docs/04-frontend-spec.md` Two contracts to hold exactly
- **Preconditions:**
  - Logged-out browser
- **Steps:**
  1. Open the operator portal
- **Expected result:** `operator-register-link` is visible

## UI-PO-003: Logged out, the session info is not shown

- **ID:** UI-PO-003
- **Doc ref:** `docs/04-frontend-spec.md` Two contracts to hold exactly
- **Preconditions:**
  - Logged-out browser
- **Steps:**
  1. Open the operator portal
- **Expected result:** `operator-session-info` is not visible

## UI-PO-004: Logged out, the logout button is not shown

- **ID:** UI-PO-004
- **Doc ref:** `docs/04-frontend-spec.md` Two contracts to hold exactly
- **Preconditions:**
  - Logged-out browser
- **Steps:**
  1. Open the operator portal
- **Expected result:** `operator-logout-button` is not visible

## UI-PO-005: Logged in, the session info is shown

- **ID:** UI-PO-005
- **Doc ref:** `docs/04-frontend-spec.md` Two contracts to hold exactly
- **Preconditions:**
  - Logged-in browser
- **Steps:**
  1. Open the operator portal
- **Expected result:** `operator-session-info` is visible

## UI-PO-006: Logged in, the logout button is shown

- **ID:** UI-PO-006
- **Doc ref:** `docs/04-frontend-spec.md` Two contracts to hold exactly
- **Preconditions:**
  - Logged-in browser
- **Steps:**
  1. Open the operator portal
- **Expected result:** `operator-logout-button` is visible

## UI-PO-007: Logged in, the login link is not shown

- **ID:** UI-PO-007
- **Doc ref:** `docs/04-frontend-spec.md` Two contracts to hold exactly
- **Preconditions:**
  - Logged-in browser
- **Steps:**
  1. Open the operator portal
- **Expected result:** `operator-login-link` is not visible

## UI-PO-008: Logged in, the register link is not shown

- **ID:** UI-PO-008
- **Doc ref:** `docs/04-frontend-spec.md` Two contracts to hold exactly
- **Preconditions:**
  - Logged-in browser
- **Steps:**
  1. Open the operator portal
- **Expected result:** `operator-register-link` is not visible

## UI-PO-009: Logged out, the operator ID input doesn't exist

- **ID:** UI-PO-009
- **Doc ref:** `docs/04-frontend-spec.md` Two contracts to hold exactly
- **Preconditions:**
  - Logged-out browser
- **Steps:**
  1. Open the operator portal
- **Expected result:** No element has `data-testid="operator-id-input"`

## UI-PO-010: Logged in, the operator ID input doesn't exist

- **ID:** UI-PO-010
- **Doc ref:** `docs/04-frontend-spec.md` Two contracts to hold exactly
- **Preconditions:**
  - Logged-in browser
- **Steps:**
  1. Open the operator portal
- **Expected result:** No element has `data-testid="operator-id-input"`

## UI-PO-011: Interactive elements on /login carry a data-testid

- **ID:** UI-PO-011
- **Doc ref:** `docs/04-frontend-spec.md` Two contracts to hold exactly
- **Preconditions:**
  - Logged-out browser
- **Steps:**
  1. Open `/login`
- **Expected result:** Every interactive element on the page has a `data-testid` attribute

## E2E-PO-001: Logging in on /login shows the session info

- **ID:** E2E-PO-001
- **Doc ref:** `docs/04-frontend-spec.md` Operator portal; `docs/04-frontend-spec.md` Two contracts to hold exactly
- **Preconditions:**
  - Logged-out browser
  - Operator A
- **Steps:**
  1. Open `/login`
  2. Enter operator A's email and password
  3. Submit the form
- **Expected result:** `operator-session-info` is visible

## E2E-PO-002: The session survives reopening the portal without logging in again

- **ID:** E2E-PO-002
- **Doc ref:** `docs/04-frontend-spec.md` Frontend Scope
- **Preconditions:**
  - Logged-in browser
- **Steps:**
  1. Close the portal tab
  2. Open the operator portal in a new tab of the same browser
- **Expected result:** `operator-session-info` is visible

## E2E-PO-003: Where a successful login lands

- **ID:** E2E-PO-003
- **Doc ref:** `docs/04-frontend-spec.md` Operator portal
- **Preconditions:**
  - Logged-out browser
  - Operator A
- **Steps:**
  1. Open `/login`
  2. Enter operator A's email and password
  3. Submit the form
- **Expected result:** BLOCKED: the page shown after login is not stated (`04` Operator portal)

## E2E-PO-004: Message for a wrong password on /login

- **ID:** E2E-PO-004
- **Doc ref:** `docs/04-frontend-spec.md` Operator portal
- **Preconditions:**
  - Logged-out browser
  - Operator A
- **Steps:**
  1. Open `/login`
  2. Enter operator A's email and a different password
  3. Submit the form
- **Expected result:** BLOCKED: the login page's error behaviour is not stated (`04` Operator portal)

## E2E-PO-005: A logged-out visitor opens a page that requires login

- **ID:** E2E-PO-005
- **Doc ref:** `docs/04-frontend-spec.md` Operator portal
- **Preconditions:**
  - Logged-out browser
- **Steps:**
  1. Open the operator portal's "My requests" list
- **Expected result:** BLOCKED: the portal "requires login", but what a logged-out visitor sees is not stated (`04` Operator portal)

## E2E-PO-006: The login link opens the login page

- **ID:** E2E-PO-006
- **Doc ref:** `docs/04-frontend-spec.md` Two contracts to hold exactly
- **Preconditions:**
  - Logged-out browser
- **Steps:**
  1. Open the operator portal
  2. Click `operator-login-link`
- **Expected result:** BLOCKED: the docs name the link but don't state where it goes (`04` Two contracts to hold exactly)

## E2E-PO-007: The logout button logs the operator out

- **ID:** E2E-PO-007
- **Doc ref:** `docs/04-frontend-spec.md` Two contracts to hold exactly
- **Preconditions:**
  - Logged-in browser
- **Steps:**
  1. Open the operator portal
  2. Click `operator-logout-button`
- **Expected result:** BLOCKED: the docs name the button but don't state what it does (`04` Two contracts to hold exactly)
