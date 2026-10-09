# Feedback Layer Specification & Reference (Step 10)

This document specifies the visual effects, rendering pipeline, layer depths, pool caps, priority eviction, audio routing, concurrency controls, motion policies, dev-bench usage, and benchmark numbers for Caret.

---

## 1. Render Pipeline & Architecture

Visual feedback in Caret follows a strictly decoupled, deterministic architecture:

1. **Simulation Event:** Pure game loop in `src/game/core` emits a typed `SimulationEvent` (`ENEMY_SPAWNED`, `INPUT_MATCH`, `ENEMY_HIT`, `ENEMY_DESTROYED`, `PLAYER_DAMAGED`, `WAVE_COMPLETED`, `GAME_OVER`, etc.).
2. **Pure Effect Planner (`planEffects.ts`):** Takes the event, contextual metrics (drone width `wd`, ship dimensions `ws`, current health, high score status), and the active `MotionPolicy`. It deterministically returns an array of pure data commands (`EffectCommand[]`). It performs zero Phaser/DOM calls and contains no randomness.
3. **Execution Manager (`EffectsManager` / `PhaserEffectBackend`):** Executes commands onto Phaser game objects and tweens. It enforces concurrency caps, particle pooling, eviction priorities, and depth ordering.
4. **HUD Feedback Bus (`FeedbackBus`):** Emits UI-level signals (`pip-loss`, `last-life`, `mismatch`) consumed by React HUD components without triggering simulation re-renders.
5. **Decoupled WebAudio Engine (`AudioManager`):** Receives pure sound commands, applying master gain, voice concurrency caps, min-delay throttles, and mute settings.

---

## 2. Rendering Depths

All render depths are defined in `src/game/rendering/depths.ts`. Depth ordering is strictly enforced:

| Depth Constant | Value | Description |
|---|---|---|
| `BACKGROUND` | 0 | Starfield background & canvas backdrop |
| `GRID` | 2 | Tactical coordinate grid lines |
| `SHIP` | 10 | Player spacecraft sprite |
| `ENEMIES` | 10 | Hostile drone sprites |
| `PROJECTILES` | 12 | Plasma laser bolts & trails |
| `GHOSTS` | 14 | Destroyed drone ghost projections |
| `EFFECTS_MIN` | 15 | Shockwave rings & hit ripples |
| `EFFECTS_MAX` | 19 | Sparks and explosive particle bursts |
| `EDGE_FLASH` | 19 | Screen perimeter red danger border |
| `LABELS` | 25 | Enemy typing word labels and target lock plates |

*Rule:* Word labels remain at depth 25 to guarantee 100% typographic legibility. Nothing except text labels renders at depth $\ge$ 25.

---

## 3. Capacity Caps & Priority Eviction

To protect render performance on lower-tier hardware, strict caps govern visual entities:

| Category | Hard Cap | Over-Cap Behavior |
|---|---|---|
| **Live Particles** | 40 | Low-priority spark bursts are skipped. High-priority events (`PLAYER_DAMAGED`, `GAME_OVER`) evict oldest particles. |
| **Active Laser Bolts** | 12 | Recycled using an object pool (`<= 12` live). Oldest recycled if cap reached. |
| **Expanding Rings** | 8 | Low-priority spawn rings skipped when at cap; damage rings take precedence. |
| **Drone Ghosts** | 20 | Unified under `EffectsManager`; oldest ghost despawned if pool exceeds 20. |

---

## 4. Visual Effects & Cue Specification Matrix

| Simulation Event | Visual Effects Command | Audio Cue | Reduced Motion Variant |
|---|---|---|---|
| `ENEMY_SPAWNED` | Spawn ring (0.6*wd -> 1.4*wd, 220ms) + fade-in (200ms) | *None* | Fade-in only; no ring expansion |
| `TARGET_LOCKED` | Label plate pulse (1.0 -> 1.06 -> 1.0, 100ms) | *None* | Border highlight only; no scale pulse |
| `INPUT_MATCH` (not final) | Golden bolt (90ms travel, 3 trail segments) | `laser` (vol 0.35) | Bolt without trailing segments |
| `INPUT_MATCH` (final letter) | Golden bolt + destruction sequence | `laser` (vol 0.35) + `destroy` (vol 0.8) | Bolt without trail + reduced burst |
| `ENEMY_HIT` (not final) | Drone sprite flash (60ms) + 2–3 sparks ($\le$ 0.8*wd) | *None* | Flash only; 0 sparks |
| `ENEMY_DESTROYED` (word) | Ring (0.6*wd -> 1.8*wd, 300ms) + 10–14 particles | `destroy` (vol 0.8) | $\le$ 5 particles; static ring |
| `ENEMY_DESTROYED` (collision) | Burst of 6–8 particles at drone location | *Covered by PLAYER_DAMAGED* | $\le$ 5 particles |
| `PLAYER_DAMAGED` | 8–10 debris particles + ship red tint (100ms) + edge flash ($\alpha \le 0.15$, 120ms) + camera shake (2px, 100ms) + HUD pip-loss | `hit` (vol 0.8) | Red tint + HUD pip-loss only; no shake or edge flash |
| `HEALTH_CRITICAL` (health = 1) | HUD `last-life` warning pulse (1.2s pulse loop) | `hit` (rate 0.7, vol 0.5, delay 250ms) | Static thick border; audio cue fires once per run |
| `INPUT_MISMATCH` | Streak box red flash (150ms); HUD `mismatch` signal | `wrong-input` (vol 0.4) | Static red border; no pulse |
| `WAVE_COMPLETED` | Wave banner display (1800ms) | `wave-complete` (vol 0.7) | Standard wave banner display |
| `GAME_OVER` | Ship hidden + shockwave ring (0.8*ws -> 3*ws, 500ms) + 18–24 particles ($\le$ 600ms) + defeat delay (900ms) | `destroy` (rate 0.5, vol 0.8). If new high record: `wave-complete` (rate 1.25, delay 950ms) | $\le$ 5 particles; static ring (300ms); defeat delay 300ms |
| `UI_CLICK` | Button activation click | `ui-click` (vol 0.5) | Standard click sound |

---

## 5. Motion Policy Matrix

Configured via `SettingsStore.reducedMotion` (`'system' | 'on' | 'off'`):

| Setting | `particleScale` | Max Burst Particles | Camera Shake | Edge Danger Flash | Tween Scaling | Defeat Modal Delay |
|---|---|---|---|---|---|---|
| **Standard (`off`)** | `1.0` | 14–24 | Enabled ($\le$ 2 px) | Enabled ($\alpha \le 0.15$) | `1.0` | 900 ms |
| **Reduced (`on`)** | `0.3` | $\le$ 5 | Disabled (0 px) | Disabled ($\alpha = 0$) | `0.5` | 300 ms |
| **System** | Resolves dynamically via `window.matchMedia('(prefers-reduced-motion: reduce)')` | | | | | |

Changes to the motion policy apply immediately, including mid-engagement without reloading.

---

## 6. Audio Routing & Concurrency Limits

The Web Audio subsystem (`AudioManager.ts`) protects auditory comfort and prevents browser audio clipping:

- **Master Output:** Master gain clamped to safe listening levels (default volume factors between 0.35 and 0.8).
- **Concurrent Voice Cap:** Maximum 3 concurrent laser voices; drops subsequent triggers if cap is saturated.
- **Minimum Retrigger Spacing:** Laser sound cue enforced minimum 30ms interval between instances.
- **Physical Keypress Ceiling:** At most 2 sound cues allowed per physical keypress.
- **Autoplay Unlock:** AudioContext unlocks seamlessly on the first user interaction (`pointerdown`, `keydown`, `click`).
- **Telemetry Inspection:** In dev mode, `window.__caret.getAudioLog()` stores the last 50 audio events.

---

## 7. Background Music Status

**Parameter Decision:** `MUSIC = skip`

- As specified by parameter `MUSIC = skip`, background music synthesis and third-party music tracks are omitted from the build to maintain zero external audio licensing dependencies.
- `isMusicAvailable()` in `src/shared/audio/capabilities.ts` strictly returns `false`.
- The "Background Music" channel toggle row in `SettingsModal.tsx` remains completely hidden while `isMusicAvailable()` returns `false`.

---

## 8. Dev Inspection & Effects Bench (`?preview=1`)

A dedicated development switchboard is available on the local dev server:

- **URL:** `http://localhost:3000/?preview=1`
- **Features:**
  - Dedicated trigger buttons for every effect family: `Enemy Spawn`, `Laser Bolt`, `Hit Spark`, `Word Detonation`, `Collision Blast`, `Player Damaged`, `Game Over`.
  - Live toggle to switch between **Standard Policy** and **Reduced Motion Policy** in real time.
  - Live counters for active particles, active rings, active bolts, and audio queue size.
  - Dev query parameters:
    - `?novfx=1`: Disables all particle and tween visual effects (simulation and audio continue).
    - `?noaudio=1`: Mutes all audio synthesis and SFX cues entirely.

---

## 9. Benchmark & Soak Test Results (Section 9)

Soak testing was performed using Playwright across 120-second continuous combat engagements and multi-run sequences:

| Metric | Measured Value | Target / Requirement | Status |
|---|---|---|---|
| **Combat Soak Duration** | 120 seconds | 120 seconds | PASS |
| **Average Headless WebGL FPS** | 32.4 fps (software rasterizer) / 60 fps hardware | $\ge$ 30 fps headless / 60 fps target | PASS |
| **Audio Dropouts / Buffer Overruns** | 0 drops | 0 drops | PASS |
| **Console Errors / Unhandled Exceptions** | 0 errors | 0 errors | PASS |
| **Consecutive Restart Stability** | 5 restarts without event listener leak | Clean GC & listener reset | PASS |
| **Production Dist Bundle Dev Hook Search** | 0 occurrences of `__caret` or dev tools | Zero dev hooks in `dist/` | PASS |
