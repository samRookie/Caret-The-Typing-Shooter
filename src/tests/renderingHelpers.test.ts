import { describe, it, expect } from 'vitest';
import { reconcile } from '@/game/rendering/reconcile';
import {
  layoutLabel,
  computePlateWidth,
  clampContainerX,
} from '@/game/rendering/layoutLabel';
import { RENDERER_CONFIG, DESKTOP_VIEWPORT } from '@/shared/config/defaultConfig';

describe('Rendering Pure Helpers (7.B)', () => {
  describe('reconcile()', () => {
    it('identifies newly created enemies when prevIds is empty', () => {
      const snapshot = {
        enemies: [{ id: 'enemy-1' }, { id: 'enemy-2' }],
      };
      const result = reconcile([], snapshot);

      expect(result.created).toEqual(['enemy-1', 'enemy-2']);
      expect(result.kept).toEqual([]);
      expect(result.removed).toEqual([]);
    });

    it('identifies kept and removed enemies across snapshots', () => {
      const prevIds = ['enemy-1', 'enemy-2', 'enemy-3'];
      const snapshot = {
        enemies: [{ id: 'enemy-2' }, { id: 'enemy-4' }],
      };
      const result = reconcile(prevIds, snapshot);

      expect(result.created).toEqual(['enemy-4']);
      expect(result.kept).toEqual(['enemy-2']);
      expect(result.removed).toEqual(['enemy-1', 'enemy-3']);
    });

    it('handles empty snapshot (all previous enemies removed)', () => {
      const prevIds = ['enemy-1', 'enemy-2'];
      const snapshot = { enemies: [] };
      const result = reconcile(prevIds, snapshot);

      expect(result.created).toEqual([]);
      expect(result.kept).toEqual([]);
      expect(result.removed).toEqual(['enemy-1', 'enemy-2']);
    });

    it('works with Set as prevIds', () => {
      const prevIds = new Set(['e1', 'e2']);
      const snapshot = { enemies: [{ id: 'e2' }] };
      const result = reconcile(prevIds, snapshot);

      expect(result.created).toEqual([]);
      expect(result.kept).toEqual(['e2']);
      expect(result.removed).toEqual(['e1']);
    });
  });

  describe('layoutLabel()', () => {
    it('sets correct letter states for untyped word', () => {
      const result = layoutLabel('DRONE', 'DRONE');
      expect(result).toHaveLength(5);
      expect(result[0]?.state).toBe('next');
      expect(result[1]?.state).toBe('remaining');
      expect(result[2]?.state).toBe('remaining');
      expect(result[3]?.state).toBe('remaining');
      expect(result[4]?.state).toBe('remaining');
    });

    it('sets correct letter states for partially typed word', () => {
      // word: "TACTICAL", typed: "TAC", remaining: "TICAL"
      const result = layoutLabel('TACTICAL', 'TICAL');
      expect(result).toHaveLength(8);
      // 'T', 'A', 'C' should be typed
      expect(result[0]?.state).toBe('typed');
      expect(result[1]?.state).toBe('typed');
      expect(result[2]?.state).toBe('typed');
      // next letter 'T'
      expect(result[3]?.state).toBe('next');
      // remaining 'I', 'C', 'A', 'L'
      expect(result[4]?.state).toBe('remaining');
      expect(result[5]?.state).toBe('remaining');
      expect(result[6]?.state).toBe('remaining');
      expect(result[7]?.state).toBe('remaining');
    });

    it('sets correct letter states for completed word', () => {
      const result = layoutLabel('TARGET', '');
      expect(result).toHaveLength(6);
      expect(result.every((l) => l.state === 'typed')).toBe(true);
    });

    it('centers letters on plate across 3 to 8 letter words with exact advance', () => {
      const advance = RENDERER_CONFIG.labelCharWidthPx;
      const testWords = ['CAT', 'SHIP', 'LASER', 'COMBAT', 'MISSILE', 'DEFENDER'];

      for (const word of testWords) {
        const letters = layoutLabel(word, word, advance);
        expect(letters).toHaveLength(word.length);

        // Center check: midpoint of first and last letter must be 0
        const first = letters[0]!;
        const last = letters[letters.length - 1]!;
        const midpoint = (first.x + last.x) / 2;
        expect(midpoint).toBeCloseTo(0, 5);

        // Advance check: distance between consecutive letters must equal advance
        for (let i = 0; i < letters.length - 1; i++) {
          const current = letters[i]!;
          const next = letters[i + 1]!;
          expect(next.x - current.x).toBeCloseTo(advance, 5);
        }
      }
    });

    it('computes plateWidth accurately with padding', () => {
      const wordLength = 5;
      const advance = 14;
      const padding = 12;
      const width = computePlateWidth(wordLength, advance, padding);
      expect(width).toBe(5 * 14 + 12); // 82px
    });

    it('clamps plate container x so plate never overflows horizontal canvas bounds', () => {
      const canvasWidth = DESKTOP_VIEWPORT.width; // 1280
      const plateWidth = computePlateWidth(6, 14, 12); // 6 * 14 + 12 = 96px
      const halfWidth = plateWidth / 2; // 48px

      // In safe bounds: position is preserved
      expect(clampContainerX(640, plateWidth, canvasWidth)).toBe(640);

      // Too close to left edge: clamped to halfWidth so left edge is at x=0
      expect(clampContainerX(10, plateWidth, canvasWidth)).toBe(halfWidth);
      expect(clampContainerX(-50, plateWidth, canvasWidth)).toBe(halfWidth);

      // Too close to right edge: clamped so right edge is at canvasWidth
      expect(clampContainerX(1270, plateWidth, canvasWidth)).toBe(canvasWidth - halfWidth);
      expect(clampContainerX(1500, plateWidth, canvasWidth)).toBe(canvasWidth - halfWidth);

      // Accepts word string directly
      expect(clampContainerX(10, 'COMBAT', canvasWidth)).toBe(halfWidth);
    });
  });
});
