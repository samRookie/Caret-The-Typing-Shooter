/**
 * Central Asset Key Registry
 */
export const ASSET_KEYS = {
  sprites: {
    player: 'player-ship',
    drone: 'drone',
    projectileReticle: 'projectile-reticle',
  },
  audio: {
    uiClick: 'ui-click',
    laser: 'laser',
    hit: 'hit',
    destroy: 'destroy',
    wrongInput: 'wrong-input',
    waveComplete: 'wave-complete',
  },
  ui: {
    iconPlay: 'icon-play',
    iconRepeat: 'icon-repeat',
    inputRect: 'input-rect',
    buttonRect: 'button-rect',
  },
} as const;
