# Architectural Assessment: Revision R1 Impact on Phase 2 & Future Milestones

## 1. Executive Summary

Revision R1 implemented fundamental mechanical, visual, and architectural re-calibrations across the Caret game engine. This document establishes how these decisions impact subsequent development phases (Phase 1 Step 10 Polish, Phase 2 Advanced Combat & Additional Modes, and Cloud Infrastructure).

---

## 2. Key Subsystem Impacts & Guidance

### 2.1 Progression Engine & Game Modes (Decision D5)
* **Legacy Design:** Three static difficulty presets (`relaxed`, `normal`, `intense`).
* **R1 Architecture:** Single continuous mathematical progression curve parametrized purely by wave number $w \ge 1$:
  - Approach speed: $\min(30 + 2.5(w - 1), 72)\text{ px/s}$.
  - Spawn interval: $\max(1.0, 2.8 \times 0.95^{w - 1})\text{ s}$.
  - Concurrency cap: $\min(2 + \lfloor(w - 1)/3\rfloor, 6)$.
  - Word length distribution: $w=1\text{--}2$ strictly 3–4 letters, transitioning to 8-letter vocabulary by wave 10–20.
* **Phase 2 Impact:**
  - Future game modes (e.g. **Endless Mode**, **Sprint / Precision Mode**) must **not** re-introduce static difficulty presets.
  - Instead, new modes should configure the progression curves directly (e.g. higher initial wave index, steeper speed slopes, or tailored vocabulary subsets).

---

### 2.2 Hull Integrity & Damage Calibration (Decision D2)
* **Legacy Design:** Continuous 100 HP health bar with arbitrary damage amounts.
* **R1 Architecture:** 3-point discrete Hull Pip integrity (`playerMaxHealth = 3`, `collisionDamage = 1`). The player survives 2 collisions; the 3rd collision destroys the craft.
* **Phase 2 Impact:**
  - Future enemy types (e.g. Heavy Drones, Boss Vessels, EMP mines) must be balanced around discrete pip increments (e.g. 1 pip standard damage, 2 pips heavy impact, or shield absorption pips), not fractional percentages.

---

### 2.3 Audio & Soundtrack Pipeline (Decision D6)
* **Current State:** 6 core combat sound effects deployed (`laser.ogg`, `hit.ogg`, `destroy.ogg`, `ui-click.ogg`, `wrong-input.ogg`, `wave-complete.ogg`). Music tracks are declared unavailable via `musicAvailable = false`.
* **R1 Architecture:** The `SettingsModal` dynamically suppresses the Background Music toggle row when `musicAvailable === false`, preserving a clean user interface.
* **Phase 2 Impact:**
  - When music tracks are composed and bundled, flipping `musicAvailable = true` in `src/shared/audio/capabilities.ts` will automatically expose the Music channel toggle in both the Command Menu and Tactical Pause settings.

---

### 2.4 Persistence & Telemetry Schema
* **Current State:** `caret.history.v1` stores up to 100 historical runs with per-field validation and in-memory fallback.
* **Phase 2 Impact:**
  - Schema is versioned (`version: 1`). Any future remote leaderboard or cloud sync adapters can wrap `historyStore` without altering core simulation contracts.
