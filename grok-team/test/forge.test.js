import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runMission } from '../src/chief.js';
import { createMockClient } from '../src/mock.js';
import { BOTS, habitScore, SHAPES, COLORS } from '../src/team.js';
import { normUrl } from '../src/receipts.js';
import { extractText, extractCitations, parseJson } from '../src/grok.js';
import { toMarkdown } from '../src/report.js';

const fast = () => createMockClient({ delayMs: [0, 1] });
const architect = BOTS.find((b) => b.id === 'architect');

test('demo forge: Chief sends back Scout and Architect, merges guardrails, ships a valid Bot Card', async () => {
  const events = [];
  const d = await runMission({ idea: 'freelancers', client: fast(), onEvent: (e) => events.push(e) });
  const rejected = events.filter((e) => e.type === 'review' && !e.data.accepted).map((e) => e.data.bot).sort();
  assert.deepEqual(rejected, ['architect', 'scout']);
  assert.equal(d.plan.mode, 'discover');
  assert.equal(d.card.name, 'Owed');
  assert.ok(SHAPES.includes(d.card.shape) && COLORS.includes(d.card.color));
  assert.match(d.card.instructions, /## Guardrails/);
  assert.match(d.card.instructions, /Never send, archive or delete anything without my approval/);
  assert.equal(d.outputs.rank.winner.name, 'Owed');
  assert.equal(d.outputs.rank.candidates.find((c) => c.name === 'Lead Nudge').unverified_evidence, 1);
  assert.ok(d.outputs.habit.score >= 80);
  assert.equal(d.verdict.verdict, 'BUILD_THIS');
  assert.equal(d.receipts.score, 100);
  assert.match(toMarkdown(d, { demo: true }), /Bot Card \(paste into the Grok Bot app\)/);
});

test('gate: BUILD_THIS is downgraded when the winner has fewer than 3 verified receipts', async () => {
  const base = fast();
  const client = {
    async respond(o) {
      const res = await base.respond(o);
      if (o.role !== 'scout') return res;
      const j = JSON.parse(res.text); j.signals = j.signals.filter((s) => s.handle !== '@demo_ghost').slice(0, 1);
      return { ...res, text: JSON.stringify(j), citations: j.signals.map((s) => s.url) };
    },
  };
  const d = await runMission({ idea: 'freelancers', client, maxRevisions: 0 });
  assert.equal(d.verdict.verdict, 'REWORK');
  assert.match(d.verdict.gate, /verified demand/);
  assert.ok(d.outputs.rank.winner.verified_evidence < 3);
});

test('architect rules: risky actions need an approval clause, and at least one routine must recur', () => {
  const card = {
    name: 'Test', shape: 'circle', color: 'blue', first_run: 'x', notifications: true,
    instructions: `## Role\nYou post updates to X for me.\n## Rules\n${'word '.repeat(150)}`,
    routines: [{ name: 'r', frequency: 'on-demand', prompt: 'post the update' }],
  };
  const issues = architect.validate(card).join(' | ');
  assert.match(issues, /never asks for approval/);
  assert.match(issues, /at least one routine must be recurring/);
  card.instructions += '\nAsk me before posting anything.';
  card.routines[0].frequency = 'daily';
  assert.deepEqual(architect.validate(card), []);
});

test('habit score rewards daily routines, notifications, digests and trust', () => {
  const hi = habitScore({ routines: [{ name: 'Morning brief', frequency: 'daily', prompt: 'digest' }], notifications: true, first_run: 'x', instructions: 'Ask me before sending.' });
  const lo = habitScore({ routines: [{ name: 'x', frequency: 'on-demand', prompt: 'y' }], notifications: false });
  assert.equal(hi.score, 90);
  assert.equal(lo.score, 0);
  assert.ok(lo.tips.length >= 2);
});

test('budget and input guards', async () => {
  await assert.rejects(runMission({ idea: 'freelancers', client: fast(), maxCalls: 3 }), /budget/);
  await assert.rejects(runMission({ idea: 'ab', client: fast() }), /problem/);
});

test('receipts and Grok response parsing', () => {
  assert.equal(normUrl('https://twitter.com/A/status/1?s=20'), normUrl('https://x.com/a/status/1/'));
  const data = { output: [{ type: 'x_search_call' }, { type: 'message', content: [{ type: 'output_text', text: '```json\n{"a":1}\n```', annotations: [{ type: 'url_citation', url: 'https://x.com/a/status/1' }] }] }], citations: ['https://example.com'] };
  assert.deepEqual(parseJson(extractText(data)), { a: 1 });
  assert.deepEqual(extractCitations(data).sort(), ['https://example.com', 'https://x.com/a/status/1']);
});
