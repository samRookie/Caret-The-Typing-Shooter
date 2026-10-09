/**
 * Render depth constants across all Phaser display layers.
 * Section 3 / Spec 7.C:
 * background 0–2, enemies/player 10, projectiles 12, ghosts 14,
 * effects 15–18, edge flash 19, reticle 20, word labels 25.
 * CRITICAL RULE: Nothing except labels may be >= 25.
 */
export const DEPTHS = {
  BACKGROUND_GRID: 0,
  BACKGROUND_STARS: 1,
  PLAYER: 10,
  ENEMIES: 10,
  PROJECTILES: 12,
  GHOSTS: 14,
  EFFECTS_MIN: 15,
  EFFECTS_MID: 16,
  EFFECTS_MAX: 19,
  EDGE_FLASH: 19,
  RETICLE: 20,
  LABELS: 25,
} as const;

export type RenderDepthKey = keyof typeof DEPTHS;
