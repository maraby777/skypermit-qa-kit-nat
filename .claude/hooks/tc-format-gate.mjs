#!/usr/bin/env node
// PreToolUse hook (Write|Edit): block badly formatted test cases before they land.
//
// stdin  : PreToolUse hook JSON. Uses tool_name, tool_input.file_path and
//          Write: tool_input.content
//          Edit:  tool_input.old_string, new_string, replace_all
//          (cwd / $CLAUDE_PROJECT_DIR only to resolve a relative file_path).
// scope  : <project>/test-cases/**/*.md. Everything else passes.
// result : exit 0, no output = allow. exit 2 + one stderr line per problem = block;
//          Claude Code feeds stderr back to the model so it can fix the case.
//
// Checks, for every "## " block except "## Shared setup":
//   1. has ID, Doc ref, Preconditions, Steps, Expected result fields
//   2. ID field equals the heading ID and matches PREFIX-AREA-NNN (e.g. API-FR-012)
//   3. no placeholders copied from the skill example: 0XX, <reviewer-id>
//   4. if the block mentions rule_reference, the title names a gate in capitals
//      (PILOT, AIRCRAFT, ZONE, TIME_WINDOW)
//
// Fails open (exit 0) on unreadable stdin or an Edit that can't be applied:
// the Edit tool reports those itself.

import fs from 'node:fs';
import path from 'node:path';

const FIELDS = ['ID', 'Doc ref', 'Preconditions', 'Steps', 'Expected result'];
const ID_FORMAT = /^[A-Z][A-Z0-9]*-[A-Z][A-Z0-9]*-\d{3}$/;
const PLACEHOLDERS = ['0XX', '<reviewer-id>'];
const GATES = /\b(PILOT|AIRCRAFT|ZONE|TIME_WINDOW)\b/;

function readStdin() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch {
    return null;
  }
}

function inScope(absPath, projectDir) {
  const rel = path.relative(projectDir, absPath).split(path.sep).join('/');
  return /^test-cases\/(?:.+\/)?[^/]+\.md$/.test(rel) ? rel : null;
}

// Resulting file content after the tool call, or null if it can't be determined.
function resultingContent(toolName, input, absPath) {
  if (toolName === 'Write') return typeof input.content === 'string' ? input.content : null;
  if (toolName !== 'Edit') return null;
  const { old_string: oldStr, new_string: newStr, replace_all: all } = input;
  if (typeof oldStr !== 'string' || typeof newStr !== 'string') return null;
  let current;
  try {
    current = fs.readFileSync(absPath, 'utf8');
  } catch {
    return oldStr === '' ? newStr : null; // Edit with empty old_string creates the file
  }
  if (oldStr === '') return null;
  if (!current.includes(oldStr)) return null;
  return all ? current.split(oldStr).join(newStr) : current.replace(oldStr, () => newStr);
}

function splitBlocks(text) {
  const lines = text.split(/\r?\n/);
  const blocks = [];
  let cur = null;
  let inFence = false;
  lines.forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (!inFence && /^## /.test(line)) {
      cur = { heading: line.slice(3).trim(), line: i + 1, body: [] };
      blocks.push(cur);
    } else if (!inFence && /^# /.test(line)) {
      cur = null; // a new H1 ends the current case
    } else if (cur) {
      cur.body.push(line);
    }
  });
  return blocks;
}

function fieldValue(body, label) {
  const re = new RegExp(`^\\s*[-*]\\s+\\*\\*${label}:\\*\\*(.*)$`);
  for (const line of body) {
    const m = line.match(re);
    if (m) return m[1].trim();
  }
  return null;
}

function checkBlock(block) {
  const problems = [];
  const colon = block.heading.indexOf(':');
  const headingId = (colon === -1 ? block.heading : block.heading.slice(0, colon)).trim();
  const title = colon === -1 ? '' : block.heading.slice(colon + 1).trim();
  const name = `${headingId || block.heading} (line ${block.line})`;
  const text = [block.heading, ...block.body].join('\n');

  // 1. required fields
  const missing = FIELDS.filter((f) => fieldValue(block.body, f) === null);
  if (missing.length) problems.push(`${name}: missing field(s): ${missing.join(', ')}`);

  // 2. ID matches heading and format
  const idRaw = fieldValue(block.body, 'ID');
  if (idRaw !== null) {
    const id = idRaw.replace(/`/g, '').trim();
    if (id !== headingId) problems.push(`${name}: ID field "${id}" does not match heading ID "${headingId}"`);
    if (!ID_FORMAT.test(id)) problems.push(`${name}: ID "${id}" is not in PREFIX-AREA-NNN format (e.g. API-FR-012)`);
  } else if (!ID_FORMAT.test(headingId)) {
    problems.push(`${name}: heading ID "${headingId}" is not in PREFIX-AREA-NNN format (e.g. API-FR-012)`);
  }

  // 3. placeholders from the example
  const found = PLACEHOLDERS.filter((p) => text.includes(p));
  if (found.length) problems.push(`${name}: contains example placeholder(s): ${found.join(', ')}`);

  // 4. rule_reference needs a gate named in the title
  if (text.includes('rule_reference') && !GATES.test(title)) {
    problems.push(`${name}: mentions rule_reference but the title names no gate in capitals (PILOT, AIRCRAFT, ZONE, TIME_WINDOW)`);
  }
  return problems;
}

function main() {
  const input = readStdin();
  if (!input || !['Write', 'Edit'].includes(input.tool_name)) return 0;
  const toolInput = input.tool_input || {};
  if (typeof toolInput.file_path !== 'string') return 0;

  const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  const absPath = path.resolve(input.cwd || projectDir, toolInput.file_path);
  const rel = inScope(absPath, projectDir);
  if (!rel) return 0;

  const content = resultingContent(input.tool_name, toolInput, absPath);
  if (content === null) return 0;

  const problems = splitBlocks(content)
    .filter((b) => b.heading.toLowerCase() !== 'shared setup')
    .flatMap(checkBlock);
  if (!problems.length) return 0;

  process.stderr.write(problems.map((p) => `tc-format-gate: ${rel}: ${p}`).join('\n') + '\n');
  return 2;
}

process.exit(main());
