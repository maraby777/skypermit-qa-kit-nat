#!/usr/bin/env node
// List SkyPermit business rules that no test case covers yet.
//
// Usage: node scripts/uncovered-rules.mjs [PILOT|AIRCRAFT|ZONE|TIME_WINDOW]
//
// Rules: the rows of the `rule_reference` table in §6 of
// docs/06-business-rules.md, read from the SkyPermit repo at runtime
// (read-only). §6 already reflects docs/07-clarifications.md: 07 adds,
// renames or removes no values; it moves weight band to AIRCRAFT, which §6
// already shows.
//
// Coverage: test-cases/**/*.md is split into blocks at each `## ` heading.
// - A unique rule_reference is covered if any block contains the value.
// - A value shared by several gates (ZC-2026.1 §2: AIRCRAFT weight band and
//   ZONE altitude) only counts for a gate if the same block also names that
//   gate, because 06 §1.2 says failing_gate, not rule_reference,
//   distinguishes them.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const GATES = ['PILOT', 'AIRCRAFT', 'ZONE', 'TIME_WINDOW'];
const NOT_A_GATE = 'NOT A GATE';

// Notes from docs/05-open-questions.md, keyed by gate + rule_reference.
const NOTES = {
  'ZONE|ZC-2026.1 §4': 'citation unconfirmed (05 row 5)',
};

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const testCasesDir = path.join(repoRoot, 'test-cases');

function die(msg, code = 1) {
  process.stderr.write(`uncovered-rules: ${msg}\n`);
  process.exit(code);
}

function findDocsDir() {
  const candidates = [
    path.join(repoRoot, 'skypermit', 'docs'),
    path.resolve(repoRoot, '..', 'ct-gen-ai-skypermit', 'docs'),
  ];
  const found = candidates.find((d) => fs.existsSync(path.join(d, '06-business-rules.md')));
  if (!found) die(`06-business-rules.md not found in:\n  ${candidates.join('\n  ')}`);
  return found;
}

const normalise = (s) => s.replace(/[ \s]+/g, ' ');
const stripMd = (s) => s.replace(/`/g, '').trim();

// Parse the §6 table into [{ gate, condition, ref }].
function parseRules(docsDir) {
  const text = fs.readFileSync(path.join(docsDir, '06-business-rules.md'), 'utf8');
  const lines = text.split('\n');
  const start = lines.findIndex((l) => /^## 6\.\s.*rule_reference/.test(l));
  if (start < 0) die('section "## 6. `rule_reference` values" not found in 06-business-rules.md');

  const rules = [];
  for (let i = start + 1; i < lines.length && !/^## /.test(lines[i]); i++) {
    const line = lines[i].trim();
    if (!line.startsWith('|') || /^\|[\s|:-]+\|$/.test(line)) continue; // not a row, or separator
    const cells = line.slice(1, -1).split('|').map((c) => c.trim());
    if (cells.length < 3 || cells[0] === 'Gate') continue; // header

    const gateCell = stripMd(cells[0]);
    let gate;
    if (GATES.includes(gateCell)) gate = gateCell;
    else if (/not a gate/i.test(gateCell)) gate = NOT_A_GATE;
    else die(`unrecognised gate "${cells[0]}" in §6 row: ${line}`);

    const refMatch = cells[2].match(/`([^`]+)`/);
    if (!refMatch) die(`no rule_reference code span in §6 row: ${line}`);

    rules.push({ gate, condition: stripMd(cells[1]), ref: normalise(refMatch[1]).trim() });
  }
  if (!rules.length) die('§6 table in 06-business-rules.md has no rows');
  return rules;
}

function listMarkdown(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listMarkdown(p));
    else if (e.isFile() && e.name.endsWith('.md')) out.push(p);
  }
  return out.sort();
}

// Every `## ` section of every test-case file, normalised. Text before the
// first heading is its own block.
function loadBlocks() {
  const blocks = [];
  for (const file of listMarkdown(testCasesDir)) {
    const parts = fs.readFileSync(file, 'utf8').split(/^(?=## )/m);
    for (const part of parts) blocks.push(normalise(part));
  }
  return blocks;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Matches the value with flexible spacing, not as part of a longer
// citation: `TSD-4 §3` must not match `TSD-4 §3.2`, `TSD-4 §31` or `XTSD-4 §3`.
function valueRegex(ref) {
  const body = ref.split(' ').map(escapeRe).join('\\s*');
  return new RegExp(`(?<![A-Za-z0-9.-])${body}(?![0-9]|\\.[0-9])`);
}

function main() {
  const arg = process.argv[2];
  let only = null;
  if (arg !== undefined) {
    only = arg.toUpperCase();
    if (!GATES.includes(only)) die(`unknown gate "${arg}". Use one of: ${GATES.join(', ')}`, 2);
  }

  const rules = parseRules(findDocsDir());
  const blocks = loadBlocks();

  const gatesPerRef = {};
  for (const r of rules) (gatesPerRef[r.ref] ||= new Set()).add(r.gate);

  const isCovered = (r) => {
    const re = valueRegex(r.ref);
    const shared = gatesPerRef[r.ref].size > 1;
    const gateRe = new RegExp(`(?<![A-Za-z0-9_])${r.gate}(?![A-Za-z0-9_])`);
    return blocks.some((b) => re.test(b) && (!shared || gateRe.test(b)));
  };

  const groups = only ? [only] : [...GATES, NOT_A_GATE];
  let checked = 0;
  let gaps = 0;
  const out = [];

  for (const g of groups) {
    const inGroup = rules.filter((r) => r.gate === g);
    checked += inGroup.length;
    const uncovered = inGroup.filter((r) => !isCovered(r));
    gaps += uncovered.length;

    out.push(`${g} (${uncovered.length} of ${inGroup.length} uncovered)`);
    if (!uncovered.length) out.push('  (none)');
    const width = Math.max(0, ...uncovered.map((r) => r.ref.length));
    for (const r of uncovered) {
      const note = NOTES[`${r.gate}|${r.ref}`];
      out.push(`  ${r.ref.padEnd(width)}  ${r.condition}${note ? ` [${note}]` : ''}`);
    }
    out.push('');
  }

  out.push(`Rules checked: ${checked}, gaps found: ${gaps}`);
  process.stdout.write(out.join('\n') + '\n');
}

main();
