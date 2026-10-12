# Progressive Web App (PWA) & Desktop Installation

Caret is configured as an installable Progressive Web App (PWA) on Chromium-based desktop browsers (Chrome and Edge on Windows, macOS, and Linux).

---

## 1. Metadata & Manifest Parameters

Defined in [`public/manifest.webmanifest`](../public/manifest.webmanifest) and referenced in [`index.html`](../index.html):

- **Application Name**: `Caret: Space typing simulator`
- **Short Name**: `Caret`
- **Description**: `A typing shooter: lock onto each ship's word, type it to destroy the ship, and survive the waves.`
- **Display Mode**: `standalone` (removes browser navigation chrome when installed)
- **Orientation**: `landscape`
- **Theme Color**: `#07090c` (matching `--bg-0` token)
- **Background Color**: `#07090c`
- **Icons**:
  - `icons/icon-192.png`: 192×192 standard icon (`purpose: any`)
  - `icons/icon-512.png`: 512×512 high-resolution icon (`purpose: any`)
  - `icons/icon-512-maskable.png`: 512×512 adaptive icon (`purpose: maskable`) with a 68% safe-zone scale

---

## 2. Service Worker Strategy ([`public/sw.js`](../public/sw.js))

The service worker is intentionally hand-crafted with zero runtime library dependencies:

- **Build ID Stamping**: During production build (`npm run build`), Vite replaces `__BUILD_ID__` with a unique timestamp in `dist/sw.js`.
- **Precache (App Shell)**: On installation, the core offline shell is cached (`./`, `./index.html`, `./manifest.webmanifest`, icons, fonts, sprites, and audio assets).
- **Cache Invalidation**: On activation, caches from older builds (`caret-*` not matching current `CACHE_NAME`) are purged immediately, and clients are claimed (`self.clients.claim()`).
- **Fetch Handling**:
  - **Navigation (`request.mode === 'navigate'`)**: Network-first with graceful fallback to cached `index.html`.
  - **Hashed Assets (`/assets/*`)**: Cache-first for instant loading of immutable JS/CSS/asset bundles.
  - **Dynamic Assets**: Network-first with cache fallback.
- **Development Safety**: In development mode (`import.meta.env.DEV`), the service worker registration is bypassed in `src/main.tsx` to prevent stale caches during iteration.

---

## 3. Server Caching & Content Security Policy ([`vercel.json`](../vercel.json))

- `/sw.js` and `/manifest.webmanifest`: `Cache-Control: no-cache, no-store, must-revalidate` to ensure clients receive manifest and service worker updates promptly.
- `/assets/*`: `Cache-Control: public, max-age=31536000, immutable` for maximal CDN cache hits on content-hashed files.
- **Content-Security-Policy**: Explicitly permits `worker-src 'self'` and `manifest-src 'self'`.

---

## 4. In-App Installation Hook

On desktop browsers that support PWA installation, Caret listens for the `beforeinstallprompt` event on the main menu. When triggered, an `"INSTALL CARET"` button appears in the action panel. Clicking it triggers the native browser prompt and plays the `ui-click` sound cue. Once accepted or dismissed, the button state updates cleanly.
