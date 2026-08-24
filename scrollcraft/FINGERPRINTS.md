# Fingerprints

Every site you build with **scrollcraft** gets one row here, appended after it
ships. The registry exists so your next build can prove it is a different page
rather than a re-skin of one you already made.

This file is **yours**. It starts empty on purpose: the gate is about not
repeating *yourself*, so it has nothing to say until you have built something.

The rules and the gate live in the skill's
`references/uniqueness.md`. Short version:

**A new build must differ from EVERY row below on at least 4 of the 6
dimensions.** Four against each row individually, not four on average across the
table. If a planned build fails, change the plan. Never edit a row to make room
for it.

The six dimensions are: **grammar**, **nav treatment**, **hero device**,
**act-sequence shape**, **close pattern**, **signature move**.

Dimension 6 is free, because a signature move is unique by definition. So the
gate really asks for three more out of the remaining five, and a build that
changes only grammar and world will fail it.

---

## The registry

| Build | Grammar | Nav treatment | Hero device | Act-sequence shape | Close pattern | Signature move | World | Port |
|---|---|---|---|---|---|---|---|---|
| bok-vai | Filmic one-shot | Fixed minimal bar, BOK mark + one CTA ("Reserve your spot") | `pin`, real app screenshot in a CSS phone frame, scale driven from `--sc-p`, corner-anchored greet copy | pin > flow > pin > pan > pin, 5 acts, 12.1vh | Pinned close, spotlight stage, magnetic CTA, footer inside the stage | Type your own idea, a held "reading it" beat, then a `clip-path` wipe to a live-computed score ring and BUILD/KILL/PIVOT badge | Product-photographic: real iOS screenshots of the app, deep navy ground, electric cyan accent | Web, 390px and up |

---

## What is taken

Add a bullet here whenever a build claims something a later build should avoid
reusing: a grammar, a nav treatment, a close pattern, a signature move, an
act-count-and-length band. The shared columns are what the next build inherits
as a constraint, so writing them down is the whole point.

Claimed by **bok-vai** (first build, so it cleared the gate trivially; every
build after this one has to differ from it on 4 of 6):

- **Filmic one-shot** grammar. The next build reaching for it carries
  uniqueness.md's burden of proof, and now also has to differ from this row on
  three of the remaining five dimensions.
- **Fixed minimal bar, wordmark + one CTA.** The default nav for this grammar,
  and now taken.
- **A CSS device frame holding a real product screenshot** as the hero, scaled
  from `--sc-p`. Any other app or SaaS build needs a different first screen.
- **Pinned close with spotlight + magnetic CTA, footer inside the stage.** The
  template's own close pattern, now spent.
- **The act band: 5 acts at 12.1vh.** Sits outside the author's 6-to-7-at-13.6
  band, but is itself now a taken shape.
- **Signature move: the visitor's own input scored live in the page**, revealed
  by a `clip-path` wipe. A different input widget computing a different number
  is the same move; it does not count as new.

---

## Appending a row

After shipping, add one line to the table and one bullet to **What is taken** if
the build claimed something new. Fill every column. Say what the build shares
with existing rows.

Rows are append-only. A build that has been superseded stays in the table,
because the space it occupies is still occupied.

---

## Worked example

The skill's author kept a registry of twelve builds across eight page grammars.
If you want to see what a filled-in table looks like, and which shapes tend to
collide, read `EXAMPLES.md` in the scrollcraft repository. Treat it as
illustration only: those rows are somebody else's builds and they do **not**
constrain yours.
