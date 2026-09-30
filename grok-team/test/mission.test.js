import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runMission } from '../src/chief.js';
import { createMockClient } from '../src/mock.js';
import { normUrl, audit, createLedger } from '../src/receipts.js';
import { extractText, extractCitations, parseJson } from '../src/grok.js';
import { toMarkdown } from '../src/report.js';

const fast = () => createMockClient({ delayMs: [0, 1] });

test('full demo mission: chief catches the fabricated link and the invented customer', async () => {
  const events = [];
  const d = await runMission({ idea: 'shift-swap app for nurses', client: fast(), onEvent: (e) => events.push(e) });
  const rejects = events.filter((e) => e.type === 'review' && !e.data.accepted).map((e) => e.data.bot);
  assert.deepEqual(rejects.sort(), ['closer', 'scout']);
  assert.ok(!d.outputs.scout.pain_signals.some((p) => p.handle === '@demo_ghost'));
  assert.ok(!d.outputs.closer.first_customers.some((c) => c.handle === '@demo_growthhacker'));
  assert.equal(d.receipts.score, 100);
  assert.equal(d.verdict.verdict, 'BUILD');
  assert.match(toMarkdown(d, { demo: true }), /DEMO MODE/);
});

test('evidence gate downgrades BUILD when Scout verifies fewer than 3 signals', async () => {
  const base = fast();
  const client = {
    async respond(o) {
      const r = await base.respond(o);
      if (o.role === 'scout') {
        const j = JSON.parse(r.text); j.pain_signals = j.pain_signals.slice(0, 1);
        return { ...r, text: JSON.stringify(j), citations: [j.pain_signals[0].url] };
      }
      return r;
    },
  };
  const d = await runMission({ idea: 'shift-swap app for nurses', client, maxRevisions: 0 });
  assert.equal(d.verdict.verdict, 'PIVOT');
  assert.ok(d.verdict.confidence <= 45);
  assert.match(d.verdict.gate, /Evidence gate/);
});

test('call budget is enforced', async () => {
  await assert.rejects(runMission({ idea: 'shift-swap app for nurses', client: fast(), maxCalls: 3 }), /budget/);
});

test('rejects empty ideas', async () => {
  await assert.rejects(runMission({ idea: 'hi', client: fast() }), /at least/);
});

test('receipts: url normalization and audit', () => {
  assert.equal(normUrl('https://twitter.com/Foo/status/1/'), normUrl('https://x.com/foo/status/1?s=20'));
  assert.equal(normUrl('not a url'), null);
  const ledger = createLedger();
  ledger.addCitations(['https://x.com/a/status/1']);
  const r = audit({ scout: { pain_signals: [{ url: 'https://x.com/a/status/1' }, { url: 'https://x.com/b/status/2' }] } }, ledger);
  assert.equal(r.score, 50);
  assert.equal(r.flagged[0].url, 'https://x.com/b/status/2');
});

test('grok response parsing', () => {
  const data = { output: [{ type: 'web_search_call' }, { type: 'message', content: [{ type: 'output_text', text: '```json\n{"a":1}\n```', annotations: [{ type: 'url_citation', url: 'https://x.com/a/status/1' }] }] }], citations: ['https://example.com'] };
  assert.deepEqual(parseJson(extractText(data)), { a: 1 });
  assert.deepEqual(extractCitations(data).sort(), ['https://example.com', 'https://x.com/a/status/1']);
});
