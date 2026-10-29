# Building def-platform

**Project report · 28–29 October 2026 · 12 commits**

Two days from an empty idea to a playable wheelchair platformer with **one full level, a
settings screen, two languages, a toggleable boost, and a develop/main bookkeeping process
borrowed from three other projects** — written in plain HTML/CSS/JavaScript with no build step
and nothing installed. This is both days of work, in order, with the handful of decisions that
are actually worth remembering.

| | |
| --- | --- |
| Commits | 12 |
| Days | 2 |
| Task IDs | 1 (DEFPL-1) |
| Curated levels | 1 |
| Languages | 2 |
| Framework | none |

> **This is not [CHANGELOG.md](CHANGELOG.md), and does not replace it.** The changelog is written
> for someone who should not need the repo open: what the game does now, in player-facing terms.
> This is the engineering narrative behind it — the order things actually happened in, and the
> decisions that never reached a release note. Where the two disagree about a date or a detail,
> the changelog and the commit history win; this file is derived from them.

---

## Contents

| Era | Date | Subject |
| --- | --- | --- |
| 1 | Oct 28 | Level 1, a rebrand mid-build, and one-key play |
| 2 | Oct 29 | The process arrives, then corrects itself twice |
| — | — | Patterns, and what's next |

---

## How to read this

def-platform is Deficientezinho: a 2D canvas platformer where you roll a wheelchair through an
obstacle course built, like most cities, by people who never tried it. There's no npm, no
bundler, no package.json — `index.html` is the whole install. That also means this report is
short: a feature-complete first level, its controls, and its settings screen all shipped inside
one day, before any task-tracking or branch convention existed at all — which is exactly why era
2 is about adding one.

> ### The one recurring theme
>
> The game didn't know its own name while it was being built. It shipped with a placeholder
> **"EFFICIENZINO"** credit line and finish banner, pulled in two separate commits (first the
> title-screen "presents" line, then the word everywhere else). Only after that did the real
> tagline — "um passeio do caralho" — land, and it survived exactly **66 seconds** before being
> censored to "um passeio do cara\*\*\*" (17:29:37 → 17:30:43, same evening). Branding settled
> last, not first.

---

# The two days

## 1 · Level 1, a rebrand mid-build, and one-key play

**Oct 28 · 9 commits**

> **In plain words** — The whole game, in one sitting: physics, a level, controls, a settings
> screen, two languages, a default avatar, and a bug find-and-fix — with the brand changing
> underneath it twice along the way.

The day opened with the entire dependency-free engine landing in one commit: momentum-based
wheelchair physics, ramps, curbs, gaps, moving platforms, carts, checkpoints, a boost battery,
signs, title/win screens, touch controls and sound effects, all built straight on top of a
`<canvas>`. There was no scaffolding stage — the first commit is already a playable Level 1.

The placeholder "EFFICIENZINO" branding that shipped with it didn't last the day: its
title-screen credit line went first, then the word everywhere else it appeared (the finish
banner, the README, the first accessibility-tour sign, the browser tab). A buried-coin bug
followed — coins arcing over ground weren't following the surface at the curbs or the first park
hill, fixed by having their arc track the terrain under them rather than a flat offset.

Numpad support arrived next (4/6 roll, 8/0 hop, 2/5 brake), and then the day's biggest single
commit: one-key play. Mid-air steering got strong enough, and the hop got tall enough, that a
single directional tap during a jump now moves the player forward — nobody has to hold two keys
at once. Boost became a toggle (numpad 5 / B) instead of a hold, with Settings able to switch it
back; a settings screen appeared for boost mode, language and character, remembered in the
browser; every piece of on-screen text moved into `js/i18n.js` with Portuguese (Portugal) as the
default and English as the alternative; and a new avatar was drawn in the logo's own crayon
style.

The logo avatar became the *default* character in the next commit — deliberately paired with a
settings-storage-key bump, so that anyone who'd already saved a preference under the old key got
reset to the new defaults once, cleanly, instead of needing a migration written for an audience
that didn't exist yet.

The day closed with the real branding: a tagline under the title, "um passeio do caralho", added
to the title screen, the browser tab and the README — and censored to "um passeio do cara\*\*\*"
one minute later.

---

## 2 · The process arrives, then corrects itself twice

**Oct 29 · 3 commits**

> **In plain words** — The project got a branch convention, a task ledger, a changelog and two
> agents in one commit, borrowed from Sphinx, DigiSpin and Watchr — and then the changelog that
> commit wrote needed fixing twice, on its own branches, by its own new rules.

def-platform had shipped a full game the day before with no branch convention, no task ledger
and no changelog, while GitHub Pages deployed straight from `main` on every push — the same
situation Watchr's Railway deploy is in. **DEFPL-1** brought in the same answer those three
projects already use: `develop` for day-to-day work, `main` reserved for a deliberate release,
task IDs registered in `TASKS.md`, a `CHANGELOG.md`, and `commit`/`changelog-updater` agents
adapted from Sphinx's (with the Expo- and `app.json`-specific steps dropped, since there's
nothing here to version).

That first changelog backfill covered the gameplay but missed something clearly visible on
screen: the whole EFFICIENZINO-removal-and-rebrand arc from era 1. A second, unnumbered commit
added it. A third, also unnumbered, then trimmed one of those two new bullets back out. Both
follow-ups landed the way DEFPL-1 itself now requires — each on its own branch, fast-forwarded
into `develop`, branch deleted both locally and on the remote — the new process being used on
itself within hours of existing.

---

# Patterns, and what's next

Read across both days, three things stand out:

- **Ship first, name second.** A full playable level existed before the game had a settled
  title, tagline, or brand — the placeholder credit came out in pieces, and the real tagline
  didn't land until the day's last commit, then changed again a minute after that.
- **Reset forward instead of migrating backward.** The settings-key bump in era 1 is the whole
  pattern: when there's no real installed base yet, changing the storage key is simpler and
  safer than writing code to migrate old values.
- **A new process gets exercised immediately.** DEFPL-1 wrote the branch-per-change rule, and the
  very next two commits — both pure changelog corrections — followed it to the letter rather than
  being pushed straight to `develop`.

> ### Where it stands
>
> One level, no automated tests, two languages, and a develop/main workflow that's one day old.
> `TASKS.md` has one task closed (`DEFPL-1`) and nothing open; the next registered ID is
> `DEFPL-2`. The changelog needed two corrections before it matched the actual screen — a reminder
> that "backfill the changelog" means reading every diff, not every commit subject.

---

*Range: `9d7fb84..HEAD` · 12 commits · 2026-10-28 → 2026-10-29*

*Sources: CHANGELOG.md, TASKS.md, CLAUDE.md and the commit bodies themselves. Figures are as
recorded at the time each change landed.*
