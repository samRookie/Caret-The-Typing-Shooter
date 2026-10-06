# Tuning Log — Futuristic Typing Shooter

This document tracks all balance and difficulty adjustments made based on playtest observations and simulation benchmarks.

---

## Tuning Principles & Rules (Section 9.D)

1. **Config Only**: Modify values exclusively within `src/shared/config/` (or word lists via `scripts/build-words.ts` and `exclude.txt` if specific words are problematic). Do not add new features or modify core engine code during tuning.
2. **One Change Per Iteration**: Modify one parameter at a time. Commit each change separately with message format:
   `step-9: tune <key> <old> -> <new>`
3. **Evidence-Driven**: Re-run `npm run sim:demo` before and after each adjustment, recording simulated metrics. Re-run test suite (`npm run test`) and e2e checks.
4. **Preset Targets**:
   - `relaxed`: Allows a ~25 WPM typist to survive several waves.
   - `normal`: Feels fair and balanced for a ~40 WPM typist (reaching wave 3–5).
   - `intense`: Challenging and demanding for a ~60+ WPM typist.

---

## 1. Observations

*Record high-level themes, failure points, and pacing feedback gathered from playtesters.*

- *(No playtest observations recorded yet — awaiting Step 9.B)*

---

## 2. Changes

| Iteration # | Config Key | Old Value | New Value | Reason / Hypothesis | Observed Evidence (`npm run sim:demo` & test results) |
|---|---|---|---|---|---|
| *Example* | *normal.spawnIntervalSeconds* | *3.0* | *3.5* | *Typists under 40 WPM overwhelmed by wave 2 backlog* | *Normal bot survival increased from 2:10 to 3:45, wave 3 reached* |

---

## 3. Bugs & Usability Issues Discovered

| Issue ID | Description / Verbatim Feedback | Impact (High / Med / Low) | Resolution / Action Taken |
|---|---|---|---|
| | | | |
