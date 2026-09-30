// The roster. Each bot has one job, a narrow toolset, a JSON contract, and a rubric
// the Chief enforces. `validate` returns a list of issues; empty means "accepted".

export const CHIEF = {
  id: 'chief', name: 'Grok Chief', emoji: '🧠', title: 'Chief of Staff',
  skills: ['mission planning', 'delegation', 'quality review', 'final call'],
  job: 'Turns a raw idea into assignments, reviews every deliverable, sends weak work back, and makes the BUILD / PIVOT / KILL call.',
};

export const AUDITOR = {
  id: 'auditor', name: 'Auditor', emoji: '🧾', title: 'Receipts Officer',
  skills: ['citation matching', 'hallucination gate', 'evidence scoring'],
  job: 'Checks every link against what the search tools actually returned. Deterministic code, not vibes. No receipt, no credit.',
};

const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
const arr = (v) => (Array.isArray(v) ? v : []);

export const BOTS = [
  {
    id: 'scout', name: 'Scout', emoji: '🛰️', title: 'X Pain Hunter',
    tools: ['x_search'], skills: ['X live search', 'pain mining', 'intensity scoring'],
    dependsOn: [],
    job: 'Finds real people on X complaining about this exact problem, recently. Quotes, handles, links.',
    schema: `{"pain_signals":[{"quote":"verbatim excerpt","handle":"@user","url":"https://x.com/user/status/…","date":"YYYY-MM-DD","intensity":1-5}],
"signal_summary":"2 sentences on what people actually say","strength":"none|weak|moderate|strong"}`,
    rubric: 'Up to 8 signals. Only posts you actually found via x_search. Verbatim quotes. If there is little or no signal, set strength to "none" or "weak" and say so. An honest empty result is praised, an invented one gets sent back.',
    validate(o) {
      const issues = [];
      const s = arr(o.pain_signals);
      if (!['none', 'weak', 'moderate', 'strong'].includes(o.strength)) issues.push('strength must be none|weak|moderate|strong');
      if (!isStr(o.signal_summary)) issues.push('signal_summary is missing');
      if (o.strength !== 'none' && s.length === 0) issues.push('strength is not "none" but there are no pain_signals');
      s.forEach((p, i) => {
        if (!isStr(p.quote) || !isStr(p.url)) issues.push(`pain_signals[${i}] needs quote and url`);
      });
      return issues;
    },
    evidence: (o) => arr(o.pain_signals),
  },
  {
    id: 'recon', name: 'Recon', emoji: '🌐', title: 'Competitive Intel',
    tools: ['web_search'], skills: ['web search', 'competitor teardown', 'pricing intel'],
    dependsOn: [],
    job: 'Maps who already solves this, what they charge, and where they are weak.',
    schema: `{"competitors":[{"name":"","url":"https://…","pricing":"as published, or 'unknown'","weakness":"specific, from reviews/complaints"}],
"crowdedness":"empty|some|crowded","market_gap":"the one gap nobody covers well"}`,
    rubric: '3-6 real competitors including indirect ones (spreadsheets, agencies, doing nothing). Only prices you actually saw. Otherwise write "unknown".',
    validate(o) {
      const issues = [];
      const c = arr(o.competitors);
      if (!['empty', 'some', 'crowded'].includes(o.crowdedness)) issues.push('crowdedness must be empty|some|crowded');
      if (!isStr(o.market_gap)) issues.push('market_gap is missing');
      if (o.crowdedness !== 'empty' && c.length < 2) issues.push('list at least 2 competitors (indirect ones count)');
      c.forEach((x, i) => { if (!isStr(x.name) || !isStr(x.url)) issues.push(`competitors[${i}] needs name and url`); });
      return issues;
    },
    evidence: (o) => arr(o.competitors),
  },
  {
    id: 'skeptic', name: 'Skeptic', emoji: '🔪', title: 'Red Team',
    tools: [], skills: ['assumption hunting', 'failure pre-mortem', 'cheap-test design'],
    dependsOn: ['scout', 'recon'],
    job: "Builds the strongest honest case to KILL the idea, using the team's evidence against it.",
    schema: `{"kill_reasons":[{"reason":"","severity":1-5,"evidence_url":"a URL from the team evidence, or null"}],
"deadliest_assumption":"the one belief that, if false, ends this","cheapest_test":"how to test it in under 48h for under $100"}`,
    rubric: '3-5 kill reasons ranked by severity. Cite team evidence where possible. Never cite a URL that is not in the evidence list.',
    validate(o) {
      const issues = [];
      const k = arr(o.kill_reasons);
      if (k.length < 3) issues.push('give at least 3 kill_reasons');
      k.forEach((x, i) => { if (!isStr(x.reason)) issues.push(`kill_reasons[${i}].reason missing`); });
      if (!isStr(o.deadliest_assumption)) issues.push('deadliest_assumption is missing');
      if (!isStr(o.cheapest_test)) issues.push('cheapest_test is missing');
      return issues;
    },
  },
  {
    id: 'architect', name: 'Architect', emoji: '📐', title: 'MVP Scoper',
    tools: [], skills: ['ruthless scoping', 'stack selection', '14-day build plan'],
    dependsOn: ['scout', 'recon'],
    job: 'Cuts the idea to the smallest thing that proves demand, and plans a 14-day build.',
    schema: `{"mvp_name":"","one_liner":"","in_scope":["max 5 features"],"out_of_scope":["what we deliberately skip"],
"stack":["boring, proven tools"],"plan":[{"days":"1-3","goal":""}],"success_metric":"one number that means it works"}`,
    rubric: 'At most 5 in-scope features. The plan must fit in 14 days. The success metric must be a number a founder can measure in week 3.',
    validate(o) {
      const issues = [];
      const inScope = arr(o.in_scope);
      if (!isStr(o.mvp_name) || !isStr(o.one_liner)) issues.push('mvp_name and one_liner are required');
      if (inScope.length === 0) issues.push('in_scope is empty');
      if (inScope.length > 5) issues.push(`in_scope has ${inScope.length} features, max is 5. Cut harder`);
      if (arr(o.out_of_scope).length === 0) issues.push('out_of_scope must name what you are cutting');
      if (arr(o.plan).length === 0) issues.push('plan is empty');
      if (!isStr(o.success_metric) || !/\d/.test(o.success_metric)) issues.push('success_metric must contain a number');
      return issues;
    },
  },
  {
    id: 'closer', name: 'Closer', emoji: '📣', title: 'Go-To-Market',
    tools: [], skills: ['positioning', 'copywriting', 'first-10-customers'],
    dependsOn: ['scout', 'recon'],
    job: "Writes the landing copy and a first-10-customers list built from the people Scout found in pain, with reply drafts for a human to send.",
    schema: `{"headline":"","subhead":"","price_test":"what to charge first and why","channels":[""],
"first_customers":[{"handle":"@user from Scout's signals","source_url":"their post url","why":"","reply_draft":"<=280 chars, helpful not spammy"}],
"launch_post":"a post for X, <=280 chars"}`,
    rubric: 'first_customers must come only from Scout\'s verified signals. Never invent people. Replies must lead with help, not a pitch, and stay at 280 characters or fewer.',
    validate(o, ctx) {
      const issues = [];
      if (!isStr(o.headline) || !isStr(o.subhead)) issues.push('headline and subhead are required');
      if (!isStr(o.price_test)) issues.push('price_test is missing');
      if (isStr(o.launch_post) && o.launch_post.length > 280) issues.push('launch_post is over 280 chars');
      const fc = arr(o.first_customers);
      const known = new Set((ctx?.verifiedHandles ?? []).map(normHandle));
      const need = Math.min(3, known.size);
      if (fc.length < need) issues.push(`Scout found ${known.size} verified people in pain. List at least ${need} of them as first_customers`);
      fc.forEach((c, i) => {
        if (known.size && !known.has(normHandle(c.handle))) issues.push(`first_customers[${i}] ${c.handle} is not in Scout's verified signals. No invented people`);
        if (isStr(c.reply_draft) && c.reply_draft.length > 280) issues.push(`first_customers[${i}].reply_draft is over 280 chars`);
      });
      return issues;
    },
  },
];

export const VERDICT_SCHEMA = `{"verdict":"BUILD|PIVOT|KILL","confidence":0-100,"headline":"one punchy line",
"reasons":["3 reasons, each grounded in team output"],"pivot":"if PIVOT, the specific pivot, else null",
"next_48h":["3 concrete actions for the founder"]}`;

export function normHandle(h) {
  return String(h ?? '').trim().replace(/^@/, '').toLowerCase();
}
