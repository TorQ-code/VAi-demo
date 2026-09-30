// Render a dossier as Markdown for sharing.
export function toMarkdown(d, { demo = false } = {}) {
  const { outputs: o, verdict: v, receipts: r } = d;
  const L = [];
  const tick = (x) => (x === true ? '✅' : x === false ? '⚠️ unverified' : '·');
  L.push(`# Grok War Room dossier: ${d.idea}`);
  if (demo) L.push(`> **DEMO MODE.** Simulated data, not real posts.`);
  L.push(`\n## Verdict: **${v.verdict}** (${v.confidence}% confidence)\n\n**${v.headline}**`);
  if (v.gate) L.push(`\n> ${v.gate}`);
  v.reasons.forEach((x) => L.push(`- ${x}`));
  if (v.pivot) L.push(`\n**Pivot:** ${v.pivot}`);
  L.push(`\n### Next 48 hours`); v.next_48h.forEach((x, i) => L.push(`${i + 1}. ${x}`));
  L.push(`\n## Receipts\n${r.score === null ? r.note : `**${r.score}%** of cited links verified (${r.verified}/${r.total}). ${r.note}`}`);
  if (o.scout) {
    L.push(`\n## 🛰️ Scout: pain on X (${o.scout.strength})\n${o.scout.signal_summary}\n`);
    (o.scout.pain_signals ?? []).forEach((p) => L.push(`- ${tick(p.verified)} "${p.quote}" by ${p.handle ?? ''}, ${p.date ?? ''} (${'🔥'.repeat(p.intensity || 0)}) ${p.url}`));
  }
  if (o.recon) {
    L.push(`\n## 🌐 Recon: competitors (${o.recon.crowdedness})\n**Gap:** ${o.recon.market_gap}\n\n| Name | Pricing | Weakness |\n|---|---|---|`);
    (o.recon.competitors ?? []).forEach((c) => L.push(`| [${c.name}](${c.url}) ${tick(c.verified)} | ${c.pricing} | ${c.weakness} |`));
  }
  if (o.skeptic) {
    L.push(`\n## 🔪 Skeptic: how this dies\n**Deadliest assumption:** ${o.skeptic.deadliest_assumption}\n\n**Cheapest test:** ${o.skeptic.cheapest_test}\n`);
    (o.skeptic.kill_reasons ?? []).forEach((k) => L.push(`- [sev ${k.severity}] ${k.reason}${k.evidence_url ? ` (${k.evidence_url})` : ''}`));
  }
  if (o.architect) {
    const a = o.architect;
    L.push(`\n## 📐 Architect: ${a.mvp_name}\n${a.one_liner}\n\n**In:** ${(a.in_scope ?? []).join(', ')}\n\n**Out:** ${(a.out_of_scope ?? []).join(', ')}\n\n**Stack:** ${(a.stack ?? []).join(', ')}\n`);
    (a.plan ?? []).forEach((p) => L.push(`- Days ${p.days}: ${p.goal}`));
    L.push(`\n**Success metric:** ${a.success_metric}`);
  }
  if (o.closer) {
    const c = o.closer;
    L.push(`\n## 📣 Closer: go-to-market\n# ${c.headline}\n${c.subhead}\n\n**Price test:** ${c.price_test}\n\n**Channels:** ${(c.channels ?? []).join(', ')}\n\n### First customers (a human sends these)`);
    (c.first_customers ?? []).forEach((f) => L.push(`- **${f.handle}** (${f.source_url}): ${f.why}\n  > ${f.reply_draft}`));
    L.push(`\n**Launch post:** ${c.launch_post}`);
  }
  L.push(`\n---\n${d.stats.calls} model calls · ${(d.stats.ms / 1000).toFixed(1)}s · ${d.created}`);
  return L.join('\n');
}
