export interface KeyInputEvent {
  key: string;
  timestamp: number;
}

export type InputHandler = (event: KeyInputEvent) => void;

export interface InputDispatcher {
  subscribe: (handler: InputHandler) => () => void;
  dispatch: (event: KeyInputEvent) => void;
  reset: () => void;
}
