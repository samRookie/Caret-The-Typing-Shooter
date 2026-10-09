# Feedback Layer Specification & Reference (Step 10)

This document specifies the visual effects, motion policies, audio routing, concurrency controls, and music configuration for Caret.

---

## 1. Visual Effects Matrix

All visual effects are planned deterministically by the pure effect planner (`planEffects.ts`) and executed by `EffectsManager` / `PhaserEffectBackend`.

| Event | Primary Effect | Secondary Effect | Audio Cue | Reduced Motion Variant |
|---|---|---|---|---|
| `INPUT_MATCH` | Laser bolt towards target | Expanding hit ring (8px -> 14px, 120ms) | `laser` (pitch rises +2 semitones up to +12) | Static ring, no camera shake |
| `ENEMY_HIT` | Drone sprite flash (60ms) | 4 gold spark particles (`particle-spark`) | `hit` | 2 spark particles, no flash |
| `ENEMY_DESTROYED (word)` | Expanding ring (12px -> 44px, 250ms) | 12 gold debris particles (`particle-burst`) | `destroy` | Static ring, 4 particles max |
| `ENEMY_DESTROYED (collision)` | Immediate hull loss | Screen camera shake (6px, 180ms), edge flash (0.35 alpha) | `destroy` | No camera shake, no edge flash |
| `INPUT_MISMATCH` | Streak box red flash (150ms) | Target word label pulse (120ms) | `wrong-input` | Static color tint, no pulse scale |
| `PLAYER_DAMAGED` | Hull pip loss animation | Edge danger flash (4px red border, 220ms), ship shake (8px, 200ms) | `destroy` | Static pip gray-out, no camera shake |
| `WAVE_COMPLETED` | Wave banner display | Wave completion audio cue | `wave-complete` | Immediate banner presentation |
| `GAME_OVER` | Ship sprite hidden | Central shockwave ring, defeat delay (900ms) | `destroy` | Reduced delay (300ms), no shake |

---

## 2. Motion Policy Matrix

Configured via `SettingsStore.reducedMotion` (`'system' | 'on' | 'off'`):

| Setting | `particleScale` | Max Burst Particles | Camera Shake | Edge Flash | Defeat Panel Delay |
|---|---|---|---|---|---|
| **Standard (`off`)** | `1.0` | 12 | Enabled (6–8px) | Enabled (alpha 0.35–0.5) | 900 ms |
| **Reduced (`on`)** | `0.3` | 5 | Disabled (0px) | Disabled (alpha 0) | 300 ms |
| **System** | Evaluated via `prefers-reduced-motion: reduce` media query | | | | |

---

## 3. Audio Routing & Concurrency Limits

The WebAudio layer (`AudioManager.ts`) is decoupled from simulation state and provides strict safety guards:

- **Master Gain:** Scaled by 0.85; max individual volume capped at 0.8 (never exceeds safe listening threshold).
- **Laser Concurrency:** Maximum 3 concurrent laser voices; minimum spacing of 30ms between successive triggers.
- **Keypress Ceiling:** At most 2 sound cues dispatched per physical keypress.
- **Audio Unlock:** Suspended AudioContext automatically unlocked upon first user interaction (`pointerdown`, `keydown`, `click`).
- **Telemetry Log:** Circular buffer of the last 50 played sound events (`getAudioLog()`).

---

## 4. Background Music Status

**Parameter Selection:** `MUSIC = skip`

- **Decision:** As specified by parameter `MUSIC = skip`, background music synthesis and third-party music tracks are omitted from the build to maintain zero external audio licensing dependencies.
- **Capability Check:** `isMusicAvailable()` in `src/shared/audio/capabilities.ts` strictly returns `false`.
- **UI State:** The "Background Music" channel toggle row in `SettingsModal.tsx` remains completely hidden while `isMusicAvailable()` returns `false`.
