import { GameCommand } from '@/shared/domain';
import { KeyLike, InputIntent, normalizeKey } from './normalize';

/**
 * Target consumer interface for normalized game commands.
 */
export interface InputSink {
  push(command: GameCommand): void;
  clear(): void;
}

/**
 * Pluggable input source contract allowing future input adapters (e.g. touch/gamepad).
 */
export interface InputSource {
  attach(sink: InputSink): void;
  detach(): void;
}

/**
 * Configuration options for the KeyboardAdapter.
 */
export interface KeyboardAdapterOptions {
  getState: () => { gameActive: boolean };
  targetWindow?: Window | null;
  onUIIntent?: (action: 'pause-toggle') => void;
  onIntent?: (intent: InputIntent, preventDefault: boolean) => void;
}

/**
 * Checks whether an event target is an interactive or editable text form control.
 * Prevents game typing logic from capturing text entered into settings inputs or textareas.
 */
export function isEditableElement(target: EventTarget | null): boolean {
  if (!target) return false;

  const el = target as Partial<HTMLElement>;
  const tagName = el.tagName ? el.tagName.toLowerCase() : '';

  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true;
  }

  if (el.isContentEditable === true) {
    return true;
  }

  if (typeof el.getAttribute === 'function') {
    const attr = el.getAttribute('contenteditable');
    if (attr !== null && attr !== 'false') {
      return true;
    }
  }

  if (typeof el.closest === 'function') {
    const editableAncestor = el.closest('[contenteditable]:not([contenteditable="false"])');
    if (editableAncestor) {
      return true;
    }
  }

  return false;
}

/**
 * Browser DOM keyboard adapter implementing InputSource.
 * Listens for keydown events on window, performs normalization,
 * prevents browser shortcuts or scrolling where appropriate,
 * and clears the queue on window blur.
 */
export class KeyboardAdapter implements InputSource {
  private sink: InputSink | null = null;
  private attached = false;
  private readonly getState: () => { gameActive: boolean };
  private readonly targetWindow: Window | null;
  private readonly onUIIntent?: (action: 'pause-toggle') => void;
  private readonly onIntent?: (intent: InputIntent, preventDefault: boolean) => void;

  private readonly boundKeyDown: (e: KeyboardEvent) => void;
  private readonly boundBlur: (e: FocusEvent) => void;

  constructor(options: KeyboardAdapterOptions) {
    this.getState = options.getState;
    this.targetWindow =
      options.targetWindow !== undefined
        ? options.targetWindow
        : typeof window !== 'undefined'
          ? window
          : null;
    this.onUIIntent = options.onUIIntent;
    this.onIntent = options.onIntent;

    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundBlur = this.handleBlur.bind(this);
  }

  /**
   * Attaches listeners to window. Re-attaching detaches previous listeners first.
   */
  attach(sink: InputSink): void {
    if (this.attached) {
      this.detach();
    }
    this.sink = sink;
    if (this.targetWindow) {
      this.targetWindow.addEventListener('keydown', this.boundKeyDown);
      this.targetWindow.addEventListener('blur', this.boundBlur);
      this.attached = true;
    }
  }

  /**
   * Detaches exactly what attach() added, resetting sink reference.
   */
  detach(): void {
    if (this.attached && this.targetWindow) {
      this.targetWindow.removeEventListener('keydown', this.boundKeyDown);
      this.targetWindow.removeEventListener('blur', this.boundBlur);
      this.attached = false;
    }
    this.sink = null;
  }

  get isAttached(): boolean {
    return this.attached;
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.attached || !this.sink) return;
    if (isEditableElement(e.target)) return;

    const { gameActive } = this.getState();
    const keyLike: KeyLike = {
      key: e.key,
      ctrlKey: e.ctrlKey,
      metaKey: e.metaKey,
      altKey: e.altKey,
      shiftKey: e.shiftKey,
      repeat: e.repeat,
      isComposing: e.isComposing ?? false,
    };

    const { intent, preventDefault } = normalizeKey(keyLike, { gameActive });

    if (preventDefault && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    this.onIntent?.(intent, preventDefault);

    if (intent.kind === 'command') {
      this.sink.push(intent.command);
    } else if (intent.kind === 'ui') {
      this.onUIIntent?.(intent.action);
    }
  }

  private handleBlur(): void {
    if (this.sink) {
      this.sink.clear();
    }
  }
}

/**
 * Factory creating a KeyboardAdapter instance.
 */
export function createKeyboardAdapter(options: KeyboardAdapterOptions): KeyboardAdapter {
  return new KeyboardAdapter(options);
}
