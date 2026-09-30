// Offline demo client with simulated, clearly labelled data. It makes three deliberate mistakes:
// Echo cites a post the tool never returned, Fixer suggests a dangerous fix, and Advocate
// cites a link outside the evidence. Watch the team catch all three.

export function createMockClient({ delayMs = [500, 1400] } = {}) {
  const wait = () => new Promise((r) => setTimeout(r, delayMs[0] + Math.random() * (delayMs[1] - delayMs[0])));
  async function respond({ role, user }) {
    await wait();
    const product = /Product: ([^(\n]+)/.exec(user)?.[1]?.trim();
    const p = !product || /not given|unknown/i.test(product) ? 'the device' : product;
    const revision = /SENT YOUR LAST DRAFT BACK/.test(user);
    const r = R[role];
    if (!r) throw new Error(`mock has no responder for ${role}`);
    const { json, citations = [] } = r(p, revision, user);
    return { text: JSON.stringify(json), citations, usage: null };
  }
  return { respond, mode: 'demo' };
}

const post = (h, id) => `https://x.com/${h}/status/${id}`;
const REPORTS = [
  ['demo_jen_k', '1839001', 'anyone else\'s {p} acting up since the update this week?? did everything right and it still happens', '2026-09-23', 'exact'],
  ['demo_marcus_t', '1839002', 'same thing here. {p} started this on Tuesday after the update. support told me to "restart it" lol', '2026-09-24', 'exact'],
  ['demo_ana_r', '1839003', 'ok so it\'s not just me. {p} broken again. 3rd time this week', '2026-09-24', 'exact'],
  ['demo_dev_patel', '1839004', 'there\'s a whole thread of people with this on {p}. rolling back fixed it for me', '2026-09-25', 'similar'],
  ['demo_kim_lo', '1839005', 'did the reset. worked for a day, then it came back. {p} is driving me insane', '2026-09-27', 'exact'],
  ['demo_sam_w', '1839006', 'is the company going to acknowledge this or what. {p}, same issue as everyone', '2026-09-28', 'exact'],
];
const fill = (s, p) => s.replaceAll('{p}', p);

const R = {
  'chief-plan': (p, _r, user) => ({
    json: {
      summary: (/Problem: (.*)/.exec(user)?.[1] ?? 'Device misbehaving').slice(0, 140),
      product: p, category: 'electronics',
      x_queries: [`${p} not working since update`, `${p} anyone else`, `${p} broken again`],
      web_queries: [`${p} recall`, `${p} service bulletin`, `${p} class action`],
      assignments: {
        echo: 'Find people on X with this exact symptom in the last 60 days. I need dates, so we can see whether it spiked after something.',
        rights: 'Check official recall databases, manufacturer bulletins, and any class-action investigations. Get the warranty terms.',
        fixer: 'Find what actually fixed it for other people. Count the "worked for me" replies. Safest first.',
        advocate: 'Draft the claim to the manufacturer using the widespread evidence. Ask only for what the evidence supports.',
      },
    },
  }),

  echo: (p, revision) => {
    const good = REPORTS.map(([h, id, q, date, match]) => ({ quote: fill(q, p), handle: `@${h}`, url: post(h, id), date, match }));
    const fake = { quote: 'mine literally exploded lmao', handle: '@demo_ghost', url: post('demo_ghost', '9999999'), date: '2026-09-26', match: 'similar' };
    return {
      json: {
        reports: revision ? good : [...good.slice(0, 3), fake, ...good.slice(3)],
        spread: 'many',
        trigger: 'The firmware update that rolled out around Sep 23',
        summary: `Reports cluster right after the Sep 23 update. Several people say the usual reset only helps for a day, and one says rolling back fixed it.`,
      },
      citations: good.map((g) => g.url),
    };
  },

  rights: (p) => {
    const json = {
      recalls: [],
      bulletins: [{ title: `Known issue: ${p} behaviour after the September update (support article)`, url: 'https://example.com/support/known-issue-0923' }],
      class_actions: [{ name: `${p} firmware defect investigation`, url: 'https://example.com/law/investigation-0923', status: 'investigation', deadline: null }],
      warranty: '1-year limited manufacturer warranty covering defects. Firmware faults are covered, and user damage is not.',
      entitlement_summary: 'No recall yet. But the manufacturer has acknowledged a known issue, so a warranty repair or replacement is a reasonable ask. Document everything in case the investigation becomes a settlement.',
    };
    return { json, citations: [...json.bulletins, ...json.class_actions].map((x) => x.url) };
  },

  fixer: () => {
    const fixes = [
      { title: 'Roll back to the previous firmware', steps: ['Open Settings → System → Updates', 'Choose "Previous version"', 'Turn off auto-update until a patch ships'], source_url: post('demo_dev_patel', '1839004'), confirmations: 7, risk: 'safe', minutes: 10 },
      { title: 'Full reset, then restore from backup', steps: ['Back up your data', 'Settings → Reset → Reset all settings', 'Restore from the backup'], source_url: 'https://example.com/support/known-issue-0923', confirmations: 3, risk: 'moderate', minutes: 30 },
      { title: 'Open the case and bypass the thermal fuse', steps: ['Remove the back panel', 'Jumper the thermal fuse', 'Reassemble'], source_url: post('demo_kim_lo', '1839005'), confirmations: 1, risk: 'moderate', minutes: 45 },
    ];
    return { json: { fixes }, citations: [post('demo_dev_patel', '1839004'), 'https://example.com/support/known-issue-0923', post('demo_kim_lo', '1839005')] };
  },

  advocate: (p, revision) => ({
    json: {
      ask_for: 'A free warranty repair or replacement. The fault started with your own update and is widely reported.',
      support_message: `Hello, my ${p} developed a fault right after the update released around Sep 23. Your own known-issue article describes it, and many other owners are reporting the same symptom publicly. Since this is a firmware defect within the warranty period, I'm requesting a free repair or replacement. If a fix is only coming later, please confirm in writing that this case will stay open and covered past my warranty end date. Case evidence is attached.`,
      public_post: `My ${p} broke right after the Sep 23 update, and I'm not the only one. Is a fix coming? Please confirm that affected units are covered under warranty.`,
      escalation: ['Open a support case and get a case number in writing', 'If there is no resolution in 7 days, ask for escalation to a supervisor and reply to their official X account publicly', 'If a repair is refused, file a complaint with your state attorney general or consumer protection agency, and with the FTC at reportfraud.ftc.gov'],
      deadlines: ['Warranty ends 1 year from the purchase date. Get the case opened before then.', 'Card chargeback windows are usually about 60 days from the statement date, so check yours.'],
      evidence_urls: revision
        ? ['https://example.com/support/known-issue-0923', post('demo_marcus_t', '1839002'), post('demo_ana_r', '1839003')]
        : ['https://example.com/support/known-issue-0923', 'https://example.com/news/total-recall-coming-soon'],
    },
  }),

  'chief-verdict': (p) => ({
    json: {
      verdict: 'NOT_JUST_YOU', confidence: 82,
      headline: `It's not you. It's the Sep 23 update, and at least 6 other ${p} owners have the same problem.`,
      likely_cause: 'A firmware regression in the update that rolled out around Sep 23. The manufacturer has already published a known-issue article.',
      do_now: ['Roll back to the previous firmware (7 people confirm it works) and pause auto-updates', 'Open a warranty case now and quote the known-issue article', 'Screenshot the problem with dates, in case the investigation turns into a settlement'],
      avoid: ['Opening the case yourself. That voids the warranty.', 'Paying for a third-party repair before the manufacturer responds'],
    },
  }),
};
