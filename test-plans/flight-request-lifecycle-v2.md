# Test plan: FlightRequest lifecycle

**Based on:** `docs/02-state-machine.md` (all sections). Also checked: `06` §1.4, §5, §6 (which `02` cross-references), `05`, `07`, `03` (reviewer and error sections) and `01` (`FlightRequest`, `ReviewAction`, `AuditLog`). Application code was not read, because docs define expected behaviour here.
**Plan status:** PROVISIONAL. Completion, overlap errors and suspended operators have unresolved requirements.

## Scope

**In scope:** all 35 state and action pairs, submit outcomes, reviewer decisions, the `APPROVED` cancellation deadline, completion, overlap visibility by state, concurrent actions, and `ReviewAction` and `AuditLog` records.

**Out of scope:** each gate's internal rules (one failing case per gate only, as they need their own plan), portal UI (`04` not reviewed), and load testing.

## Top risks

| Risk and consequence | Severity | How to verify | Source |
|---|---|---|---|
| An illegal transition succeeds or leaves side effects, so a dead request is revived or an unreviewed flight looks authorised | High | Full matrix: `409`, with state, `ReviewAction` and `AuditLog` unchanged | `02` §Request Lifecycle |
| `COMPLETED` can't be reached: `02` requires a maintenance endpoint, but `03` lists none | High | Confirm the endpoint exists, then run completion checks | `02` §States, `03` |
| Concurrent actions both succeed (approve vs. cancel), or two submits double-book an aircraft | High | Repeated parallel calls; expected result is PROPOSED | `02` §Rules, `06` §1.4 |
| `APPROVED` is cancelled inside the deadline, or a valid cancel is refused | High | Below, at and above 2 hours before `window_start` | `02` §Rules, `06` §5 |
| Overlap counts the wrong states, double-booking an aircraft or blocking on a dead request | High | Conflicting request in each state; touching windows don't overlap | `02` §Rules, `06` §1.4 |
| Someone other than a reviewer approves or rejects, or another operator cancels | High | Missing header, wrong operator, wrong role | `02` §Request Lifecycle, `03` |
| A state change has no audit row or `ReviewAction`, leaving a gap in the authorisation record | Medium | Check records after each legal transition and failed attempt | `02` §Implementation note, `01` |

## Test strategy

| Area | Key coverage | Method | Priority | Why |
|---|---|---|---|---|
| Transition matrix | Appendix: 8 legal, 27 illegal pairs | Automated | P0 | Finite rules, rerun on every change |
| Submit outcomes | Pass gives `UNDER_REVIEW`; failure gives `422`, `REJECTED` and `failing_gate`; first failing gate is named; `SUBMITTED` never observed | Automated | P0 | Stable, clear results |
| Reviewer decisions | Approve and reject write `ReviewAction`; reject requires `note`; gate fields stay empty after reviewer reject | Automated | P0 | Authorises flights |
| Cancellation deadline | Three boundary points; other cancellable states unaffected inside 2 hours | Automated | P0 | Exact time rule |
| Overlap | `UNDER_REVIEW` and `APPROVED` block; others don't; validate passes, then submit fails after another approval | Automated | P0 | Repeated per state |
| Concurrency | Approve vs. cancel, approve vs. reject, double submit, parallel submits for one aircraft | Both | P0 | Scripts repeat races; exploration finds timings |
| Completion | Only from `APPROVED`; never inferred from elapsed time | Automated | P0, blocked | Endpoint undefined |
| Audit trail | One row per change, correct from and to states; append-only | Automated | P1 | Simple record checks |
| Suspended operator | Create, submit and approve are blocked, without a gate-failure body | Automated | P2, blocked | Response undefined; don't assert a placeholder |

## Testability and dependencies

- **Seeded states:** `SUBMITTED` never rests, so testing it needs direct setup.
- **Controlled time:** the 6-hour lead-time rule (`06` §1.4) stops a request being created close to its window, so deadline tests need seeded times or a controlled clock.
- **Isolated data:** a separate aircraft per test stops overlap checks interfering.

## Entry and exit criteria

**Entry:**

- All five actions are callable in a test environment, or missing ones are marked blocked
- Requests can be seeded in any state with any window
- Reviewer and two operator identities are available

**Exit:**

- All 35 pairs have a recorded result matching the appendix, or are marked blocked by a named open question
- All P0 and P1 areas were run, with no open critical defects
- Blocked P0 checks are unblocked or formally accepted by an authorised owner
- Concurrency runs show no double transitions or double bookings (PROPOSED: agree the repeat count)

## Open questions

| Question or conflict | What it blocks | Owner | Source |
|---|---|---|---|
| What are the completion endpoint's path and permissions? | Completion and the `complete` column | TBD | `02` §States, `03` |
| Is overlap a `422` naming `TIME_WINDOW`, or a `409` scheduling conflict? `02` also names `AIRCRAFT`. | Overlap results | TBD | `02` §Rules, `03`, `06` §1.4, §6 |
| `06` §5 says a late `APPROVED` request may be "handled by reviewer action", but `02` allows none. Which applies? | Late-cancel path | TBD | `02`, `06` §5 |
| Is a missing `X-Reviewer-Id` `400` or `401`? | Reviewer negatives | TBD | `03` |
| Which wins: validation or permission error, or `409`? | Reject without `note` on a closed request | TBD | `02`, `03` |
| Is cancel from `SUBMITTED` reachable, given synchronous gates? | One matrix row | TBD | `02` §Request Lifecycle |
| Is exactly 2 hours before `window_start` allowed? | Boundary result | TBD | `02` §Rules, `06` §5 |
| What status and body apply to a suspended operator? | Suspended checks | TBD | `05` §1 |

## Appendix: transition matrix

| From \ Action | submit | approve | reject | complete | cancel |
|---|---|---|---|---|---|
| `DRAFT` | `UNDER_REVIEW` or `REJECTED` | 409 | 409 | 409 | `CANCELLED` |
| `SUBMITTED` | 409 | 409 | 409 | 409 | `CANCELLED` (open) |
| `UNDER_REVIEW` | 409 | `APPROVED` | `REJECTED` | 409 | `CANCELLED` |
| `APPROVED` | 409 | 409 | 409 | `COMPLETED` (blocked) | `CANCELLED` before the deadline, otherwise 409 |
| `REJECTED` | 409 | 409 | 409 | 409 | 409 |
| `CANCELLED` | 409 | 409 | 409 | 409 | 409 |
| `COMPLETED` | 409 | 409 | 409 | 409 | 409 |

The `complete` column is blocked by the endpoint question.
