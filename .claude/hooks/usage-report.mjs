#!/usr/bin/env node
// SessionEnd hook: summarise token usage and cost for a Claude Code session.
//
// stdin  : SessionEnd hook JSON; only `transcript_path` and `session_id` are used.
// output : reports/ws2/<YYYY-MM-DD>-<session_id>.md under the project dir.
//
// Transcript facts this relies on (checked against real transcripts):
// - Usage lives on `type: "assistant"` lines in `message.usage`; model in `message.model`.
// - One API response is written as several assistant lines with the same
//   `message.id` + `requestId` and identical usage -> count each pair once.
// - Subagents are NOT in the main file: <transcript without .jsonl>/subagents/
//   agent-<id>.jsonl, with agent-<id>.meta.json next to it (agentType, description).
// - Compaction: `type: "system"`, `subtype: "compact_boundary"`, `compactMetadata`
//   {trigger, preTokens, postTokens, durationMs}. The summarising call's own usage
//   is not recorded in the transcript, so its cost cannot be counted.

import fs from 'node:fs';
import path from 'node:path';

// $ per 1M tokens. Cache read = 0.1x input; cache write 5m = 1.25x, 1h = 2x input.
const PRICES = {
  'claude-haiku-5-5': { input: 0.1, output: 0.5 },
  'claude-sonnet-5-5': { input: 2, output: 10 },
  'claude-opus-5-5': { input: 4, output: 20 },
};
const CACHE_READ_X = 0.1;
const CACHE_5M_X = 1.25;
const CACHE_1H_X = 2;

const FIELDS = ['input', 'output', 'cacheRead', 'cache5m', 'cache1h', 'cacheUnknownTtl', 'thinking', 'webSearch', 'webFetch', 'requests'];

function emptyTotals() {
  return Object.fromEntries(FIELDS.map((f) => [f, 0]));
}

function addTotals(into, from) {
  for (const f of FIELDS) into[f] += from[f];
}

function readJsonl(file) {
  const out = [];
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    return out;
  }
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line));
    } catch {
      // A partially written last line is possible; skip it.
    }
  }
  return out;
}

// Returns { byModel: {model: totals}, compacts: [...] } for one transcript file.
function summarise(file) {
  const byModel = {};
  const compacts = [];
  const seen = new Set();
  for (const d of readJsonl(file)) {
    if (d.type === 'system' && d.subtype === 'compact_boundary') {
      const m = d.compactMetadata || {};
      compacts.push({
        timestamp: d.timestamp,
        trigger: m.trigger,
        preTokens: m.preTokens,
        postTokens: m.postTokens,
        durationMs: m.durationMs,
      });
      continue;
    }
    if (d.type !== 'assistant') continue;
    const msg = d.message;
    const u = msg && msg.usage;
    if (!u) continue;
    const key = `${msg.id ?? ''}|${d.requestId ?? ''}`;
    if (key !== '|') {
      if (seen.has(key)) continue;
      seen.add(key);
    }
    const model = msg.model || 'unknown';
    const t = (byModel[model] ||= emptyTotals());
    t.requests += 1;
    t.input += u.input_tokens || 0;
    t.output += u.output_tokens || 0;
    t.cacheRead += u.cache_read_input_tokens || 0;
    const created = u.cache_creation_input_tokens || 0;
    const cc = u.cache_creation;
    if (cc && typeof cc === 'object') {
      const m5 = cc.ephemeral_5m_input_tokens || 0;
      const h1 = cc.ephemeral_1h_input_tokens || 0;
      t.cache5m += m5;
      t.cache1h += h1;
      // Anything not attributed to a TTL is kept separate rather than guessed.
      t.cacheUnknownTtl += Math.max(0, created - m5 - h1);
    } else {
      t.cacheUnknownTtl += created;
    }
    t.thinking += (u.output_tokens_details && u.output_tokens_details.thinking_tokens) || 0;
    t.webSearch += (u.server_tool_use && u.server_tool_use.web_search_requests) || 0;
    t.webFetch += (u.server_tool_use && u.server_tool_use.web_fetch_requests) || 0;
  }
  return { byModel, compacts };
}

// Cost in $, or null when the model has no price or a cache TTL is unknown.
function cost(model, t) {
  const p = PRICES[model];
  if (!p) return null;
  if (t.cacheUnknownTtl > 0) return null;
  const perTok = (rate) => rate / 1e6;
  return (
    t.input * perTok(p.input) +
    t.output * perTok(p.output) +
    t.cacheRead * perTok(p.input * CACHE_READ_X) +
    t.cache5m * perTok(p.input * CACHE_5M_X) +
    t.cache1h * perTok(p.input * CACHE_1H_X)
  );
}

const fmtN = (n) => n.toLocaleString('en-US');
const fmt$ = (c) => (c === null ? 'n/a' : `$${c.toFixed(4)}`);

function sumCosts(rows) {
  let total = 0;
  let unpriced = false;
  for (const [model, t] of rows) {
    const c = cost(model, t);
    if (c === null) unpriced = true;
    else total += c;
  }
  return { total, unpriced };
}

function modelTable(byModel) {
  const rows = Object.entries(byModel).sort(([a], [b]) => a.localeCompare(b));
  if (!rows.length) return '_No assistant usage recorded._\n';
  const showUnknownTtl = rows.some(([, t]) => t.cacheUnknownTtl > 0);
  let s =
    '| Model | Requests | Input | Output (thinking) | Cache read | Cache write 5m | Cache write 1h |' +
    (showUnknownTtl ? ' Cache write, TTL unknown |' : '') +
    ' Cost |\n|---|---:|---:|---:|---:|---:|---:|' +
    (showUnknownTtl ? '---:|' : '') +
    '---:|\n';
  for (const [model, t] of rows) {
    s +=
      `| \`${model}\` | ${fmtN(t.requests)} | ${fmtN(t.input)} | ${fmtN(t.output)} (${fmtN(t.thinking)}) | ` +
      `${fmtN(t.cacheRead)} | ${fmtN(t.cache5m)} | ${fmtN(t.cache1h)} |` +
      (showUnknownTtl ? ` ${fmtN(t.cacheUnknownTtl)} |` : '') +
      ` ${fmt$(cost(model, t))} |\n`;
  }
  const { total, unpriced } = sumCosts(rows);
  s += `\n**Subtotal:** ${fmt$(total)}${unpriced ? ' (excludes rows marked n/a)' : ''}\n`;
  return s;
}

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function localDate(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function main() {
  let input;
  try {
    input = JSON.parse(readStdin() || '{}');
  } catch (e) {
    process.stderr.write(`usage-report: invalid stdin JSON: ${e.message}\n`);
    return;
  }
  const transcriptPath = input.transcript_path;
  const sessionId = input.session_id;
  if (!transcriptPath || !sessionId) {
    process.stderr.write('usage-report: stdin lacks transcript_path or session_id\n');
    return;
  }
  if (!fs.existsSync(transcriptPath)) {
    process.stderr.write(`usage-report: transcript not found: ${transcriptPath}\n`);
    return;
  }

  const main = summarise(transcriptPath);

  // Subagents
  const subDir = path.join(transcriptPath.replace(/\.jsonl$/, ''), 'subagents');
  const agents = [];
  let agentFiles = [];
  try {
    agentFiles = fs.readdirSync(subDir).filter((f) => /^agent-.+\.jsonl$/.test(f)).sort();
  } catch {
    // No subagents directory.
  }
  for (const f of agentFiles) {
    const id = f.replace(/^agent-/, '').replace(/\.jsonl$/, '');
    let meta = {};
    try {
      meta = JSON.parse(fs.readFileSync(path.join(subDir, `agent-${id}.meta.json`), 'utf8'));
    } catch {
      // meta is optional
    }
    agents.push({ id, meta, ...summarise(path.join(subDir, f)) });
  }

  // Totals per model across main + subagents
  const all = {};
  const merge = (byModel) => {
    for (const [m, t] of Object.entries(byModel)) addTotals((all[m] ||= emptyTotals()), t);
  };
  merge(main.byModel);
  for (const a of agents) merge(a.byModel);

  const compacts = [...main.compacts, ...agents.flatMap((a) => a.compacts.map((c) => ({ ...c, agent: a.id })))];

  // Report
  const date = localDate();
  const { total, unpriced } = sumCosts(Object.entries(all));
  const anyUnknownTtl = Object.values(all).some((t) => t.cacheUnknownTtl > 0);
  const webCalls = Object.values(all).reduce((n, t) => n + t.webSearch + t.webFetch, 0);

  let md = `# Usage report — session \`${sessionId}\`\n\n`;
  md += `- Date: ${date}\n`;
  if (input.reason) md += `- End reason: ${input.reason}\n`;
  md += `- Transcript: \`${transcriptPath}\`\n`;
  md += `- Subagents: ${agents.length}\n`;
  md += `- Compactions: ${compacts.length}\n`;
  md += `- **Total cost: ${fmt$(total)}**${unpriced ? ' (excludes rows marked n/a)' : ''}\n\n`;

  md += `## Total by model (main session + subagents)\n\n${modelTable(all)}\n`;
  md += `## Main session\n\n${modelTable(main.byModel)}\n`;

  md += `## Subagents\n\n`;
  if (!agents.length) md += '_None._\n\n';
  for (const a of agents) {
    const type = a.meta.agentType || 'unknown type';
    const desc = a.meta.description ? ` — ${a.meta.description}` : '';
    md += `### \`${a.id}\` (${type})${desc}\n\n${modelTable(a.byModel)}\n`;
  }

  md += `## Compactions\n\n`;
  if (!compacts.length) {
    md += '_None._\n\n';
  } else {
    md += '| Time | Where | Trigger | Tokens before | Tokens after | Duration |\n|---|---|---|---:|---:|---:|\n';
    for (const c of compacts) {
      const dur = typeof c.durationMs === 'number' ? `${(c.durationMs / 1000).toFixed(1)} s` : '—';
      md += `| ${c.timestamp ?? '—'} | ${c.agent ? `subagent \`${c.agent}\`` : 'main'} | ${c.trigger ?? '—'} | ${c.preTokens != null ? fmtN(c.preTokens) : '—'} | ${c.postTokens != null ? fmtN(c.postTokens) : '—'} | ${dur} |\n`;
    }
    md += '\nThe transcript does not record usage for the summarising call itself, so compaction cost is not included above.\n\n';
  }

  md += `## Notes\n\n`;
  md += `- Prices per 1M tokens: ${Object.entries(PRICES).map(([m, p]) => `\`${m}\` in $${p.input} / out $${p.output}`).join('; ')}.\n`;
  md += `- Cache read = ${CACHE_READ_X}× input; cache write 5m = ${CACHE_5M_X}× input, 1h = ${CACHE_1H_X}× input.\n`;
  md += '- Output tokens include thinking tokens (shown in brackets).\n';
  md += '- Models without a price show tokens but cost n/a.\n';
  md += '- Repeated transcript lines for the same API response (same `message.id` + `requestId`) are counted once.\n';
  if (anyUnknownTtl) md += '- Some cache writes had no 5m/1h breakdown; those rows show cost n/a instead of guessing a TTL.\n';
  if (webCalls) md += `- ${webCalls} server web search/fetch request(s) were made; their per-request fees are not priced here.\n`;

  const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  const outDir = path.join(projectDir, 'reports', 'ws2');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${date}-${sessionId}.md`);
  fs.writeFileSync(outFile, md);
  process.stderr.write(`usage-report: wrote ${outFile}\n`);
}

try {
  main();
} catch (e) {
  // Never break session shutdown.
  process.stderr.write(`usage-report: ${e && e.stack ? e.stack : e}\n`);
}
process.exit(0);
