# Third-Party Asset Credits & License Status

This document catalogues every third-party asset currently residing in `public/` and bundled runtime packages, identifying the source pack, version, license status, and provenance notes.

---

## 1. Third-Party Files in `public/`

| File Path in `public/` | Originating Pack | Version / License Status | Stated License |
|---|---|---|---|
| `assets/audio/ui-click.ogg` | Kenney UI Pack / Digital Audio | Version not stated; license file missing from pack | CC0 1.0 Universal (claimed) |
| `assets/audio/laser.ogg` | Kenney Digital Audio | Version not stated; license file missing from pack | CC0 1.0 Universal (claimed) |
| `assets/audio/hit.ogg` | Kenney Sci-Fi Sounds | Version 1.0; license file present in repo (`third_party/kenney/sci-fi-sounds/License.txt`) | CC0 1.0 Universal |
| `assets/audio/destroy.ogg` | Kenney Digital Audio | Version not stated; license file missing from pack | CC0 1.0 Universal (claimed) |
| `assets/audio/wrong-input.ogg` | Kenney Digital Audio | Version not stated; license file missing from pack | CC0 1.0 Universal (claimed) |
| `assets/audio/wave-complete.ogg` | Kenney Digital Audio | Version not stated; license file missing from pack | CC0 1.0 Universal (claimed) |

*(Note: Original SVGs in `public/assets/vfx/` — `player-ship-original.svg`, `drone-original.svg`, and `projectile-and-reticle-original.svg` — are original prototype assets authored for this project and are not third-party files. Legacy Kenney font files `kenney-future.ttf` and `kenney-future-narrow.ttf` were removed in Revision R1 Phase P4.)*

---

## 2. Bundled Font Software (`@fontsource/tektur` & JMH Typewriter)

* **Font Family:** Tektur
* **Package Source:** `@fontsource/tektur` (npm)
* **License:** SIL Open Font License 1.1 (`OFL-1.1`)
* **License File:** Stored at `third_party/tektur/OFL.txt`
* **Copyright Notice:** `Copyright 2023 The Tektur Project Authors (https://www.github.com/hyvyys/Tektur)`

* **Font Family:** JMH Typewriter (used restrictively for drone target words)
* **Author / Owner:** Jorge Morón (joorgemoron@gmail.com)
* **License:** Free for Personal Use Only
* **License File:** Stored at `third_party/jmh-typewriter/Personal Use Only-User Terms Agreement.txt`

---

## 3. Packs and License Files Audit

1. **Kenney UI Pack - Adventure (Version 1.1)**
   * **License File:** Present in repository at `third_party/kenney/ui-pack-adventure/License.txt` (extracted from `docs/source-assets/kenney_ui-pack-adventure.zip`).
   * **License:** Creative Commons Zero, CC0 1.0 Universal.
   * **Usage in `public/`:** None currently deployed (supplemental UI pack retained in `docs/source-assets/`).

2. **Kenney Space Shooter Extension**
   * **License File:** Missing from repository archives. Recorded in `third_party/kenney/space-shooter-extension/License.txt`.
   * **Usage in `public/`:** All spritesheet assets were removed from `public/` in Section A6.

3. **Kenney Digital Audio**
   * **License File:** Missing from repository archives. Recorded in `third_party/kenney/digital-audio/License.txt`.
   * **Usage in `public/`:** Sound effects (`laser.ogg`, `destroy.ogg`, `wrong-input.ogg`, `wave-complete.ogg`).

4. **Kenney Sci-Fi Sounds (Version 1.0)**
   * **License File:** Present in repository at `third_party/kenney/sci-fi-sounds/License.txt`.
   * **License:** Creative Commons Zero, CC0 1.0 Universal.
   * **Usage in `public/`:** Hull collision & damage sound effect (`hit.ogg`, sourced from `explosionCrunch_000.ogg`).

5. **Kenney UI Pack**
   * **License File:** Missing from repository archives. Recorded in `third_party/kenney/ui-pack/License.txt`.
   * **Usage in `public/`:** UI sound (`ui-click.ogg`). Legacy fonts removed.

---

## 4. Provenance Discrepancy Flags

The legacy documentation (`docs/source-assets/Asset Provenance and Licenses.md`) contained two inaccurate claims:

1. **Claimed:** *"Original pack license file was reviewed and is included in the source download."*
   * **Flagged as False:** The curated zip (`phase1-futuristic-asset-pack.zip`) did not bundle any official Kenney `License.txt` files; it only contained a derivative `LICENSES.md`. The only real `License.txt` file in the repo was found inside `kenney_ui-pack-adventure.zip`.
2. **Claimed:** *Generic "UI Pack" covers all included assets.*
   * **Flagged as Inaccurate:** The repository actually contained `kenney_ui-pack-adventure.zip` (UI Pack - Adventure 1.1), while the audio in `phase1-futuristic-asset-pack.zip` was pulled from different unversioned packs without official license text files attached.
