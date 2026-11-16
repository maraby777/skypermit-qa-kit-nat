---
name: atomic-test-cases
description: "Generate low-level, atomic test cases in Markdown (one case = one check = one expected result) from SkyPermit docs, each with an ID like E2E-PO-006, doc ref, preconditions, steps, and expected result, saved under test-cases/{module}/. Use this whenever the user asks for test cases, test scenarios, negative or boundary cases, or checks for a feature, endpoint, state transition, business rule, or screen, even if they don't say 'atomic'. Not for one-page test plans or automated test code."
model: sonnet
---

# Atomic test cases

Turn documented behaviour into test cases a tester can run and mark pass or fail without judgement calls. A failed case should point at exactly one thing that is wrong, which is why each case holds a single check.

## 1. Read the docs

Read the docs that define the requested behaviour, following their cross-references. Expected results come from `docs/` in the SkyPermit repo, not from `app/`, `lib/`, or `tests/`, because code would only confirm what it already does. Follow the rules in the project's `CLAUDE.md` for which doc wins a conflict and for keeping SkyPermit read-only.

If the request is too broad to review in one sitting, such as "all test cases for the docs", propose how to split it by module and ask which part to start with.

## 2. Split behaviour into atomic checks

One case checks one observable outcome. Use this test: could the case partly pass? If so, split it.

- **"And" in an expected result usually means two cases.** "Returns `409` and the state is unchanged" becomes one case for the status and one for the state.
- **Each boundary value gets its own case:** below, exactly at, and above the limit.
- **Each input class or state gets its own case,** such as one per illegal source state.
- **A field-level check is one case.** Asserting several fields of one response means several cases, unless the doc defines them as one value, such as a whole enum.
- **A case that checks a `rule_reference` names its gate in the title, in capitals** (`PILOT`, `AIRCRAFT`, `ZONE`, `TIME_WINDOW`). Some citations belong to more than one rule, such as `ZC-2026.1 §2` for both the `AIRCRAFT` weight band and the `ZONE` altitude ceiling, so the value alone doesn't say which rule the case covers.

Include the negative, boundary, permission, and side-effect checks the docs support, not only the normal path. Don't add checks for behaviour the docs don't define.

**Stay on the requested feature.** Test its own behaviour, and sample any shared rules it passes through, because exhaustive rule coverage repeated per feature creates overlapping cases. For a button that shows gate results, that means one passing check and one failing check per gate, not a case for every gate rule. List what you left out and where it belongs in your report, for example rule-by-rule gate cases under `flight-requests`.

## 3. Handle undefined behaviour

Never guess an expected result, because a guess becomes a wrong test that looks authoritative.

- **Listed as open in `05-open-questions.md`, or otherwise undefined:** write the case if the check is worth keeping, and set its expected result to `BLOCKED: <what is undefined> (<source>)`.
- **Docs are ambiguous or contradict each other, with no rule saying which wins:** do the same, and flag it in your report so the user can decide.
- **Inferred from the docs, but not stated by them:** treat it as undefined and mark it `BLOCKED`, even if the inference seems safe. For example, "the request is blocked" doesn't state that nothing is written, so checks that no data changed stay blocked until a doc says so.
- **Stated by the docs, but a reader could question the wording:** keep the case runnable, and ask for confirmation in your report. For example, "up to 2 hours" with only "closer than that" rejected states that exactly 2 hours is allowed.

## 4. Assign IDs

Format: `TYPE-MODULE-NNN`, for example `E2E-PO-006`.

| Type | Use for |
|---|---|
| `E2E` | A check reached through a full user journey in a portal |
| `API` | One endpoint call and its response |
| `UI` | One screen or element behaviour |
| `DB` | A stored record, such as an `AuditLog` or `ReviewAction` row |
| `AT` | A case the user asks to mark for later automation. It is still a written case: don't write test code |

| Module | Folder | Covers |
|---|---|---|
| `PO` | `operator-portal` | Operator portal pages and forms |
| `RQ` | `reviewer-queue` | Reviewer queue pages and actions |
| `FR` | `flight-requests` | Flight request lifecycle and gate rules |
| `RG` | `registry` | Pilot, aircraft, and operator records |

Choose by where the check is observed: a `409` from the cancel endpoint is `API-FR`, while the message an operator sees about it is `UI-PO`. If nothing fits, ask the user before adding a module.

Number by the full `TYPE-MODULE` prefix. Search all of `test-cases/` for the highest existing number with that prefix and continue from it, so `E2E-PO-006` is followed by `E2E-PO-007` while `UI-PO-` keeps its own sequence. Use three digits. Don't reuse or renumber existing IDs, because other documents may refer to them.

## 5. Write the cases

Save to `test-cases/<module-folder>/<feature>.md`, with one file per feature, for example `test-cases/flight-requests/cancellation.md`. If the feature's file exists, add to it without changing existing cases, and reuse its setups. A file starts with `# <Feature>`, then a `## Shared setup` section, then one section per case. Shared setup keeps long files reviewable, because most atomic cases differ in only one or two values:

```markdown
# Cancellation

## Shared setup

- **Approved request:** the owning operator is logged in, and their request is `APPROVED`

## API-FR-012: Cancel is refused one minute inside the deadline

- **ID:** API-FR-012
- **Doc ref:** `docs/06-business-rules.md` §5
- **Preconditions:**
  - Approved request
  - Its `window_start` is 1 hour 59 minutes from now
- **Steps:**
  1. As the owning operator, send `POST /flight-requests/{id}/cancel`
- **Expected result:** The response status is `409`
```

- **Heading:** the ID plus a short title naming the condition and outcome, so the file can be scanned.
- **Doc ref:** the doc and section that define the expected result. If `07` corrects `06`, or another doc governs, cite the governing one.
- **Shared setup:** named setups used by two or more cases in the file. Skip the section if no setup repeats.
- **Preconditions:** name the shared setup, then add only what differs for this case. Setup belongs here, not in the steps. Give a concrete value where the doc fixes it or the check depends on it, such as a boundary ("1 m above the zone's `ceiling_metres`", "`window_start` is 1 hour 59 minutes from now"). Otherwise describe the condition the data must meet, with its doc ref ("a pilot whose `rating` covers the zone's `zone_class`"), rather than picking a specific zone code, weight, email, or record ID.
- **Steps:** only the actions that trigger the check, numbered. Use endpoints and `data-testid` values where the docs define them. Don't invent selectors, routes, or test data the check depends on.
- **Expected result:** one observable outcome, stated exactly as the docs define it, so anyone gets the same pass or fail.

See `examples/lifecycle-example.md` for how runnable, blocked, and database cases look in practice. Follow its format and level of detail, but take IDs from `test-cases/` and expected results from the docs, not from the example. Its `0XX` IDs and `<reviewer-id>` are placeholders: never copy them into a case.

## 6. Check and report

Before finishing, reread the cases: each has all five fields, one expected result, a doc ref that supports it, and a unique ID.

Tell the user the file paths, how many cases you wrote, the ID ranges, which cases are blocked and by what, and any doc conflicts that need a decision.
