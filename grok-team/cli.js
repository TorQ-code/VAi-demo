#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { runMission } from './src/chief.js';
import { loadConfig } from './src/config.js';
import { toMarkdown } from './src/report.js';

const idea = process.argv.slice(2).join(' ');
if (!idea) { console.error('Usage: node cli.js "your startup idea"'); process.exit(1); }

const cfg = loadConfig();
if (cfg.demo) console.log('⚠  DEMO MODE: simulated data. Set XAI_API_KEY for a live run.\n');
const icons = { chief: '🧠', scout: '🛰️', recon: '🌐', skeptic: '🔪', architect: '📐', closer: '📣', auditor: '🧾' };

try {
  const dossier = await runMission({
    idea, client: cfg.client, models: cfg.models, maxCalls: cfg.maxCalls,
    onEvent: (e) => { if (e.type !== 'status' && e.type !== 'done') console.log(`${(e.t / 1000).toFixed(1).padStart(5)}s ${icons[e.bot] ?? '•'} ${e.msg}`); },
  });
  mkdirSync('dossiers', { recursive: true });
  const file = `dossiers/${Date.now()}-${idea.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}.md`;
  writeFileSync(file, toMarkdown(dossier, { demo: cfg.demo }));
  console.log(`\n${dossier.verdict.verdict} (${dossier.verdict.confidence}%). Dossier saved to ${file}`);
} catch (err) {
  console.error(`Mission failed: ${err.message}`);
  process.exit(1);
}
