# 🧠 Grok War Room

**One startup idea in. A team of bots. Receipts out.**

Grok Chief is a manager bot. It takes a raw startup idea, writes a mission brief, and hands out work to five specialist bots. It reviews each deliverable against a rubric and **sends weak or made-up work back**. At the end it gives a **BUILD / PIVOT / KILL** verdict, backed by real posts on X and checked by a code-based Auditor.

Most "AI idea validators" give you opinions. This one gives you **evidence and a list of real people already asking for the product**.

## The team

| Bot | Job | Skills and tools |
|---|---|---|
| 🧠 **Grok Chief** (Chief of Staff) | Plans the mission, writes each bot's assignment, reviews every deliverable, sends work back, and makes the final call | planning, delegation, quality review |
| 🛰️ **Scout** (X Pain Hunter) | Finds real people on X complaining about this exact problem recently, with verbatim quotes and links | `x_search` (Grok's live X search) |
| 🌐 **Recon** (Competitive Intel) | Finds existing competitors, their published prices, and the weakness users complain about most | `web_search` |
| 🔪 **Skeptic** (Red Team) | Builds the strongest honest case to kill the idea, using the team's own evidence, and designs a test that takes under 48 hours and costs under $100 | pre-mortem |
| 📐 **Architect** (MVP Scoper) | Cuts the idea to at most 5 features, a 14-day plan, and one success number | ruthless scoping |
| 📣 **Closer** (Go-To-Market) | Writes landing copy and a **first-customers list built from the people Scout found**, with reply drafts for a human to send | copy, outreach |
| 🧾 **Auditor** (Receipts Officer) | Checks that every cited link was actually returned by a search tool. It is plain code, not an LLM, so it can't be talked into anything | hallucination gate |

## How the Chief manages the team

1. **Plan.** Grok Chief restates the idea sharply, names the customer and the pain, writes the X and web search queries, and writes a specific assignment for each bot.
2. **Delegate in waves.** Scout and Recon run in parallel. Skeptic, Architect and Closer then run in parallel on top of their evidence.
3. **Review and send back.** Every deliverable is checked against a JSON contract and a rubric. Work is sent back with the specific problems listed (one revision by default) when:
   - Scout cites a post the `x_search` tool never returned (a fabricated receipt)
   - Closer lists a "customer" who isn't in Scout's verified signals (an invented person)
   - Architect goes over 5 features, or gives a success metric without a number
4. **Audit.** The Auditor scores the dossier as the percentage of cited links that a search tool actually returned.
5. **Decide, with guardrails.** The Chief can't approve BUILD on vibes. With fewer than 3 verified pain signals, **BUILD is downgraded to PIVOT** and confidence is capped at 45%. A receipts score below 50% caps confidence at 40%.

Other guardrails: a call budget for each mission (16 calls by default), X and web content treated as untrusted data in every prompt (to resist prompt injection), and **no auto-posting**. Bots write the drafts, and a human sends them.

## Run it

Requires Node 18+. There are no dependencies.

```bash
cd grok-team
npm run demo                     # offline demo with simulated data → http://localhost:3000
XAI_API_KEY=xai-... npm start    # live, using Grok with x_search and web_search
node cli.js "shift-swap app for nurses"   # terminal version; saves a Markdown dossier
npm test
```

The demo mode includes two deliberate bot mistakes, a fabricated X link and an invented customer, so you can watch the Chief catch both of them live.

| Env var | Default | |
|---|---|---|
| `XAI_API_KEY` | none | If unset, the app runs in demo mode |
| `GROK_MODEL` | `grok-4.5` | The Chief's model |
| `GROK_WORKER_MODEL` | same as `GROK_MODEL` | Use a cheaper or faster model for the workers |
| `MAX_CALLS` | `16` | Model-call budget for each mission |
| `PORT` | `3000` | |

It uses xAI's Responses API (`POST /v1/responses`) with the server-side `x_search` and `web_search` tools. Citations come back from the API, and that is what the Auditor checks links against.

## Layout

```
server.js         HTTP + Server-Sent Events (live war-room stream)
cli.js            terminal runner
src/chief.js      the manager: plan → waves → review loop → audit → verdict + evidence gate
src/team.js       bot roster: jobs, tools, JSON contracts, rubrics, validators
src/receipts.js   Auditor: URL normalisation, citation matching, scoring
src/grok.js       xAI Responses API client (retries, timeouts, citation extraction)
src/mock.js       offline demo client
src/report.js     Markdown dossier
public/index.html the war-room UI
```
