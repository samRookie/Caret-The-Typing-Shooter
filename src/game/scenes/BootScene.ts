import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
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

    // UI elements
    this.load.image('icon-play', '/assets/ui/icon-play-outline.png');
    this.load.image('icon-repeat', '/assets/ui/icon-repeat-outline.png');
    this.load.image('input-rect', '/assets/ui/input-outline-rectangle.png');
    this.load.image('button-rect', '/assets/ui/button-rectangle-line.png');
  }

  create(): void {
    this.scene.start('GameScene');
  }
}
