import { GameEvent, Vector2 } from '@/shared/domain';
import { MotionPolicy } from '@/shared/motion';
import { EFFECT_CONFIG, SoundCue } from '@/shared/config/effectsConfig';
import { PLAYER_START } from '@/shared/config/defaultConfig';

export type EffectCommand =
  | {
      readonly type: 'ring';
      readonly at: Vector2;
      readonly fromRadius: number;
      readonly toRadius: number;
      readonly ms: number;
    }
  | {
      readonly type: 'burst';
      readonly at: Vector2;
      readonly count: number;
      readonly speed: readonly [number, number];
      readonly lifeMs: number;
    }
  | {
      readonly type: 'spriteFlash';
      readonly target: 'drone' | 'ship';
      readonly id?: string;
      readonly ms: number;
    }
  | {
      readonly type: 'labelPulse';
      readonly id: string;
      readonly ms: number;
    }
  | {
      readonly type: 'bolt';
      readonly from: Vector2;
      readonly to: Vector2;
      readonly travelMs: number;
      readonly trailSegments: number;
    }
  | {
      readonly type: 'tint';
      readonly target: 'ship';
      readonly color: number;
      readonly ms: number;
    }
  | {
      readonly type: 'edgeFlash';
      readonly alpha: number;
      readonly ms: number;
    }
  | {
      readonly type: 'shake';
      readonly px: number;
      readonly ms: number;
    }
  | {
      readonly type: 'hudSignal';
      readonly signal: 'pip-loss' | 'last-life' | 'mismatch';
    }
  | {
      readonly type: 'sound';
      readonly cue: SoundCue;
      readonly volume?: number;
      readonly rate?: number;
      readonly delayMs?: number;
    };

export interface EffectContext {
  readonly wd: number;
  readonly ws: number;
  readonly healthAfter?: number;
  readonly isNewRecord?: boolean;
  readonly panelDelayMs?: number;
  readonly shipPosition?: Vector2;
}

function scaleBurstCount(
  min: number,
  max: number,
  particleScale: number,
  reduced: boolean
): number {
  const base = Math.round((min + max) / 2);
  if (reduced) {
    return Math.min(5, Math.max(1, Math.round(base * particleScale)));
  }
  return Math.min(max, Math.max(min, Math.round(base * particleScale)));
}

/**
 * Pure declarative effect and audio planner.
 * Encodes exact visual feedback and acoustic cue rules.
 * Strictly free of DOM, Phaser, React, and randomness.
 */
export function planEffects(
  event: GameEvent,
  ctx: EffectContext,
  policy: MotionPolicy
): EffectCommand[] {
  const wd = ctx.wd;
  const ws = ctx.ws;
  const shipPos = ctx.shipPosition ?? PLAYER_START;
  const commands: EffectCommand[] = [];

  switch (event.type) {
    case 'ENEMY_SPAWNED': {
      if (!policy.reduced) {
        commands.push({
          type: 'ring',
          at: event.position,
          fromRadius: 0.6 * wd,
          toRadius: 1.4 * wd,
          ms: EFFECT_CONFIG.SPAWN_RING_MS,
        });
      }
      break;
    }

    case 'TARGET_LOCKED': {
      commands.push({
        type: 'labelPulse',
        id: event.enemyId,
        ms: EFFECT_CONFIG.TARGET_PULSE_MS,
      });
      break;
    }

    case 'INPUT_MATCH': {
      // Correct letter, not final -> laser vol 0.35
      // Correct final letter -> laser vol 0.35 AND destroy vol 0.8
      commands.push({
        type: 'sound',
        cue: 'laser',
        volume: 0.35,
      });

      if (event.remainingWord.length === 0) {
        commands.push({
          type: 'sound',
          cue: 'destroy',
          volume: 0.8,
        });
      }
      break;
    }

    case 'PROJECTILE_SPAWNED': {
      commands.push({
        type: 'bolt',
        from: event.from,
        to: event.to,
        travelMs: EFFECT_CONFIG.BOLT_TRAVEL_MS,
        trailSegments: policy.reduced ? 0 : EFFECT_CONFIG.BOLT_TRAIL_SEGMENTS,
      });
      break;
    }

    case 'ENEMY_HIT': {
      commands.push({
        type: 'spriteFlash',
        target: 'drone',
        id: event.enemyId,
        ms: EFFECT_CONFIG.HIT_FLASH_MS,
      });

      if (!policy.reduced) {
        commands.push({
          type: 'burst',
          at: event.position,
          count: scaleBurstCount(2, 3, policy.particleScale, false),
          speed: [30, 80],
          lifeMs: 150,
        });
      }
      break;
    }

    case 'ENEMY_DESTROYED': {
      if (event.cause === 'word') {
        commands.push({
          type: 'ring',
          at: event.position,
          fromRadius: 0.6 * wd,
          toRadius: policy.reduced ? 0.6 * wd : 1.8 * wd,
          ms: EFFECT_CONFIG.DESTROY_RING_MS,
        });

        commands.push({
          type: 'burst',
          at: event.position,
          count: scaleBurstCount(10, 14, policy.particleScale, policy.reduced),
          speed: [60, 140],
          lifeMs: EFFECT_CONFIG.DESTROY_BURST_LIFE_MS,
        });
      } else {
        // Collision destruction
        commands.push({
          type: 'burst',
          at: event.position,
          count: scaleBurstCount(6, 8, policy.particleScale, policy.reduced),
          speed: [50, 120],
          lifeMs: EFFECT_CONFIG.COLLISION_BURST_LIFE_MS,
        });
      }
      break;
    }

    case 'PLAYER_DAMAGED': {
      const healthAfter = ctx.healthAfter ?? event.currentHealth;

      if (!policy.reduced) {
        commands.push({
          type: 'burst',
          at: shipPos,
          count: scaleBurstCount(8, 10, policy.particleScale, false),
          speed: [40, 100],
          lifeMs: EFFECT_CONFIG.COLLISION_BURST_LIFE_MS,
        });
      }

      commands.push({
        type: 'tint',
        target: 'ship',
        color: 0xff0000,
        ms: EFFECT_CONFIG.PLAYER_DAMAGE_TINT_MS,
      });

      if (!policy.reduced) {
        if (policy.flash) {
          commands.push({
            type: 'edgeFlash',
            alpha: EFFECT_CONFIG.PLAYER_EDGE_FLASH_ALPHA,
            ms: EFFECT_CONFIG.PLAYER_EDGE_FLASH_MS,
          });
        }
        if (policy.shake) {
          commands.push({
            type: 'shake',
            px: EFFECT_CONFIG.PLAYER_SHAKE_PX,
            ms: EFFECT_CONFIG.PLAYER_SHAKE_MS,
          });
        }
      }

      commands.push({
        type: 'hudSignal',
        signal: 'pip-loss',
      });

      if (healthAfter === 1) {
        commands.push({
          type: 'hudSignal',
          signal: 'last-life',
        });
      }

      // Sound commands
      commands.push({
        type: 'sound',
        cue: 'hit',
        volume: 0.8,
      });

      if (healthAfter === 1) {
        commands.push({
          type: 'sound',
          cue: 'hit',
          rate: 0.7,
          volume: 0.5,
          delayMs: EFFECT_CONFIG.LAST_LIFE_DELAY_MS,
        });
      }
      break;
    }

    case 'INPUT_MISMATCH': {
      commands.push({
        type: 'hudSignal',
        signal: 'mismatch',
      });
      commands.push({
        type: 'sound',
        cue: 'wrong-input',
        volume: 0.4,
      });
      break;
    }

    case 'WAVE_COMPLETED': {
      commands.push({
        type: 'sound',
        cue: 'wave-complete',
        volume: 0.7,
      });
      break;
    }

    case 'GAME_OVER': {
      if (policy.reduced) {
        commands.push({
          type: 'ring',
          at: shipPos,
          fromRadius: 0.8 * ws,
          toRadius: 0.8 * ws,
          ms: EFFECT_CONFIG.GAME_OVER_RING_REDUCED_MS,
        });
        commands.push({
          type: 'burst',
          at: shipPos,
          count: scaleBurstCount(18, 24, policy.particleScale, true),
          speed: [60, 160],
          lifeMs: EFFECT_CONFIG.GAME_OVER_RING_REDUCED_MS,
        });
      } else {
        commands.push({
          type: 'ring',
          at: shipPos,
          fromRadius: 0.8 * ws,
          toRadius: 3 * ws,
          ms: EFFECT_CONFIG.GAME_OVER_RING_MS,
        });
        commands.push({
          type: 'burst',
          at: shipPos,
          count: scaleBurstCount(18, 24, policy.particleScale, false),
          speed: [60, 160],
          lifeMs: EFFECT_CONFIG.GAME_OVER_BURST_LIFE_MS,
        });
      }

      commands.push({
        type: 'sound',
        cue: 'destroy',
        rate: 0.5,
        volume: 0.8,
      });

      if (ctx.isNewRecord) {
        const defaultPanelDelay = policy.reduced
          ? EFFECT_CONFIG.GAME_OVER_PANEL_DELAY_REDUCED_MS
          : EFFECT_CONFIG.GAME_OVER_PANEL_DELAY_MS;
        const panelDelay = ctx.panelDelayMs ?? defaultPanelDelay;
        const recordDelay = Math.max(
          EFFECT_CONFIG.NEW_RECORD_MIN_DELAY_MS,
          panelDelay + EFFECT_CONFIG.NEW_RECORD_PANEL_OFFSET_MS
        );

        commands.push({
          type: 'sound',
          cue: 'wave-complete',
          rate: 1.25,
          volume: 0.6,
          delayMs: recordDelay,
        });
      }
      break;
    }

    default:
      break;
  }

  return commands;
}
