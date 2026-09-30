// Offline demo client. Simulated data, clearly labelled. It deliberately makes two mistakes
// (a fabricated link, an invented customer) so you can watch the Chief catch them.

export function createMockClient({ delayMs = [500, 1400] } = {}) {
  const wait = () => new Promise((r) => setTimeout(r, delayMs[0] + Math.random() * (delayMs[1] - delayMs[0])));

  async function respond({ role, user }) {
    await wait();
    const idea = /Idea: (.*)/.exec(user)?.[1] ?? 'your idea';
    const revision = /SENT YOUR LAST DRAFT BACK/.test(user);
    const r = responders[role];
    if (!r) throw new Error(`mock has no responder for ${role}`);
    const { json, citations = [] } = r(idea, revision);
    return { text: JSON.stringify(json), citations, usage: null };
  }
  return { respond, mode: 'demo' };
}

const post = (h, id) => `https://x.com/${h}/status/${id}`;
const SIGNALS = [
  ['demo_sarah_ops', '18410001', 'I have spent 3 hours this week on this exact problem. Why is there no tool that just does it??', 5],
  ['demo_mike_builds', '18410002', 'tried 4 apps for this, all of them are bloated enterprise junk. I just want the one thing', 4],
  ['demo_priya_pm', '18410003', 'honestly would pay $20/mo tomorrow if someone fixed this properly', 5],
  ['demo_leo_founder', '18410004', 'our team hacks this together with a spreadsheet and it breaks every Monday', 3],
];

const responders = {
  'chief-plan': (idea) => ({
    json: {
      brief: `A focused tool that solves "${idea}" for people who feel it weekly, not a platform.`,
      customer: 'Small-team operators and solo founders who currently duct-tape this',
      problem: '"It eats hours every week and every tool I try is bloated"',
      x_queries: [`"${idea.split(' ').slice(0, 3).join(' ')}" annoying`, 'why is there no tool for', 'would pay for an app that'],
      web_queries: [`${idea} software`, `${idea} alternatives pricing`, `${idea} reviews complaints`],
      assignments: {
        scout: 'Find people on X venting about this in the last 90 days. I want verbatim quotes and links, ranked by intensity.',
        recon: 'Map direct and indirect competitors, published prices, and the weakness users complain about most.',
        skeptic: "Try to kill this. Use Scout's and Recon's evidence against it. Find the one assumption that sinks us.",
        architect: 'Cut to a 14-day MVP that tests demand. Max 5 features. One success number.',
        closer: 'Write the landing headline and turn Scout’s people in pain into a first-10-customers list with helpful reply drafts.',
      },
    },
  }),

  scout: (idea, revision) => {
    const good = SIGNALS.map(([h, id, q, i], n) => ({ quote: q, handle: `@${h}`, url: post(h, id), date: `2026-09-${String(10 + n * 4).padStart(2, '0')}`, intensity: i }));
    const fake = { quote: 'this is the biggest problem in my life', handle: '@demo_ghost', url: post('demo_ghost', '99999999'), date: '2026-09-01', intensity: 5 };
    return {
      json: {
        pain_signals: revision ? good : [...good, fake],
        signal_summary: 'People describe it as a weekly time sink and complain that existing tools are bloated. Two of them mention paying for it unprompted.',
        strength: 'moderate',
      },
      citations: good.map((g) => g.url),
    };
  },

  recon: () => {
    const comps = [
      { name: 'BigSuite Pro', url: 'https://example.com/bigsuite', pricing: '$49/user/mo', weakness: 'Onboarding takes weeks. Reviews call it "overkill for small teams"' },
      { name: 'QuickFix', url: 'https://example.com/quickfix', pricing: 'unknown', weakness: 'Abandoned, last update 14 months ago' },
      { name: 'Spreadsheets + Zapier', url: 'https://example.com/zapier-templates', pricing: '$0-30/mo', weakness: 'Breaks silently, and nobody owns it' },
    ];
    return { json: { competitors: comps, crowdedness: 'some', market_gap: 'A dead-simple, single-purpose version for teams under 10 people' }, citations: comps.map((c) => c.url) };
  },

  skeptic: () => ({
    json: {
      kill_reasons: [
        { reason: 'BigSuite could ship a "lite" tier in a quarter and end this', severity: 4, evidence_url: 'https://example.com/bigsuite' },
        { reason: 'A spreadsheet is "good enough" for most people. Pain is real but maybe not $20 real', severity: 4, evidence_url: 'https://example.com/zapier-templates' },
        { reason: 'Only 4 verified complainers so far. That could be a loud minority', severity: 3, evidence_url: null },
      ],
      deadliest_assumption: 'That people who complain on X will actually switch and pay, rather than keep complaining',
      cheapest_test: 'Put up a landing page with a $20/mo pre-order button, reply helpfully to the 4 posters, and count pre-orders in 48h',
    },
  }),

  architect: (idea) => ({
    json: {
      mvp_name: 'OneThing',
      one_liner: `The fastest way to handle "${idea}" without a platform`,
      in_scope: ['Single-screen core workflow', 'Import from spreadsheet', 'Weekly email digest', 'Stripe checkout', 'Magic-link login'],
      out_of_scope: ['Teams and permissions', 'Integrations marketplace', 'Mobile app', 'AI anything until users ask'],
      stack: ['Next.js', 'Postgres (Supabase)', 'Stripe', 'Resend'],
      plan: [{ days: '1-3', goal: 'Landing page and pre-order live, core workflow clickable' }, { days: '4-9', goal: 'Core workflow and import working end to end' }, { days: '10-14', goal: 'Billing, digest, onboard the first 5 users by hand' }],
      success_metric: '5 paying users and 3 of them using it 2 weeks in a row',
    },
  }),

  closer: (idea, revision) => {
    const real = SIGNALS.slice(0, 3).map(([h, id]) => ({
      handle: `@${h}`, source_url: post(h, id),
      why: 'Posted about this pain recently and named the problem precisely',
      reply_draft: 'Felt this too. The trick that helped us: batch it once a week and kill the spreadsheet step. Building a tiny tool that does exactly that. Want early access (free)?',
    }));
    const invented = { handle: '@demo_growthhacker', source_url: 'https://x.com/demo_growthhacker', why: 'Big following', reply_draft: 'Check out my app!!' };
    return {
      json: {
        headline: 'Stop losing Mondays to it.',
        subhead: `One tool for ${idea}. No platform, no onboarding call, and it works in 2 minutes.`,
        price_test: '$19/mo with a pre-order discount. Two posters named ~$20 unprompted',
        channels: ['Helpful replies to people in pain on X', 'Indie Hackers build log', 'Niche Slack and Discord communities'],
        first_customers: revision ? real : [...real, invented],
        launch_post: 'I kept losing hours to this every week, so I built the smallest possible fix. One screen, 2 minutes. Looking for 10 people to break it →',
      },
    };
  },

  'chief-verdict': () => ({
    json: {
      verdict: 'BUILD', confidence: 68,
      headline: 'Real pain, bloated incumbents, and a wedge small enough to win',
      reasons: [
        '4 verified people on X describe weekly pain, and 2 volunteer a price near $20/mo',
        'Incumbents are enterprise-heavy or abandoned, which leaves a clear gap for teams under 10',
        'The biggest risk (complainers won\'t pay) can be tested in 48h for almost nothing',
      ],
      pivot: null,
      next_48h: ['Ship the landing page and pre-order button', "Reply helpfully to Scout's 4 people. Help first, then offer early access", 'Kill it if you get fewer than 3 pre-orders in 7 days'],
    },
  }),
};
