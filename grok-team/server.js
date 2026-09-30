import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { runMission } from './src/chief.js';
import { loadConfig } from './src/config.js';
import { toMarkdown } from './src/report.js';

const cfg = loadConfig();
const PORT = Number(process.env.PORT) || 3000;
const MAX_ACTIVE = Number(process.env.MAX_ACTIVE) || 3;
let active = 0;

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname === '/' || url.pathname === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(await readFile(new URL('./public/index.html', import.meta.url)));
    }
    if (url.pathname === '/api/health') return json(res, 200, { ok: true, demo: cfg.demo, models: cfg.models });
    if (url.pathname === '/api/run') return run(url.searchParams.get('idea'), req, res);
    json(res, 404, { error: 'not found' });
  } catch (err) {
    json(res, 500, { error: err.message });
  }
});

async function run(idea, req, res) {
  if (!idea || idea.trim().length < 8) return json(res, 400, { error: 'Describe the idea in at least a few words.' });
  if (active >= MAX_ACTIVE) return json(res, 429, { error: 'The team is busy. Try again in a minute.' });
  active++;
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  let closed = false;
  req.on('close', () => { closed = true; });
  const send = (e) => { if (!closed) res.write(`data: ${JSON.stringify(e)}\n\n`); };
  send({ type: 'hello', demo: cfg.demo });
  try {
    const dossier = await runMission({ idea, client: cfg.client, models: cfg.models, maxCalls: cfg.maxCalls, onEvent: send });
    send({ type: 'markdown', data: toMarkdown(dossier, { demo: cfg.demo }) });
  } catch (err) {
    send({ type: 'error', bot: 'chief', msg: err.message });
  } finally {
    active--;
    res.end();
  }
}

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

server.listen(PORT, () => {
  console.log(`Grok War Room on http://localhost:${PORT}  (${cfg.demo ? 'DEMO mode, simulated data' : `LIVE, ${cfg.models.chief}`})`);
});
