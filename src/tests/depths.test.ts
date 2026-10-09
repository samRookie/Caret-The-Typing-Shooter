import { describe, it, expect } from 'vitest';
import { DEPTHS } from '@/game/rendering/depths';

describe('Render Depths Invariants (Section 3 & 8)', () => {
  it('conforms to the exact depth hierarchy specification', () => {
    expect(DEPTHS.BACKGROUND_GRID).toBe(0);
    expect(DEPTHS.BACKGROUND_STARS).toBe(1);
    expect(DEPTHS.PLAYER).toBe(10);
    expect(DEPTHS.ENEMIES).toBe(10);
    expect(DEPTHS.PROJECTILES).toBe(12);
    expect(DEPTHS.GHOSTS).toBe(14);
    expect(DEPTHS.EFFECTS_MIN).toBe(15);
    expect(DEPTHS.EFFECTS_MAX).toBe(18);
    expect(DEPTHS.EDGE_FLASH).toBe(19);
    expect(DEPTHS.LABELS).toBe(25);
  });

  it('guarantees every visual effect depth is strictly below the word label depth (25)', () => {
    const labelDepth = DEPTHS.LABELS;

    for (const [key, depth] of Object.entries(DEPTHS)) {
      if (key !== 'LABELS') {
        expect(depth).toBeLessThan(labelDepth);
      }
    }
  });

  it('guarantees nothing is at or above depth 25 except labels', () => {
    for (const [key, depth] of Object.entries(DEPTHS)) {
      if (depth >= 25) {
        expect(key).toBe('LABELS');
      }
    }
  });
});
