# Caret — Revision R1
## Playtest Feedback Implementation: Prompt Set

> Inserted **after Phase 1 Step 9 (playtest gate)** and **before Phase 1 Step 10 (VFX and audio)**.
> Source: your own test notes (15 items) plus the four screenshots (gameplay, main menu, Tektur specimen, Target Lock panel).
> Date: 2026-10-06. Stack: Vite + React + TypeScript (strict) + Phaser 3. Windows PowerShell.

---

# Part 0 — Read this first

## 0.1 Purpose and placement

Your playtest produced 15 changes that touch the simulation (scoring, lives, difficulty, word progression), persistence (run history, stats, settings), the renderer (sizes, labels), the React shell (HUD, menu, game-over screen, clock, wave banner), and typography. This document turns them into **eight sequenced agent prompts (P0–P7)**, each with scope, technical spec, tests, acceptance checks, and a human gate. Nothing here replaces Phase 1 Steps 10–12; it prepares them (see 0.5).

**Run order matters.** Simulation changes come first because they invalidate the golden event-log test and reshape the result data that the screens consume.

```text
P0  Audit and confirmation          (read-only; no code)
P1  Simulation: scoring, accuracy/WPM, lives, elapsed time, sizes/radii
P2  Progression: remove difficulty selection, wave curve, word-length distribution, wave intermission
P3  Persistence: settings store (minimal), run history and stats store
P4  Typography: Tektur everywhere
P5  Layout and HUD: top strip, wing boxes, clock, timer, lives, banner, sprite sizes, removals
P6  Screens: main menu (stats, graph, settings), game-over screen, temporary boot status
P7  QA, documentation, licenses, tag
```

## 0.2 How to run each prompt

1. **One fresh agent conversation per prompt.** Give it: the Agent Rules (`docs/AGENT_RULES.md`, R1–R16) + the R1 additions in 0.6 + the specification sections the prompt references + the previous prompt's completion report.
2. Wrapper (paste above each prompt):
   ```text
   Read docs/AGENT_RULES.md and the R1 additions. Do ONLY the prompt below. Inspect before changing anything (R1). Do not start the next prompt. End with the completion report format from the rules.
   ```
3. After each prompt, **you** do its Human verification, then commit/tag `r1-pN-done`.
4. Two failed fix attempts → stop and report evidence (R16). Never weaken a test (R6).
5. Keep this file at `docs/R1_PROMPT_SET.md` so every session can reference it.

## 0.3 Change register: your 15 items → where they are implemented

| # | Your change | Prompt | Notes |
|---|---|---|---|
| 1 | Drones a lot smaller | P1 (radii/config), P5 (sprite + label) | Hitbox must shrink with the sprite or collisions feel unfair |
| 2 | No difficulty selection; difficulty rises with play | P2, P6 | Removes the three presets from sim, menu, tests |
| 3 | Replace the break with "WAVE XX" | P2 (event), P5 (banner) | New `WAVE_INTERMISSION` event |
| 4 | Word progression by wave; game-over popup; new-record message; graph after ~5 runs; menu/new-game buttons | P2 (words), P3 (history), P6 (screens) | Concrete curve in 1.4 |
| 5 | Main menu: stats, graph, new game, music/SFX settings | P3, P6 | Music has no asset yet — see D6 |
| 6 | 3 collisions instead of a 100 hull bar | P1, P5 | Pips replace the bar |
| 7 | Stats out of the play area | P5 | Dedicated top strip outside the canvas |
| 8 | Medium-size craft | P1, P5 | ≈ 70% of current |
| 9 | Streak bottom-left, score bottom-right beside the wings; smaller boxes; score = plain +1 | P1 (score rule), P5 (placement) | Multiplier removed everywhere |
| 10 | Accuracy per the SpeedTypingOnline equations | P1 | Formulas in 1.2 (source page was read for this document) |
| 11 | Remove the top console bar; show details temporarily on the start page | P5, P6 | "Temporarily" = boot status line, see D9 |
| 12 | Real-time clock top-right | P5 | UI layer only (core never reads wall-clock time) |
| 13 | Elapsed typing time | P1 (ticks), P5 (display) | Excludes paused time |
| 14 | Whole-project font → Tektur | P4 | Includes Phaser word labels; legibility check |
| 15 | Remove Target Lock component | P5 | Keep the mechanic; remove the HUD panel |

## 0.4 Interpretations and decisions (change any before running the matching prompt)

Several of your notes can be read more than one way. Each default below is my reading; tell me if it is wrong.

| ID | Item | Default used in the prompts | Alternative |
|---|---|---|---|
| D1 | 9 — "1s value only, straight add" | **+1 point per correct character.** No word bonus, no wave bonus, no multiplier. Streak is shown but never scores. | +1 per destroyed word (then score = words destroyed; mostly redundant with another stat) |
| D2 | 6 — "vulnerable to 3 collisions" | 3 hull points, each drone collision removes 1, no invulnerability window. Game over at 0. | Add 1 s of invulnerability after a hit |
| D3 | 15 — "remove Target Lock entirely, no visibility" | Delete the HUD panel (component, props, styles, tests). The lock **mechanic** stays. In the world, the locked drone's own word label keeps its typed-letter dimming (that is typing progress, not a lock panel). The in-world bracket reticle is switched **off** by a config flag (`SHOW_LOCK_RETICLE = false`), not deleted until the next playtest. | Delete the reticle code too; or remove typed-letter dimming (not recommended: players could not see typing progress) |
| D4 | 3 — "replace the space with WAVE XX" | During the intermission (lengthened from 2 s to 2.5 s) the empty play area shows a large "WAVE 0N" banner. "WAVE 01" shows before the first spawn. | No pause at all, banner overlaid on drones (not recommended) |
| D5 | 2 — no difficulty choice | One progressive campaign. `relaxed/normal/intense` are deleted from UI, settings, sim, and tests. | Keep presets as hidden dev options |
| D6 | 5 — music/SFX settings | Settings store and toggles for SFX and Music are built now. **No music asset exists** (the licensed packs contain none), so the Music row stays hidden until a track is registered. Nothing audible exists until Step 10 builds the audio manager; the SFX toggle persists but changes nothing yet. | Add a CC0 loop or procedural music in Step 10 (separate decision) |
| D7 | 12 — real time | Local time `HH:MM` (12/24 h by browser locale), updated each minute, top-right, muted style. | `HH:MM:SS` (a ticking seconds display competes for attention in a typing game) |
| D8 | 4 — graph "after 4–5 gameplays" | Shown at **≥ 5 recorded runs** (config `GRAPH_MIN_RUNS`). Last 10 runs, metric tabs: Wave / Score / Accuracy / Net WPM. | Threshold 4 |
| D9 | 11 — "temporarily" | On the first menu view per page load, a one-line boot status (`SYSTEM ONLINE // READY`, mode, status) fades in and out over 2.5 s. Never shown again until reload. | Always-visible small status text |
| D10 | 13 — time | Elapsed **simulation** time, excluding pauses, `mm:ss` (`h:mm:ss` after an hour). | Wall-clock time since the run started |
| D11 | 14 — Tektur everywhere | HUD, menus, buttons **and** Phaser word labels. Legibility check on all 26 lowercase letters; if two letters are confusable at label size, only the labels revert to a plain monospace (your call after seeing it). | Labels stay monospace from the start |
| D12 | 1, 8 — sizes | Drone ≈ 50% of its current rendered size (≈ 44 world px wide), ship ≈ 70% (≈ 60 px wide). Collision radii derive from sprite sizes (P1). | Different ratios — they are config constants |
| D13 | New: records | A "NEW RECORD" message appears when the run's wave exceeds the previous best wave **and at least one earlier run exists** (the very first run shows "FIRST MISSION LOGGED"). A new best score is a secondary line. | Record on the first run too |

**Reconciliation of your earlier and later notes:** in your first note, SCORE, WAVE, STREAK, MULTIPLIER and ACCURACY go to the top; in item 9 you move STREAK and SCORE to the wings and drop the multiplier. Final layout used here: **top strip = WAVE, TIME, ACCURACY, HULL pips, PAUSE, clock; wings = STREAK (left), SCORE (right); multiplier removed.** Hull pips in the top strip is my placement — you did not specify one.

## 0.5 Impact on other plans (decide before Phase 1 Step 10/11 and Phase 2)

| Plan | What this revision changes | Action |
|---|---|---|
| Phase 1 Step 10 (VFX/audio) | Multiplier/streak-milestone effects are obsolete; hull-damage effect becomes "lose a life". No music exists. | Regenerate Step 10's effect table from the new events (P7 updates `docs/PHASE1_PLAN.md`) |
| Phase 1 Step 11 (settings) | P3 **pulls forward** the settings store, validator, and modal using Step 11's own design (schema v1, per-field validation, no dependency). `difficulty` and `highScore` fields no longer exist. | Step 11 then only adds volume, MotionPolicy wiring, and polish |
| Phase 2 | Presets (relaxed/normal/intense) vanish; damage values were written for a 100-point hull (missile 15, precision miss 5); the "Endless" mode is now essentially the main game; the adaptive mode competes with the built-in progression. | Revisit Phase 2 Steps 3, 5, 6, 10 after R1 (missile damage → 1 hull; modes redefined). Not done here. |
| Golden tests | Scoring, radii, spawn Y, word selection draws, and wave timing all change. | Each prompt that changes behavior updates the golden hash in its own commit with an explanation (rule R-D) |

## 0.6 R1 additions to the Agent Rules

```text
R-A  SCOPE OF NUMBERS. Do not change any gameplay or layout number this document does not mention. New numbers live in src/shared/config and are named constants.
R-B  WALL-CLOCK TIME. Date and Intl time formatting are allowed only in src/ui and src/app. The core and domain use simulation ticks (lint already forbids Date there).
R-C  REMOVAL MEANS DELETION. When a feature is removed (difficulty presets, multiplier, Target Lock panel, hull bar, console header), delete its code, styles, tests, docs, and config. No dead flags, except SHOW_LOCK_RETICLE which D3 explicitly allows.
R-D  GOLDEN UPDATES. Updating golden/determinism fixtures happens in its own commit whose message lists what changed and why. Never update a golden to make an unexplained diff pass.
R-E  MEASURE BEFORE SIZING. Before changing any size, record the current rendered size in world pixels (from code and a screenshot) in the report.
R-F  DEPENDENCIES. The only new runtime dependency allowed in R1 is the Tektur font package (P4). Charts are hand-written SVG; no chart library.
```

---

# Part 1 — Specifications (the behavior contract the prompts implement)

## 1.1 Layout and HUD

**Principle (your item 7):** nothing that is not a game object may overlap the area where drones enter and travel. The score/streak boxes are allowed only in the bottom band beside the ship, where drones arrive last.

```text
GAMEPLAY
┌─ TOP STRIP (outside the canvas, 44–48 px, no heavy border) ─────────────────────────────────┐
│ WAVE 03    TIME 02:14    ACCURACY 96.4%            ♥ ♥ ♥             [ PAUSE · ESC ]   14:32 │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
┌─ GAME VIEWPORT (16:9, Phaser canvas fills it; world 1280×720) ───────────────────────────────┐
│                                                                                              │
│          ▫ drones enter and travel through the whole area; nothing overlays them ▫           │
│                                                                                              │
│                                                                                              │
│                         ┌─────────┐        ▲        ┌─────────┐                              │
│                         │ STREAK  │      ◢███◣      │ SCORE   │                              │
│                         │   12    │       ship      │   148   │                              │
│                         └─────────┘                 └─────────┘                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘

MAIN MENU (panel centered, scrolls inside itself if the window is very short)
┌ COMMAND HEADQUARTERS ───────────────────────────────── MISSION DISPATCH READY ┐
│                 CARET: THE TYPING SHOOTER                                      │
│                    TACTICAL DEFENSE PROTOCOL                                   │
│  ┌ PILOT RECORD ───────────────────────────────────────────────────────────┐   │
│  │ BEST SCORE  BEST WAVE  BEST ACCURACY  BEST NET WPM  RUNS  TIME TYPED    │   │
│  │ LAST RUN: wave 5 · score 148 · 96.4% · 41 wpm · 03:12                   │   │
│  │ [ progress graph — after 5 recorded runs; otherwise a "play N more" hint]│   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│  [ NEW GAME  ·  ENTER ]                                    [ SETTINGS ]        │
│  TACTICAL DIRECTIVE: type the first letter … TAB releases the lock. ESC pauses.│
└────────────────────────────────────────────────────────────────────────────────┘
                                                                   top-right: 14:32

GAME OVER (same panel style as the menu)
┌ COMMAND HEADQUARTERS ───────────────────────────────────── MISSION ENDED ──────┐
│          NEW RECORD!  WAVE 07 REACHED          (or: SHIP LOST · WAVE 05)       │
│  THIS RUN   SCORE 148 · WAVE 07 · ACCURACY 96.4% · NET WPM 41 · TIME 03:12     │
│  BEST       SCORE 212 · WAVE 07        PREVIOUS RUN  wave 5 · score 131        │
│  [ progress graph with metric tabs; current run highlighted — after 5 runs ]   │
│  [ NEW GAME · ENTER ]                                   [ MAIN MENU ]          │
└────────────────────────────────────────────────────────────────────────────────┘
```

**Structure.** `.game-shell` is a CSS grid with two rows: `auto` (top strip) and `1fr` (viewport area). The viewport is `aspect-ratio: 16/9`, sized by `min(100%, (100dvh − stripHeight) × 16/9)` and centered; Phaser's `FIT` scale fills it. A single CSS variable `--u` (set by a `ResizeObserver` to `viewportWidthPx / 1280`) scales every element placed *inside* the viewport (wing boxes, banner, label sizes in DOM overlays) so they track the canvas exactly.

**Wing boxes.** Positioned from world constants, not magic percentages: left box right-edge at `PLAYER_START.x − HUD_WING_GAP_WORLD` and right box left-edge at `PLAYER_START.x + HUD_WING_GAP_WORLD`, vertically centered on the ship's wing line (`PLAYER_START.y + HUD_WING_Y_OFFSET_WORLD`). A pure helper `worldToViewportPercent({x,y}) → {left%, top%}` converts; it is unit-tested. Boxes are ≈ 84 × 34 world px, `pointer-events: none`, semi-transparent, and hold a small label (STREAK / SCORE) over the value.

**Top strip.** Left cluster: WAVE, TIME, ACCURACY (borderless label/value pairs). Center: three hull pips. Right cluster: PAUSE button, then the clock. No box outlines (less visual weight than the old HUD). Values are fixed-width (tabular figures or reserved width) so they do not jitter as digits change.

**Removed from the UI:** the "TACTICAL COMMAND CONSOLE" header bar with `MODE`/`STATUS`, the in-canvas five-box stat row, the multiplier box, the hull-integrity bar, the `MOTION: NORMAL` HUD button (reduced motion moves into Settings), the Target Lock panel, the three threat-intensity radio buttons.

**Wave banner.** Centered in the viewport, large Tektur 700, wide letter-spacing, amber with a restrained glow, e.g. `WAVE 04`. Fade in 250 ms, hold, fade out 250 ms (reduced motion: no animation, simple show/hide). `aria-live="polite"` announces "Wave 4". Visible only between `WAVE_INTERMISSION` and `WAVE_STARTED`.

## 1.2 Scoring, accuracy, WPM, time

**Scoring (D1):** `INPUT_MATCH` awards exactly **+1** point. Nothing else awards points: no word bonus, no wave bonus, no multiplier, no streak bonus. Streak is the count of consecutive correct characters (reset by any miss) and is informational only. Delete `multiplier`, `scorePerChar` ×10 logic, `enemyClearBonus`, `waveClearBonus`, the multiplier thresholds, and the fields that carried them (`ENEMY_DESTROYED.scoreAwarded`, `WAVE_COMPLETED.bonusScore`); `INPUT_MATCH` carries `scoreAwarded: 1`.

**What counts as a typed entry:** a printable letter the input layer accepted (correct → `hits`, wrong → `misses`). Not counted: Tab, Esc, Space, Backspace, modifier keys, auto-repeat events, IME/dead keys, and anything pressed while paused or not running. This mirrors the source's rule that function keys are not counted.

**Equations (from the SpeedTypingOnline "Typing Equations" page, paraphrased):**

- **Accuracy** = correct entries ÷ total entries × 100. Every error counts, whether or not it is corrected.
- **Gross WPM** = (total entries ÷ 5) ÷ minutes. A "word" is five characters.
- **Net WPM** = Gross WPM − (uncorrected errors ÷ minutes). The source argues that only uncorrected errors should be deducted; **this game has no correction mechanism** (no backspace), so every miss is an uncorrected error: `Net WPM = Gross WPM − misses ÷ minutes`, floored at 0.

**Implementation rules.**
1. `accuracy = 100 × hits / (hits + misses)`; when `hits + misses = 0`, `accuracy = 100`. Computed from integers, never by subtracting a miss count from 100.
2. **Display** accuracy with one decimal using **floor**, not round: 999 hits + 1 miss shows `99.9%`, never `100.0%`. 100.0% appears only with zero misses.
3. `minutes = elapsedTicks / tickRate / 60`. If `elapsedTicks = 0`, both WPM values are 0 (no division by zero, no NaN/Infinity anywhere).
4. WPM here is "game WPM": the run clock includes waiting time between drones and the wave intermission, so it will read lower than a pure typing test. State that in the stats screen's help text.

**Test vectors (must pass):**

| hits | misses | ticks (60/s) | accuracy | gross WPM | net WPM |
|---|---|---|---|---|---|
| 90 | 10 | 3600 (1 min) | 90.0 | (100/5)/1 = 20.0 | 20 − 10 = 10.0 |
| 0 | 0 | 0 | 100.0 | 0 | 0 |
| 2 | 1 | 600 | 66.6 (floor of 66.66…) | (3/5)/0.1667 = 3.6 | 3.6 − 6.0 → 0 |
| 999 | 1 | 7200 | 99.9 | (1000/5)/2 = 100.0 | 100 − 0.5 = 99.5 |
| 792 | 8 | 7200 (2 min) | 99.0 | (800/5)/2 = 80.0 | 80 − 4 = 76.0 (matches the source's worked example) |

**Time (D10):** `elapsedTicks` is part of the snapshot and increments only while `status = "running"`. HUD shows `mm:ss` (`h:mm:ss` from one hour). Because it counts ticks, paused time is excluded automatically and the value is deterministic.

## 1.3 Lives (item 6, D2)

`playerMaxHealth = 3`, `collisionDamage = 1`. Config names stay (`health`) so the domain contract needs no rename, but all documentation calls them hull points. A drone that reaches the hull is destroyed and costs 1; at 0 → `GAME_OVER`. The HUD shows three pips (filled/outlined; shape differs, not only color). Phase 2's damage values must be revisited (see 0.5).

## 1.4 Progression: one campaign, no difficulty selection (items 2, 4; D5)

All per-wave values come from `src/shared/config/progression.ts` (data, tunable in playtests). **Starting values:**

| Quantity | Formula |
|---|---|
| Drone speed (px/s) | `min(30 + 2.5·(w−1), 72)` |
| Spawn interval (s) | `max(1.0, 2.8 · 0.95^(w−1))` |
| Concurrent drones | `min(2 + floor((w−1)/3), 6)` |
| Wave quota (drones) | `min(5 + 2·(w−1), 30)` |
| Word commonality (pool = first `ceil(c × tierLength)` words of each length tier, frequency-ordered) | `min(1.0, 0.30 + 0.07·(w−1))` |
| Hard-letter weight multiplier (letters `j k q v w x z`) | `1 + min(1.0, 0.10·max(0, w−2))` |
| Intermission before each wave | 2.5 s |

**Word-length distribution (% of spawned words by length).** Rows must each sum to 100. Waves 1–2 never contain a word longer than 4 letters; wave 3 has "a few" 5–6 letter words (10%); wave 5 has "more" (50%).

| Wave | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|
| 1 | 50 | 50 | | | | |
| 2 | 40 | 60 | | | | |
| 3 | 35 | 55 | 6 | 4 | | |
| 4 | 28 | 48 | 14 | 10 | | |
| 5 | 18 | 32 | 26 | 24 | | |
| 6 | 12 | 28 | 28 | 27 | 5 | |
| 7 | 8 | 24 | 28 | 30 | 10 | |
| 8 | 6 | 20 | 28 | 30 | 12 | 4 |
| 9 | 4 | 18 | 26 | 30 | 16 | 6 |
| 10 | 3 | 15 | 25 | 30 | 18 | 9 |
| 20+ (final) | 0 | 8 | 20 | 30 | 26 | 16 |

Waves 11–19 interpolate linearly, per column, between row 10 and the final row; waves ≥ 20 use the final row. "Meaningful" words: only words from the curated word tiers (Phase 1 Step 5) — never generated strings.

**Selection algorithm (deterministic; two `wordRng` draws per word, document the order).**
1. Draw one number; map it through the cumulative length weights to choose length `L` (if tier `L` has no admissible candidate, widen to the nearest available length, preferring shorter).
2. Candidate pool: first `ceil(c × |tier L|)` words, minus words currently on screen and words whose first letter is already the first letter of a live drone (existing exclusion rules and fallbacks stay).
3. Draw one number; weighted pick over the pool where a word containing at least one hard letter has weight `hardLetterMultiplier(w)` and every other word has weight 1 (cumulative weights in tier order).

**Intended feel:** waves 1–2 are simple, common 3–4 letter words at a gentle pace; the change per wave is small (speed ≈ +8%, interval −5%); the "focus" difficulty comes from longer words, rarer words, and awkward letters, not from a sudden speed jump.

**Distribution tests (seeded, 10,000 draws per wave):** wave 1–2: max length ≤ 4 (exact); wave 3: share of 5–6 letter words within ±3 points of 10%; wave 5: within ±3 points of 50%; every row's observed lengths within ±3 points of the table; hard-letter share rises with the wave.

## 1.5 Wave intermission contract (item 3, D4)

Event order: `WAVE_COMPLETED(n)` → `WAVE_INTERMISSION { tick, nextWave, durationTicks }` → *(2.5 s of no spawns)* → `WAVE_STARTED(n+1)`. At run start: `WAVE_INTERMISSION(nextWave = 1)` → `WAVE_STARTED(1)`. A wave still completes when its quota is spawned and no drone is alive, so the banner always appears over an empty play area. Pausing freezes the intermission timer (tick-based).

## 1.6 Persistence (items 4, 5; D6, D8, D13) — local only

**`caret.history.v1`** `{ version: 1, runs: RunRecord[] }`, newest last, capped at 100 runs.

```ts
interface RunRecord {
  id: number;            // monotonic per history
  endedAt: string;       // ISO-8601, created in the app layer (never in core)
  score: number; wave: number; maxStreak: number; wordsDestroyed: number;
  hits: number; misses: number;
  accuracy: number;      // 0–100, stored with one decimal (floored)
  grossWpm: number; netWpm: number;   // one decimal
  durationSeconds: number;            // from elapsedTicks
}
```

**Aggregates (`computeStats(runs)`):** `bestScore`, `bestWave`, `bestAccuracy` (only runs with ≥ 100 entries — `MIN_ENTRIES_FOR_BEST_ACCURACY`), `bestNetWpm` (only runs ≥ 30 s — `MIN_SECONDS_FOR_BEST_WPM`), `totalRuns`, `totalTimeSeconds`, `lastRun`, `previousRun`.

**Records:** computed against the history **before** the new run is appended. `isNewWaveRecord = runs.length ≥ 1 && run.wave > bestWave(previous)`. First ever run: show "FIRST MISSION LOGGED". Secondary: new best score line.

**Graph:** shown when `runs.length ≥ GRAPH_MIN_RUNS (5)`; last 10 runs; metric tabs Wave / Score / Accuracy / Net WPM; the current run's point highlighted on the game-over screen. Hand-written SVG, `role="img"` with a text summary, plus a visually hidden table of the same data.

**`caret.settings.v1` (minimal, pulled forward from Phase 1 Step 11):**

```ts
interface SettingsV1 { version: 1; sfxEnabled: boolean /*true*/; musicEnabled: boolean /*true*/; reducedMotion: "system" | "on" | "off" /*"system"*/ }
```
Hand-written per-field validator (bad field → its default, good fields kept), try/catch around all storage access with an in-memory fallback, `subscribe()` for React via `useSyncExternalStore`. A "Reset statistics" action (with confirmation) clears history only.

## 1.7 Typography (item 14, D11)

Tektur (the specimen you sent credits Adam Jagosz). **Checked for this document:** the npm package `@fontsource/tektur` (version 5.3.0 at the time of checking) exists, declares the SIL Open Font License 1.1, bundles a `LICENSE` file with the OFL text, and ships a Latin subset per weight (400, 500, 600, 700, about 7.5 KB each as `.woff2`), registered under the family name `Tektur`. The agent must still confirm the license file in the version it installs. Use weights 400/500/600/700 as needed. Fallback stack: `"Tektur", ui-sans-serif, system-ui, sans-serif`. Phaser word labels: `fontFamily: "Tektur"`, weight 600, 18 px, one `Text` per letter centered in a fixed-advance cell (`origin 0.5`), because a proportional face has glyphs of different widths. **The font must be loaded before any Phaser `Text` is created** (`await document.fonts.load("600 18px Tektur")`) or the first frame renders in the fallback. All Kenney font files, `@font-face` rules, and their CREDITS entries are removed.

## 1.8 Sizes (items 1, 8; D12)

Measured from your screenshots (estimates — verify in code, R-E): current drone ≈ 85–90 world px wide; current ship ≈ 85 × 124 px. Targets: **drone ≈ 44 px wide; ship ≈ 60 × 87 px**; label font unchanged (18 px) so words stay readable. Collision radii derive from the sprites: `hitboxRadius ≈ 0.8 × droneHalfWidth` (≈ 18), `hullRadius ≈ 0.8 × shipHalfWidth` (≈ 24). `SPAWN_Y` is chosen so a label plate above a freshly spawned drone has ≥ 6 px of canvas above it (your screenshot shows the label "ambush" cut off at the top); with these sizes about 64. Label plates sit above the sprite with a 6 px gap, never over it.

---

# Part 2 — The prompts

Each prompt: Goal → Preconditions → Scope → **Agent prompt** → Tests → Acceptance checks → Human verification → Commit/tag.

---

# P0 — Audit and confirmation (read-only)

## Goal
Replace my assumptions about your code with evidence before anything changes: where each of the 15 items lives, what will break, and which readings in 0.4 are wrong.

## Preconditions
Tag `step-9-done` exists; working tree clean; lint/test/build/e2e pass.

## Scope
Create **only** `docs/R1_AUDIT.md`. No other file changes.

## Agent prompt

```text
You are auditing an existing project (Caret, a typing shooter: Vite + React + TypeScript strict + Phaser 3) before a revision. Follow the Agent Rules (R1-R16) and the R1 additions (R-A..R-F). THIS PROMPT MAKES NO CODE CHANGES. The only file you may create is docs/R1_AUDIT.md.

Tasks (cite file:line evidence for every claim; paste raw command output):
1. Baseline: show git branch, latest tags, clean tree; run npm run lint, npm run test, npm run build, and the Playwright suite; report counts.
2. For each of these 15 requested changes, find where today's behavior is implemented (files and lines) and list the tests that will break:
   (1) drones much smaller; (2) no difficulty selection, difficulty rises with play; (3) "WAVE XX" instead of a plain break; (4) word-length progression by wave and a game-over popup with records/graph; (5) main menu stats + graph + settings; (6) 3 collisions instead of a 100-point hull bar; (7) stats moved out of the play area; (8) medium-size ship; (9) streak/score beside the ship wings and score as a plain +1; (10) accuracy per the typing equations; (11) remove the top console bar; (12) real-time clock; (13) elapsed time; (14) Tektur font everywhere; (15) remove the Target Lock panel.
3. SIZES (rule R-E): record today's rendered size in world pixels (1280x720 space) of the drone sprite, the ship sprite, a word label plate for a 3-letter and an 8-letter word, and the top HUD elements. Derive them from code constants AND from a Playwright screenshot of ?autostart=1&seed=1337 (state the scale factor you used). My estimate from screenshots is drone ~85-90 px wide and ship ~85x124 px: confirm or correct.
4. FORMULAS: locate the code that computes accuracy, WPM, score, multiplier and streak. Write down the exact current formulas. Compare each against the equations in section 1.2 of this document (accuracy = hits/(hits+misses)*100; gross WPM = (entries/5)/minutes; net WPM = gross - misses/minutes, floored at 0). List every difference, including any place where accuracy is computed as 100 minus something.
5. DEFECTS I saw in screenshots - find the cause of each, DO NOT FIX: (a) a thin full-width green horizontal line across the main menu screen; (b) the word label near the top edge (e.g. "ambush") being clipped by the canvas top; (c) the HUD label "HULL INTEGRITY100/100" missing a space; (d) design-note text in the footer strip ("TACTICAL RESOLUTION..." / "DOMINANT ACCENT...").
6. FONTS: list every @font-face, font-family token, Phaser fontFamily usage, font file (name, size, license file present or not) and where each is used.
7. REMOVALS INVENTORY: list every use of difficulty presets (UI, settings, sim, config, tests, docs), multiplier, hull bar/integrity, ActiveTargetReadout / "TARGET LOCK", the "TACTICAL COMMAND CONSOLE" header, the MOTION button, and the in-canvas stat row.
8. PRESENCE CHECK: report whether any of these already exist: a settings store, localStorage usage (every key), an audio manager or audio files in use, a run-history store, a clock/timer component.
9. Write docs/R1_AUDIT.md with: baseline results; the evidence tables above; a list of every statement in this prompt set that your findings contradict; a list of the files each later prompt (P1-P7) will touch; and risks you foresee. End with the completion report.
Do not propose or write code. Do not start P1.
```

## Acceptance checks
- [ ] `git diff --stat` after the prompt shows only `docs/R1_AUDIT.md`.
- [ ] All 15 items have file:line evidence; sizes are recorded with the scale factor.
- [ ] Every "contradicted statement" is listed (or "none" with the evidence searched).

## Human verification
Read the audit. Then confirm or change decisions D1–D13 in a short `docs/R1_DECISIONS.md` (one line each). The later prompts assume the 0.4 defaults unless that file says otherwise — tell the agent to read it.

## Commit/tag
`r1-p0-done`

---

# P1 — Simulation: scoring, accuracy and WPM, lives, elapsed time, sizes and radii

## Goal
Make the rules match your notes in the headless core, with tests, before any UI work.

## Preconditions
P0 done; `docs/R1_DECISIONS.md` exists (or the 0.4 defaults are accepted).

## Scope
`src/game/core/**`, `src/shared/domain/**`, `src/shared/config/**`, tests, docs. UI is touched **only** to keep the build compiling (delete references to removed fields; no restyling — that is P5).

## Technical spec
Implement sections 1.2 (scoring, accuracy, WPM, time), 1.3 (lives), and the radii/`SPAWN_Y` parts of 1.8. Add `SHOW_LOCK_RETICLE = false` to config now (used in P5).

## Agent prompt

```text
Implement P1 of Revision R1 (simulation changes). Follow R1-R16 and R-A..R-F. Preconditions: P0 complete; read docs/R1_AUDIT.md and docs/R1_DECISIONS.md. Scope: src/game/core, src/shared/domain, src/shared/config, tests, docs. UI changes are limited to what is needed to keep npm run build green (delete references to removed fields; do NOT restyle).

1.A SCORING (D1). INPUT_MATCH awards exactly +1 point. Nothing else awards points. Delete: multiplier (state, thresholds, config, events), scorePerChar=10 logic, enemyClearBonus, waveClearBonus, and the fields that carried them (ENEMY_DESTROYED.scoreAwarded, WAVE_COMPLETED.bonusScore). INPUT_MATCH carries scoreAwarded: 1. Streak = consecutive correct characters, reset by any miss, informational only; maxStreak tracked. Update domain types, TSDoc, docs/simulation.md.
1.B ACCURACY AND WPM. Create a pure module (e.g. src/game/core/metrics/typingMetrics.ts) with: computeAccuracy(hits, misses) = 100*hits/(hits+misses), 100 when both are 0, computed from integers (never "100 minus misses"); floorToOneDecimal(x); computeGrossWpm(entries, elapsedTicks, tickRate) = (entries/5)/minutes; computeNetWpm(entries, misses, elapsedTicks, tickRate) = max(0, gross - misses/minutes); minutes = elapsedTicks/tickRate/60; both WPM = 0 when elapsedTicks = 0. No NaN/Infinity anywhere (property tests). Entries = hits + misses and count ONLY accepted printable letters (not Tab, Esc, Space, Backspace, modifiers, auto-repeat, IME keys, or anything while paused/not running). Replace every previous accuracy/WPM computation with these functions. A display helper (pure, in src/shared) formats accuracy with one decimal using FLOOR so 999 hits + 1 miss shows 99.9, never 100.0.
1.C RESULT DATA. The snapshot exposes hits, misses, accuracy, streak, maxStreak, wordsDestroyed, score, wave, elapsedTicks (increments only while status is running). getResult() returns score, wave, maxStreak, wordsDestroyed, hits, misses, accuracy (floored to one decimal), grossWpm, netWpm (one decimal), durationSeconds (from ticks).
1.D LIVES (D2). playerMaxHealth = 3, collisionDamage = 1, no invulnerability window. A drone reaching the hull is destroyed (ENEMY_DESTROYED{cause:"collision"}) and costs 1; GAME_OVER at 0, with the event order from the Phase 1 plan (PLAYER_DAMAGED, ENEMY_DESTROYED, TARGET_LOST if locked, GAME_OVER). Remove the hull-bar concept from docs and config comments; keep field names if renaming would churn the contract.
1.E SIZES AND RADII (rule R-E). Using the sizes recorded in docs/R1_AUDIT.md, define in config the TARGET rendered sizes: drone ~44 world px wide, ship ~60x87 px (about 50% and 70% of today's). Derive hitboxRadius = round(0.8 x droneHalfWidth) and hullRadius = round(0.8 x shipHalfWidth) from those constants (do not hard-code the results). Set SPAWN_Y so that a word label plate placed 6 px above a freshly spawned drone sprite has at least 6 px of canvas above it (report the value; expect ~64). Add SHOW_LOCK_RETICLE = false.
1.F GOLDEN TESTS (rule R-D). Behavior has changed on purpose (scoring, lives, radii, spawn Y). Update the golden event-log fixtures and determinism snapshots in ONE dedicated commit whose message lists exactly what changed and why. Show the diff summary in the report.
Commit per sub-section (R13). Do not implement progression, waves, UI layout, stores, or fonts. Run lint, test, build, e2e. STOP after the completion report. Do not start P2.
```

## Tests
- Metrics vectors from 1.2 (all five rows) plus property tests: accuracy ∈ [0,100] and finite for all non-negative integers; WPM finite and ≥ 0; floor display never shows 100.0 when misses > 0.
- Scoring: each correct char is +1; a mismatch scores 0 and resets streak; completing a word adds nothing extra; no event has a removed field (type-level test).
- Entry counting: Tab, Esc, Space, Backspace, auto-repeat, and keys while paused never change hits/misses.
- Lives: three collisions end the run exactly on the third; event order; commands ignored after game over; `start()` resets lives to 3.
- `elapsedTicks` frozen while paused.
- Radii derive from size constants (changing the constant changes the radius).
- Architecture test and core-purity lint still green; golden updated once, in its own commit.

## Acceptance checks
- [ ] Vectors in 1.2 pass exactly.
- [ ] No reference to `multiplier`, `enemyClearBonus`, `waveClearBonus`, `bonusScore` remains (search output pasted).
- [ ] Golden-update commit message lists changes; no other commit touches goldens.
- [ ] Build, lint, tests, e2e green.

## Human verification
Run `npm run dev`, play 30 s: each correct letter adds exactly 1 to the score; let three drones hit you: the third ends the run (UI may still look rough — that is expected until P5).

## Commit/tag
`r1-p1-done`

---

# P2 — Progression: no difficulty selection, wave curve, word lengths, wave intermission

## Goal
One progressive campaign driven by wave number, with the word-length curve you described and a "WAVE XX" intermission contract.

## Preconditions
P1 done.

## Scope
`src/shared/config/progression.ts`, word provider, wave state machine in the core, `sim:demo`, tests, docs; minimal UI edits to remove the difficulty radios (P6 redesigns the menu).

## Technical spec
Implement sections 1.4 and 1.5 exactly. Remove `DIFFICULTY_PRESETS` and everything that used them (D5).

## Agent prompt

```text
Implement P2 of Revision R1 (progression). Follow R1-R16 and R-A..R-F. Preconditions: P1 complete. Scope: src/shared/config/progression.ts, src/game/core (waves, words, spawn), scripts/sim-demo.ts, tests, docs/simulation.md. UI edits only to delete the difficulty radio buttons and anything that read a difficulty preset.

2.A REMOVE PRESETS (D5). Delete DIFFICULTY_PRESETS, DifficultyPresetId, RunConfig.difficulty, the menu radio group, any "difficulty" settings field, and tests that depend on presets. All per-wave values now come from progression.ts. Report every file you changed for this.
2.B PROGRESSION CONFIG. Create src/shared/config/progression.ts exporting pure functions with TSDoc: speedForWave, spawnIntervalSeconds, concurrentCapForWave, quotaForWave, commonalityForWave, hardLetterMultiplierForWave, lengthWeightsForWave. Use EXACTLY the formulas in section 1.4 (speed min(30+2.5(w-1),72); interval max(1.0, 2.8*0.95^(w-1)); cap min(2+floor((w-1)/3),6); quota min(5+2(w-1),30); commonality min(1, 0.30+0.07(w-1)); hard-letter multiplier 1+min(1, 0.10*max(0,w-2)) for letters j k q v w x z) and the length-weight table for waves 1-10, linear per-column interpolation for waves 11-19, and the final row for waves >= 20. Rows must sum to 100.
2.C WORD SELECTION. Update IWordProvider.nextWord to take {lengthWeights, commonality, hardLetterMultiplier, excludeFirstLetters, excludeWords}. Algorithm (deterministic, exactly two wordRng draws per word, documented in docs/simulation.md): (1) one draw maps through the cumulative length weights to a length L (if tier L has no admissible candidate widen to the nearest available length, preferring shorter); (2) pool = first ceil(commonality*|tier L|) words of tier L, minus live words and words whose first letter is the first letter of a live drone (keep the existing fallback order: drop first-letter exclusion, then widen length); (3) one draw does a weighted pick where words containing at least one hard letter have weight hardLetterMultiplier and all others weight 1 (cumulative weights in tier order). Only curated tier words are ever used.
2.D WAVE INTERMISSION (D4). waveIntermissionSeconds = 2.5. Event order: WAVE_COMPLETED(n) -> WAVE_INTERMISSION{tick,nextWave,durationTicks} -> (no spawns for the duration) -> WAVE_STARTED(n+1). At run start: WAVE_INTERMISSION(nextWave=1) -> WAVE_STARTED(1). A wave still completes only when its whole quota has spawned and no drone is alive. The intermission timer counts ticks and freezes while paused. Add WAVE_INTERMISSION to the domain types and docs.
2.E SIM:DEMO. Remove presets from scripts/sim-demo.ts. Run seeded bots at 30, 50 and 70 WPM with 4% error rate for 5 simulated minutes (and a no-input run) and print: waves reached, hits/misses, accuracy, net WPM, elapsed time, time to game over. REPORT the numbers; do NOT tune any value.
2.F GOLDEN UPDATE (rule R-D) in its own commit with a list of what changed.
Tests: see the plan (distribution, monotonicity, intermission order, pause freeze, determinism 20,000 ticks x 2 seeds, hard-letter share rising, no duplicate live words, fallback paths, word-provider determinism with an injected fixture). Run lint, test, build, e2e. STOP after the completion report. Do not start P3.
```

## Tests
- **Table integrity:** each row sums to 100; waves 1–2 produce no word > 4 letters over 10,000 draws; wave 3's 5–6 share within 10% ± 3 points; wave 5's within 50% ± 3; every row's observed share within ± 3 points.
- **Monotonicity:** speed non-decreasing, interval non-increasing, cap non-decreasing, quota non-decreasing (until caps), mean word length non-decreasing across waves 1–25.
- **Selection:** exactly two RNG draws per word; hard-letter share rises with the wave; deterministic with a fixed seed; fallback paths; no duplicate live words in a 20,000-tick run.
- **Intermission:** exact event order; timer freezes while paused; run starts with `WAVE_INTERMISSION(1)`; no spawns during intermission.
- **Removal:** a repo search for `DIFFICULTY_PRESETS|DifficultyPresetId|relaxed|intense` returns nothing outside historical docs.

## Acceptance checks
- [ ] Distribution and monotonicity tests pass with the numbers above.
- [ ] `sim:demo` output pasted for 30/50/70 WPM bots and the no-input run.
- [ ] Golden commit isolated and explained.

## Human verification
Read the `sim:demo` output. Rough expectation (a proposal, not a requirement): a 30 WPM bot reaches around wave 4–6, a 50 WPM bot roughly 8–10, a 70 WPM bot beyond 11, and a no-input run ends within roughly 45 s (my hand estimate: the first drone needs about 17 s to reach the ship at 30 px/s after a 3.5 s start, and the third collision lands near 40 s). If the output is far outside that, note it for P7/Step 9-style tuning; do not tune now.

## Commit/tag
`r1-p2-done`

---

# P3 — Persistence: settings (minimal) and run history

## Goal
Safe local stores for settings and run history, with all stat math in pure, tested code.

## Preconditions
P2 done (result shape is final).

## Scope
`src/shared/storage/**`, `src/shared/settings/**`, `src/shared/history/**`, tests. No UI beyond what P6 builds.

## Technical spec
Implement section 1.6. This **pulls forward** the settings design of Phase 1 Step 11: per-field validation, try/catch with in-memory fallback, `useSyncExternalStore`, **no new dependency** (R-F).

## Agent prompt

```text
Implement P3 of Revision R1 (persistence). Follow R1-R16 and R-A..R-F. Preconditions: P2 complete. Scope: src/shared/storage, src/shared/settings, src/shared/history, tests. No UI work (P6 builds screens). No new dependencies.

3.A safeStorage: get/set/remove for localStorage with try/catch on EVERY access, an in-memory fallback, and an `available` flag. Never throw to callers.
3.B SettingsStore (key caret.settings.v1): { version:1, sfxEnabled:true, musicEnabled:true, reducedMotion:"system"|"on"|"off" ("system") }. Hand-written parseSettings with PER-FIELD validation (a bad field falls back to its own default, good fields are kept; unknown version or non-JSON -> all defaults). get/update/reset/subscribe plus a useSettings() hook via useSyncExternalStore. Add a `musicAvailable` constant (false) in an audio-capabilities module so the UI can hide the Music row until a track exists (D6).
3.C HistoryStore (key caret.history.v1): { version:1, runs: RunRecord[] }, newest last, capped at 100 (drop oldest). Validate every record field (clamp/reject malformed records individually rather than discarding the whole history). RunRecord as in section 1.6. API: load(), append(record), clear(), subscribe().
3.D PURE LOGIC (no storage access): computeStats(runs) -> bestScore, bestWave, bestAccuracy (only runs with >= 100 entries, constant MIN_ENTRIES_FOR_BEST_ACCURACY), bestNetWpm (only runs >= 30 s, constant MIN_SECONDS_FOR_BEST_WPM), totalRuns, totalTimeSeconds, lastRun, previousRun; evaluateRecords(previousRuns, run) -> { isFirstRun, isNewWaveRecord (previous runs >= 1 and run.wave > previous best wave), isNewScoreRecord }; selectSeries(runs, metric: "wave"|"score"|"accuracy"|"netWpm", count=10) -> number[] plus the index of the newest run; GRAPH_MIN_RUNS = 5.
3.E buildRunRecord(result, nowIso, nextId) lives in the app layer (src/app or src/ui) because it receives a timestamp string; the core never creates timestamps (R-B).
3.F Formatting helpers (pure): formatElapsed(seconds) -> mm:ss (h:mm:ss from one hour), formatAccuracy (floor to one decimal), formatCount.
Tests (Vitest, jsdom for storage): defaults; round trip; malformed JSON; wrong type per field keeps the good fields; out-of-range clamp; unknown version; storage throwing on read AND on write; quota error; history cap at 100; one corrupt record among good ones; computeStats with empty/one/many runs and the min-entries/min-seconds rules; evaluateRecords for first run, equal wave (no record), higher wave (record), higher score only; selectSeries counts and newest-run index; formatElapsed boundaries (59 s, 60 s, 3599 s, 3600 s); formatAccuracy never shows 100.0 with misses.
Run lint, test, build, e2e. STOP after the completion report. Do not start P4.
```

## Acceptance checks
- [ ] Corrupted or unavailable storage never throws (tests).
- [ ] Records logic matches D13 (first run is not a "record").
- [ ] No new dependency (`package.json` diff shown).
- [ ] No `Date` usage in `src/game/core` or `src/shared/domain` (lint).

## Human verification
In the browser console: `localStorage.setItem("caret.history.v1", "garbage")` and reload — the app must still start. (UI for stats arrives in P6.)

## Commit/tag
`r1-p3-done`

---

# P4 — Typography: Tektur everywhere

## Goal
Replace every font in the project with Tektur (item 14), self-hosted, with a loading strategy that cannot render Phaser text in a fallback face, and a legibility check for the word labels.

## Preconditions
P3 done.

## Scope
`package.json` (one new dependency), global CSS tokens, `BootScene`, Phaser text styles, `CREDITS.md`, `third_party/`, removal of the old font files, dev-only legibility sheet, tests.

## Technical spec
Section 1.7. Use the npm package **`@fontsource/tektur`** (checked: exists, OFL-1.1, includes a LICENSE file). Import only the Latin files for the weights actually used: `@fontsource/tektur/latin-400.css`, `latin-500.css`, `latin-600.css`, `latin-700.css`. Fontsource bundles the `.woff2` files through Vite, so there are **no requests to Google** at runtime (Playwright asserts this).

## Agent prompt

```text
Implement P4 of Revision R1 (typography). Follow R1-R16 and R-A..R-F. Preconditions: P3 complete. The ONLY new dependency allowed is @fontsource/tektur (justify per R8: name, version, license as listed in its package.json, alternative rejected = hand-downloading font files).

4.A INSTALL. Run `npm view @fontsource/tektur name version license` and report. Install it. Open the installed package's LICENSE file and confirm it contains the SIL Open Font License 1.1 text; if it does not, STOP and report. Copy that LICENSE to third_party/tektur/OFL.txt unchanged.
4.B TOKENS. Import latin-400/500/600/700 CSS once (src/main.tsx or the global stylesheet). Define --font-ui and --font-display as "Tektur", ui-sans-serif, system-ui, sans-serif and replace EVERY font-family declaration and font token in src/ (CSS, CSS-in-TS, inline styles). Remove all old @font-face rules and delete the old font files from public/ (the Kenney fonts and any others you inventoried in docs/R1_AUDIT.md). Update CREDITS.md: remove the removed fonts, add Tektur (OFL-1.1, copyright line copied from the package LICENSE, source: the @fontsource/tektur package). Never write the word "verified" about licenses.
4.C PHASER. Update BootScene so the game does not create any Phaser Text until the font is ready: `await Promise.all([document.fonts.load("600 18px Tektur"), document.fonts.load("500 16px Tektur"), document.fonts.load("700 48px Tektur")])` (use the weights your styles actually use), then start the next scene. All Phaser text styles use fontFamily "Tektur" via ONE exported style constant. Word labels: weight 600, 18 px, one Text per letter centered in a fixed-advance cell (origin 0.5) because Tektur is proportional; the advance stays labelCharWidthPx.
4.D LAYOUT. Tektur's glyph widths differ from the old font. Re-check letter-spacing tokens, button widths, and panel padding so that no text overflows or wraps unexpectedly in the menu, pause overlay, game-over overlay (current versions) at 1280x720, 1440x900 and 1920x1080.
4.E LEGIBILITY SHEET (dev only, behind ?preview=1, absent from dist): render (1) all 26 lowercase letters, (2) 12 sample words of lengths 3-8 including words with i, l, j, g, a, r, n, m, u, v, w, (3) the typed/next/remaining label states, each at the real label size and at 200% zoom. Save screenshots to artifacts/font-check/. In the report, list every pair of letters you personally find confusable at label size and say whether the next-letter underline and dimming make the active letter clear. Do not decide on a fallback; I will.
Tests: (a) a Playwright test that walks every element containing visible text on the menu and in a running game and asserts getComputedStyle(el).fontFamily starts with "Tektur"; (b) document.fonts.check for every used weight; (c) a dev-hook-based audit that every Phaser Text object's style.fontFamily is Tektur; (d) network assertion: during a full menu->game->game-over flow there are zero requests to fonts.googleapis.com or fonts.gstatic.com; (e) a grep-style test that no source file references an old font family name; (f) first-frame test: the first rendered Phaser Text is created only after the fonts are loaded.
Run lint, test, build, e2e. Report the production bundle size difference. STOP after the completion report. Do not start P5.
```

## Acceptance checks
- [ ] `third_party/tektur/OFL.txt` matches the package license; `CREDITS.md` updated; old font files gone.
- [ ] Computed-style test passes on menu and in-game; no Google font requests.
- [ ] Legibility sheet screenshots exist and the report names any confusable pairs.
- [ ] No text overflow at the three resolutions (screenshots in `artifacts/`).

## Human verification
Open the legibility sheet at your normal screen distance. Read the 26 letters and the sample words aloud. **Decision (D11):** if any pair is a problem (for example `i`/`l`/`j`), tell me and I will write a one-line change that reverts only the word labels to a plain monospace face.

## Commit/tag
`r1-p4-done`

---

# P5 — Layout and HUD

## Goal
Implement items 1, 3 (banner), 6 (pips), 7, 8, 9 (placement), 11 (console bar removal), 12, 13, 15: new shell, top strip, wing boxes, clock, timer, lives, sprite sizes and label placement, wave banner, and the removals.

## Preconditions
P4 done.

## Scope
`src/app`, `src/ui`, `src/game/scenes`, `src/game/rendering`, CSS, tests. No menu/game-over redesign (P6) and no VFX (Step 10).

## Technical spec
Sections 1.1 and 1.8; D3, D4, D7, D10.

## Agent prompt

```text
Implement P5 of Revision R1 (layout and HUD). Follow R1-R16 and R-A..R-F. Preconditions: P4 complete. Scope: src/app, src/ui, src/game/scenes, src/game/rendering, CSS, tests. Do NOT redesign the menu or game-over screen (P6). Do NOT add effects or audio.

5.A SHELL. Build `.game-shell` as a CSS grid with rows `auto` (top strip) and `1fr` (viewport area). The viewport is aspect-ratio 16/9, sized with min(100%, (100dvh - stripHeight) * 16/9), centered; the Phaser canvas fills it (Scale.FIT, world 1280x720). A ResizeObserver sets the CSS variable --u = viewportWidthPx/1280 on the viewport; every element placed INSIDE the viewport scales with --u. Remove the "TACTICAL COMMAND CONSOLE" header bar and its MODE/STATUS content entirely (item 11) from every screen.
5.B TOP STRIP (outside the canvas, 44-48 px, no heavy border). Left: WAVE (two digits), TIME (formatElapsed of snapshot.elapsedTicks/tickRate, mm:ss, h:mm:ss after an hour), ACCURACY (floor to one decimal, e.g. 96.4%). Center: HullPips (3 pips = current health out of 3; filled vs outlined differ in SHAPE as well as color). Right: PAUSE button ("PAUSE · ESC") then ClockBadge. Values use tabular figures or a reserved width so they do not jitter.
5.C CLOCK (D7). ClockBadge shows local time HH:MM using Intl.DateTimeFormat(undefined, {hour:"2-digit", minute:"2-digit"}). Update on minute boundaries (setTimeout aligned to the next minute, not a 1 s interval), clear the timer on unmount, handle visibilitychange by refreshing immediately. Wall-clock access is allowed ONLY in this UI component (R-B). The clock is also shown on the menu and game-over screens at top-right.
5.D WING BOXES (items 7, 9). StreakBox on the left and ScoreBox on the right of the ship, small (about 84x34 world px via --u), semi-transparent, pointer-events none, label over value. Position with a pure, unit-tested helper worldToViewportPercent({x,y}) driven by PLAYER_START, HUD_WING_GAP_WORLD and HUD_WING_Y_OFFSET_WORLD (add these named constants to config; do not hard-code percentages). They must stay in the bottom band beside the ship.
5.E REMOVALS (rule R-C). Delete completely, with their CSS, tests, props and docs: the in-canvas five-box stat row; the multiplier box; the hull-integrity bar; the MOTION button from the HUD (reduced motion moves to Settings in P6); the Target Lock panel (ActiveTargetReadout, its tests and styles, and the HUD slot) - D3. The lock MECHANIC stays. Gate the in-world bracket reticle behind config SHOW_LOCK_RETICLE (default false): when false no reticle object is created. The locked drone's label keeps its typed-letter dimming and next-letter highlight/underline.
5.F SIZES AND LABELS (rule R-E, items 1 and 8). Apply the TARGET sizes from config (drone ~44 px wide, ship ~60x87 px): set sprite display scales from the texture dimensions; do not edit the SVG files unless unavoidable. Label plates sit ABOVE the sprite with a 6 px gap and never over it; plate width derives from word length x labelCharWidthPx plus padding, clamped inside the canvas horizontally. Remove any cropping of labels at the top edge. Ship uses PLAYER_START from config. Expose a DEV-ONLY hook window.__caret.getViewMetrics() returning {droneWidth, shipWidth, shipHeight, labelPlateTopMin, canvasRect}; prove it is absent from dist.
5.G WAVE BANNER (D4). WaveBanner component, centered in the viewport, shown from WAVE_INTERMISSION until WAVE_STARTED: text "WAVE 04" (two digits), Tektur 700, wide letter-spacing, amber with a restrained glow; fade in 250 ms, hold, fade out 250 ms; with reduced motion (user setting or OS) no animation, just show/hide; role="status" aria-live="polite"; sized with --u; pointer-events none. "WAVE 01" appears before the first spawn.
5.H HULL FEEDBACK. On PLAYER_DAMAGED the ship tints red for 100 ms (reduced motion: tint only) and a pip becomes outlined. No other effects (Step 10 owns effects).
Tests: (1) unit: worldToViewportPercent, formatElapsed, HullPips (health 3/2/1/0), ClockBadge with fake timers and a fixed time zone (minute alignment, cleanup, visibilitychange), WaveBanner visibility logic and reduced-motion branch; (2) Playwright geometry tests at 1280x720, 1440x900, 1920x1080 and 1024x600 with ?autostart=1&seed=1337: top-strip bottom <= canvas top; NO HUD element's bounding box intersects the upper 80% of the canvas; wing boxes lie in the bottom 20% and within 20% of horizontal center; labelPlateTopMin >= 6; drone width within +-3 px of the target and ship within +-3 px; (3) e2e: banner shows "WAVE 01" at start and "WAVE 02" after the first wave clears (use a typing bot that reads window.__caret.getSnapshot() and types the nearest drone's word, with a fixed seed; allow up to 90 s); (4) e2e: three pips decrease with each collision and the run ends on the third; (5) e2e: no "TARGET LOCK" text, no multiplier, no "TACTICAL COMMAND CONSOLE" anywhere in the DOM; (6) a source search proves ActiveTargetReadout and the removed strings are gone.
Run lint, test, build, e2e; save screenshots at the four sizes to artifacts/r1-p5/. STOP after the completion report. Do not start P6.
```

## Acceptance checks
- [ ] Geometry tests prove nothing overlaps the upper 80% of the canvas (item 7).
- [ ] Sizes within ±3 px of targets; label top margin ≥ 6 px (items 1, 8, and the clipped-label defect).
- [ ] Streak left / score right of the ship in screenshots at all four sizes; boxes visibly smaller than before.
- [ ] Clock top-right, elapsed time in the top strip, three hull pips.
- [ ] Banner shows during intermissions only; reduced motion verified.
- [ ] Removed items are gone from DOM, source, and styles.

## Human verification
Play 5 minutes. Do new drones ever hide behind anything at the top? Does the smaller drone still feel fair when it collides (visual contact ≈ hit)? Can you read the word labels at normal distance? Is the ship size what you meant by "medium"? (If not, say a percentage: it is one constant.)

## Commit/tag
`r1-p5-done`

---

# P6 — Screens: main menu, game over, settings, boot status

## Goal
Implement items 4 (game-over popup, records, graph, buttons), 5 (menu stats/graph/new game/settings), and 11 (temporary status on the start page).

## Preconditions
P5 done.

## Scope
`src/ui/screens/**`, `src/ui/components/**` (ProgressChart, StatCard, SettingsModal), controller wiring for run results, tests. No audio playback (Step 10).

## Technical spec
Sections 1.1 (menu and game-over wireframes) and 1.6; D6, D8, D9, D13.

## Agent prompt

```text
Implement P6 of Revision R1 (screens). Follow R1-R16 and R-A..R-F. Preconditions: P5 complete (read docs/R1_DECISIONS.md). Scope: src/ui, src/app, controller wiring, tests. Charts are hand-written SVG (no chart library). No audio playback.

6.A MAIN MENU. Panel in the existing "Command Headquarters" style (Tektur, amber accents, corner brackets). Content: title (GAME_TITLE / subtitle from branding), PILOT RECORD (BEST SCORE, BEST WAVE, BEST ACCURACY, BEST NET WPM, RUNS, TIME TYPED via computeStats and formatElapsed; "--" for values that do not qualify yet), LAST RUN line (wave, score, accuracy, net WPM, time) when a last run exists, the progress graph when runs >= GRAPH_MIN_RUNS (else a muted hint: "Complete N more runs to unlock your progress graph"), primary button NEW GAME [ENTER] (autofocused), a SETTINGS button, and the existing TACTICAL DIRECTIVE text (keep: type the first letter to lock on; finish the word; TAB releases the lock; ESC pauses). There are NO difficulty controls (D5). Help text under the stats explains that WPM is "game WPM" (the run clock includes waiting time). At 1280x720 everything important is visible without scrolling; the panel scrolls internally only if the window is shorter. The clock stays top-right.
6.B TEMPORARY BOOT STATUS (D9). On the FIRST menu view per page load only, show a one-line status above the panel - "SYSTEM ONLINE // READY  ·  MODE: TACTICAL DEFENSE  ·  STATUS: MENU" - fading in and out over about 2.5 s (reduced motion: shown 2.5 s without animation). It never reappears when returning from a game. It is not interactive and not announced to screen readers.
6.C PROGRESS CHART (component ProgressChart). Props: runs, metric ("wave"|"score"|"accuracy"|"netWpm"), highlightLatest. Last 10 runs (selectSeries). Thin amber line with small point markers on a transparent dark plot; light horizontal grid lines; y-axis min/max labels; x-axis run numbers; the newest point larger/ringed when highlighted. Metric tabs (Wave / Score / Accuracy / Net WPM) as a radiogroup with arrow-key support. role="img" with an aria-label summarizing the metric, count, best and latest values, plus a visually hidden <table> of the same data. Handles 5..100 runs, equal values (no divide-by-zero), and a single metric with all zeros.
6.D GAME-OVER PANEL (same panel style). On GAME_OVER: build the RunRecord (buildRunRecord, timestamp created in the app layer), compute evaluateRecords against the history BEFORE appending, then append once. Heading: if isNewWaveRecord -> "NEW RECORD!" with "WAVE 07 REACHED"; else if isFirstRun -> "FIRST MISSION LOGGED" with the wave; else "SHIP LOST" with the wave reached. A secondary line "NEW BEST SCORE" when isNewScoreRecord. Rows: THIS RUN (score, wave, accuracy, net WPM, time, longest streak), BEST (score, wave) and PREVIOUS RUN (wave, score). Graph (metric tabs, latest highlighted) when runs >= GRAPH_MIN_RUNS. Buttons: NEW GAME [ENTER] (autofocused) and MAIN MENU. The panel must append exactly one record per run even under React StrictMode double-invocation and fast restarts (guard by run id).
6.E SETTINGS MODAL (from the menu and from the pause overlay). SFX toggle, Music toggle (hidden while musicAvailable is false - D6), Reduced motion radio (System / On / Off), RESET STATISTICS (with a confirmation step; clears history only). Uses SettingsStore. Reduced motion setting drives data-reduced-motion on <html> and the banner/boot animations. SFX/Music values persist; nothing audible exists yet (add a TODO(step-10) at the audio hook point).
6.F ACCESSIBILITY. All panels are role=dialog with aria-modal, focus moves to the first/primary control, focus is trapped and restored on close; Tab behaves normally in menus (it is "release target" only during gameplay).
Tests: component tests for StatCard values/dashes, the record-message matrix (first run; wave record; equal wave; score-only record), ProgressChart (series, highlight, tabs, hidden table, edge cases), SettingsModal (persistence, Music row hidden, reset confirm); Playwright with history seeded via page.addInitScript: (a) 0 runs -> no graph, hint shown; (b) 4 runs -> hint "1 more"; (c) 6 runs -> graph + metric tabs; (d) play a run to game over with no input (seed 1337; allow 90 s) -> panel appears, exactly one new record in localStorage, "FIRST MISSION LOGGED"/"NEW RECORD!" per seeded history; (e) NEW GAME starts a run; MAIN MENU returns without the boot status; (f) reset statistics clears the graph; (g) corrupted history string does not break the menu; (h) no difficulty controls anywhere.
Save screenshots of menu (0 runs, 6 runs), game over (record, no record) at 1280x720 and 1440x900 to artifacts/r1-p6/. Run lint, test, build, e2e. STOP after the completion report. Do not start P7.
```

## Acceptance checks
- [ ] Menu shows stats, graph rule (≥ 5), New Game, Settings; no difficulty controls.
- [ ] Game-over shows record logic exactly as D13; one history append per run (test).
- [ ] Chart is accessible (role/label/hidden table) and handles edge cases.
- [ ] Boot status appears once per load and never again.
- [ ] Settings persist; reset requires confirmation; Music row hidden.

## Human verification
Play 6 runs (let some end quickly). After run 5 the graph should appear; try each metric tab. Beat your best wave once and confirm "NEW RECORD!" shows only then. Reload the page and confirm the boot line shows once.

## Commit/tag
`r1-p6-done`

---

# P7 — QA, documentation, licenses, tag

## Goal
Prove all 15 items, update the docs that other plans depend on, and tag the revision.

## Preconditions
P6 done.

## Scope
Tests, docs, `CREDITS.md`, small confirmed-bug fixes (each with a regression test). No new features.

## Agent prompt

```text
Perform P7 of Revision R1 (QA, documentation, tag). Follow R1-R16 and R-A..R-F. Do NOT add features and do NOT rewrite working code. Audit first; fix only confirmed defects, each with a regression test.

7.A CLEAN-CLONE GATE: delete node_modules and dist; npm ci; npm run lint; npm run test; npm run build; npm run sim:demo; the full Playwright suite. Paste raw output.
7.B ITEM-BY-ITEM CHECK: fill the 15-row table in docs/R1_REPORT.md using Appendix B of docs/R1_PROMPT_SET.md. For each row give the evidence (test name, screenshot path, or command output). Rows you cannot prove are marked UNVERIFIED with the reason.
7.C SCREENSHOT MATRIX: gameplay, wave banner, menu (0 runs and 6 runs), game over (record and non-record) at 1280x720, 1440x900, 1920x1080 and 1024x600, plus 1440x900 at deviceScaleFactor 2. Save under artifacts/r1-final/ and list them.
7.D SOAK: Playwright bot (reads window.__caret.getSnapshot(), types the nearest drone's word at ~50 WPM) for 90 s across several waves: zero console errors; display-object counts bounded (state the bound from a 20 s baseline); listener counts flat across 5 consecutive restarts; p95 frame time reported with the machine spec; heap after gc() if available (else UNVERIFIED).
7.E LEFTOVER SEARCH: search src/, docs/, tests/ and dist/ for: multiplier, DIFFICULTY_PRESETS, relaxed, intense, TACTICAL COMMAND CONSOLE, ActiveTargetReadout, "TARGET LOCK", hull integrity, MOTION:, Kenney (fonts), Math.random/Date.now inside src/game/core, window.__caret and ?preview strings in dist. Paste each search's result; fix any leftover that should be gone.
7.F DOCS: update docs/simulation.md (scoring, lives, progression table, events incl. WAVE_INTERMISSION, RNG draw order), README.md (how to play, stats, settings, fonts), CREDITS.md (Tektur OFL; no removed fonts), docs/PHASE1_PLAN.md (Step 10: effects now follow the new events - no multiplier effects, hull = lives; Step 11: settings store and modal already exist, only volume and MotionPolicy wiring remain), and add a short "Impact on Phase 2" note listing: presets removed; damage values written for a 100-point hull must be redefined for 3 lives; Endless mode and Adaptive mode must be reconsidered against the new built-in progression. Save the prompt set itself as docs/R1_PROMPT_SET.md if it is not there.
7.G Write docs/R1_REPORT.md: what changed per item, decisions D1-D13 as finally confirmed, tests added, soak numbers, known limitations, license statuses (Tektur: OFL-1.1 per the package LICENSE; other assets as in CREDITS.md), and the list of open questions. Tag r1-complete. End with the completion report.
```

## Acceptance checks
- [ ] Clean-clone gate passes; soak numbers recorded.
- [ ] All 15 rows in `docs/R1_REPORT.md` have evidence or an explicit UNVERIFIED.
- [ ] Leftover searches return nothing that should be gone; dev hooks absent from `dist/`.
- [ ] Docs updated, including the Phase 2 impact note.

## Human verification
Play a normal session of 10 minutes and walk through Appendix B yourself, ticking each row. Show the game to someone who has not seen it and watch for confusion about the wave banner, the pips, and the stats screen.

## Commit/tag
`r1-complete`

---

# Appendices

## Appendix A — New configuration constants

| Constant | Value | Prompt |
|---|---|---|
| `SCORE_PER_CORRECT_CHAR` | 1 | P1 |
| `playerMaxHealth` / `collisionDamage` | 3 / 1 | P1 |
| Drone target width / ship target size (world px) | 44 / 60 × 87 | P1 |
| `hitboxRadius`, `hullRadius` | derived: round(0.8 × half-width) | P1 |
| `SPAWN_Y` | derived, expected ≈ 64 | P1 |
| `SHOW_LOCK_RETICLE` | false | P1/P5 |
| `waveIntermissionSeconds` | 2.5 | P2 |
| speed / interval / cap / quota / commonality / hard-letter formulas | section 1.4 | P2 |
| Length-weight table, interpolation to wave 20 | section 1.4 | P2 |
| `HARD_LETTERS` | j k q v w x z | P2 |
| `GRAPH_MIN_RUNS` | 5 | P3 |
| `MIN_ENTRIES_FOR_BEST_ACCURACY` / `MIN_SECONDS_FOR_BEST_WPM` | 100 / 30 | P3 |
| History cap | 100 runs | P3 |
| `HUD_WING_GAP_WORLD`, `HUD_WING_Y_OFFSET_WORLD` | set in P5 from the measured ship size | P5 |
| Banner fade / boot status duration | 250 ms / 2.5 s | P5/P6 |
| `musicAvailable` | false | P3 |

All of these are starting values; tune them after your next playtest, one change at a time, with the golden-update rule (R-D).

## Appendix B — Item-by-item acceptance checklist (used in P7 and by you)

| # | Check | Evidence |
|---|---|---|
| 1 | Drone ≈ 44 px wide (± 3), labels still readable | `getViewMetrics` test + screenshot |
| 2 | No difficulty control anywhere; waves get harder (speed, interval, length) | repo search + monotonicity tests |
| 3 | "WAVE 0N" banner during every intermission and before wave 1 | e2e + screenshot |
| 4 | Wave 1–2 words ≤ 4 letters; wave 3 ≈ 10% 5–6 letters; wave 5 ≈ 50% | distribution tests |
| 4b | Game-over panel with record message, previous/best, graph after 5 runs, two buttons | e2e + screenshots |
| 5 | Menu shows stats, graph rule, New Game, Settings (SFX; Music hidden) | e2e + screenshots |
| 6 | Three pips; third collision ends the run | unit + e2e |
| 7 | Nothing overlaps the upper 80% of the canvas | geometry test |
| 8 | Ship ≈ 60 × 87 px (± 3) | `getViewMetrics` test |
| 9 | Streak left / score right of the ship, small; +1 per correct char; no multiplier | screenshot + scoring tests |
| 10 | Accuracy matches the five vectors; display never shows 100.0 with misses | metrics tests |
| 11 | No console header bar; boot status shows once | e2e + search |
| 12 | Clock top-right, minute-aligned, local time | unit + screenshot |
| 13 | Elapsed time in the top strip; frozen while paused | unit + e2e |
| 14 | Computed font is Tektur everywhere, including Phaser labels; no Google font requests | font tests |
| 15 | No "Target Lock" panel in DOM or source; reticle off | search + e2e |

## Appendix C — Risks

| Risk | Mitigation in this set |
|---|---|
| Tektur's stylized lowercase letters hurt word readability | P4 legibility sheet and your D11 decision; fallback is a one-line change for labels only |
| Smaller drones feel unfair if hitboxes do not shrink | Radii derive from the sprite constants (P1) and the human check in P5 |
| Progression too easy or too hard | All formulas are data; `sim:demo` gives numbers; tune after playtesting |
| Golden tests silently normalize bugs | R-D: isolated, explained golden commits only |
| Removing difficulty selection invalidates Phase 2 designs | Impact note (0.5) and P7 documentation |
| Stats polluted by trivial runs | Minimum-entries and minimum-seconds rules for "best" values |
| Duplicate history entries from React double effects | Run-id guard and a test (P6) |
| Wall-clock code leaking into the core | R-B plus the existing lint rule and architecture test |

## Appendix D — Not verified (treat as open)

- **Your current code was not available to me.** The sizes (≈ 85–90 px drone, ≈ 85 × 124 px ship) are estimated from screenshots; P0 replaces them with measurements.
- Whether your current accuracy code actually subtracts misses — P0 checks it. The formulas in 1.2 were taken from the SpeedTypingOnline equations page, read for this document.
- Whether the thin green horizontal line in your menu screenshot is a leftover scanline or a capture artifact — P0 investigates, nothing deletes it blindly.
- Hardware and browser behavior (frame time, heap) — P7 measures on your machine.
- All difficulty numbers, thresholds, and sizes are proposals. The five metric test vectors are arithmetic and were checked by hand.
- Whether "temporarily" in item 11 means the boot line I chose (D9) — correct me if you meant something else.
