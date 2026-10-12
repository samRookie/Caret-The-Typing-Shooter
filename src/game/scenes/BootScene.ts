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

    const baseUrl = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '') + '/';

    // Sprites
    this.load.svg('player-ship', `${baseUrl}assets/vfx/player-ship-original.svg`);
    this.load.svg('drone', `${baseUrl}assets/vfx/drone-original.svg`);
    this.load.svg('elite-drone', `${baseUrl}assets/vfx/elite-drone.svg`);
    this.load.svg(
      'projectile-reticle',
      `${baseUrl}assets/vfx/projectile-and-reticle-original.svg`
    );

    // Audio cues
    this.load.audio('ui-click', `${baseUrl}assets/audio/ui-click.ogg`);
    this.load.audio('laser', `${baseUrl}assets/audio/laser.ogg`);
    this.load.audio('hit', `${baseUrl}assets/audio/hit.ogg`);
    this.load.audio('destroy', `${baseUrl}assets/audio/destroy.ogg`);
    this.load.audio('wrong-input', `${baseUrl}assets/audio/wrong-input.ogg`);
    this.load.audio('wave-complete', `${baseUrl}assets/audio/wave-complete.ogg`);
  }

  async create(): Promise<void> {
    if (typeof document !== 'undefined' && 'fonts' in document) {
      try {
        await Promise.all([
          document.fonts.load('600 18px Tektur'),
          document.fonts.load('500 16px Tektur'),
          document.fonts.load('700 48px Tektur'),
          document.fonts.load('600 18px "JMH Typewriter"'),
        ]);
      } catch {
        // Fall back gracefully if font loading throws
      }
    }

    const controller = this.registry.get('controller');
    if (controller && typeof controller.setBootComplete === 'function') {
      controller.setBootComplete();
    }

    const isPreview =
      Boolean(import.meta.env.DEV) &&
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('preview') === '1';

    if (import.meta.env.DEV && isPreview) {
      const { VisualPreviewScene } = await import('./VisualPreviewScene');
      if (!this.scene.get('VisualPreviewScene')) {
        this.scene.add('VisualPreviewScene', VisualPreviewScene, false);
      }
      this.scene.start('VisualPreviewScene');
    } else {
      this.scene.start('GameScene');
    }
  }
}
