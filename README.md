# Deficientezinho: um passeio do cara***

A 2D platformer where you roll a wheelchair through an obstacle course built
(like most cities) by people who never tried it. Curbs, ramps, a staircase-only
"main entrance", a broken elevator, and shopping carts with strong opinions.

**Play:** open `index.html` in a browser. No install, no build step, no dependencies.

## Controls

| Key | Action |
| --- | --- |
| `←` `→` / `A` `D` / numpad `4` `6` | Roll |
| `Space` / `↑` / `W` / numpad `8` or `0` | Hop (quick tap = short, hold = taller) |
| numpad `5` / `B` | Boost: press once to turn on, again to turn off (see Settings) |
| `↓` / `S` / numpad `2` | Brake |
| `P` / `R` / `M` / `O` | Pause / restart / mute / settings |

Touch devices get on-screen buttons.

**One key at a time:** everything works without pressing two keys at once.
Steering works in mid-air (tap a direction while hopping), and boost is a toggle.
## Settings

Open **Settings** with `O` (or the button on the title / pause screen). Use `↑` `↓`
to pick a row and `Space` / `Enter` / click to change it. Everything is remembered
in the browser.

- **Boost mode:** *Toggle* (default: press numpad `5` / `B` once to turn boost on, again to turn it off) or *Hold*.
- **Language:** Português (Portugal, the default) or English.
- **Character:** the hand-drawn Deficientezinho from the logo (the default), or *Clássico*.

## How the level works

- **Momentum is the verb.** Downhill ramps give free speed; uphill ramps eat it.
  Gap 1 can only be cleared with the speed from the hill before it.
- **Hop** clears curbs. Ledges under ~14 px are rolled over without hopping.
- **Boost** is a battery. Pick up ⚡ to refill it (and heal).
- **Carts** hurt on contact (3 battery cells), but stomping them squashes them.
- **Checkpoints** (flags with an E) respawn you after a fall or 0 cells.
- **Stars:** finish, collect 80% of the tokens, and beat par time.

## Project layout

```
index.html        page + canvas
style.css         layout, touch buttons
js/level1.js      level data — edit this to change or add levels
js/game.js        input, physics (PH = tuning constants), entities, main loop
js/render.js      all drawing (both avatars); THEME at the top holds the brand colours
js/i18n.js        all on-screen text, Portuguese (PT) and English
js/audio.js       tiny WebAudio sound effects
```

### Making it yours

- **Brand colours / logo:** edit `THEME` at the top of `js/render.js`.
  The "E" on the tokens, shirt, flags and finish gate is drawn there too.
- **Text and translations:** everything shown on screen lives in `js/i18n.js`
  (`pt` = Português de Portugal, `en` = English). Signs refer to their text by key in `js/level1.js`.
- **Game feel:** the `PH` object at the top of `js/game.js`
  (speeds, hop height, gravity, ramp strength).
- **New level:** copy `level1.js`, change the `flat / slope / step / gap` calls,
  and point `DEF.level1` at it in `js/game.js`.
