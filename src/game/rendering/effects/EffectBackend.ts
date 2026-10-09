import { Vector2 } from '@/shared/domain';

export interface EffectCounts {
  readonly liveParticles: number;
  readonly liveBolts: number;
  readonly liveRings: number;
  readonly ghosts: number;
  readonly displayObjects?: number;
  readonly shakeCount: number;
  readonly edgeFlashCount: number;
}

/**
 * Pluggable backend interface for executing visual commands.
 * Allows pure unit testing of caps, throttling, and priority eviction without Phaser.
 */
export interface EffectBackend {
  spawnRing(at: Vector2, fromRadius: number, toRadius: number, ms: number): void;
  spawnBurst(
    at: Vector2,
    count: number,
    speed: readonly [number, number],
    lifeMs: number,
    priority: 'normal' | 'high'
  ): void;
  flashSprite(target: 'drone' | 'ship', id?: string, ms?: number): void;
  pulseLabel(id: string, ms: number): void;
  spawnBolt(from: Vector2, to: Vector2, travelMs: number, trailSegments: number): void;
  tintShip(color: number, ms: number): void;
  flashEdge(alpha: number, ms: number): void;
  shakeCamera(px: number, ms: number): void;
  spawnGhost(x: number, y: number): void;
  getCounts(): EffectCounts;
  clear(): void;
  destroy(): void;
}
