# Test plan: FlightRequest lifecycle

**Based on:** `docs/02-state-machine.md` only. Sources below are its sections. Other docs and the code were not read.

## Scope

**In scope:**

- The seven states and legal transitions
- `409` for every illegal `(from, action)` pair
- The automatic outcome of submit, and terminal states
- The 2-hour deadline for cancelling `APPROVED`
- `complete` as the only route to `COMPLETED`
- Which states the aircraft overlap check counts
- State-change audit logging

**Out of scope:** gate logic and thresholds (only their effect on state is tested), portal UI, data model, performance and security, because this source doesn't define them.

## Risks

| Risk | Severity | How testing addresses it | Source |
|---|---|---|---|
| An illegal transition succeeds, so a `REJECTED` request gets approved and an unauthorised flight appears authorised | High | Try every illegal pair; expect `409` and unchanged state | §Request Lifecycle |
| A request leaves a terminal state, reviving a cancelled, rejected or completed request | High | Try all actions from all three terminal states | §States |
| A failed gate still reaches `UNDER_REVIEW`, or submit leaves a request in `SUBMITTED` | High | Submit passing and failing requests; check the state and, on failure, `failing_gate` and `rejection_reason` | §Request Lifecycle, §States |
| `APPROVED` is cancelled after the deadline, or refused before it | High | Test either side of 2 hours before `window_start` | §Rules |
| Overlap counts the wrong states, causing double-booked aircraft or false rejections | High | Submit against the same aircraft's request in each counted and ignored state | §Rules |
| `COMPLETED` is inferred from elapsed time | Medium | Let the flight's time pass without calling `complete`; state stays `APPROVED` | §States |
| A non-reviewer approves or rejects, or a reject has no `note` | Medium | Attempt both; confirm no state change | §Request Lifecycle |

## Strategy

| Area | Approach | Priority | Why |
|---|---|---|---|
| Transition matrix: 7 legal and 23 illegal pairs (5 actions, 6 restable states) | Automated | High | Fixed, repetitive rules worth rerunning on every change |
| Submit outcome and rejection fields | Automated | High | Stable, clear pass and fail outcomes |
| Cancellation deadline | Automated | High | Precise time boundaries are error-prone by hand |
| Overlap, including validate passing then submit failing | Both | High | Automate state combinations; explore interleaved sequences manually |
| Reviewer actions, `ReviewAction` row, required `note` | Automated | Medium | Simple, repeatable checks |
| Cancel from `SUBMITTED`, concurrent actions on one request | Manual | Medium | Narrow timing window, hard to trigger reliably |
| Audit entry for each state change | Both | Medium | Automate presence; review content manually |

## Readiness criteria

**Entry (ready to start testing):**

- Requests can be set up in each restable state
- The maintenance completion endpoint and reviewer identity are usable
- `window_start` can be set relative to the current time
- Each open question below has an owner

**Exit (testing finished, ready to release):**

- All 30 action and restable-state pairs were run with the expected result
- Every illegal pair returned `409` and left the state unchanged
- Deadline checks passed on both sides of the boundary
- All High-priority areas tested, with no open critical defects
- Each open question is answered, or its blocked tests are recorded as an accepted risk

## Open questions

| Question or contradiction | What it blocks | Source |
|---|---|---|
| `SUBMITTED` can be cancelled, but gates run synchronously and callers never see it at rest. Is this cancel reachable? | Cancel-from-`SUBMITTED` test | §Request Lifecycle |
| `failing_gate` is populated for every `REJECTED` request. What does it hold after a reviewer rejects? | Reviewer rejection expected fields | §States |
| Is exactly 2 hours before `window_start` still allowed? | Exact boundary test | §Rules |
| `validate` isn't in the transition table, yet unlisted pairs return `409`. Is it a state action? | Validate tests | §Rules, §Request Lifecycle |
| Does overlap count `SUBMITTED`, and which gate is named when overlap fails? | Concurrent-submit and overlap results | §Rules |
| What does a missing `X-Reviewer-Id` or `note` return, and is it checked before state legality? | Permission and validation results | §Request Lifecycle |
| The diagram's explanation omits `APPROVED` from the states that can cancel; the table and deadline rule include it. Can the text be corrected? | Nothing if the table stands | §Request Lifecycle |
