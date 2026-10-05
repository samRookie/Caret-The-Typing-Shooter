import { DESKTOP_VIEWPORT, RENDERER_CONFIG } from '@/shared/config/defaultConfig';

export type LetterState = 'typed' | 'next' | 'remaining';

export interface LayoutLetter {
  readonly char: string;
  readonly x: number;
  readonly state: LetterState;
}

/**
 * Computes plate width from word length, character advance, and padding.
 * plateWidth = word.length * advance + padding
 */
export function computePlateWidth(
  wordLength: number,
  advance: number = RENDERER_CONFIG.labelCharWidthPx,
  padding: number = RENDERER_CONFIG.labelPaddingPx
): number {
  return wordLength * advance + padding;
}

/**
 * Clamps the container x coordinate so the plate never overflows the canvas horizontally.
 */
export function clampContainerX(
  containerX: number,
  plateWidthOrWord: number | string,
  canvasWidth: number = DESKTOP_VIEWPORT.width,
  advance: number = RENDERER_CONFIG.labelCharWidthPx,
  padding: number = RENDERER_CONFIG.labelPaddingPx
): number {
  const plateWidth =
    typeof plateWidthOrWord === 'number'
      ? plateWidthOrWord
      : computePlateWidth(plateWidthOrWord.length, advance, padding);

  if (plateWidth >= canvasWidth) {
    return canvasWidth / 2;
  }

  const halfWidth = plateWidth / 2;
  return Math.max(halfWidth, Math.min(canvasWidth - halfWidth, containerX));
}

/**
 * Pure label layout helper.
 * Returns array of { char, x, state } using labelCharWidthPx as advance, centered on the plate.
 */
export function layoutLabel(
  word: string,
  remainingWord: string,
  advance: number = RENDERER_CONFIG.labelCharWidthPx
): LayoutLetter[] {
  const len = word.length;
  if (len === 0) {
    return [];
  }

  const typedCount = Math.max(0, len - remainingWord.length);
  const result: LayoutLetter[] = [];

  // Center characters around x = 0:
  // For len characters, the offset of character i from center is:
  // -((len - 1) * advance) / 2 + i * advance
  const startX = -((len - 1) * advance) / 2;

  for (let i = 0; i < len; i++) {
    const char = word[i] ?? '';
    let state: LetterState;

    if (i < typedCount) {
      state = 'typed';
    } else if (i === typedCount && remainingWord.length > 0) {
      state = 'next';
    } else {
      state = 'remaining';
    }

    result.push({
      char,
      x: startX + i * advance,
      state,
    });
  }

  return result;
}
