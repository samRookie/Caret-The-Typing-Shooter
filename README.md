# Futuristic Typing Shooter (Phase 1)

A minimalist dark sci-fi typing shooter built with **React**, **TypeScript**, and **Phaser 3**.

---

## Visual Direction & Aesthetic Philosophy

* **Theme:** Tactical military HUD console. Minimalist dark sci-fi, not an arcade carnival.
* **Palette:**
  * Background: Deep charcoal / near black (`#07090c`, `#0d1218`).
  * Dominant Accent: Electric Amber (`#ffb84a`).
  * Text: White (`#f3f7fa`) for high-priority telemetry; Muted Gray (`#8995a1`) for context.
  * Surfaces: Dark translucent glass (`rgba(18, 24, 31, 0.86)`) with subtle amber borders.
* **Typography:** Kenney Future display font for scores & HUD; high-contrast sans-serif for words and menu items.

---

## Directory Architecture

```text
PROJECT 11 - TYPING SHOOTING GAME/
├── public/
│   └── assets/
│       ├── audio/          # Curated CC0 audio cues (click, laser, hit, destroy, error, wave)
│       ├── fonts/          # Tactical display fonts (Kenney Future)
│       ├── sprites/        # Kenney space shooter extension vectors & spritesheet
│       ├── ui/             # Tactical UI elements
│       └── vfx/            # Original SVG entities (player-ship, drone, projectile)
├── src/
│   ├── app/
│   │   ├── App.tsx         # Root tactical console shell
│   │   ├── routes.ts       # Route / state definitions
│   │   └── app.css         # Design tokens & tactical theme styles
│   ├── game/
│   │   ├── config.ts       # Phaser GameConfig factory
│   │   ├── core/           # Game simulation interfaces
│   │   ├── input/          # Typing dispatcher contracts
│   │   ├── rendering/      # Procedural VFX helper module
│   │   └── scenes/
│   │       ├── BootScene.ts # Asset preloader
│   │       └── GameScene.ts # Tactical grid & viewport
│   ├── ui/
│   │   ├── components/
│   │   │   └── TacticalFrame.tsx # Translucent glass HUD panel
│   │   └── PhaserContainer.tsx   # React ref wrapper with clean teardown
│   ├── shared/
│   │   ├── theme.ts        # Color palette & visual constants
│   │   └── types.ts        # Shared telemetry types
│   ├── assets/
│   │   └── index.ts        # Asset key constants
│   ├── tests/
│   │   ├── setup.ts        # Vitest setup
│   │   └── App.test.tsx    # Baseline test suite
│   ├── main.tsx            # React application entry
│   └── vite-env.d.ts       # Vite client types
├── eslint.config.js        # Strict ESLint configuration
├── .prettierrc             # Code formatting rules
├── tsconfig.json           # Strict TypeScript configuration
├── vite.config.ts          # Vite build & dev config
├── vitest.config.ts        # Vitest test runner config
└── package.json            # Scripts & scoped dependencies
```

---

## Getting Started

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Starts the Vite development server at `http://localhost:3000`.

### Production Build
```bash
npm run build
```
Executes TypeScript type checking (`tsc -b`) and bundles the application with Vite.

### Testing
```bash
npm run test
```
Executes the Vitest test runner.

### Code Quality
```bash
npm run lint          # Run ESLint across TypeScript codebase
npm run format        # Format code with Prettier
npm run format:check  # Check formatting compliance
```

---

## Provenance and Licenses

* Sprite assets, UI elements, audio, and fonts from [Kenney.nl](https://kenney.nl/) under **Creative Commons CC0**.
* Original SVGs and VFX module authored for this project and freely usable.
