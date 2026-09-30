// Minimal xAI client over the Responses API (POST /v1/responses).
// Server-side tools (x_search, web_search) run on xAI's side; we get text + citations back.

export class GrokError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

export function createGrokClient({
  apiKey,
  baseUrl = 'https://api.x.ai/v1',
  fetchImpl = globalThis.fetch,
  timeoutMs = 180_000,
  retries = 2,
} = {}) {
  if (!apiKey) throw new Error('XAI_API_KEY is required (or run with MOCK=1)');

  async function respond({ model, system, user, tools = [] }) {
    const body = {
      model,
      input: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    };
    if (tools.length) body.tools = tools.map((type) => ({ type }));

    let lastErr;
    for (let attempt = 0; attempt <= retries; attempt++) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const res = await fetchImpl(`${baseUrl}/responses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify(body),
          signal: ctrl.signal,
        });
        if (!res.ok) {
          const detail = (await res.text()).slice(0, 400);
          const err = new GrokError(`xAI ${res.status}: ${detail}`, res.status);
          if (res.status === 429 || res.status >= 500) { lastErr = err; await sleep(1000 * 2 ** attempt); continue; }
          throw err;
        }
        const data = await res.json();
        return { text: extractText(data), citations: extractCitations(data), usage: data.usage ?? null };
      } catch (err) {
        if (err instanceof GrokError && err.status < 500 && err.status !== 429) throw err;
        lastErr = err;
        if (attempt < retries) await sleep(1000 * 2 ** attempt);
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastErr;
  }

  return { respond, mode: 'live' };
}

export function extractText(data) {
  if (typeof data?.output_text === 'string' && data.output_text) return data.output_text;
  const parts = [];
  for (const item of data?.output ?? []) {
    if (item?.type !== 'message') continue;
    for (const c of item.content ?? []) if (typeof c?.text === 'string') parts.push(c.text);
  }
  if (parts.length) return parts.join('\n');
  return data?.choices?.[0]?.message?.content ?? '';
}

export function extractCitations(data) {
  const urls = new Set();
  const add = (u) => { if (typeof u === 'string' && /^https?:\/\//.test(u)) urls.add(u); };
  for (const c of data?.citations ?? []) add(typeof c === 'string' ? c : c?.url);
  for (const item of data?.output ?? []) {
    for (const c of item?.content ?? []) for (const a of c?.annotations ?? []) add(a?.url);
  }
  return [...urls];
}

export function parseJson(text) {
  const cleaned = String(text ?? '').replace(/```(?:json)?/gi, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('No JSON object in model output');
  return JSON.parse(cleaned.slice(start, end + 1));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
