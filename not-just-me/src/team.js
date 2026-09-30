// The roster. LLM bots have one job, a narrow toolset, a JSON contract and a rubric.
// Code bots (Safety Officer, Auditor) are plain rules the Chief can't overrule.
import { lockFixes } from './safety.js';
import { audit } from './receipts.js';

const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
const arr = (v) => (Array.isArray(v) ? v : []);
const needUrl = (list, name, key = 'url') => list.flatMap((x, i) => (isStr(x?.[key]) ? [] : [`${name}[${i}] needs a ${key}`]));

export const CHIEF = {
  id: 'chief', name: 'Grok Chief', emoji: '🧠', title: 'Incident Commander',
  skills: ['triage', 'search planning', 'delegation', 'quality review', 'final call'],
  job: 'Triages what broke, plans the searches, assigns the team, sends back anything without receipts, and makes the call: is it just you?',
};

export const TEAM = [
  {
    id: 'echo', name: 'Echo', emoji: '🛰️', title: 'X Signal Hunter',
    tools: ['x_search'], skills: ['live X search', 'symptom matching', 'spike timing'], dependsOn: [],
    job: 'Finds people on X hitting the same problem right now, and pins down when it started and what triggered it.',
    schema: `{"reports":[{"quote":"verbatim","handle":"@user","url":"https://x.com/…/status/…","date":"YYYY-MM-DD","match":"exact|similar"}],
"spread":"none|few|many|widespread","trigger":"what seems to have started it (an update, a batch, an outage) or 'unknown'","summary":"2 sentences"}`,
    rubric: 'Up to 10 reports from the last 60 days, newest first, and only posts you actually found. "exact" means the same product and symptom. If nobody else has it, say spread "none". That is a valid, useful answer.',
    validate(o) {
      const issues = [];
      if (!['none', 'few', 'many', 'widespread'].includes(o.spread)) issues.push('spread must be none|few|many|widespread');
      if (!isStr(o.summary)) issues.push('summary is missing');
      if (o.spread !== 'none' && arr(o.reports).length === 0) issues.push('spread is not "none" but there are no reports');
      arr(o.reports).forEach((r, i) => { if (!isStr(r.quote)) issues.push(`reports[${i}] needs a verbatim quote`); });
      return [...issues, ...needUrl(arr(o.reports), 'reports')];
    },
    evidence: (o) => ({ items: arr(o.reports), key: 'url' }),
  },
  {
    id: 'rights', name: 'Rights', emoji: '⚖️', title: 'Entitlements Researcher',
    tools: ['web_search'], skills: ['recall databases', 'service bulletins', 'warranty terms', 'class actions'], dependsOn: [],
    job: 'Finds recalls, service bulletins, warranty coverage and class actions, so you know what you are owed before you pay for anything.',
    schema: `{"recalls":[{"title":"","authority":"NHTSA|CPSC|FDA|manufacturer|other","url":"","applies_if":"which models/serials/dates"}],
"bulletins":[{"title":"","url":""}],"class_actions":[{"name":"","url":"","status":"investigation|filed|settlement","deadline":"YYYY-MM-DD or null"}],
"warranty":"the coverage that normally applies, and for how long","entitlement_summary":"plain English: what this person is probably owed"}`,
    rubric: 'Check official recall sources first (NHTSA, CPSC, the manufacturer). Empty lists are fine. Never invent a recall or a settlement. Include deadlines whenever they are published.',
    validate(o) {
      const issues = [];
      for (const k of ['recalls', 'bulletins', 'class_actions']) if (!Array.isArray(o[k])) issues.push(`${k} must be a list (empty is fine)`);
      if (!isStr(o.warranty)) issues.push('warranty is missing');
      if (!isStr(o.entitlement_summary)) issues.push('entitlement_summary is missing');
      return [...issues, ...needUrl(arr(o.recalls), 'recalls'), ...needUrl(arr(o.bulletins), 'bulletins'), ...needUrl(arr(o.class_actions), 'class_actions')];
    },
    evidence: (o) => ({ items: [...arr(o.recalls), ...arr(o.bulletins), ...arr(o.class_actions)], key: 'url' }),
  },
  {
    id: 'fixer', name: 'Fixer', emoji: '🔧', title: 'Fix Finder',
    tools: ['x_search', 'web_search'], skills: ['fix mining', 'confirmation counting', 'risk rating'], dependsOn: [],
    job: 'Collects the fixes that actually worked for other people, ranked by how many people confirmed them.',
    schema: `{"fixes":[{"title":"","steps":["short, numbered-style steps"],"source_url":"","confirmations":0,"risk":"safe|moderate|pro_only","minutes":0}],
"no_fix_reason":"if you found no fix, why"}`,
    rubric: 'Up to 5 fixes, safest and free first. confirmations is the number of people who said it worked, or 0 if unknown. Only fixes from sources you actually found.',
    validate(o) {
      const issues = [];
      const f = arr(o.fixes);
      if (!f.length && !isStr(o.no_fix_reason)) issues.push('no fixes and no no_fix_reason');
      if (f.length > 5) issues.push('max 5 fixes');
      f.forEach((x, i) => {
        if (!isStr(x.title) || !arr(x.steps).length) issues.push(`fixes[${i}] needs a title and steps`);
      });
      return [...issues, ...needUrl(f, 'fixes', 'source_url')];
    },
    evidence: (o) => ({ items: arr(o.fixes), key: 'source_url' }),
  },
  {
    id: 'safety', name: 'Safety Officer', emoji: '🦺', title: 'Hazard Gate', code: true,
    tools: [], skills: ['hazard rules', 'fix lockout'], dependsOn: ['fixer'],
    job: 'Plain rules, not a model. Locks any fix that involves mains power, gas, brakes, airbags, batteries or bypassing a safety part.',
    run(ctx) {
      const fixes = ctx.outputs.fixer?.fixes ?? [];
      const locked = lockFixes(fixes, ctx.hazards);
      const out = { hazards: ctx.hazards, locked };
      const msg = locked.length ? `Locked ${locked.length} fix(es) as pro-only: ${locked.join('; ')}` : 'No dangerous fixes found';
      return { out, msg, status: locked.length || ctx.hazards.length ? 'flagged' : 'done' };
    },
  },
  {
    id: 'advocate', name: 'Advocate', emoji: '📨', title: 'Claims Writer',
    tools: [], skills: ['support escalation', 'claim letters', 'public posts'], dependsOn: ['echo', 'rights', 'safety'],
    job: 'Writes the message that gets you a free repair, replacement or refund, citing the evidence that the problem is widespread.',
    schema: `{"ask_for":"repair|replacement|refund|credit, and one line on why","support_message":"<=1200 chars, firm and polite, cites the evidence",
"public_post":"<=280 chars for X, factual, no insults","escalation":["ordered steps if support stalls"],
"deadlines":["time limits to watch: warranty end, chargeback window, claim deadline"],"evidence_urls":["only URLs from the team evidence"]}`,
    rubric: 'Ask only for what the evidence supports. Cite team evidence URLs only. Stay factual so the message holds up with a regulator or a card issuer. No legal threats you can\'t back.',
    validate(o) {
      const issues = [];
      if (!isStr(o.ask_for)) issues.push('ask_for is missing');
      if (!isStr(o.support_message)) issues.push('support_message is missing');
      else if (o.support_message.length > 1200) issues.push('support_message is over 1200 chars');
      if (isStr(o.public_post) && o.public_post.length > 280) issues.push('public_post is over 280 chars');
      if (arr(o.escalation).length < 2) issues.push('give at least 2 escalation steps');
      return issues;
    },
    refs: (o) => arr(o.evidence_urls),
  },
  {
    id: 'auditor', name: 'Auditor', emoji: '🧾', title: 'Receipts Officer', code: true,
    tools: [], skills: ['citation matching', 'hallucination gate'], dependsOn: ['echo', 'rights', 'fixer', 'advocate'],
    job: 'Plain code that checks every cited link against what the search tools actually returned. No receipt, no credit.',
    run(ctx) {
      const o = ctx.outputs;
      const claims = [
        ...arr(o.echo?.reports).map((r) => ({ bot: 'echo', url: r.url })),
        ...[...arr(o.rights?.recalls), ...arr(o.rights?.bulletins), ...arr(o.rights?.class_actions)].map((r) => ({ bot: 'rights', url: r.url })),
        ...arr(o.fixer?.fixes).map((f) => ({ bot: 'fixer', url: f.source_url })),
        ...arr(o.advocate?.evidence_urls).map((u) => ({ bot: 'advocate', url: u })),
      ];
      const out = audit(claims, ctx.ledger);
      const msg = out.score === null ? out.note : `Receipts score ${out.score}% (${out.verified}/${out.total}). ${out.note}`;
      return { out, msg, status: out.flagged.length ? 'flagged' : 'done' };
    },
  },
];

export const VERDICT_SCHEMA = `{"verdict":"NOT_JUST_YOU|JUST_YOU|TOO_EARLY","confidence":0-100,"headline":"one line the person will remember",
"likely_cause":"best evidence-backed explanation","do_now":["3 ordered steps, safest and free first"],"avoid":["things that would void the warranty or make it worse"]}`;
