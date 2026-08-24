# BRIEF — bok-vai

Interviewed, not self-authored. Questions 3 and 7 were explicitly deferred to
Claude by the human; those two are marked as decided rather than answered.

## Step 0 — Interview (verbatim)

1. **Vibe / references**: "film". No named references.
2. **Scroll journey, in their words**: "the app on a phone, discription
   [description], app working".
3. **Energy curve**: "Ai choice here" — deferred. Decided below.
4. **Feeling / the one moment**: "the app".
5. **Signature move seed**: "Make you want to use the app".
6. **Aesthetic lane**: "premium-minimal".
7. **One world vs. distinct scenes**: "your choice" — deferred. Decided below.
8. **Assets owned**: the BoK-Build-or-Kill repo. Real VAi/BOK brand kit and
   real iOS screenshots; no footage.

Later, confirmed by the human:
- **CTA, used everywhere**: "Reserve your spot."
- Pre-launch framing approved.

## Subject

BOK ("Build or Kill") validates a startup idea in about 60 seconds and returns
a BUILD / KILL / PIVOT verdict with market analysis, competitor breakdown,
monetization and a 90-day roadmap. Audience: early-stage founders and indie
hackers with an unvalidated idea.

**The belief to install**: this will tell me the truth about my idea, and I
want to be first in line for it.

**Tell-someone sentence**: it's the site where you type your own half-formed
idea and it gives you a verdict on the spot.

## Grammar: filmic one-shot

One linear argument, one arc, no jumping. The visitor should feel carried.

Why the other seven lost: chaptered editorial and gallery want "read this" or
"browse a range" pacing, and this page has neither. Live surface was the real
contender, and it bans marketing chrome outright and wants the close to be an
actual input; the confirmed CTA is a pre-launch reservation button, which that
grammar forbids. Continuous world needs real geography. Typographic poster
forbids the photography, and the real app screenshots are the strongest asset
here. Split stage needs a two-sided argument. Rhythmic cutlist is an energy
brand's grammar and contradicts "premium-minimal".

## Decisions made on the human's behalf

- **Energy curve (Q3)**: quiet open, quieter middle, one spike at the verdict,
  settle at the close. A validator's pitch is credibility, so a loud page would
  undercut it.
- **Distinct scenes, not one unbroken world (Q7)**: worldflight needs real
  geography and is the most fragile thing available. The subject is a piece of
  software, not a place.

## Feeling curve

```
1  Curiosity    the app itself, cold, no preamble, held on a phone
2  Unease       the cost of building on a guess, named plainly, on an empty ground
3  Recognition  THE PEAK. their own idea goes in, and the page answers it
4  Confidence   the real analysis screens travelling sideways
5  Resolve      everything stops, one line, one button
```

Act 2 is the authored silence in front of the peak. It is a near-empty screen
on purpose, so the verification pass should not read it as dead scroll.

## The peak

> "I typed my actual idea into the page and it scored it right there."

Act 3. It gets the largest span on the page (3.6vh against 1.2 to 4.4), the
silence of act 2 in front of it, and the only bespoke code on the page.

## Signature move

The visitor types their own idea into a real field. A held beat ("reading it"),
then a `clip-path` wipe reveals a score ring and a BUILD / KILL / PIVOT badge
computed live in the browser from what they typed.

The heuristic is small, real, and honestly labelled on the card itself as a
quick in-browser read, not the product's real analysis. It reacts to length,
whether an audience is named, whether concrete numbers appear, and whether the
pitch leans on buzzwords. No invented statistics, and no pretending to be the
backend.

## Score table

| Beat | Device | Span | Why this one |
|---|---|---|---|
| Curiosity | `pin` | 2.4 | The product first, in the shared `.device` frame, scaling from `--sc-p` so the app arrives rather than sits |
| Unease | `flow` | — | Plain document rhythm. The page stops performing for one beat, which is what makes the next one land |
| Recognition | `pin` + bespoke | 3.6 | The frame has to hold still while the visitor types. Longest span on the page |
| Confidence | `pan` | 4.4 | Lateral travel reads as breadth. Four real screens as evidence |
| Resolve | `pin` + pointer | 1.2 | The page stops moving and starts responding. Spotlight and magnetic CTA |

Four device families, none twice in a row, zero `scrub` acts (no footage
exists, and faking one would have meant generating a fake product). Total
12.1vh, inside the 8 to 14 budget and outside the author's 13.6-13.8 band.

## What verification found and what changed

Seven real defects. Four were caught by the harness or by direct measurement
before review; three more came from the human's read of the built page, which
is the check no harness performs.

1. **Wrong hero asset.** `hero-home.webp` was the Market tab, not the home
   screen. Replaced with the real input screen.
2. **Three of five acts were not pinning.** `.hero-stage`, `.turn-stage` and
   `.close` carried `height: 100%` and `position` on the same element the
   engine turns into `.sc-stage`, and this page's stylesheet loads after
   `scrollcraft.css`, so they silently beat `position: sticky`. Removed both
   properties from all three; the classes now do flex layout only.
3. **Hero copy failed contrast on mobile** (3.2:1, reported by the 390px
   shoot): absolutely-positioned copy landed on top of the centred phone
   screenshot. The hero now stacks below 860px instead of overlapping.
4. **The pan rail had zero horizontal overflow at desktop widths**, measured
   directly. Fixed-rem items summed to exactly the viewport at 1440px and less
   than it at 1920px, which would have parked act 4 as a dead pinned screen on
   an ordinary monitor. The harness reported "no dead scroll" on every pass, as
   devices.md warns it would. Widths are now viewport-relative and measured
   positive at 1280, 1440, 1920 and 390.

Then, from the human's review of the page itself:

5. **The hero copy overlapped the phone**, reported by the human, confirmed by
   measurement: the copy was absolutely positioned over the stage and ran into
   the device by 137px at 1100 and 56px at 1280, clearing only at 1440 and then
   by 16px. That overlay pattern belongs to full-bleed media; a phone is a
   discrete object. The hero is now a two-column grid, measured at zero overlap
   from 1024 to 1920, and one column below 860px.
6. **The phones were not consistent hardware.** The hero had a CSS frame while
   the analysis screens were raw crops that still carried the simulator's own
   bezel, so the page showed two different kinds of phone. All four screenshots
   are now cropped to screen content only, and one `.device` component draws
   the hardware everywhere: titanium rail, black bezel, inset glass, side
   buttons, raking glare. Callers set `--device-w`; everything else derives.
7. **The rail sat flush against the top of the viewport.** The pan stage is
   100vh but the rail is only as tall as its content, so it was never centred
   and the phones ran under the fixed bar. The stage centres its rail now, and
   device width is capped by viewport height as well as width so a short
   window cannot push the caption past the fold.

Also: the hero screenshot's "Validation failed" error line is covered with the
input card's own background colour rather than cropped out, so the asset keeps
the true 1170x2532 phone ratio the device frame needs.

The lesson worth keeping: every defect in 5 to 7 was visible in the contact
sheets I had already looked at and called clean. The harness measures contrast,
dead scroll and clip decoding, and it passed all three the whole time. It has
no opinion on whether a page looks professional.

## Feel check

Cold read of the contact sheet, one word per act, before rereading this file:
curiosity, quiet, *form*, evidence, resolve.

The diff is at act 3, and it is real: **on a screenshot, the peak reads as the
quietest act on the page**, because the reveal is gated on the visitor's own
input and a scroll harness never types anything. Live it is the biggest change
on the page; on the sheet, act 4 is.

This is left as-is deliberately rather than "fixed", because the alternative is
making the peak fire on scroll, which would destroy the thing that makes it the
peak. It is recorded here as a known limitation of the verification method, not
of the page. Confirmed by hand instead: a scripted browser types a real idea,
clicks Validate, and the ring, badge and reasoning render (73/100, BUILD).
`lab/peak-before.png` and `lab/peak-after.png` are that check.

## Not verified

- **A real phone.** Headless Chromium cannot reproduce iOS touch scrolling or
  Safari's rendering. Nothing here depends on a video decoder, which removes
  the usual worst case, but the mobile pass is still a simulation.
- **The reserve button does nothing.** It is a local confirmation message with
  no backend, and the page says so on its face. Wiring it to a real waitlist is
  outstanding work.
- The Google Fonts request fails in this sandbox (blocked egress), so every
  shot above rendered in the fallback system face. Type will read tighter than
  the sheet suggests once Space Grotesk and Manrope actually load.
