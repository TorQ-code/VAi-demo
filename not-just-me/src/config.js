import { createGrokClient } from './grok.js';
import { createMockClient } from './mock.js';

export function loadConfig(env = process.env) {
  const demo = env.MOCK === '1' || !env.XAI_API_KEY;
  return {
    demo,
    client: demo ? createMockClient() : createGrokClient({ apiKey: env.XAI_API_KEY, baseUrl: env.XAI_BASE_URL || undefined }),
    models: { chief: env.GROK_MODEL || 'grok-4.5', worker: env.GROK_WORKER_MODEL || env.GROK_MODEL || 'grok-4.5' },
    maxCalls: Number(env.MAX_CALLS) || 18,
  };
}
