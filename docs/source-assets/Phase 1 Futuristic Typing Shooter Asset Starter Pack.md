# Phase 1 Futuristic Typing Shooter Asset Starter Pack

This pack contains a curated set of free CC0 Kenney assets plus original SVG placeholders and a Phaser VFX helper module for the Phase 1 prototype.

## Contents

- `assets/sprites/kenney-space-shooter-extension.*` — Kenney Space Shooter Extension vector/spritesheet assets.
- `assets/ui/` — selected Kenney UI icons and input/button assets.
- `assets/fonts/` — Kenney Future and Kenney Future Narrow fonts.
- `assets/audio/` — selected Kenney UI, laser, hit, destroy, wrong-input, and wave-complete sounds.
- `assets/vfx/` — original amber-theme SVG placeholders and `phase1-vfx.ts` Phaser helper functions.
- `LICENSES.md` — provenance and license information.

## Suggested mapping

| Game feature | File or module |
|---|---|
| Player placeholder | `assets/vfx/player-ship-original.svg` |
| Enemy placeholder | `assets/vfx/drone-original.svg` |
| Projectile/reticle reference | `assets/vfx/projectile-and-reticle-original.svg` |
| Phaser lock effect | `assets/vfx/phase1-vfx.ts` → `spawnTargetLock` |
| Hit flash | `spawnHitFlash` |
| Destruction burst | `spawnDestroyBurst` |
| Wrong-input feedback | `spawnWrongInputPulse` |
| UI click | `assets/audio/ui-click.ogg` |
| Projectile launch | `assets/audio/laser.ogg` |
| Correct hit | `assets/audio/hit.ogg` |
| Enemy destruction | `assets/audio/destroy.ogg` |
| Wrong input | `assets/audio/wrong-input.ogg` |
| Wave complete | `assets/audio/wave-complete.ogg` |

## Phaser notes

The original SVGs can be loaded as normal Phaser image assets. The helper module uses lightweight Graphics, Tweens, Camera flash, and particle effects. Keep the VFX options object connected to your reduced-motion setting.

## License reminder

The Kenney files are CC0 according to the official Kenney asset pages. The original SVGs and VFX TypeScript file in this pack were created for this project and may be used, modified, and redistributed with this pack. See `LICENSES.md` for sources and exact provenance.

Do not use the original ZType name, logo, artwork, sprites, soundtrack, or source code in a public release unless you have the necessary rights.
