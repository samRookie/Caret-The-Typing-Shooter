# Deployment Guide — Caret: The Typing Shooter

This document provides deployment instructions for hosting the production build of **Caret: The Typing Shooter** on static hosting providers: **Vercel**, **Netlify**, and **GitHub Pages**.

> **Note**: You (the repository owner) perform the deployment using your own provider account and credentials.

---

## 1. Production Build & Environment Setup

The build uses Vite and supports custom sub-path hosting via the `VITE_BASE` environment variable.

```bash
# Default root deployment (base = "/")
npm run build

# Sub-path deployment (e.g. GitHub Pages at /<repo-name>/)
# In Windows PowerShell:
$env:VITE_BASE = "/caret/"; npm run build

# In bash / macOS / Linux:
VITE_BASE="/caret/" npm run build
```

The output bundle is generated in the `dist/` directory.

---

## 2. Platform Deployment Instructions

### A. Vercel

Vercel serves single-page applications at the domain root (`/`), so `VITE_BASE` defaults to `/`.

#### Option 1: Vercel CLI
```bash
# 1. Install or run Vercel CLI
npx vercel

# 2. When prompted:
# - Set up and deploy? Yes
# - Which scope? <your account>
# - Link to existing project? No
# - Project name? caret-typing-shooter
# - In which directory is your code located? ./
# - Want to modify build settings? No (Vite is auto-detected)

# 3. For production release:
npx vercel --prod
```

#### Option 2: Vercel Dashboard (Git Integration)
1. Push your repository to GitHub.
2. In the Vercel Dashboard, click **Add New...** → **Project** and import your repository.
3. Framework Preset: **Vite**.
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Environment Variables (optional, only needed if not hosting at root):
   - Key: `VITE_BASE` | Value: `/`
7. Click **Deploy**.

---

### B. Netlify

Netlify also serves static sites from the domain root (`/`) by default.

#### Option 1: Netlify CLI
```bash
# 1. Install or run Netlify CLI
npx netlify deploy

# 2. When prompted:
# - Publish directory: dist
# 3. For production release:
npx netlify deploy --prod --dir=dist
```

#### Option 2: Netlify Dashboard (Git Integration)
1. Push your repository to GitHub.
2. In the Netlify Dashboard, click **Add new site** → **Import an existing project**.
3. Select your repository.
4. Build settings:
   - Base directory: (leave blank)
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Environment Variables:
   - Key: `VITE_BASE` | Value: `/`
6. Click **Deploy site**.

---

### C. GitHub Pages

GitHub Pages typically hosts repositories under a sub-path: `https://<username>.github.io/<repo-name>/`.
Therefore, `VITE_BASE` **must** be set to `/<repo-name>/` (with leading and trailing slashes).

For example, if your repository is named `Caret-The-Typing-Shooter`:
- `VITE_BASE`: `"/Caret-The-Typing-Shooter/"`

#### Option 1: Manual Deployment with `gh-pages` branch
```bash
# 1. Build with your repository sub-path
# PowerShell:
$env:VITE_BASE = "/Caret-The-Typing-Shooter/"; npm run build

# Bash:
VITE_BASE="/Caret-The-Typing-Shooter/" npm run build

# 2. Deploy dist directory to gh-pages branch
npx gh-pages -d dist
```

#### Option 2: GitHub Actions Workflow (`.github/workflows/deploy.yml`)
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [master]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build production bundle
        run: npm run build
        env:
          VITE_BASE: /${{ github.event.repository.name }}/

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## 3. Post-Deployment Verification Checklist

Once deployed to your staging or production URL:

1. **Verify Asset Loading**:
   - Open browser DevTools (F12) → **Console** and **Network** tabs.
   - Confirm zero red HTTP 404 status codes on audio files (`.ogg`), SVG sprites (`.svg`), or fonts (`.ttf`).
   - Confirm zero browser console errors.
2. **Verify Playable Flow**:
   - Menu Screen displays title, difficulty preset selector, and controls.
   - Click **INITIATE ENGAGEMENT** → loading overlay completes smoothly into active gameplay.
   - Type target words on approaching drones → verify sound effects and score increments.
   - Let enemies deplete hull to 0 → verify **ENGAGEMENT TERMINATED** game-over modal appears with seed and stats.
   - Click **RESTART / INITIALIZE NEW RUN [ENTER]** → verify seamless restart with clean canvas.
3. **Verify Dev Hooks are Absent**:
   - In browser console, evaluate `window.__caret`.
   - Confirm it returns `undefined`.
