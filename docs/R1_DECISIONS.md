# Revision R1 — Confirmed Decisions (D1–D13)

Date: 2026-10-07
Status: Approved for execution across prompts P0–P7

---

- **D1 (Scoring)**: Exactly `+1` point per correct character (`INPUT_MATCH`). No word clear bonus, wave bonus, or score multiplier. Streak tracks consecutive correct characters for display only.
- **D2 (Lives)**: 3 hull points (`playerMaxHealth = 3`, `collisionDamage = 1`). Each drone collision deducts 1 point with no invulnerability period. Game over occurs at 0.
- **D3 (Target Lock)**: Delete HUD Target Lock panel (`ActiveTargetReadout`, component, styles, tests). The targeting mechanic and in-world word label typed-letter dimming remain active. In-world bracket reticle toggled off via `SHOW_LOCK_RETICLE = false`.
- **D4 (Wave Intermission)**: 2.5-second intermission between waves displaying centered amber `WaveBanner` (`WAVE 0N`) over an empty play area. `WAVE 01` displays before the first spawn.
- **D5 (Difficulty)**: Single progressive campaign. The three difficulty presets (`relaxed`, `normal`, `intense`) are completely deleted from simulation, domain config, menu UI, and tests.
- **D6 (Audio Settings)**: Settings store and toggles for SFX and Music are implemented. Music row remains hidden in UI (`musicAvailable = false`) until audio assets exist.
- **D7 (Clock)**: Top-right `ClockBadge` shows local time `HH:MM` (12/24-hour per browser locale), updated on minute boundaries with a muted style. UI-only.
- **D8 (Progress Graph)**: Unlocks at $\ge 5$ recorded runs (`GRAPH_MIN_RUNS = 5`). Displays last 10 runs with metric tabs: Wave, Score, Accuracy, Net WPM.
- **D9 (Boot Status)**: On first menu view per page load only, show ephemeral one-line status (`SYSTEM ONLINE // READY · MODE: TACTICAL DEFENSE · STATUS: MENU`) fading in/out over 2.5 seconds.
- **D10 (Elapsed Time)**: Simulation elapsed time (`elapsedTicks / 60`), formatted as `mm:ss` (`h:mm:ss` after an hour). Paused time is excluded automatically.
- **D11 (Typography)**: Whole-project font switches to self-hosted Tektur (OFL-1.1), including in-world Phaser word labels (fixed-advance letter cells). Legibility verification in P4.
- **D12 (Sizes)**: Drone target width ≈ 44 world px (≈ 50%), ship ≈ 60 × 87 px (≈ 70%). `hitboxRadius` and `hullRadius` derived from half-widths. `SPAWN_Y` ≈ 64 (provides $\ge 6$ px headroom above label plates).
- **D13 (Records)**: Display `NEW RECORD! WAVE 0N REACHED` when wave exceeds previous best and prior runs exist. First run displays `FIRST MISSION LOGGED`. Secondary line indicates `NEW BEST SCORE`.
