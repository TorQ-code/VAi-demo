#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { investigate, label } from './src/engine.js';
import { loadConfig } from './src/config.js';
import { toMarkdown } from './src/report.js';

const args = process.argv.slice(2);
const pi = args.indexOf('--product');
const product = pi >= 0 ? args.splice(pi, 2)[1] : '';
const problem = args.join(' ');
if (!problem) { console.error('Usage: node cli.js "what went wrong" [--product "Brand Model"]'); process.exit(1); }

const cfg = loadConfig();
if (cfg.demo) console.log('⚠  DEMO MODE: simulated data. Set XAI_API_KEY for a live run.\n');
const icons = { chief: '🧠', echo: '🛰️', rights: '⚖️', fixer: '🔧', safety: '🦺', advocate: '📨', auditor: '🧾' };

try {
  const r = await investigate({
    problem, product, client: cfg.client, models: cfg.models, maxCalls: cfg.maxCalls,
    onEvent: (e) => { if (!['status', 'done'].includes(e.type)) console.log(`${(e.t / 1000).toFixed(1).padStart(5)}s ${icons[e.bot] ?? '•'} ${e.msg}`); },
  });
  mkdirSync('reports', { recursive: true });
  const file = `reports/${Date.now()}.md`;
  writeFileSync(file, toMarkdown(r, { demo: cfg.demo }));
  console.log(`\n${label(r.verdict.verdict)} (${r.verdict.confidence}%). Report saved to ${file}`);
} catch (err) {
  console.error(`Investigation failed: ${err.message}`);
  process.exit(1);
}
