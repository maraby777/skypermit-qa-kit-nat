---
name: cover-gaps
description: "Cover SkyPermit business rules (the rule_reference values in 06-business-rules §6) that no test case covers yet. Lists the gaps with scripts/uncovered-rules.mjs, writes atomic cases for up to max-rules of them with the atomic-test-cases skill, has the tc-verifier subagent check every new case, removes cases that don't meet the docs, and ends with a JSON summary saved under reports/cover-gaps/. Run manually as /cover-gaps [max-rules] [gate]."
argument-hint: "[max-rules] [gate]"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Edit(test-cases/**), Edit(reports/cover-gaps/**), Skill(atomic-test-cases), Agent(tc-verifier), Bash(node scripts/uncovered-rules.mjs), Bash(date +%Y-%m-%d-%H%M)
---

# Cover gaps

Close coverage gaps in SkyPermit's business rules in small, reviewable batches. Each gap gets cases written by `atomic-test-cases`, every new case is checked against the docs by `tc-verifier`, and only cases that hold up (or are honestly marked `BLOCKED`) stay in `test-cases/`. The user reviews the batch from the JSON summary, so it has to say exactly what was kept, fixed, removed, and left open.

## Inputs

Arguments: `$ARGUMENTS`

Run ID: !`date +%Y-%m-%d-%H%M`

Uncovered rules, from `node scripts/uncovered-rules.mjs` at load time (one gate header per group, then `rule_reference  condition [note]` rows, then a totals line):

!`node scripts/uncovered-rules.mjs`

## 1. Read the arguments

Split the arguments on spaces, in any order:

- A positive integer is **max-rules**. Default: `3`.
- `PILOT`, `AIRCRAFT`, `ZONE` or `TIME_WINDOW` (any case) is the **gate** filter. Default: all four gates.
- Anything else, or two values of the same kind: stop and reply with the usage `/cover-gaps [max-rules] [gate]` and what was wrong. Don't guess.

## 2. Pick the gaps

Work only from the list above. If it shows an error instead of a list (for example, the SkyPermit docs weren't found), stop and report the error. Don't work out gaps by hand, because the script's matching rules (shared citations, `§3` vs `§3.2`) are easy to get wrong.

- **rules_checked / gaps_found:** with a gate, use that gate's header line (`ZONE (2 of 3 uncovered)` → checked 3, gaps 2). Without one, use the script's last line (`Rules checked: 13, gaps found: 12`).
- **Selected gaps:** the first max-rules gaps of the gates in scope, in the script's order.
- **`NOT A GATE` rows are never selected.** Put each one in `skipped` with the reason "not a gate rule; belongs with registry cases". Do this only when no gate filter is given, because a filtered run doesn't list them.
- Keep any bracketed note on a row, such as `[citation unconfirmed (05 row 5)]`, and pass it on in step 3. It usually means the case will end up blocked.

If no gaps are selected, skip to step 6.

## 3. Write cases for each gap

Handle the selected gaps one at a time, in order. Finish steps 3 to 5 for a gap before starting the next, so a problem with one rule doesn't spread to the others.

1. Before writing, collect the IDs of all existing cases (Grep `^## [A-Z0-9]+-[A-Z]+-[0-9]{3}:` in `test-cases/`). The new cases for this gap are the IDs that appear afterwards and weren't there before. Only those may be fixed or removed by this skill. Never touch a case that existed before the run.
2. Invoke the `atomic-test-cases` skill (it runs on Sonnet) with a request like:

   > Write rule-by-rule gate cases for the `<GATE>` gate rule `<rule_reference>`: "<condition>"<, note: ...>. Put them with the flight-request gate rules in `test-cases/flight-requests/`. Cover this rule only: the response that cites it (`failing_gate`, `rule_reference`) and its boundaries where the docs define them. Name the gate in capitals in every title.

3. The `tc-format-gate` hook checks the format of every write to `test-cases/`. If it blocks one, its message says which case failed which check, so fix that and write again. Don't repeat its checks yourself.
4. If `atomic-test-cases` writes no case for the gap (for example, it reports the rule as fully undefined), record one result with `case_id: null`, `action: "none"` and its reason, and move on.

## 4. Verify the new cases

Spawn the `tc-verifier` subagent (Haiku, read-only) once per gap. Give it the new IDs and their file. Read its verdict for each case, then act on it:

| Verdict | Action |
|---|---|
| **Meets requirements** | Keep it. `action: "kept"` |
| **Does not meet requirements** | Fix once (below) |
| **No requirements exist** | Keep it only if its expected result starts with `BLOCKED`. Otherwise remove it, because a concrete expected result the docs don't support is a guess. Either way, add an `open_questions` entry |

**Fixing once:** invoke `atomic-test-cases` again. Pass the verifier's findings for those cases and ask it to rewrite them in place, keeping their IDs. Then run `tc-verifier` again on just those IDs.

- If it now meets requirements, keep it with `action: "fixed"`.
- If it now has no requirements, apply that row of the table.
- If it still doesn't meet requirements, remove it with `action: "removed"`.

There's only one fix attempt, so a case can't loop.

## 5. Remove rejected cases

Remove a case by deleting its whole block with Edit, from its `## <ID>:` heading up to the next `## ` heading or the end of the file. Leave the rest of the file as it is. Never reuse a removed ID.

After removing:

- If a `## Shared setup` entry was used only by removed cases, delete that entry too.
- If a file created during this run is left with no cases, empty it with Write and name it in your final message, because this skill can't delete files.

For every removed case, keep its title and the verifier's reason (quote the deciding words and the doc link). The user reads these to judge whether the rejection was right.

## 6. Summarise

Write the summary to `reports/cover-gaps/<run-id>.json` using the run ID from the inputs. Then end with the same JSON in a ```json block. Before the block, add at most two lines for anything that needs the user's attention, such as emptied files or a doc conflict the verifier reported. Put nothing after the block.

```json
{
  "run_id": "2026-11-16-1432",
  "arguments": { "max_rules": 3, "gate": null },
  "rules_checked": 13,
  "gaps_found": 12,
  "results": [
    {
      "rule_reference": "OH-1 §2.1",
      "gate": "PILOT",
      "case_id": "API-FR-060",
      "title": "Submit with a rating that doesn't cover the zone class fails the PILOT gate",
      "verdict": "meets requirements",
      "action": "kept",
      "file": "test-cases/flight-requests/gate-rules.md"
    },
    {
      "rule_reference": "OH-1 §2.1",
      "gate": "PILOT",
      "case_id": "API-FR-061",
      "title": "...",
      "verdict": "does not meet requirements",
      "action": "removed",
      "reason": "Expected 409, docs say 422: \"...\" (../ct-gen-ai-skypermit/docs/03-api-contract.md:130)",
      "file": "test-cases/flight-requests/gate-rules.md"
    }
  ],
  "open_questions": [
    {
      "rule_reference": "ZC-2026.1 §4",
      "gate": "ZONE",
      "case_id": "API-FR-062",
      "case_action": "kept_blocked",
      "missing": "what the docs don't define, from the verifier",
      "checked": ["../ct-gen-ai-skypermit/docs/05-open-questions.md:40"]
    }
  ],
  "skipped": [
    { "rule_reference": "OH-1 §3", "gate": "NOT A GATE", "condition": "Aircraft mtom_grams > 30,000 g", "reason": "not a gate rule; belongs with registry cases" }
  ]
}
```

- **One result per new case**, including removed ones, plus one `case_id: null` result for a gap that produced no case.
- **`verdict`** is the final verdict, using the verifier's exact wording: `meets requirements`, `does not meet requirements` or `no requirements exist`. Use `null` when no case was written.
- **`action`** is `kept`, `fixed`, `removed` or `none`.
- **`reason`** is required for `removed` and `none`, and for `fixed` it gives the first verdict's reason. Leave it out for `kept`.
- **`case_action`** in `open_questions` is `kept_blocked` or `removed`.
- **`rules_checked` and `gaps_found`** come from the script, before this run's cases were added. Don't re-run the script to recount.
