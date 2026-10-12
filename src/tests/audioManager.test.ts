import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AudioManager, SoundBackend } from '@/game/rendering/audio/AudioManager';
import { settingsStore } from '@/shared/settings/settingsStore';
import { EFFECT_CONFIG } from '@/shared/config/effectsConfig';

describe('AudioManager', () => {
  let playedList: Array<{ cue: string; volume: number; rate: number }>;
  let stopped: boolean;
  let backend: SoundBackend;
  let mockTime: number;

  beforeEach(() => {
    vi.useFakeTimers();
    mockTime = 1000;
    playedList = [];
    stopped = false;

    backend = {
      play: (cue, config) => {
        playedList.push({ cue, ...config });
      },
      stopAll: () => {
        stopped = true;
      },
      getContextState: () => 'running',
      resumeContext: async () => {},
    };

    settingsStore.resetSettings();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('plays sounds via backend with master gain applied', () => {
    const mgr = new AudioManager({ backend, clock: () => mockTime });
    mgr.play('hit', { volume: 0.6, rate: 1.0 });

    expect(playedList.length).toBe(1);
    expect(playedList[0]!.cue).toBe('hit');
    expect(playedList[0]!.volume).toBeCloseTo(0.6 * EFFECT_CONFIG.MASTER_GAIN, 4);
    expect(playedList[0]!.rate).toBe(1.0);
    mgr.destroy();
  });

  it('clamps volume ceiling to 0.8 before master gain', () => {
    const mgr = new AudioManager({ backend, clock: () => mockTime });
    mgr.play('destroy', { volume: 1.5 });

    expect(playedList.length).toBe(1);
    // 0.8 * 0.85 = 0.68
    expect(playedList[0]!.volume).toBeCloseTo(0.8 * EFFECT_CONFIG.MASTER_GAIN, 4);
    mgr.destroy();
  });

  it('enforces 30ms spacing between laser sounds', () => {
    const mgr = new AudioManager({ backend, clock: () => mockTime });
    
    // First laser at t=1000
    mgr.play('laser');
    expect(playedList.length).toBe(1);

    // Second laser at t=1010 (< 30ms spacing)
    mockTime = 1010;
    mgr.play('laser');
    expect(playedList.length).toBe(1); // Blocked

    // Third laser at t=1035 (>= 30ms spacing)
    mockTime = 1035;
    mgr.play('laser');
    expect(playedList.length).toBe(2); // Allowed
    mgr.destroy();
  });

  it('enforces laser concurrency cap of 3 within active duration window', () => {
    const mgr = new AudioManager({ backend, clock: () => mockTime });
    
    // 1st laser at t=1000
    mgr.play('laser');
    expect(playedList.length).toBe(1);

    // 2nd laser at t=1035
    mockTime = 1035;
    mgr.play('laser');
    expect(playedList.length).toBe(2);

    // 3rd laser at t=1070
    mockTime = 1070;
    mgr.play('laser');
    expect(playedList.length).toBe(3);

    // 4th laser at t=1095 (< 100ms from 1st, cap of 3 reached)
    mockTime = 1095;
    mgr.play('laser');
    expect(playedList.length).toBe(3); // Blocked by concurrency cap

    // Advance timers so active lasers expire
    vi.advanceTimersByTime(150);
    mockTime = 1250;
    mgr.play('laser');
    expect(playedList.length).toBe(4); // Allowed again
    mgr.destroy();
  });

  it('enforces at most two sounds per keypress', () => {
    const mgr = new AudioManager({ backend, clock: () => mockTime });
    mgr.beginKeypress();

    mgr.play('laser', { isKeypress: true });
    mockTime += 35;
    mgr.play('hit', { isKeypress: true });
    mockTime += 35;
    mgr.play('destroy', { isKeypress: true });

    // Only 2 should play
    expect(playedList.length).toBe(2);
    expect(playedList[0]!.cue).toBe('laser');
    expect(playedList[1]!.cue).toBe('hit');

    // Next keypress resets counter
    mgr.beginKeypress();
    mockTime += 35;
    mgr.play('wrong-input', { isKeypress: true });
    expect(playedList.length).toBe(3);
    mgr.destroy();
  });

  it('mutes playback and stops all active sounds when sfxEnabled is false', () => {
    const mgr = new AudioManager({ backend, clock: () => mockTime });
    settingsStore.set({ sfxEnabled: false });

    mgr.play('hit');
    expect(playedList.length).toBe(0);
    expect(stopped).toBe(true);

    // Re-enable
    settingsStore.set({ sfxEnabled: true });
    mgr.play('hit');
    expect(playedList.length).toBe(1);
    mgr.destroy();
  });

  it('mutes playback and stops all active sounds when setMuted or setSfxEnabled is called', () => {
    const mgr = new AudioManager({ backend, clock: () => mockTime });
    mgr.setMuted(true);

    mgr.play('hit');
    expect(playedList.length).toBe(0);
    expect(stopped).toBe(true);

    // Unmute
    mgr.setSfxEnabled(true);
    mgr.play('hit');
    expect(playedList.length).toBe(1);
    mgr.destroy();
  });

  it('scales effective volume by sfxVolume dynamically', () => {
    const mgr = new AudioManager({ backend, clock: () => mockTime });
    mgr.setVolume(0.5);

    mgr.play('hit', { volume: 0.6 });
    expect(playedList.length).toBe(1);
    // 0.6 raw * 0.5 sfxVolume = 0.3 effective
    expect(playedList[0]!.volume).toBeCloseTo(0.3, 4);

    mgr.setVolume(1.0);
    mockTime += 40;
    mgr.play('hit', { volume: 0.6 });
    expect(playedList.length).toBe(2);
    // 0.6 raw * 1.0 sfxVolume = 0.6 effective
    expect(playedList[1]!.volume).toBeCloseTo(0.6, 4);

    mgr.setVolume(0.0);
    mockTime += 40;
    mgr.play('hit', { volume: 0.6 });
    // volume 0 behaves as muted
    expect(playedList.length).toBe(2);

    mgr.destroy();
  });

  it('respects delayMs for scheduled sounds and clears them on stopAll', () => {
    const mgr = new AudioManager({ backend, clock: () => mockTime });
    mgr.play('wave-complete', { delayMs: 150 });

    expect(playedList.length).toBe(0);
    vi.advanceTimersByTime(100);
    expect(playedList.length).toBe(0);

    vi.advanceTimersByTime(50);
    expect(playedList.length).toBe(1);
    expect(playedList[0]!.cue).toBe('wave-complete');

    // Test cancellation on stopAll
    mgr.play('wave-complete', { delayMs: 200 });
    mgr.stopAll();
    vi.advanceTimersByTime(250);
    expect(playedList.length).toBe(1); // No second play
    mgr.destroy();
  });

  it('maintains play log for telemetry up to 50 items', () => {
    const mgr = new AudioManager({ backend, clock: () => mockTime });
    for (let i = 0; i < 60; i++) {
      mockTime += 40;
      mgr.play('hit');
    }

    const log = mgr.getAudioLog();
    expect(log.length).toBe(50);
    mgr.destroy();
  });
});
