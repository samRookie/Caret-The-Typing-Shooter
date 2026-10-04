# Third-Party Asset Credits & License Status

This document catalogues every third-party asset currently residing in `public/`, identifying the source pack, stated version, license status, and discrepancies found during the repository provenance audit.

---

## 1. Third-Party Files in `public/`

| File Path in `public/` | Originating Pack | Version / License Status | Stated License |
|---|---|---|---|
| `assets/fonts/kenney-future.ttf` | Kenney UI Pack | Version not stated; license file **MISSING** from repo | CC0 1.0 Universal (claimed) |
| `assets/fonts/kenney-future-narrow.ttf` | Kenney UI Pack | Version not stated; license file **MISSING** from repo | CC0 1.0 Universal (claimed) |
| `assets/audio/ui-click.ogg` | Kenney UI Pack / Digital Audio | Version not stated; license file **MISSING** from repo | CC0 1.0 Universal (claimed) |
| `assets/audio/laser.ogg` | Kenney Digital Audio | Version not stated; license file **MISSING** from repo | CC0 1.0 Universal (claimed) |
| `assets/audio/hit.ogg` | Kenney Digital Audio | Version not stated; license file **MISSING** from repo | CC0 1.0 Universal (claimed) |
| `assets/audio/destroy.ogg` | Kenney Digital Audio | Version not stated; license file **MISSING** from repo | CC0 1.0 Universal (claimed) |
| `assets/audio/wrong-input.ogg` | Kenney Digital Audio | Version not stated; license file **MISSING** from repo | CC0 1.0 Universal (claimed) |
| `assets/audio/wave-complete.ogg` | Kenney Digital Audio | Version not stated; license file **MISSING** from repo | CC0 1.0 Universal (claimed) |

*(Note: Original SVGs in `public/assets/vfx/` — `player-ship-original.svg`, `drone-original.svg`, and `projectile-and-reticle-original.svg` — are original prototype assets authored for this project and are not third-party files.)*

---

## 2. Packs and License Files Audit

1. **Kenney UI Pack - Adventure (Version 1.1)**
   * **License File:** Present in repository at `third_party/kenney/ui-pack-adventure/License.txt` (extracted from `docs/source-assets/kenney_ui-pack-adventure.zip`).
   * **License:** Creative Commons Zero, CC0 1.0 Universal.
   * **Usage in `public/`:** None currently deployed (supplemental UI pack retained in `docs/source-assets/`).

2. **Kenney Space Shooter Extension**
   * **License File:** **MISSING** from repository archives. Recorded in `third_party/kenney/space-shooter-extension/License.txt`.
   * **Usage in `public/`:** All spritesheet assets were removed from `public/` in Section A6.

3. **Kenney Digital Audio**
   * **License File:** **MISSING** from repository archives. Recorded in `third_party/kenney/digital-audio/License.txt`.
   * **Usage in `public/`:** Sound effects (`laser.ogg`, `hit.ogg`, `destroy.ogg`, `wrong-input.ogg`, `wave-complete.ogg`).

4. **Kenney UI Pack**
   * **License File:** **MISSING** from repository archives. Recorded in `third_party/kenney/ui-pack/License.txt`.
   * **Usage in `public/`:** Fonts (`kenney-future.ttf`, `kenney-future-narrow.ttf`) and UI sound (`ui-click.ogg`).

---

## 3. Provenance Discrepancy Flags

The legacy documentation (`docs/source-assets/Asset Provenance and Licenses.md`) contained two inaccurate claims:

1. **Claimed:** *"Original pack license file was reviewed and is included in the source download."*
   * **Flagged as False:** The curated zip (`phase1-futuristic-asset-pack.zip`) did not bundle any official Kenney `License.txt` files; it only contained a derivative `LICENSES.md`. The only real `License.txt` file in the repo was found inside `kenney_ui-pack-adventure.zip`.
2. **Claimed:** *Generic "UI Pack" covers all included assets.*
   * **Flagged as Inaccurate:** The repository actually contained `kenney_ui-pack-adventure.zip` (UI Pack - Adventure 1.1), while the fonts and audio in `phase1-futuristic-asset-pack.zip` were pulled from different unversioned packs without official license text files attached.
