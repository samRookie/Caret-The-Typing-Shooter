import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { DESKTOP_VIEWPORT } from '@/shared/config/defaultConfig';

export function createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: DESKTOP_VIEWPORT.width, // 1280
    height: DESKTOP_VIEWPORT.height, // 720
    transparent: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, GameScene],
    render: {
      pixelArt: false,
      antialias: true,
      roundPixels: true,
    },
    audio: {
      noAudio: false,
    },
  };
}
