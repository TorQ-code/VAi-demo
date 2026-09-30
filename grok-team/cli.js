#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { runMission } from './src/chief.js';
import { loadConfig } from './src/config.js';
import { toMarkdown } from './src/report.js';

const brief = process.argv.slice(2).join(' ');
if (!brief) { console.error('Usage: node cli.js "a problem, a bot idea, or an audience"'); process.exit(1); }

const cfg = loadConfig();
if (cfg.demo) console.log('⚠  DEMO MODE: simulated data. Set XAI_API_KEY for a live run.\n');
const icons = { chief: '🧠', scout: '🛰️', recon: '🌐', architect: '📐', redteam: '🔪', closer: '📣', habit: '🔁', auditor: '🧾' };

try {
  const d = await runMission({
    idea: brief, client: cfg.client, models: cfg.models, maxCalls: cfg.maxCalls,
    onEvent: (e) => { if (e.type !== 'status' && e.type !== 'done') console.log(`${(e.t / 1000).toFixed(1).padStart(5)}s ${icons[e.bot] ?? '•'} ${e.msg}`); },
  });
  mkdirSync('dossiers', { recursive: true });
  const file = `dossiers/${Date.now()}-${(d.card?.name ?? 'bot').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
  writeFileSync(file, toMarkdown(d, { demo: cfg.demo }));
  console.log(`\n${d.verdict.verdict.replace('_', ' ')} (${d.verdict.confidence}%). Bot Card saved to ${file}`);
} catch (err) {
  console.error(`Forge failed: ${err.message}`);
  process.exit(1);
}
