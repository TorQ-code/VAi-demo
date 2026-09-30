import { test } from 'node:test';
import assert from 'node:assert/strict';
import { investigate, buildTimeline } from '../src/engine.js';
import { createMockClient } from '../src/mock.js';
import { scanIntake, lockFixes } from '../src/safety.js';
import { normUrl } from '../src/receipts.js';
import { extractText, extractCitations, parseJson } from '../src/grok.js';
import { toMarkdown } from '../src/report.js';

const fast = () => createMockClient({ delayMs: [0, 1] });
const PROBLEM = 'Thermostat keeps rebooting every few hours since last week';

test('demo case: Chief sends back Echo and Advocate, Safety locks the dangerous fix', async () => {
  const events = [];
  const r = await investigate({ problem: PROBLEM, product: 'Nestor T3', client: fast(), onEvent: (e) => events.push(e) });
  const rejected = events.filter((e) => e.type === 'review' && !e.data.accepted).map((e) => e.data.bot).sort();
  assert.deepEqual(rejected, ['advocate', 'echo']);
  assert.ok(!r.outputs.echo.reports.some((x) => x.handle === '@demo_ghost'));
  const bypass = r.outputs.fixer.fixes.find((f) => /bypass/i.test(f.title));
  assert.equal(bypass.locked, true);
  assert.equal(bypass.steps.length, 0);
  assert.equal(r.verdict.verdict, 'NOT_JUST_YOU');
  assert.equal(r.timeline.verified, 6);
  assert.equal(r.timeline.first_seen, '2026-09-23');
  assert.equal(r.receipts.score, 100);
  assert.match(toMarkdown(r, { demo: true }), /DEMO MODE/);
});

test('hazard at intake: safety banner first, every DIY fix locked, safety steps lead do_now', async () => {
  const events = [];
  const r = await investigate({ problem: 'My laptop battery is swelling and the trackpad is lifting', client: fast(), onEvent: (e) => events.push(e) });
  const firstSafety = events.findIndex((e) => e.type === 'safety');
  const firstPlan = events.findIndex((e) => e.type === 'plan');
  assert.ok(firstSafety >= 0 && firstSafety < firstPlan);
  assert.ok(r.outputs.fixer.fixes.every((f) => f.locked));
  assert.match(r.verdict.do_now[0], /lithium battery/);
});

test('evidence gate: NOT_JUST_YOU needs 3 verified reports', async () => {
  const base = fast();
  const client = {
    async respond(o) {
      const res = await base.respond(o);
      if (o.role !== 'echo') return res;
      const j = JSON.parse(res.text); j.reports = j.reports.filter((x) => x.handle !== '@demo_ghost').slice(0, 2);
      return { ...res, text: JSON.stringify(j), citations: j.reports.map((x) => x.url) };
    },
  };
  const r = await investigate({ problem: PROBLEM, client, maxRevisions: 0 });
  assert.equal(r.verdict.verdict, 'TOO_EARLY');
  assert.ok(r.verdict.confidence <= 45);
  assert.match(r.verdict.gate, /Evidence gate/);
});

test('budget and input guards', async () => {
  await assert.rejects(investigate({ problem: PROBLEM, client: fast(), maxCalls: 2 }), /budget/);
  await assert.rejects(investigate({ problem: 'broken', client: fast() }), /sentence/);
});

test('safety rules', () => {
  assert.deepEqual(scanIntake('I smell gas near the stove').map((h) => h.id), ['gas']);
  assert.deepEqual(scanIntake('there were sparks from the outlet').map((h) => h.id), ['fire']);
  assert.deepEqual(scanIntake('my brakes squeal').map((h) => h.id), ['vehicle']);
  assert.deepEqual(scanIntake('app crashes on login'), []);
  const fixes = [{ title: 'Clear cache', steps: ['Settings → Storage → Clear'], risk: 'safe' }, { title: 'Discharge the capacitor', steps: ['...'], risk: 'moderate' }];
  assert.deepEqual(lockFixes(fixes), ['Discharge the capacitor']);
  assert.equal(fixes[0].locked, undefined);
});

test('timeline ignores unverified reports', () => {
  const t = buildTimeline([{ date: '2026-09-02', verified: true }, { date: '2026-09-01', verified: false }, { date: '2026-09-02', verified: true }, { date: '2026-09-03' }]);
  assert.deepEqual(t, { verified: 3, first_seen: '2026-09-02', peak: '2026-09-02', days: [{ date: '2026-09-02', count: 2 }, { date: '2026-09-03', count: 1 }] });
});

test('receipts and Grok response parsing', () => {
  assert.equal(normUrl('https://mobile.twitter.com/A/status/1?s=20'), normUrl('https://x.com/a/status/1/'));
  const data = { output: [{ type: 'x_search_call' }, { type: 'message', content: [{ type: 'output_text', text: '```json\n{"a":1}\n```', annotations: [{ type: 'url_citation', url: 'https://x.com/a/status/1' }] }] }], citations: ['https://example.com'] };
  assert.deepEqual(parseJson(extractText(data)), { a: 1 });
  assert.deepEqual(extractCitations(data).sort(), ['https://example.com', 'https://x.com/a/status/1']);
});
