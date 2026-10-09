import Phaser from 'phaser';
import type { GameRuntime, GameController } from '@/game/controller';
import { GameRenderer } from '@/game/rendering/GameRenderer';
import { audioManager } from '@/game/rendering/audio/AudioManager';

/**
 * Main gameplay scene driving frame updates and rendering.
 * Spec 7.D / 8.D:
 * GameScene.update(time, delta) -> controller.frame(delta / 1000) -> renderer.apply(snapshot, events).
 * No setTimeout/setInterval for gameplay.
 * On scene shutdown, remove all listeners and destroy all views.
 */
export class GameScene extends Phaser.Scene {
  private gameRenderer: GameRenderer | null = null;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.gameRenderer = new GameRenderer(this);

    audioManager.setBackend({
      play: (cue, config) => {
        try {
          if (this.sound && this.cache.audio.exists(cue)) {
            this.sound.play(cue, { volume: config.volume, rate: config.rate });
          }
        } catch {
          // ignore playback errors
        }
      },
      stopAll: () => {
        try {
          this.sound?.stopAll();
        } catch {
          // ignore stop errors
        }
      },
      getContextState: () => {
        const soundMgr = this.sound as Phaser.Sound.WebAudioSoundManager;
        return soundMgr?.context?.state ?? 'running';
      },
      resumeContext: async () => {
        const soundMgr = this.sound as Phaser.Sound.WebAudioSoundManager;
        if (soundMgr?.context?.state === 'suspended') {
          await soundMgr.context.resume();
        }
      },
    });

    const controller = this.registry.get('controller') as GameController | undefined | null;
    if (controller) {
      controller.setSceneClearCallback(() => {
        this.gameRenderer?.clear();
      });
    }

    // Register shutdown and destroy lifecycle hooks
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.handleShutdown, this);
  }

  update(_time: number, delta: number): void {
    const controller = this.registry.get('controller') as GameController | undefined | null;
    const runtime = controller?.runtime ?? (this.registry.get('runtime') as GameRuntime | undefined | null);

    if (!this.gameRenderer) {
      return;
    }

    const deltaSeconds = delta / 1000;

    if (controller) {
      const { snapshot, events } = controller.frame(deltaSeconds);
      this.gameRenderer.apply(snapshot, events, deltaSeconds);
    } else if (runtime) {
      const { snapshot, events } = runtime.frame(deltaSeconds);
      this.gameRenderer.apply(snapshot, events, deltaSeconds);
    }
  }

  getGameRenderer(): GameRenderer | null {
    return this.gameRenderer;
  }

  private handleShutdown(): void {
    this.events.off(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
    this.events.off(Phaser.Scenes.Events.DESTROY, this.handleShutdown, this);

    audioManager.stopAll();

    if (this.gameRenderer) {
      this.gameRenderer.destroy();
      this.gameRenderer = null;
    }
  }
}
