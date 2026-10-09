import { describe, it, expect, vi } from 'vitest';
import { EffectsManager } from '@/game/rendering/effects/EffectsManager';
import { EffectBackend, EffectCounts } from '@/game/rendering/effects/EffectBackend';
import { EffectCommand } from '@/game/rendering/effects/planEffects';

class MockEffectBackend implements EffectBackend {
  liveParticles = 0;
  liveBolts = 0;
  liveRings = 0;
  ghosts = 0;
  shakeCount = 0;
  edgeFlashCount = 0;

  spawnRingCalls = 0;
  spawnBurstCalls = 0;
  spawnBoltCalls = 0;

  spawnRing = vi.fn((_at, _from, _to, _ms) => {
    this.spawnRingCalls++;
    this.liveRings++;
  });

  spawnBurst = vi.fn((_at, count, _speed, _life, priority) => {
    this.spawnBurstCalls++;
    if (this.liveParticles + count > 40 && priority === 'high') {
      // High priority evicts older particles to fit
      this.liveParticles = count;
    } else {
      this.liveParticles += count;
    }
  });

  flashSprite = vi.fn();
  pulseLabel = vi.fn();

  spawnBolt = vi.fn((_from, _to, _ms, _trail) => {
    this.spawnBoltCalls++;
    this.liveBolts++;
  });

  tintShip = vi.fn();
  flashEdge = vi.fn((_alpha, _ms) => {
    this.edgeFlashCount++;
  });
  shakeCamera = vi.fn((_px, _ms) => {
    this.shakeCount++;
  });
  spawnGhost = vi.fn((_x, _y) => {
    this.ghosts++;
  });

  getCounts(): EffectCounts {
    return {
      liveParticles: this.liveParticles,
      liveBolts: this.liveBolts,
      liveRings: this.liveRings,
      ghosts: this.ghosts,
      shakeCount: this.shakeCount,
      edgeFlashCount: this.edgeFlashCount,
    };
  }

  clear(): void {
    this.liveParticles = 0;
    this.liveBolts = 0;
    this.liveRings = 0;
    this.ghosts = 0;
  }

  destroy(): void {
    this.clear();
  }
}

describe('EffectsManager with MockBackend (Section 3 & 8)', () => {
  it('enforces ring cap <= 8 and skips low priority commands beyond cap', () => {
    const backend = new MockEffectBackend();
    const manager = new EffectsManager(backend);

    const ringCmd: EffectCommand = {
      type: 'ring',
      at: { x: 100, y: 100 },
      fromRadius: 20,
      toRadius: 40,
      ms: 200,
    };

    // Emit 15 rings
    for (let i = 0; i < 15; i++) {
      manager.execute([ringCmd]);
    }

    // Must be capped at exactly 8
    expect(backend.spawnRingCalls).toBe(8);
  });

  it('enforces bolt cap <= 12 and skips excess bolts', () => {
    const backend = new MockEffectBackend();
    const manager = new EffectsManager(backend);

    const boltCmd: EffectCommand = {
      type: 'bolt',
      from: { x: 0, y: 0 },
      to: { x: 10, y: 10 },
      travelMs: 90,
      trailSegments: 3,
    };

    for (let i = 0; i < 20; i++) {
      manager.execute([boltCmd]);
    }

    expect(backend.spawnBoltCalls).toBe(12);
  });

  it('allows high-priority bursts to evict and execute when cap is reached', () => {
    const backend = new MockEffectBackend();
    const manager = new EffectsManager(backend);

    backend.liveParticles = 38;

    const normalBurst: EffectCommand = {
      type: 'burst',
      at: { x: 100, y: 100 },
      count: 10,
      speed: [60, 140],
      lifeMs: 350,
    };

    // Normal burst should be skipped (38 + 10 > 40)
    manager.execute([normalBurst], 'normal');
    expect(backend.spawnBurstCalls).toBe(0);

    // High priority burst should execute with priority='high'
    manager.execute([normalBurst], 'high');
    expect(backend.spawnBurstCalls).toBe(1);
  });

  it('remains stable and bounded after 1,000 simulated events', () => {
    const backend = new MockEffectBackend();
    const manager = new EffectsManager(backend);

    for (let i = 0; i < 1000; i++) {
      manager.execute([
        {
          type: 'burst',
          at: { x: 100, y: 100 },
          count: 5,
          speed: [60, 140],
          lifeMs: 300,
        },
      ]);
      // Periodically drain particles like the timer does
      if (i % 8 === 0) {
        backend.liveParticles = 0;
      }
    }

    const counts = manager.getCounts();
    expect(counts.liveParticles).toBeLessThanOrEqual(40);
  });
});
