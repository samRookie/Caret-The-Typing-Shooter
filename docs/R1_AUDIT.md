# Caret — Revision R1 Codebase Audit (`docs/R1_AUDIT.md`)

> **Audit Date**: 2026-10-07  
> **Environment**: Windows 11 / PowerShell / Node v25.9.0 / Vite 6.4.3 / Phaser 3.88.2 / React 18.3.1  
> **Scope**: Read-only codebase audit across all 15 playtest findings prior to Revision R1 code modifications.

---

## 1. Baseline Verification & Repository Health

```text
Git Branch: master
Latest Tag: step-9-done
Working Tree: clean (0 uncommitted changes)
```

### Raw Command Execution Outputs

- **ESLint Check (`npm run lint`)**:
  ```text
  > typing-shooting-game@0.1.0 lint
  > eslint .
  (Exited with code 0; 0 errors, 0 warnings)
  ```
- **Vitest Unit & Integration Suite (`npm run test`)**:
  ```text
  Test Files  22 passed (22)
  Tests       187 passed (187)
  Duration    36.86s
  ```
- **Production Bundle Build (`npm run build`)**:
  ```text
  dist/index.html                     0.50 kB │ gzip:   0.32 kB
  dist/assets/index-DZGVxdkF.css      5.43 kB │ gzip:   1.88 kB
  dist/assets/index-o_WpjClN.js   1,721.36 kB │ gzip: 417.55 kB
  ✓ built in 33.53s
  ```
- **Playwright End-to-End Suite (`npx playwright test`)**:
  ```text
  Running 7 tests using 1 worker
    ok 1 [chromium] › e2e\app.spec.ts:9:3 › smoke test (root): zero console errors (12.7s)
    ok 2 [chromium] › e2e\app.spec.ts:31:3 › smoke test (preview mode): zero console errors (1.1s)
    ok 3 [chromium] › e2e\app.spec.ts:53:3 › PhaserContainer: exactly one <canvas> (2.1s)
    ok 4 [chromium] › e2e\app.spec.ts:73:3 › scaling & letterboxing verification (4.7s)
    ok 5 [chromium] › e2e\app.spec.ts:104:3 › contrast ratio verification on HUD and Word Plate (882ms)
    ok 6 [chromium] › e2e\first-playable.spec.ts:5:3 › playable run: autostart, type word, tab release (23.7s)
    ok 7 [chromium] › e2e\game-flow.spec.ts:5:3 › complete user flow: Menu -> Play -> Esc -> Blur -> Game Over -> Restart (48.1s)
    7 passed (1.6m)
  ```

---

## 2. Inventory of the 15 Requested Changes

| # | Requested Change | Current Code Implementation (file:line) | Impacted Tests That Will Break |
|---|---|---|---|
| **1** | Drones much smaller | [`src/game/rendering/views/EnemyView.ts:40-42`](file:///d:/MY%20PROJECTS/PROJECT%2011%20-%20TYPING%20SHOOTING%20GAME/src/game/rendering/views/EnemyView.ts#L40-L42) (`setScale(0.8)` on 128×128 SVG); [`src/shared/config/defaultConfig.ts:47`](file:///d:/MY%20PROJECTS/PROJECT%2011%20-%20TYPING%20SHOOTING%20GAME/src/shared/config/defaultConfig.ts#L47) (`hitboxRadius: 24`). | `src/tests/domainConfig.test.ts`, `src/tests/enemyView.test.ts`, `e2e/first-playable.spec.ts`. |
| **2** | No difficulty selection; single progressive curve | [`src/shared/config/defaultConfig.ts:37-64`](file:///d:/MY%20PROJECTS/PROJECT%2011%20-%20TYPING%20SHOOTING%20GAME/src/shared/config/defaultConfig.ts#L37-L64) (`DIFFICULTY_PRESETS`); [`src/game/controller/GameController.ts:37,52`](file:///d:/MY%20PROJECTS/PROJECT%2011%20-%20TYPING%20SHOOTING%20GAME/src/game/controller/GameController.ts#L37); [`src/ui/components/MenuScreen.tsx:85-174`](file:///d:/MY%20PROJECTS/PROJECT%2011%20-%20TYPING%20SHOOTING%20GAME/src/ui/components/MenuScreen.tsx#L85-L174) (radio group); [`src/game/core/simulation.ts:555-580`](file:///d:/MY%20PROJECTS/PROJECT%2011%20-%20TYPING%20SHOOTING%20GAME/src/game/core/simulation.ts#L555-L580) (preset scaling). | `src/tests/domainConfig.test.ts`, `src/tests/screens.test.tsx`, `src/tests/gameController.test.ts`, `src/tests/simulation.test.ts`. |
| **3** | "WAVE XX" announcement replaces blank pause | [`src/game/core/simulation.ts:771-789`](file:///d:/MY%20PROJECTS/PROJECT%2011%20-%20TYPING%20SHOOTING%20GAME/src/game/core/simulation.ts#L771-L789) (emits `WAVE_COMPLETED`, sets intermission ticks without `WAVE_INTERMISSION` event). No `WaveBanner` component exists. | `src/tests/simulation.test.ts` (event sequence & golden replay log). |
| **4** | Wave word-length progression & rich Game Over modal | [`src/game/core/simulation.ts:555-568`](file:///d:/MY%20PROJECTS/PROJECT%2011%20-%20TYPING%20SHOOTING%20GAME/src/game/core/simulation.ts#L555-L568) (linear step ramp); [`src/ui/components/GameOverModal.tsx:1-129`](file:///d:/MY%20PROJECTS/PROJECT%2011%20-%20TYPING%20SHOOTING%20GAME/src/ui/components/GameOverModal.tsx#L1-L129) (no record checking, no trend graph, no historical comparison). | `src/tests/words.test.ts`, `src/tests/simulation.test.ts`, `src/tests/screens.test.tsx`, `src/tests/HUDComponents.test.tsx`. |
| **5** | Main menu: Pilot record, graph, settings modal | [`src/ui/components/MenuScreen.tsx:1-120`](file:///d:/MY%20PROJECTS/PROJECT%2011%20-%20TYPING%20SHOOTING%20GAME/src/ui/components/MenuScreen.tsx#L1-L120) (only contains title, radio buttons, directive, and play button). No stats, chart, or settings hook. | `src/tests/screens.test.tsx`, `src/tests/App.test.tsx`. |
| **6** | 3 collisions instead of a 100 HP hull bar | [`src/shared/config/defaultConfig.ts:44,55`](file:///d:/MY%20PROJECTS/PROJECT%2011%20-%20TYPING%20SHOOTING%20GAME/src/shared/config/defaultConfig.ts#L44) (`playerMaxHealth: 100`, `hullDamage: 20`); [`src/game/core/simulation.ts:646-654`](file:///d:/MY%20PROJECTS/PROJECT%2011%20-%20TYPING%20SHOOTING%20GAME/src/game/core/simulation.ts#L646-L654); [`src/ui/components/HUDOverlay.tsx:98-145`](file:///d:/MY%20PROJECTS/PROJECT%2011%20-%20TYPING%20SHOOTING%20GAME/src/ui/components/HUDOverlay.tsx#L98-L145) (progressbar). | `src/tests/domainConfig.test.ts`, `src/tests/simulation.test.ts`, `src/tests/hudBinding.test.tsx`, `src/tests/HUDComponents.test.tsx`. |
| **7** | Move stats out of active play area | [`src/ui/components/HUDOverlay.tsx:56-125`](file:///d:/MY%20PROJECTS/PROJECT%2011%20-%20TYPING%20SHOOTING%20GAME/src/ui/components/HUDOverlay.tsx#L56-L125) (stat row floats inside viewport top bounds, overlapping incoming drone trajectories). | `src/tests/hudBinding.test.tsx`, `e2e/app.spec.ts`. |
| **8** | Medium-size player ship | [`src/game/rendering/views/PlayerView.ts:31`](file:///d:/MY%20PROJECTS/PROJECT%2011%20-%20TYPING%20SHOOTING%20GAME/src/game/rendering/views/PlayerView.ts#L31) (`setScale(0.8)` on 120×160 SVG); [`src/shared/config/defaultConfig.ts:45`](file:///d:/MY%20PROJECTS/PROJECT%2011%20-%20TYPING%20SHOOTING%20GAME/src/shared/config/defaultConfig.ts#L45) (`hullRadius: 28`). | `src/tests/domainConfig.test.ts`, golden test in `simulation.test.ts`. |
| **9** | Wing boxes for streak/score; score = plain +1; no multiplier | [`src/game/core/simulation.ts:375-407`](file:///d:/MY%20PROJECTS/PROJECT%2011%20-%20TYPING%20SHOOTING%20GAME/src/game/core/simulation.ts#L375-L407) (`scorePerChar = 10 * streakMultiplier`); [`src/shared/config/defaultConfig.ts:70-74`](file:///d:/MY%20PROJECTS/PROJECT%2011%20-%20TYPING%20SHOOTING%20GAME/src/shared/config/defaultConfig.ts#L70-L74) (`maxMultiplier: 4`); [`src/ui/components/HUDOverlay.tsx:65-98`](file:///d:/MY%20PROJECTS/PROJECT%2011%20-%20TYPING%20SHOOTING%20GAME/src/ui/components/HUDOverlay.tsx#L65-L98) (top row). | `src/tests/domainConfig.test.ts`, `src/tests/simulation.test.ts`, `src/tests/hudBinding.test.tsx`. |
| **10** | Accuracy per typing equations; WPM computation | [`src/game/core/simulation.ts:437-438`](file:///d:/MY%20PROJECTS/PROJECT%2011%20-%20TYPING%20SHOOTING%20GAME/src/game/core/simulation.ts#L437-L438) (accuracy computed as `hits / (hits + misses) * 100`, but formatted via `Math.round`); no gross/net WPM exists. | `src/tests/simulation.test.ts`, new `src/tests/typingMetrics.test.ts`. |
| **11** | Remove top console header; temporary boot status | [`src/app/App.tsx:180-208`](file:///d:/MY%20PROJECTS/PROJECT%2011%20-%20TYPING%20SHOOTING%20GAME/src/app/App.tsx#L180-L208) (`<TacticalFrame title="TACTICAL COMMAND CONSOLE" ...>` rendered permanently across screens). | `src/tests/App.test.tsx`, `e2e/app.spec.ts`. |
| **12** | Real-time local clock top-right | Currently absent: zero clock/time components exist. | New component test for `ClockBadge`. |
| **13** | Elapsed typing time | `currentTick` tracked internally, but `elapsedTicks` is not exposed in public snapshot or formatted in HUD. | `src/tests/simulation.test.ts`, `src/tests/hudBinding.test.tsx`. |
| **14** | Whole-project font switch to Tektur | [`src/app/app.css:1-15`](file:///d:/MY%20PROJECTS/PROJECT%2011%20-%20TYPING%20SHOOTING%20GAME/src/app/app.css#L1-L15) (loads `KenneyFuture` & `KenneyFutureNarrow`); [`EnemyView.ts:59`](file:///d:/MY%20PROJECTS/PROJECT%2011%20-%20TYPING%20SHOOTING%20GAME/src/game/rendering/views/EnemyView.ts#L59) (`labelFontFamily: Consolas, Monaco...`). | `e2e/app.spec.ts`, css verification tests. |
| **15** | Remove Target Lock HUD panel | [`src/ui/components/ActiveTargetReadout.tsx:1-85`](file:///d:/MY%20PROJECTS/PROJECT%2011%20-%20TYPING%20SHOOTING%20GAME/src/ui/components/ActiveTargetReadout.tsx#L1-L85); [`src/ui/components/HUDOverlay.tsx:155-165`](file:///d:/MY%20PROJECTS/PROJECT%2011%20-%20TYPING%20SHOOTING%20GAME/src/ui/components/HUDOverlay.tsx#L155-L165); [`src/game/rendering/phase1-vfx.ts:25-85`](file:///d:/MY%20PROJECTS/PROJECT%2011%20-%20TYPING%20SHOOTING%20GAME/src/game/rendering/phase1-vfx.ts#L25-L85) (`spawnTargetLock`). | `src/tests/HUDComponents.test.tsx`, `src/tests/hudBinding.test.tsx`, `e2e/first-playable.spec.ts`. |

---

## 3. Dimensional Measurements & Rendered Sizes (Rule R-E)

### Scale Factor Analysis
- Viewport target world resolution: **1280 × 720**.
- Measured bounding box in standard desktop browser (from Playwright measurement script):
  - Canvas Client Rect: `1063.11 × 598.00 px`
  - Scale Factor: $S = \frac{1063.11}{1280} = \frac{598.00}{720} \approx \mathbf{0.83055}$

### Entity Size Comparison

| Entity | Code Configuration | Rendered World Size (1280×720) | Screen Size on 1063×598 Canvas ($S = 0.83055$) | Spec Estimate vs. Measured Confirmation |
|---|---|---|---|---|
| **Drone Sprite** | Source SVG `128 × 128`, `setScale(0.8)` in `EnemyView.ts:42` | **102.4 × 102.4 px** | **85.05 × 85.05 px** | **Confirmed**: Screen pixel size is 85.05 px, exactly matching the prompt's estimate of "85–90 px wide". Target for R1: **44 px** (scale = 0.344). |
| **Player Ship** | Source SVG `120 × 160`, `setScale(0.8)` in `PlayerView.ts:31` | **96.0 × 128.0 px** | **79.73 × 106.31 px** | **Confirmed**: Prompt estimate was "85×124 px"; measured world size is 96×128 px, screen size is 80×106 px. Target for R1: **60 × 87 px** (scale = 0.50). |
| **3-Letter Word Plate** | `computePlateWidth(3) = 3 × 14 + 12`, `plateHeightPx: 26` | **54 × 26 px** | **44.85 × 21.59 px** | Confirmed from `layoutLabel.ts:15-21`. |
| **8-Letter Word Plate** | `computePlateWidth(8) = 8 × 14 + 12`, `plateHeightPx: 26` | **124 × 26 px** | **102.99 × 21.59 px** | Confirmed from `layoutLabel.ts:15-21`. |
| **Header Bar** | `<TacticalFrame>` in `App.tsx:180` | Full width ($1256\text{ px}$), height $67\text{ px}$ | $1256 \times 67\text{ px}$ | Sits outside canvas, taking $67\text{ px}$ vertical space. |
| **In-Canvas HUD Row** | Top card row in `HUDOverlay.tsx:65` | Height $\approx 50\text{ px}$, $y \in [12, 62]$ | Overlaps top $15\%$ of canvas | Direct collision with drones entering at top. |

---

## 4. Current Formulas vs. Specification 1.2 Comparison

| Metric | Current Implementation (`simulation.ts`) | Spec 1.2 SpeedTypingOnline Formula | Divergence / Required Fix |
|---|---|---|---|
| **Accuracy** | `hits / (hits + misses) * 100` (line 438), rounded in UI via `Math.round()` | $\text{Accuracy} = \frac{\text{hits}}{\text{hits} + \text{misses}} \times 100$, floored to 1 decimal place (`floorToOneDecimal`) | Current UI rounds up ($99.96\% \rightarrow 100.0\%$). Must floor so that $100.0\%$ appears **only** when misses $= 0$. |
| **Gross WPM** | **Not computed** anywhere in core simulation or UI | $\text{Gross WPM} = \frac{\text{entries} / 5}{\text{minutes}}$ where $\text{minutes} = \frac{\text{elapsedTicks}}{\text{tickRate} \times 60}$ | Create pure function in `typingMetrics.ts`. Handle `elapsedTicks === 0` by returning 0. |
| **Net WPM** | **Not computed** anywhere in core simulation or UI | $\text{Net WPM} = \max\left(0, \text{Gross WPM} - \frac{\text{misses}}{\text{minutes}}\right)$ | Create pure function in `typingMetrics.ts`. Deduct all misses since game has no backspace correction. |
| **Score** | Keystroke: `10 * streakMultiplier` (line 381); Word clear: `100 * streakMultiplier` (line 420); Wave bonus: `100 * wave` (line 773) | Strictly $+1$ per correct character (`INPUT_MATCH`). Zero bonuses, zero multipliers. | Remove multiplier logic, thresholds, and bonuses. Set `scoreAwarded: 1` per correct keystroke. |
| **Streak** | Resets to 0 on miss. Multiplies score up to $4\times$. | Resets to 0 on miss. Informational only (no score multiplication). | Disconnect streak from score calculation. Maintain streak and `maxStreak` for telemetry/UI. |

---

## 5. Visual Defect Analysis (Observed in Screenshots)

1. **Defect (a): Thin full-width green horizontal line across the main menu screen**:
   - *Investigation*: Inspected `menu-preview.png` and `autostart-seed1337.png`. All borders and dividers rendered by the application are amber (`rgba(255, 184, 74, ...)`). In `app.css`, green is defined only for `--success: #70e0b0`. The only green border in the codebase is in `DebugInputPanel.tsx:123` (`border: 1px solid #00FF66`), which is mounted only during isolated tests.
   - *Conclusion*: The green line seen in the playtester screenshot was an artifact of an active dev debug panel border or an external OS/browser screen-capture region selection line. No application stylesheet rule generates a full-width green line on the production menu.
2. **Defect (b): Word label clipped at top canvas boundary**:
   - *Root Cause*: In `defaultConfig.ts:85`, `spawnY = 40`. In `EnemyView.ts:41`, `labelY = enemy.position.y - 38`. For a newly spawned drone, the label container is positioned at $y = 40 - 38 = 2\text{ px}$. With a plate height of $26\text{ px}$, the plate's top edge is at $2 - 13 = \mathbf{-11\text{ px}}$ (11 pixels outside the canvas viewport ceiling).
   - *Resolution for R1*: With drone target width reduced to 44 px, set `SPAWN_Y = 64`. This positions label container at $y = 64 - 28 = 36\text{ px}$, keeping the plate top at $36 - 13 = \mathbf{23\text{ px}}$, guaranteeing $> 6\text{ px}$ of clear canvas headroom.
3. **Defect (c): HUD label "HULL INTEGRITY100/100" missing a space**:
   - *Root Cause*: In `HUDOverlay.tsx:120-133`:
     ```tsx
     <span style={{ color: 'var(--text-secondary)' }}>HULL INTEGRITY</span>
     <span style={{ ... }}>{activeHud.hull}/{activeHud.maxHull}</span>
     ```
     No space exists between the two span elements. In flexbox with compressed widths, or when textContent is read by screen readers/DOM queries, it concatenates directly as `"HULL INTEGRITY100/100"`.
   - *Resolution for R1*: The 100 HP hull bar is completely replaced in P5 by 3 geometric `HullPips`.
4. **Defect (d): Design-note text in footer strip**:
   - *Root Cause*: Static text hardcoded in `App.tsx:344-345`:
     ```tsx
     <span>TACTICAL RESOLUTION: ADAPTIVE [DESKTOP OPTIMIZED 1280×720 / 1440×900]</span>
     <span>DOMINANT ACCENT: ELECTRIC AMBER (#FFB84A) // ZERO RAINBOW GRADIENTS</span>
     ```
   - *Resolution for R1*: Remove these design notes during the P5 shell restructuring.

---

## 6. Complete Font Inventory

### Font Files
- `public/assets/fonts/kenney-future.ttf` (34,160 bytes, CC0 license, credited in `CREDITS.md`).
- `public/assets/fonts/kenney-future-narrow.ttf` (34,180 bytes, CC0 license, credited in `CREDITS.md`).

### CSS `@font-face` Rules
- `src/app/app.css:1-7`: Family `'KenneyFuture'`, src `url('/assets/fonts/kenney-future.ttf')`.
- `src/app/app.css:9-15`: Family `'KenneyFutureNarrow'`, src `url('/assets/fonts/kenney-future-narrow.ttf')`.

### CSS Font Tokens (`src/app/app.css:37-41`)
- `--font-display`: `'KenneyFuture', monospace, sans-serif`
- `--font-condensed`: `'KenneyFutureNarrow', monospace, sans-serif`
- `--font-sans`: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, ...`
- `--font-mono`: `'Courier New', Courier, monospace`

### Phaser & Canvas Font Usages
- `src/shared/config/defaultConfig.ts:33`: `labelFontFamily: "Consolas, Monaco, 'Courier New', Courier, monospace"`.
- `src/game/rendering/views/EnemyView.ts:59`: `fontFamily: RENDERER_CONFIG.labelFontFamily`.
- `src/game/scenes/VisualPreviewScene.ts:146`: `fontFamily: 'KenneyFutureNarrow, monospace'`.

---

## 7. Removals Inventory Across Codebase

1. **Difficulty Presets**:
   - `src/shared/config/defaultConfig.ts`: `DIFFICULTY_PRESETS` (lines 37–64).
   - `src/shared/domain/config.ts`: `DifficultyPresetId`, `DifficultyPreset`, `RunConfig.difficulty`.
   - `src/game/controller/GameController.ts`: `difficulty` state property and setter.
   - `src/ui/components/MenuScreen.tsx`: Threat intensity radio group.
   - `src/app/App.tsx`: `selectedDifficulty` state and handlers.
   - `src/game/core/simulation.ts`: `config.difficulty` used throughout enemy spawning.
2. **Multiplier**:
   - `src/shared/config/defaultConfig.ts`: `maxMultiplier`, `streakStepForMultiplier`.
   - `src/game/core/simulation.ts`: `streakMultiplier` calculation and application.
   - `src/ui/components/HUDOverlay.tsx`: MULTIPLIER `MetricCard`.
3. **Hull Integrity Bar**:
   - `src/ui/components/HUDOverlay.tsx`: `HULL INTEGRITY` progress bar and percentage calculations.
4. **Target Lock Panel**:
   - `src/ui/components/ActiveTargetReadout.tsx`: entire component and stylesheet.
   - `src/ui/components/HUDOverlay.tsx`: `<ActiveTargetReadout />` slot.
   - `src/game/rendering/phase1-vfx.ts`: `spawnTargetLock` reticle graphics.
5. **Console Header Bar**:
   - `src/app/App.tsx`: `<TacticalFrame title="TACTICAL COMMAND CONSOLE">`.
6. **In-Canvas Stat Row**:
   - `src/ui/components/HUDOverlay.tsx`: top row of 6 stat cards.

---

## 8. Presence Check of Unbuilt Subsystems

| Subsystem | Current Status in Codebase |
|---|---|
| **Settings Store** | **Does not exist**. No `settingsStore.ts` or persistence module exists. |
| **`localStorage` Usage** | **Zero occurrences** anywhere in `src/`. No keys exist. |
| **Audio Manager** | **Does not exist**. Audio files exist in `public/assets/audio/` and are preloaded by Phaser `BootScene`, but no playback controller or volume manager exists. |
| **Run-History Store** | **Does not exist**. `caret.history.v1` is not implemented. |
| **Clock / Timer Component** | **Does not exist**. No real-time or elapsed clock component exists in UI. |

---

## 9. Contradicted Statements in Prompt Set

- **Statement in 0.4 / D12 & Section 3**: *"My estimate from screenshots is drone ~85-90 px wide and ship ~85x124 px"*.
  - **Audit Finding**: In 1280×720 world coordinates, the current drone sprite is rendered at **$102.4 \times 102.4\text{ px}$** (`128 × 0.8`), and the ship is rendered at **$96 \times 128\text{ px}$** (`120 × 0.8` width, `160 × 0.8` height). When scaled by the canvas aspect ratio on a 1280px screen ($S \approx 0.83$), the drone appears as **$85.05\text{ screen px}$** and the ship as **$79.7 \times 106.3\text{ screen px}$**. The visual screen estimate was accurate, but the underlying world dimensions were slightly larger due to viewport letterboxing.
- **Statement in 0.4 / Defect (a)**: *"A thin full-width green horizontal line across the main menu screen"*.
  - **Audit Finding**: No green line exists in application CSS or menu rendering. Verified as an external capture or debug panel border.

---

## 10. File Touch Map for Prompts P1–P7

```text
P1: src/game/core/metrics/typingMetrics.ts (NEW)
    src/game/core/simulation.ts
    src/shared/domain/events.ts
    src/shared/domain/config.ts
    src/shared/config/defaultConfig.ts
    src/tests/domainConfig.test.ts
    src/tests/simulation.test.ts

P2: src/shared/config/progression.ts (NEW)
    src/game/core/simulation.ts
    src/game/core/wordProvider.ts
    scripts/sim-demo.ts
    src/tests/words.test.ts

P3: src/shared/storage/safeStorage.ts (NEW)
    src/shared/settings/settingsStore.ts (NEW)
    src/shared/history/historyStore.ts (NEW)
    src/shared/history/statsMath.ts (NEW)
    src/shared/formatters.ts (NEW)
    src/tests/persistence.test.ts (NEW)

P4: package.json (add @fontsource/tektur)
    third_party/tektur/OFL.txt (NEW)
    CREDITS.md
    src/app/app.css
    src/game/scenes/BootScene.ts
    src/game/rendering/views/EnemyView.ts
    public/assets/fonts/ (DELETE kenney fonts)

P5: src/ui/components/TopStrip.tsx (NEW)
    src/ui/components/HullPips.tsx (NEW)
    src/ui/components/ClockBadge.tsx (NEW)
    src/ui/components/WaveBanner.tsx (NEW)
    src/ui/components/WingBox.tsx (NEW)
    src/ui/components/HUDOverlay.tsx
    src/ui/components/ActiveTargetReadout.tsx (DELETE)
    src/app/App.tsx
    src/app/app.css

P6: src/ui/components/ProgressChart.tsx (NEW)
    src/ui/components/SettingsModal.tsx (NEW)
    src/ui/components/StatCard.tsx (NEW)
    src/ui/components/MenuScreen.tsx
    src/ui/components/GameOverModal.tsx
    src/app/App.tsx

P7: docs/simulation.md
    README.md
    CREDITS.md
    docs/PHASE1_PLAN.md
    docs/R1_REPORT.md (NEW)
```

---

## 11. Identified Engineering Risks & Mitigation Strategies

1. **Golden Replay Drift**:
   - *Risk*: P1 scoring adjustments and P2 wave curve updates will invalidate existing golden determinism replays.
   - *Mitigation*: Strictly isolate golden updates into their own dedicated commits with explicit diff summaries (Rule R-D).
2. **Font Layout Shifts (Tektur Proportional Advance)**:
   - *Risk*: Proportional widths in Tektur could cause in-world word labels to jitter as letters are typed.
   - *Mitigation*: P4 enforces fixed-advance letter cell layout (`origin: 0.5` per letter) so total plate width remains static.
3. **Double Invocations in React 18**:
   - *Risk*: `React.StrictMode` double mounting could append duplicate run records to `caret.history.v1` on game over.
   - *Mitigation*: Guard history appends with unique monotonic session run IDs.
