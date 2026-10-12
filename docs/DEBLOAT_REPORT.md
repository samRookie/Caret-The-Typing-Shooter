# Production Debloat Report — Caret

This report records the before-and-after audit and measurements for the Caret production debloat pass.

---

## 1. Executive Summary

| Metric | Before Debloat | After Debloat | Reduction |
|---|---|---|---|
| **Total `dist/` Size** | **4,751,534 bytes** (~4.75 MB) | **2,384,543 bytes** (~2.38 MB) | **-2,366,991 bytes (-49.8%)** |
| **Fonts in `dist/assets/fonts/`** | **2,810,876 bytes** (~2.81 MB across 8 files) | **375,884 bytes** (~375.9 KB across 2 files) | **-2,434,992 bytes (-86.6%)** |
| **Production CSS (`index-*.css`)** | **6,750 bytes** (minified) | **5,850 bytes** (minified) | **-900 bytes (-13.3%)** |
| **Dev Scene in Production JS** | `VisualPreviewScene` statically bundled | 0 occurrences in `dist/assets/*.js` | **100% Tree-shaken** |
| **Dead CSS Classes** | 5 dead rule blocks present | 0 dead classes in bundle | **100% Removed** |
| **Repository File Redundancy** | Duplicate 707-line root prompt | Single canonical source in `docs/` | **-707 lines** |

---

## 2. Detailed Audit & Changes

### 2.A Font Payload Optimization
- **Problem**: Modern Chromium desktop browsers (Chrome and Edge) natively support OpenType `.otf` format directly within `@font-face`. Shipping dual `.otf` and `.ttf` formats along with unused weights (`Thin` and `Black`) added over 2.4 MB of unreferenced font assets.
- **Action**:
  - Removed `.ttf` fallback sources from `src/app/app.css` `@font-face` rules for `JMH Typewriter`.
  - Removed 6 unused font variants from `public/assets/fonts/`:
    - `JMH Typewriter-Black.otf` (179,392 B)
    - `JMH Typewriter-Black.ttf` (449,732 B)
    - `JMH Typewriter-Thin.otf` (324,348 B)
    - `JMH Typewriter-Thin.ttf` (614,524 B)
    - `JMH Typewriter.ttf` (396,036 B)
    - `JMH Typewriter-Bold.ttf` (470,960 B)
  - Retained solely the active weights:
    - `JMH Typewriter.otf` (201,304 B)
    - `JMH Typewriter-Bold.otf` (174,580 B)
- **Result**: Font payload reduced from **2,810,876 bytes** to **375,884 bytes** (**~86.6% reduction**).

---

### 2.B Tree-Shaking `VisualPreviewScene`
- **Problem**: `VisualPreviewScene` was previously statically imported in `src/game/config.ts`, causing Rollup to bundle the developer visual bench and its supporting dependencies into the main production chunk `dist/assets/index-*.js`.
- **Action**:
  - Removed static `import { VisualPreviewScene }` from `src/game/config.ts`.
  - Configured `src/game/scenes/BootScene.ts` to dynamically import `VisualPreviewScene` via `await import('./VisualPreviewScene')` only when `import.meta.env.DEV && isPreview` evaluates to true.
  - In production builds (`import.meta.env.DEV === false`), Rollup dead-code eliminates the dynamic import branch completely.
- **Result**: Verified via grep: exactly **0 occurrences** of `"VisualPreviewScene"` in production bundle `dist/assets/*.js`.

---

### 2.C CSS Cleanup & Isolation
- **Problem**: `src/app/app.css` retained obsolete legacy selectors (`.tactical-viewport`), unused animations (`.anim-pulse`, `@keyframes pulseSubtle`), and dead DOM plate styles (`.word-plate-char-typed`, `.word-plate-char-next`, `.word-plate-char-remaining`).
- **Action**:
  - Deleted `.tactical-viewport`, `.anim-pulse`, `@keyframes pulseSubtle`, and `.word-plate-char-*` rules from `src/app/app.css`.
  - Moved `.word-plate-container` into a dev-only style block in `src/app/App.tsx` (gated strictly behind `import.meta.env.DEV && isPreview`) to keep Playwright's contrast ratio verification test passing without emitting dead CSS to production.
- **Result**: Production CSS bundle decreased from **6.75 kB** to **5.85 kB** with 0 dead selectors.

---

### 2.D Repository Duplicate Elimination
- **Problem**: Root-level `Caret_R1_Playtest_Feedback_Prompt_Set.md` was byte-identical to `docs/R1_PROMPT_SET.md` (SHA256: `615A62EE7D8278D4647F920647C913E4EC0AD22302E7B0CD675A9836FAB5424A`).
- **Action**: Removed the root duplicate file via `git rm`, leaving `docs/R1_PROMPT_SET.md` as the single authoritative source. Cleaned untracked `test-results/` directory.

---

## 3. Verification & Test Evidence

All automated checks and suites pass without regressions:

1. **Linter**:
   - Command: `npm run lint`
   - Output: `0 errors, 0 warnings` (100% clean).

2. **Unit Tests**:
   - Command: `npx vitest run`
   - Output: `36 passed (36 files), 332 passed (332 tests)`.

3. **Playwright E2E**:
   - Command: `npx playwright test e2e/app.spec.ts`
   - Output: `5 passed (5 tests)`.

4. **Leftover & Purity Audit**:
   - Command: `node scripts/run-leftover-audit.cjs`
   - Output: `LEFTOVER CODE & CORE PURITY AUDIT: 100% PASS`.
