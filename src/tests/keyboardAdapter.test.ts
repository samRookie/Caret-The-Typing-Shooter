import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  KeyboardAdapter,
  isEditableElement,
  createKeyboardAdapter,
} from '@/game/input/keyboardAdapter';
import { InputQueue } from '@/game/input/inputQueue';

describe('KeyboardAdapter (6.C)', () => {
  let queue: InputQueue;
  let gameActiveState: { gameActive: boolean };

  beforeEach(() => {
    queue = new InputQueue();
    gameActiveState = { gameActive: true };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isEditableElement helper', () => {
    it('returns false for null or undefined', () => {
      expect(isEditableElement(null)).toBe(false);
      expect(isEditableElement(undefined as unknown as EventTarget)).toBe(false);
    });

    it('returns true for HTML input, textarea, and select elements', () => {
      const input = document.createElement('input');
      const textarea = document.createElement('textarea');
      const select = document.createElement('select');
      const div = document.createElement('div');

      expect(isEditableElement(input)).toBe(true);
      expect(isEditableElement(textarea)).toBe(true);
      expect(isEditableElement(select)).toBe(true);
      expect(isEditableElement(div)).toBe(false);
    });

    it('returns true for contenteditable elements and nested children', () => {
      const parent = document.createElement('div');
      parent.setAttribute('contenteditable', 'true');
      const child = document.createElement('span');
      parent.appendChild(child);
      document.body.appendChild(parent);

      expect(isEditableElement(parent)).toBe(true);
      expect(isEditableElement(child)).toBe(true);

      document.body.removeChild(parent);
    });
  });

  describe('Listener add/remove symmetry & detachment', () => {
    it('attaches and detaches listeners symmetrically with zero remaining listeners', () => {
      const addSpy = vi.spyOn(window, 'addEventListener');
      const removeSpy = vi.spyOn(window, 'removeEventListener');

      const adapter = createKeyboardAdapter({
        getState: () => gameActiveState,
      });

      expect(adapter.isAttached).toBe(false);

      adapter.attach(queue);
      expect(adapter.isAttached).toBe(true);

      // Verify exact listeners added: 'keydown' and 'blur'
      const addedKeydown = addSpy.mock.calls.filter(([evt]) => evt === 'keydown');
      const addedBlur = addSpy.mock.calls.filter(([evt]) => evt === 'blur');
      expect(addedKeydown.length).toBe(1);
      expect(addedBlur.length).toBe(1);

      const keydownHandler = addedKeydown[0]![1];
      const blurHandler = addedBlur[0]![1];

      adapter.detach();
      expect(adapter.isAttached).toBe(false);

      // Verify exact listeners removed: same event names and identical handler references
      const removedKeydown = removeSpy.mock.calls.filter(([evt]) => evt === 'keydown');
      const removedBlur = removeSpy.mock.calls.filter(([evt]) => evt === 'blur');
      expect(removedKeydown.length).toBe(1);
      expect(removedBlur.length).toBe(1);

      expect(removedKeydown[0]![1]).toBe(keydownHandler);
      expect(removedBlur[0]![1]).toBe(blurHandler);

      // Net active listeners added by adapter is zero
      expect(addSpy.mock.calls.length).toBe(removeSpy.mock.calls.length);
    });

    it('handles multiple calls to attach by detaching previous listeners first', () => {
      const addSpy = vi.spyOn(window, 'addEventListener');
      const removeSpy = vi.spyOn(window, 'removeEventListener');

      const adapter = new KeyboardAdapter({
        getState: () => gameActiveState,
      });

      adapter.attach(queue);
      adapter.attach(queue); // Re-attach

      // Previous listeners detached, then re-added
      expect(removeSpy.mock.calls.length).toBe(2);
      expect(addSpy.mock.calls.length).toBe(4);

      adapter.detach();
      expect(removeSpy.mock.calls.length).toBe(4);
      expect(adapter.isAttached).toBe(false);
    });
  });

  describe('Editable element focus ignored (JSDOM)', () => {
    it('ignores keydown events originating from input, textarea, and contenteditable elements', () => {
      const adapter = new KeyboardAdapter({
        getState: () => gameActiveState,
      });
      adapter.attach(queue);

      const input = document.createElement('input');
      document.body.appendChild(input);

      const inputEvent = new KeyboardEvent('keydown', {
        key: 'a',
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(inputEvent, 'target', { value: input, enumerable: true });

      window.dispatchEvent(inputEvent);
      expect(queue.size).toBe(0);

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      const textareaEvent = new KeyboardEvent('keydown', {
        key: 'b',
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(textareaEvent, 'target', { value: textarea, enumerable: true });

      window.dispatchEvent(textareaEvent);
      expect(queue.size).toBe(0);

      adapter.detach();
      document.body.removeChild(input);
      document.body.removeChild(textarea);
    });
  });

  describe('Window blur clears queue', () => {
    it('clears all queued commands when window blur event fires', () => {
      const adapter = new KeyboardAdapter({
        getState: () => gameActiveState,
      });
      adapter.attach(queue);

      queue.push({ type: 'char', char: 'x' });
      queue.push({ type: 'char', char: 'y' });
      expect(queue.size).toBe(2);

      const blurEvent = new FocusEvent('blur');
      window.dispatchEvent(blurEvent);

      expect(queue.size).toBe(0);
      expect(queue.isEmpty).toBe(true);

      adapter.detach();
    });
  });

  describe('Normal key processing & UI intents', () => {
    it('normalizes letter keydown and pushes command to queue when gameActive: true', () => {
      const adapter = new KeyboardAdapter({
        getState: () => gameActiveState,
      });
      adapter.attach(queue);

      const event = new KeyboardEvent('keydown', {
        key: 'g',
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(event);

      expect(queue.size).toBe(1);
      const drained = queue.drain();
      expect(drained).toEqual([{ type: 'char', char: 'g' }]);

      adapter.detach();
    });

    it('prevents default and enqueues release-target for Tab keydown while gameActive: true', () => {
      const adapter = new KeyboardAdapter({
        getState: () => gameActiveState,
      });
      adapter.attach(queue);

      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });
      const preventSpy = vi.spyOn(event, 'preventDefault');

      window.dispatchEvent(event);

      expect(preventSpy).toHaveBeenCalled();
      expect(queue.drain()).toEqual([{ type: 'release-target' }]);

      adapter.detach();
    });

    it('triggers onUIIntent pause-toggle when Escape is pressed', () => {
      const onUIIntent = vi.fn();
      const adapterWithOptions = new KeyboardAdapter({
        getState: () => gameActiveState,
        onUIIntent,
      });
      adapterWithOptions.attach(queue);

      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(event);

      expect(onUIIntent).toHaveBeenCalledWith('pause-toggle');
      expect(queue.size).toBe(0);

      adapterWithOptions.detach();
    });

    it('suppresses command enqueueing when gameActive is false', () => {
      gameActiveState.gameActive = false;
      const adapter = new KeyboardAdapter({
        getState: () => gameActiveState,
      });
      adapter.attach(queue);

      const eventA = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });
      const eventTab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });

      window.dispatchEvent(eventA);
      window.dispatchEvent(eventTab);

      expect(queue.size).toBe(0);

      adapter.detach();
    });
  });
});
