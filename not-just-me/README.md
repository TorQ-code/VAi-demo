# not just me?

**Something broke. Is it just you?**

When your phone, car, dishwasher, router or app starts misbehaving, you have two questions:

1. **Is it just me, or is everyone hitting this?**
2. **Is there a fix, and am I owed a free repair, replacement or refund?**

Answering them today takes an hour of digging through X, forums, recall databases and warranty fine print. Downdetector only covers website outages. But when a product breaks for lots of people, **the complaints show up on X first**, often days before any recall, support article or news story. Grok can search X live, so a Grok-led team can answer both questions in about a minute, with receipts.

## The team

Grok Chief manages six teammates. Four are Grok models with narrow jobs. Two are **plain code**, so no model can argue its way past them.

| Bot | Job | Skills and tools |
|---|---|---|
| 🧠 **Grok Chief** (Incident Commander) | Triages the problem, writes the search plan, gives each bot a specific assignment, reviews every deliverable, sends back work that fails review, and makes the final call | triage, delegation, review |
| 🛰️ **Echo** (X Signal Hunter) | Finds people on X with the same problem right now, with quotes, links and dates, and pins down when it started and what triggered it | `x_search` |
| ⚖️ **Rights** (Entitlements) | Finds recalls (NHTSA, CPSC, manufacturer), service bulletins, warranty terms and class actions, including their deadlines | `web_search` |
| 🔧 **Fixer** (Fix Finder) | Finds the fixes that actually worked for others, ranked by how many people confirmed them, safest first | `x_search` + `web_search` |
| 🦺 **Safety Officer** (Hazard Gate) · *code* | Flags hazards at intake (gas, CO, smoke, sparks, swollen batteries, brakes, airbags, shocks) **before any model runs**, and locks any fix that touches mains power, gas, brakes, batteries or bypasses a safety part | rules |
| 📨 **Advocate** (Claims Writer) | Writes the support message, a public post and an escalation path, citing the evidence that the problem is widespread | escalation, claims |
| 🧾 **Auditor** (Receipts Officer) · *code* | Checks every cited link against what the search tools actually returned, and scores the case | citation matching |

## How the Chief runs a case

```
intake ─▶ Safety Officer (hazard scan, before any model)
       ─▶ Chief: plan + assignments
       ─▶ wave 1 (parallel): Echo · Rights · Fixer
       ─▶ Safety Officer: lock dangerous fixes
       ─▶ Advocate: claim built on verified evidence only
       ─▶ Auditor: receipts score
       ─▶ Chief: verdict ─▶ evidence gates
```

**Review and send back.** Every deliverable has to match a JSON format and a rubric. Work goes back to the bot with the exact problems listed when:
- Echo, Rights or Fixer cite a link their search tool never returned (a fabricated receipt)
- Advocate cites anything outside the team's verified evidence
- a format rule fails, for example a public post over 280 characters, a fix with no steps, or no escalation path

**Evidence gates the Chief can't overrule:**
- **"It's not just you"** needs at least 3 verified reports. Otherwise the verdict becomes **"Too early to tell"**, with confidence capped at 45%.
- **"Looks like just you"** is overruled when 5 or more verified people report the same thing.
- A receipts score under 50% caps confidence at 40%.
- If a hazard is detected, the safety instructions always come first in "Do this now", and every DIY fix is locked.

**Other guardrails:**
- a model-call budget for each case (18 calls by default)
- web and X content is treated as untrusted data, which guards against prompt injection
- nothing is ever posted for you
- "not legal advice" appears on every report

## What you get

- **The verdict:** It's not just you / Looks like just you / Too early to tell, with confidence
- **How many verified people** have the problem, plus a **timeline chart** showing when it started (for example, "spiked after the Sep 23 update")
- **Do this now:** safety first, then free fixes, then claims, plus what to avoid (like voiding your warranty)
- **Fixes that worked,** ranked by confirmations, with dangerous ones locked
- **What you're owed:** recalls, bulletins, class actions and deadlines
- **Your claim, ready to send:** a support message, a public post, escalation steps and deadlines (with copy buttons)
- A downloadable Markdown case report

## Run it

Requires Node 18+. There are no dependencies.

```bash
cd not-just-me
npm run demo                     # offline demo with simulated data → http://localhost:3000
XAI_API_KEY=xai-... npm start    # live, using Grok with x_search and web_search
node cli.js "dishwasher shows E24 and won't drain" --product "Kelvin DW-500"
npm test
```

**Demo mode** makes three deliberate mistakes so you can watch the team catch them live:
- Echo cites an X post the search never returned. The Chief sends it back.
- Fixer suggests "bypass the thermal fuse". The Safety Officer locks it.
- Advocate cites a link outside the evidence. The Chief sends it back.

Try the "⚠️ Swelling battery" example to see the hazard gate fire before any model runs.

| Env var | Default | |
|---|---|---|
| `XAI_API_KEY` | none | If unset, the app runs in demo mode |
| `GROK_MODEL` | `grok-4.5` | The Chief's model |
| `GROK_WORKER_MODEL` | same as `GROK_MODEL` | Use a faster or cheaper model for the workers |
| `MAX_CALLS` | `18` | Model-call budget for each case |
| `PORT` | `3000` | |

It uses xAI's Responses API (`POST /v1/responses`) with the server-side `x_search` and `web_search` tools. The citations returned by the API are what the Auditor checks links against.

## Layout

```
server.js          HTTP + Server-Sent Events (live case log)
cli.js             terminal runner, saves a Markdown case report
src/engine.js      Grok Chief: plan → waves → review loop → verdict + evidence gates
src/team.js        roster: jobs, tools, JSON formats, rubrics, validators, code bots
src/safety.js      Safety Officer rules: intake hazards and fix lockout
src/receipts.js    Auditor: URL normalisation, citation matching, scoring
src/grok.js        xAI Responses API client (retries, timeouts, citation extraction)
src/mock.js        offline demo client
src/report.js      Markdown case report
public/index.html  the UI
```
