export * from './domain';

// UI Telemetry and Audio Contracts
export interface TelemetryData {
  score: number;
  wave: number;
  streak: number;
  multiplier: number;
  accuracy: number;
  activeTarget: string | null;
  activeTargetTypedIndex?: number;
}

export interface AudioSettings {
  masterMuted: boolean;
  sfxVolume: number;
  musicVolume: number;
}
