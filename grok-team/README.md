# 🧠 Grok Bot Forge

**Which Grok Bot should you build? The team finds out, then builds it.**

xAI's **Grok Bot Template Rewards** pays creators based on how many people use their template **and how consistently they keep using it**. So the hard part isn't building *a* bot. It's knowing **which** bot people will use every day, and designing it so they come back.

Give Grok Chief a problem, a bot idea, or just an audience ("freelancers"). The team:
1. finds recurring chores people complain about on X (with receipts),
2. checks which templates, GPTs and automations already exist,
3. ranks the candidates on **verified** demand,
4. designs the winner **field by field for the Grok Bot builder**: name, title, character (shape and color), instructions, routines and notifications,
5. red-teams the design and merges guardrails into the instructions,
6. scores repeat use, and
7. writes the launch kit.

The verdict is **BUILD THIS / REWORK / SKIP**.

## The team

| Bot | Job | Skills and tools |
|---|---|---|
| 🧠 **Grok Chief** (Chief of Staff) | Picks Discover or Forge mode, writes the assignments, ranks candidates, sends back weak work, and makes the final call | planning, ranking, review |
| 🛰️ **Scout** (Demand Hunter) | Finds people on X describing a task they repeat daily or weekly. Recurring pain is what makes a bot a habit | `x_search` |
| 🌐 **Recon** (Template Market) | Checks existing Grok Bot templates, GPTs, Zapier recipes and apps, and where each falls short | `web_search` |
| 📐 **Architect** (Bot Designer) | Designs the Bot Card exactly as the builder asks for it | instructions, routines |
| 🔪 **Red Team** (Trust & Safety) | Least-privilege access, prompt injection, spam and X rules. Its guardrail lines are merged into the instructions | security review |
| 📣 **Closer** (Launch) | Template listing, launch post, try-it prompts, a 30-second demo script, and replies to people already asking (a human sends them) | copy, adoption |
| 🔁 **Habit Scorer** · *code* | A transparent repeat-use score: every point has a reason | retention model |
| 🧾 **Auditor** · *code* | Checks every cited link against what the search tools actually returned | hallucination gate |

## Rules the Chief enforces

**Sent back to the bot for revision:**
- A link the search tool never returned
- A bot that can send, post, pay, book or delete **without an "ask me first" rule**
- No recurring routine (repeat use is what gets paid)
- A shape or color the builder doesn't offer
- Instructions outside 150-700 words, or missing the Role or Rules section
- A reply aimed at someone who isn't in Scout's verified signals

**Scored by code:**
- **Forge Score** ranks candidates on demand × gap × frequency. Proof counts only if the Auditor verified it: 0 receipts earns 25%, and 3 or more earns 100%.
- **Habit score:** daily routine +40, weekdays +38, weekly +28, notifications +15, first-run quick win +15, ends in a digest +10, asks before acting +10, and −10 if it needs 4 or more connected apps.

**Gates the Chief can't overrule:** BUILD THIS needs 3 or more verified demand signals, a habit score of 50 or more, a Red Team rating other than "unsafe", and no open design flags. Otherwise it's downgraded to REWORK.

## Run it

Requires Node 18+. There are no dependencies.

```bash
cd grok-team
npm run demo                      # offline demo with simulated data → http://localhost:3000
XAI_API_KEY=xai-... npm start     # live, using Grok with x_search and web_search
node cli.js "small landlords"     # terminal version; saves a Markdown Bot Card
npm test
```

In demo mode the Chief catches two planted mistakes (a fabricated X link, and a bot that would reply to email without asking), and the Red Team merges three guardrails.

**Run it as a real team of Grok Bots (no code):** [`grok-bot/chief.md`](grok-bot/chief.md) sets up Chief as the manager. Upload [`grok-bot/TEAM.md`](grok-bot/TEAM.md) to Chief's Files, and Chief creates Scout, Recon, Architect, Red Team, Closer, Habit Coach and Auditor as separate bots. It then runs every mission with numbered work orders and reports, sends weak work back, and creates the winning bot after you approve.

| Env var | Default | |
|---|---|---|
| `XAI_API_KEY` | none | If unset, the app runs in demo mode |
| `GROK_MODEL` | `grok-4.5` | The Chief's model |
| `GROK_WORKER_MODEL` | same as `GROK_MODEL` | |
| `MAX_CALLS` | `18` | Model-call budget for each run |

It uses xAI's Responses API (`POST /v1/responses`) with the server-side `x_search` and `web_search` tools.

## Layout

```
server.js           HTTP + Server-Sent Events (live comms feed)
cli.js              terminal runner
src/chief.js        plan → Scout+Recon → rank → Architect → Red Team → merge → Closer+Habit → audit → verdict
src/team.js         roster, Bot Card format (shapes, colors, frequencies), approval rules, habit score
src/receipts.js     Auditor
src/grok.js         xAI Responses API client
src/mock.js         offline demo client
src/report.js       Markdown Bot Card + dossier
public/index.html   the UI (the Bot Card mirrors the Grok Bot builder)
grok-bot/chief.md   Chief (the manager) as a Grok Bot: setup, instructions, routines
grok-bot/TEAM.md    Bot Cards for the 7 teammates Chief creates
```
