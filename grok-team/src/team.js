// The Bot Forge roster. LLM bots have one job, a narrow toolset, a JSON contract and a rubric.
// Code bots (Habit Scorer, Auditor) are plain rules the Chief can't overrule.

export const SHAPES = ['circle', 'blob', 'squircle', 'pill', 'triangle', 'hexagon', 'cloud', 'drop'];
export const COLORS = ['black', 'brown', 'red', 'orange', 'amber', 'green', 'teal', 'blue', 'purple', 'pink', 'gray'];
export const FREQUENCIES = ['hourly', 'daily', 'weekdays', 'weekly', 'monthly', 'on-demand'];

const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
const arr = (v) => (Array.isArray(v) ? v : []);
// Actions a bot must never take without the user's OK.
export const RISKY_ACTION = /\b(send|reply|post|publish|tweet|dm|email (?:them|the)|buy|purchase|pay|order|book|delete|cancel|unsubscribe|submit|sign up)\b/i;
export const APPROVAL = /\b(ask (?:me|the user|for approval)|get (?:my )?approval|confirm with me|wait for (?:my )?(?:ok|approval|confirmation)|never .{0,40}without (?:my )?(?:approval|ok|confirmation)|draft(?:s)? (?:only|for (?:my )?review))\b/i;

export const CHIEF = {
  id: 'chief', name: 'Grok Chief', emoji: '🧠', title: 'Chief of Staff',
  skills: ['mission planning', 'candidate ranking', 'quality review', 'final call'],
  job: 'Figures out which bot is worth building, assigns the team, sends back weak work, and makes the call: BUILD THIS, REWORK or SKIP.',
};

export const BOTS = [
  {
    id: 'scout', name: 'Scout', emoji: '🛰️', title: 'Demand Hunter', tools: ['x_search'],
    skills: ['X live search', 'recurring-pain mining'], dependsOn: [],
    job: 'Finds people on X asking for help with a task they have to do again and again. Recurring pain is what makes a bot get used every week.',
    schema: `{"signals":[{"quote":"verbatim","handle":"@user","url":"https://x.com/…/status/…","date":"YYYY-MM-DD","task":"the recurring task in 5 words","frequency":"hourly|daily|weekdays|weekly|monthly|on-demand"}],
"summary":"2 sentences","strength":"none|weak|moderate|strong"}`,
    rubric: 'Up to 10 signals, only posts you actually found. Prefer recurring tasks over one-off wishes. An honest "none" is praised.',
    validate(o) {
      const issues = [];
      if (!['none', 'weak', 'moderate', 'strong'].includes(o.strength)) issues.push('strength must be none|weak|moderate|strong');
      if (!isStr(o.summary)) issues.push('summary is missing');
      if (o.strength !== 'none' && !arr(o.signals).length) issues.push('strength is not "none" but there are no signals');
      arr(o.signals).forEach((s, i) => { if (!isStr(s.quote) || !isStr(s.url) || !isStr(s.task)) issues.push(`signals[${i}] needs quote, url and task`); });
      return issues;
    },
    evidence: (o) => ({ items: arr(o.signals), key: 'url' }),
  },
  {
    id: 'recon', name: 'Recon', emoji: '🌐', title: 'Template Market Intel', tools: ['web_search'],
    skills: ['template marketplace scan', 'competing tools'], dependsOn: [],
    job: 'Checks what already exists: Grok Bot templates, GPTs, Zapier recipes and apps that do this job. It finds where they fall short.',
    schema: `{"existing":[{"name":"","url":"","kind":"grok-template|gpt|automation|app","weakness":""}],"saturation":"empty|some|crowded","gap":"what nobody does well"}`,
    rubric: 'Up to 6 real alternatives, including non-bot ones. Empty is fine. Never invent a template.',
    validate(o) {
      const issues = [];
      if (!['empty', 'some', 'crowded'].includes(o.saturation)) issues.push('saturation must be empty|some|crowded');
      if (!isStr(o.gap)) issues.push('gap is missing');
      arr(o.existing).forEach((x, i) => { if (!isStr(x.name) || !isStr(x.url)) issues.push(`existing[${i}] needs name and url`); });
      return issues;
    },
    evidence: (o) => ({ items: arr(o.existing), key: 'url' }),
  },
  {
    id: 'architect', name: 'Architect', emoji: '📐', title: 'Bot Designer', tools: [],
    skills: ['instructions', 'routines', 'approval checkpoints', 'character'], dependsOn: ['scout', 'recon', 'rank'],
    job: 'Designs the winning bot field by field, exactly as the Grok Bot builder asks for it: name, title, character, instructions, routines and notifications.',
    schema: `{"name":"<=20 chars, friendly","title":"<=40 chars","shape":"${SHAPES.join('|')}","color":"${COLORS.join('|')}",
"instructions":"paste-ready, 150-700 words, markdown sections: ## Role, ## What you do, ## How you work, ## Output format, ## Rules",
"routines":[{"name":"","frequency":"${FREQUENCIES.join('|')}","when":"e.g. weekdays 7:30am","prompt":"what the bot does on each run"}],
"notifications":true,"first_run":"the task a new user should try first, a quick win in under 2 minutes",
"links":["public URLs worth adding under Links, or none"],"needs_access":["apps or accounts the user must connect"]}`,
    rubric: 'One job, done excellently. 1-3 routines, and at least one must be recurring. Any action that sends, posts, pays, books or deletes must say it asks the user first. Instructions a stranger can use without editing.',
    validate(o) {
      const issues = [];
      if (!isStr(o.name) || o.name.length > 20) issues.push('name is required, max 20 chars');
      if (isStr(o.title) && o.title.length > 40) issues.push('title is over 40 chars');
      if (!SHAPES.includes(o.shape)) issues.push(`shape must be one of ${SHAPES.join(', ')}`);
      if (!COLORS.includes(o.color)) issues.push(`color must be one of ${COLORS.join(', ')}`);
      const words = String(o.instructions ?? '').split(/\s+/).filter(Boolean).length;
      if (words < 120 || words > 900) issues.push(`instructions are ${words} words, keep them between 150 and 700`);
      for (const h of ['## Role', '## Rules']) if (!String(o.instructions ?? '').includes(h)) issues.push(`instructions need a "${h}" section`);
      const r = arr(o.routines);
      if (!r.length || r.length > 3) issues.push('give 1-3 routines');
      r.forEach((x, i) => {
        if (!FREQUENCIES.includes(x.frequency)) issues.push(`routines[${i}].frequency must be one of ${FREQUENCIES.join(', ')}`);
        if (!isStr(x.prompt)) issues.push(`routines[${i}] needs a prompt`);
      });
      if (r.length && r.every((x) => x.frequency === 'on-demand')) issues.push('at least one routine must be recurring. Repeat use is what gets rewarded');
      if (!isStr(o.first_run)) issues.push('first_run is missing');
      const text = [o.instructions, ...r.map((x) => x.prompt)].join('\n');
      if (RISKY_ACTION.test(text) && !APPROVAL.test(text)) issues.push(`the bot can "${RISKY_ACTION.exec(text)[0]}" but never asks for approval. Add an explicit "ask me before…" rule`);
      return issues;
    },
  },
  {
    id: 'redteam', name: 'Red Team', emoji: '🔪', title: 'Trust & Safety', tools: [],
    skills: ['least privilege', 'prompt-injection defense', 'policy check'], dependsOn: ['architect'],
    job: 'Attacks the design: too much access, spammy behaviour, prompt injection from emails or web pages, and anything that breaks X rules. It returns guardrail lines that get merged into the instructions.',
    schema: `{"risks":[{"risk":"","severity":1-5,"fix":""}],"permissions":[{"app":"","access":"read|write","why":""}],
"guardrail_lines":["short imperative rules to append to the instructions"],"verdict":"safe|fixable|unsafe"}`,
    rubric: '3-6 concrete risks. Read access by default, write only where the job needs it. Guardrail lines must be specific to this bot, not generic.',
    validate(o) {
      const issues = [];
      if (arr(o.risks).length < 3) issues.push('find at least 3 concrete risks');
      if (!arr(o.guardrail_lines).length) issues.push('give at least one guardrail line');
      if (!['safe', 'fixable', 'unsafe'].includes(o.verdict)) issues.push('verdict must be safe|fixable|unsafe');
      return issues;
    },
  },
  {
    id: 'closer', name: 'Closer', emoji: '📣', title: 'Launch & Adoption', tools: [],
    skills: ['template listing', 'launch post', 'demo script'], dependsOn: ['architect', 'scout'],
    job: 'Writes the template listing, the launch post for X, the try-it prompts and a 30-second demo script, so people install it and keep using it.',
    schema: `{"listing":"template description, <=300 chars, leads with the outcome","launch_post":"<=280 chars","try_prompts":["3 prompts a new user can paste"],
"demo_script":["4-6 beats for a 30-second screen recording"],"reply_to":[{"handle":"@user from Scout's signals","url":"their post","reply":"<=280 chars, helpful, human-sent"}]}`,
    rubric: 'Sell the outcome, not the AI. reply_to may only use handles from Scout\'s verified signals. Every reply is sent by a human and must lead with help.',
    validate(o, ctx) {
      const issues = [];
      if (!isStr(o.listing) || o.listing.length > 300) issues.push('listing is required, max 300 chars');
      if (!isStr(o.launch_post) || o.launch_post.length > 280) issues.push('launch_post is required, max 280 chars');
      if (arr(o.try_prompts).length < 3) issues.push('give 3 try_prompts');
      const known = new Set(ctx.verifiedHandles.map(normHandle));
      arr(o.reply_to).forEach((r, i) => {
        if (known.size && !known.has(normHandle(r.handle))) issues.push(`reply_to[${i}] ${r.handle} is not in Scout's verified signals. No invented people`);
        if (String(r.reply ?? '').length > 280) issues.push(`reply_to[${i}].reply is over 280 chars`);
      });
      return issues;
    },
  },
];

export const CODE_BOTS = {
  habit: {
    id: 'habit', name: 'Habit Scorer', emoji: '🔁', title: 'Retention Model', code: true, tools: [],
    skills: ['repeat-use scoring'], job: 'Plain code. Scores how likely people are to keep using the bot, because repeat use is what Template Rewards pays for.',
  },
  auditor: {
    id: 'auditor', name: 'Auditor', emoji: '🧾', title: 'Receipts Officer', code: true, tools: [],
    skills: ['citation matching', 'hallucination gate'], job: 'Plain code. Checks every cited link against what the search tools returned. No receipt, no credit.',
  },
};

// Repeat-use score, 0-100. Transparent on purpose: every point has a reason.
export function habitScore(card) {
  const weight = { hourly: 30, daily: 40, weekdays: 38, weekly: 28, monthly: 12, 'on-demand': 0 };
  const parts = [];
  const best = Math.max(0, ...arr(card?.routines).map((r) => weight[r.frequency] ?? 0));
  parts.push({ points: best, why: best ? `Best routine runs ${arr(card.routines).find((r) => weight[r.frequency] === best).frequency}` : 'No recurring routine' });
  if (card?.notifications) parts.push({ points: 15, why: 'Notifications on, so results reach the user' });
  if (isStr(card?.first_run)) parts.push({ points: 15, why: 'First-run quick win defined' });
  if (arr(card?.routines).some((r) => /\b(digest|brief|summary|report|recap|roundup)\b/i.test(`${r.name} ${r.prompt}`))) parts.push({ points: 10, why: 'Delivers a digest people read' });
  if (APPROVAL.test(card?.instructions ?? '')) parts.push({ points: 10, why: 'Asks before acting, so people trust it' });
  if (arr(card?.needs_access).length > 3) parts.push({ points: -10, why: 'Needs 4+ connected apps, which makes setup harder' });
  const score = Math.max(0, Math.min(100, parts.reduce((s, p) => s + p.points, 0)));
  const tips = [];
  if (best < 38) tips.push('Add a daily or weekday routine. Rewards follow repeat use.');
  if (!card?.notifications) tips.push('Turn notifications on so the bot reaches people instead of waiting to be opened.');
  if (!parts.some((p) => /digest/.test(p.why))) tips.push('End each run with a short digest the user will actually read.');
  return { score, parts, tips };
}

export const RANK_SCHEMA = `{"candidates":[{"name":"working name","job":"the one recurring job it does","audience":"who","frequency":"${FREQUENCIES.join('|')}",
"demand":1-5,"gap":1-5,"evidence_urls":["Scout signal URLs that prove demand"],"why":"one line"}],"pick":0}`;

export const VERDICT_SCHEMA = `{"verdict":"BUILD_THIS|REWORK|SKIP","confidence":0-100,"headline":"one punchy line",
"why":["3 reasons grounded in team output"],"next_steps":["3 concrete steps, starting with creating it in the Grok Bot app"]}`;

export function normHandle(h) {
  return String(h ?? '').trim().replace(/^@/, '').toLowerCase();
}
