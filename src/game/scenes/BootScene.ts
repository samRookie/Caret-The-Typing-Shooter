import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    this.load.on('progress', (value: number) => {
      const controller = this.registry.get('controller');
      if (controller && typeof controller.setLoadingProgress === 'function') {
        controller.setLoadingProgress(value * 100);
      }
    });

    // Sprites
    this.load.svg('player-ship', '/assets/vfx/player-ship-original.svg');
    this.load.svg('drone', '/assets/vfx/drone-original.svg');
    this.load.svg(
      'projectile-reticle',
      '/assets/vfx/projectile-and-reticle-original.svg'
    );

    // Audio cues
    this.load.audio('ui-click', '/assets/audio/ui-click.ogg');
    this.load.audio('laser', '/assets/audio/laser.ogg');
    this.load.audio('hit', '/assets/audio/hit.ogg');
    this.load.audio('destroy', '/assets/audio/destroy.ogg');
    this.load.audio('wrong-input', '/assets/audio/wrong-input.ogg');
    this.load.audio('wave-complete', '/assets/audio/wave-complete.ogg');
  }

  create(): void {
    const controller = this.registry.get('controller');
    if (controller && typeof controller.setBootComplete === 'function') {
      controller.setBootComplete();
    }

    const isPreview =
      Boolean(import.meta.env.DEV) &&
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('preview') === '1';

    this.scene.start(isPreview ? 'VisualPreviewScene' : 'GameScene');
  }
}
