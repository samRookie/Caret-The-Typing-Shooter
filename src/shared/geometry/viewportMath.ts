import { Vector2 } from '../domain';
import {
  DESKTOP_VIEWPORT,
  HUD_WING_BOX_HEIGHT_WORLD,
  HUD_WING_BOX_WIDTH_WORLD,
  HUD_WING_GAP_WORLD,
  HUD_WING_Y_OFFSET_WORLD,
  PLAYER_START,
  TARGET_SHIP_SIZE,
} from '../config/defaultConfig';

export interface ViewportPercent {
  leftPercent: number;
  topPercent: number;
}

export interface WingBoxPositions {
  streakBox: ViewportPercent;
  scoreBox: ViewportPercent;
}

/**
 * Pure function mapping world coordinates (x, y) to viewport percentages (leftPercent, topPercent).
 */
export function worldToViewportPercent(
  worldPos: Vector2,
  virtualResolution = DESKTOP_VIEWPORT
): ViewportPercent {
  return {
    leftPercent: (worldPos.x / virtualResolution.width) * 100,
    topPercent: (worldPos.y / virtualResolution.height) * 100,
  };
}

/**
 * Computes viewport percentages for StreakBox and ScoreBox flanking the player ship.
 * Positions are guaranteed to reside in the bottom 20% (y >= 80%)
 * and within 20% of horizontal center (30% <= x <= 70%).
 */
export function computeWingBoxPositions(
  playerPos: Vector2 = PLAYER_START,
  virtualResolution = DESKTOP_VIEWPORT
): WingBoxPositions {
  const shipHalfWidth = TARGET_SHIP_SIZE.width / 2;
  const boxHalfHeight = HUD_WING_BOX_HEIGHT_WORLD / 2;

  // Streak box on ship's left wing
  const streakWorldX = playerPos.x - shipHalfWidth - HUD_WING_GAP_WORLD - HUD_WING_BOX_WIDTH_WORLD;
  const streakWorldY = playerPos.y + HUD_WING_Y_OFFSET_WORLD - boxHalfHeight;

  // Score box on ship's right wing
  const scoreWorldX = playerPos.x + shipHalfWidth + HUD_WING_GAP_WORLD;
  const scoreWorldY = playerPos.y + HUD_WING_Y_OFFSET_WORLD - boxHalfHeight;

  return {
    streakBox: worldToViewportPercent({ x: streakWorldX, y: streakWorldY }, virtualResolution),
    scoreBox: worldToViewportPercent({ x: scoreWorldX, y: scoreWorldY }, virtualResolution),
  };
}
