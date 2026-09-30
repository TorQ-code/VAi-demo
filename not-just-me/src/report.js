import { label } from './engine.js';

export function toMarkdown(r, { demo = false } = {}) {
  const { outputs: o, verdict: v, receipts: rc, timeline: t } = r;
  const L = [];
  const tick = (x) => (x === true ? '✅' : x === false ? '⚠️ unverified' : '');
  L.push(`# Not Just Me: case report`, `**Problem:** ${r.problem}${r.product ? `  \n**Product:** ${r.product}` : ''}`);
  if (demo) L.push('> **DEMO MODE.** Simulated data, not real posts.');
  if (r.hazards.length) L.push(`\n> ⚠️ **SAFETY FIRST:** ${r.hazards.map((h) => h.msg).join(' ')}`);
  L.push(`\n## ${label(v.verdict)} (${v.confidence}% confidence)\n**${v.headline}**\n\n**Likely cause:** ${v.likely_cause}`);
  if (v.gate) L.push(`\n> ${v.gate}`);
  L.push(`\n**Verified reports:** ${t.verified}${t.first_seen ? `, first seen ${t.first_seen}, peak ${t.peak}` : ''}`);
  L.push('\n### Do this now'); v.do_now.forEach((x, i) => L.push(`${i + 1}. ${x}`));
  if (v.avoid.length) { L.push('\n### Avoid'); v.avoid.forEach((x) => L.push(`- ${x}`)); }
  if (o.fixer) {
    L.push('\n## 🔧 Fixes that worked for others');
    (o.fixer.fixes ?? []).forEach((f) => {
      L.push(`\n**${f.title}** (${f.risk}, ${f.confirmations ?? 0} confirmations${f.minutes ? `, ~${f.minutes} min` : ''}) ${tick(f.verified)}`);
      if (f.locked) L.push(`> 🦺 LOCKED: ${f.safety_note}`); else (f.steps ?? []).forEach((s, i) => L.push(`${i + 1}. ${s}`));
      L.push(`Source: ${f.source_url}`);
    });
  }
  if (o.rights) {
    const x = o.rights;
    L.push(`\n## ⚖️ What you're owed\n${x.entitlement_summary}\n\n**Warranty:** ${x.warranty}`);
    x.recalls?.forEach((c) => L.push(`- RECALL (${c.authority}): [${c.title}](${c.url}), applies if ${c.applies_if} ${tick(c.verified)}`));
    x.bulletins?.forEach((c) => L.push(`- Bulletin: [${c.title}](${c.url}) ${tick(c.verified)}`));
    x.class_actions?.forEach((c) => L.push(`- Class action (${c.status}${c.deadline ? `, deadline ${c.deadline}` : ''}): [${c.name}](${c.url}) ${tick(c.verified)}`));
  }
  if (o.advocate) {
    const a = o.advocate;
    L.push(`\n## 📨 Your claim\n**Ask for:** ${a.ask_for}\n\n${a.support_message}\n\n**Public post:** ${a.public_post}\n\n**If they stall:**`);
    (a.escalation ?? []).forEach((s, i) => L.push(`${i + 1}. ${s}`));
    if (a.deadlines?.length) { L.push('\n**Deadlines:**'); a.deadlines.forEach((d) => L.push(`- ${d}`)); }
  }
  if (o.echo) {
    L.push(`\n## 🛰️ Others with the same problem (${o.echo.spread})\n${o.echo.summary}\n`);
    (o.echo.reports ?? []).forEach((p) => L.push(`- ${tick(p.verified)} ${p.date} ${p.handle}: "${p.quote}" ${p.url}`));
  }
  L.push(`\n## 🧾 Receipts\n${rc.score === null ? rc.note : `${rc.score}% of cited links verified (${rc.verified}/${rc.total}). ${rc.note}`}`);
  L.push(`\n---\nNot legal advice. ${r.stats.calls} model calls · ${(r.stats.ms / 1000).toFixed(1)}s · ${r.created}`);
  return L.join('\n');
}
