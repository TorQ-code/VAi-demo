// Render a Forge dossier as Markdown: a paste-ready Bot Card plus the evidence behind it.
export function toMarkdown(d, { demo = false } = {}) {
  const { outputs: o, verdict: v, receipts: r, card: c } = d;
  const L = [];
  const tick = (x) => (x === true ? '✅' : x === false ? '⚠️ unverified' : '');
  L.push(`# Bot Forge: ${c?.name ?? 'bot'}`, `**Brief:** ${d.idea}`);
  if (demo) L.push('> **DEMO MODE.** Simulated data, not real posts.');
  L.push(`\n## Verdict: **${v.verdict.replace('_', ' ')}** (${v.confidence}%)\n**${v.headline}**`);
  if (v.gate) L.push(`\n> ${v.gate}`);
  v.why.forEach((x) => L.push(`- ${x}`));
  L.push('\n### Next steps'); v.next_steps.forEach((x, i) => L.push(`${i + 1}. ${x}`));

  if (c && !c._failed) {
    L.push(`\n---\n## 🤖 Bot Card (paste into the Grok Bot app)\n`);
    L.push(`| Field | Value |\n|---|---|\n| Name | ${c.name} |\n| Title | ${c.title ?? ''} |\n| Character | ${c.shape}, ${c.color} |\n| Notifications | ${c.notifications ? 'On' : 'Off'} |\n| Connect | ${(c.needs_access ?? []).join(', ') || 'nothing'} |`);
    L.push(`\n### Instructions\n\n\`\`\`markdown\n${c.instructions}\n\`\`\``);
    L.push('\n### Routines');
    (c.routines ?? []).forEach((x) => L.push(`- **${x.name}** (${x.when || x.frequency}): ${x.prompt}`));
    L.push(`\n**First run:** ${c.first_run}`);
    if (c.links?.length) L.push(`\n**Links:** ${c.links.join(', ')}`);
  }
  L.push(`\n## 🔁 Habit score: ${o.habit.score}/100`);
  o.habit.parts.forEach((p) => L.push(`- ${p.points > 0 ? '+' : ''}${p.points}: ${p.why}`));
  o.habit.tips.forEach((t) => L.push(`- 💡 ${t}`));

  if (o.closer && !o.closer._failed) {
    L.push(`\n## 📣 Launch kit\n**Template listing:** ${o.closer.listing}\n\n**Launch post:** ${o.closer.launch_post}\n\n**Try it:**`);
    (o.closer.try_prompts ?? []).forEach((p) => L.push(`- "${p}"`));
    L.push('\n**30-second demo:**'); (o.closer.demo_script ?? []).forEach((b, i) => L.push(`${i + 1}. ${b}`));
    if (o.closer.reply_to?.length) { L.push('\n**People already asking for this (you send these replies):**'); o.closer.reply_to.forEach((x) => L.push(`- ${x.handle} (${x.url}): ${x.reply}`)); }
  }
  if (o.redteam && !o.redteam._failed) {
    L.push(`\n## 🔪 Red Team (${o.redteam.verdict})`);
    (o.redteam.risks ?? []).forEach((x) => L.push(`- [sev ${x.severity}] ${x.risk} → ${x.fix}`));
    L.push('\n**Permissions:**'); (o.redteam.permissions ?? []).forEach((p) => L.push(`- ${p.app}: ${p.access} (${p.why})`));
  }
  L.push('\n## 🏁 Candidates (Forge Score, from verified evidence only)');
  o.rank.candidates.forEach((x, i) => L.push(`${i + 1}. **${x.name}** (${x.forge_score}): ${x.job} · ${x.frequency} · demand ${x.demand}/5 · gap ${x.gap}/5 · ${x.verified_evidence} verified receipts`));
  L.push(`\n## 🛰️ Demand on X (${o.scout.strength})\n${o.scout.summary}\n`);
  (o.scout.signals ?? []).forEach((s) => L.push(`- ${tick(s.verified)} "${s.quote}" by ${s.handle}, ${s.date}: ${s.url}`));
  L.push(`\n## 🌐 Already out there (${o.recon.saturation})\n**Gap:** ${o.recon.gap}\n`);
  (o.recon.existing ?? []).forEach((x) => L.push(`- [${x.name}](${x.url}) (${x.kind}): ${x.weakness} ${tick(x.verified)}`));
  L.push(`\n## 🧾 Receipts\n${r.score === null ? r.note : `${r.score}% verified (${r.verified}/${r.total}). ${r.note}`}`);
  L.push(`\n---\n${d.stats.calls} model calls · ${(d.stats.ms / 1000).toFixed(1)}s · ${d.created}`);
  return L.join('\n');
}
