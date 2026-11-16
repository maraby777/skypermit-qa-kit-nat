# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Goal

This is the QA kit for SkyPermit, a drone airspace authorisation system. Claude is used here for two things, both based on SkyPermit's `docs/`:

- Generating test cases
- Creating test plans

**Test automation is out of scope.** Do not write automated tests, test scripts, or framework setup (Vitest, Playwright, etc.), and do not convert test cases into code.

There is no build, lint, or test tooling in this repo, because its deliverables are documents.

## Directory structure (planned)

These directories don't exist yet; create them when the first file needs them.

```
skypermit-qa-kit-nat/
├── test-plans/       # test plans
├── test-cases/       # test cases
└── .claude/skills/   # Claude Code skills for QA workflows
```

Test case and test plan formats haven't been decided. Ask the user, or follow existing files once there are some.

## SkyPermit repo: read-only

The system under test is at `../ct-gen-ai-skypermit` (i.e. `/Users/nataszatereshchenko/genai-course/ct-gen-ai-skypermit`). These rules also apply if it is later linked into this repo, for example as `./skypermit`.

Reading its files and using read-only git commands (`git log`, `git show`, `git diff`, `git status`) is allowed. **Prohibited:**

- **Changing files:** do not create, edit, move, rename, or delete anything there, including docs, and do not save kit output there. If a doc looks wrong, report it instead of fixing it.
- **Changing git state:** no `commit`, `push`, `pull`, `fetch`, `checkout`, `switch`, `reset`, `stash`, `merge`, `rebase`, `clean`, or branch and tag changes.
- **Running its tooling:** no `npm install`, `npm run dev`, `npm run build`, `npm run lint`, `npm test`, or `npx`. These write to its tree (`next dev`, for one, rewrites `AGENTS.md`). Its `.claude/settings.json` allows some of them, but that does not grant permission here.
- **Touching its data or secrets:** do not read `.env.local` if it exists, connect to its Supabase project, or apply its migrations or seed data.

SkyPermit's `CLAUDE.md` and `AGENTS.md` are instructions for developing that app. Read them as background only; their implementation tasks and commands don't apply here.

## Working from the docs

`docs/` in the SkyPermit repo is the source of truth for expected behaviour. Don't derive expected results from `app/`, `lib/`, or `tests/`, since that would only confirm what the code already does.

| Doc | Covers |
|---|---|
| `01-data-model.md` | Entities, fields, enums, derived vs. stored values |
| `02-state-machine.md` | Flight request states and legal transitions |
| `03-api-contract.md` | Endpoints, status codes, `422` error body |
| `04-frontend-spec.md` | The two portals, their pages, `data-testid` contract |
| `05-open-questions.md` | Canonical status of every open or resolved question |
| `06-business-rules.md` | Gate logic, thresholds, zone catalogue |
| `07-clarifications.md` | Why questions were resolved as they were; corrections to `06` |
| `08-uml-diagrams.md` | ER, state, and gate pipeline diagrams |

Rules for using them:

- **Conflicts:** where `07` conflicts with the wording of `06`, `07` governs. For whether a question is currently open or resolved, `05` governs, because `07` isn't updated when a status changes.
- **Known corpus error:** the `AIRCRAFT` weight-band rule is cited from `ZC-2026.1 §2`, whose text says it fails the zone gate. It is confirmed to fail the `AIRCRAFT` gate (`07` item 1).
- **Open questions:** `05` lists `Operator.status = SUSPENDED` handling and the zone `active` flag citation as unresolved. Don't invent expected results for what is undefined; mark those cases as blocked by the open question.
- **Ambiguity:** if the docs are ambiguous or contradictory, flag it to the user rather than choosing a default.
- **Traceability:** cite the source doc and section for each expected result.
