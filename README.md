<div align="center">

# CARET: THE TYPING SHOOTER

### TACTICAL DEFENSE PROTOCOL

**Your keyboard is the cockpit.**

<br />

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Phaser](https://img.shields.io/badge/Phaser-3.88+-E03C11?logo=phaser&logoColor=white)](https://phaser.io/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

<br />

<img src="docs/screenshots/gameplay_combat.png" alt="Caret active gameplay combat scene showing spacecraft aiming at target enemy drone" width="800" />

</div>

---

## The Pitch

Hostile drone vessels descend through deep space, each protected by an encrypted target word. Type each word cleanly to lock on, fire plasma salvos, and obliterate incoming hostiles before they breach your perimeter. Hold the line across escalating waves as approach vectors accelerate and words demand greater typing mastery.

---

## Key Tactical Features

* **Pure Keyboard Control:** Zero mouse reliance. Every target acquisition, firing sequence, lock-release (`Tab`), and tactical pause (`Esc`) responds straight from your home row.
* **Tactical Hostile UAV Drones:** Redesigned hexacopter drone vessels equipped with animated navigation beacons, high-contrast armor plates, and crystal-clear letter illumination.
* **Dual High-Energy Plasma Lasers:** Spacecraft forward emitter ports fire twin golden-cyan plasma laser bolts along dynamic trajectory angles with muzzle flash and impact particle bursts.
* **Dynamic Cosmic Environment:** A 3-layer parallax starfield featuring occasional celestial planets drifting every 3 waves and distant spiral galaxies traversing the field on Wave 8 and beyond.
* **Emergency Hull Breach Alert:** Precision-centered hull integrity monitor and a pulsating crimson perimeter vignette that activates when your vessel drops to critical condition.
* **Three-Point Hull Protection:** Your vessel carries 3 hull integrity pips, giving you resilience to withstand two collisions before catastrophic systems failure.
* **Calibrated Word Selection:** Early waves field punchy 3-to-4 letter targets; deeper waves demand precision against complex vocabulary and rapid multi-target concurrency.
* **Persistent Settings & Local Best:** Audio volume sliders, quick HUD mute, reduced-motion preferences, and your all-time unverified local best score survive browser reloads safely (`caret.settings.v1`).
* **Tactile Combat Audio:** Responsive laser discharges, distinctive drone detonation blasts, and heavy metallic hull collision audio engineered with voice concurrency caps and volume scaling.

---

## How to Play

1. **Acquire Target:** Type the initial letter of any incoming hostile drone to lock on and align your spacecraft's firing vectors.
2. **Execute Salvo:** Finish typing the remaining letters accurately to discharge twin plasma bolts and detonate the hostile before collision.
3. **Prioritize Threats:** Press `Tab` at any moment to break target lock and switch focus to an emergency hostile closer to your perimeter.
4. **Defend Hull:** Drones colliding with your ship deal 1 damage. Survive across escalating waves to achieve a legendary tactical ranking.

### Flight Controls

| Key / Control | Tactical Action |
| :--- | :--- |
| **Letters (A–Z)** | Lock onto a matching hostile and discharge plasma lasers |
| **Tab** | Release current target lock to switch firing priorities |
| **Esc** | Pause combat engagement, review options, or access settings |
| **Enter** | Launch engagement from command menu or restart after debriefing |
| **[SFX ON / MUTED]** | Quick HUD toggle in the top bar to mute or unmute combat sound effects |

---

## Visual Briefing

<div align="center">

| Command Headquarters | Mission Debriefing |
| :---: | :---: |
| <img src="docs/screenshots/menu_screen.png" alt="Command Headquarters briefing menu screen" width="380" /> | <img src="docs/screenshots/gameover_modal.png" alt="Mission debriefing results screen displaying combat statistics" width="380" /> |
| *Mission briefing, engagement directives, and launch controls.* | *Cyber-neon debriefing: score, wave, streak, accuracy, WPM, and tactical rank.* |

<br />

<img src="docs/screenshots/preview_switchboard.png" alt="Visual preview switchboard demonstrating Tektur typography sheet" width="780" />

*Developer calibration switchboard featuring Tektur typography validation and combat UI elements.*

</div>

---

## Track Your Progress

At the conclusion of each engagement, the Mission Debriefing console provides comprehensive telemetry:

* **Final Score:** Exactly one base point awarded for every accurate character typed.
* **Wave Reached:** Deepest hostile wave cleared during your deployment.
* **Max Streak:** Your longest uninterrupted sequence of accurate keystrokes.
* **Accuracy & Speed:** Keystroke accuracy percentage paired with net words-per-minute calculations.
* **Tactical Rank:** Operational grade awarded from D up to rank S based on your shooting precision and survival.
* **Local Best Badge:** Automatically records your personal best wave and score locally (`LOCAL BEST (not verified)`).

---

## Comfort & Accessibility

* **Audio Controls:** Dedicated SFX volume slider (0–100%) and instant mute toggle accessible via the HUD top strip and Settings modal.
* **Reduced Motion:** 3-way toggle (**System** / **On** / **Off**) to suppress camera shake, edge flashes, scanlines, and high-frequency starfield velocity (respects OS `prefers-reduced-motion`).
* **Offline-Safe Persistence:** Local settings and personal bests are validated per field, falling back gracefully to memory if browser storage is blocked.
* **High-Contrast Legibility:** In-world tactical plates and letter underline indicators maintain full contrast and legibility even under monochrome/grayscale conditions.
* **Hardware Recommendation:** Best experienced on desktop and laptop displays with a physical home-row keyboard.

---

## Architecture & Technology

Caret is built from the ground up for strict deterministic fidelity and responsiveness:

* **Deterministic Simulation Core:** 60 Hz fixed-timestep physics and logic decoupled from wall-clock time and rendering (100% pure TypeScript).
* **Phaser 3.90 Renderer:** Hardware-accelerated 2D visuals with particle systems, dynamic starfield parallax, and laser trajectory calculations.
* **React 18 Tactical HUD:** Overlay UI with real-time status updates, cyber scanline effects, and interactive settings dialogs.
* **Zero Runtime Overhead:** Hand-crafted physics, input queues, and audio routing without external bloat or telemetry tracking.

---

## Credits & Licensing

* **Typography:** Font family **Tektur** by Ondrej Jób & The Tektur Project Authors, licensed under the [SIL Open Font License 1.1](third_party/tektur/OFL.txt).
* **Audio Assets:** Sound effects created by **Kenney** ([kenney.nl](https://kenney.nl)), licensed under [Creative Commons Zero (CC0 1.0 Universal)](https://creativecommons.org/publicdomain/zero/1.0/).
* **Visual Design & Code:** Original in-house assets and implementation licensed under the MIT License.
* See [CREDITS.md](CREDITS.md) for detailed asset provenance and third-party notices.

---

<div align="center">

Made with precision by [@samRookie](https://github.com/samRookie)

</div>
