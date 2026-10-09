import Phaser from 'phaser';
import { DESKTOP_VIEWPORT, TARGET_DRONE_WIDTH } from '@/shared/config/defaultConfig';
import { PHASER_FONT_FAMILY } from '@/shared/theme';
import { EffectsManager } from '../rendering/effects/EffectsManager';
import { PhaserEffectBackend } from '../rendering/effects/PhaserEffectBackend';
import { ProjectilePool } from '../rendering/views/ProjectilePool';
import { GhostPool } from '../rendering/views/GhostPool';
import { PlayerView } from '../rendering/views/PlayerView';
import { EnemyView } from '../rendering/views/EnemyView';
import { planEffects, EffectContext } from '../rendering/effects/planEffects';
import { DEFAULT_MOTION_POLICY, REDUCED_MOTION_POLICY, MotionPolicy } from '@/shared/motion';
import { GameEvent } from '@/shared/domain';
import { DEPTHS } from '../rendering/depths';

/**
 * VisualPreviewScene (Section 3 Dev Effects Bench)
 * Mounted when `?preview=1` is provided on the dev server.
 * Provides interactive trigger buttons, mock drone label 40px away,
 * motion policy toggle, and live telemetry counters.
 */
export class VisualPreviewScene extends Phaser.Scene {
  private effectsManager!: EffectsManager;
  private projectilePool!: ProjectilePool;
  private ghostPool!: GhostPool;
  private playerView!: PlayerView;
  private mockEnemyView?: EnemyView;

  private currentPolicy: MotionPolicy = DEFAULT_MOTION_POLICY;
  private policyText!: Phaser.GameObjects.Text;
  private countersText!: Phaser.GameObjects.Text;

  private readonly triggerPos = { x: 500, y: 360 };

  constructor() {
    super('VisualPreviewScene');
  }

  create(): void {
    const width = DESKTOP_VIEWPORT.width;
    const height = DESKTOP_VIEWPORT.height;

    // Tactical dark background
    const bg = this.add.graphics().setDepth(DEPTHS.BACKGROUND_GRID);
    bg.fillStyle(0x0a0e14, 1);
    bg.fillRect(0, 0, width, height);

    // Initialize pools and views
    this.projectilePool = new ProjectilePool(this);
    this.ghostPool = new GhostPool(this);
    this.playerView = new PlayerView(this, this.currentPolicy.reduced);

    // Mock Enemy View placed 40px above trigger point
    this.mockEnemyView = new EnemyView(
      this,
      {
        id: 'bench-drone',
        word: 'TARGET',
        remainingWord: 'TARGET',
        position: { x: this.triggerPos.x, y: this.triggerPos.y - 40 },
        health: 6,
        maxHealth: 6,
        speed: 0,
        alive: true,
        spawnTick: 0,
        archetype: 'drone',
      },
      true
    );

    const backend = new PhaserEffectBackend({
      scene: this,
      projectilePool: this.projectilePool,
      ghostPool: this.ghostPool,
      playerView: this.playerView,
      getEnemyView: (id) => (id === 'bench-drone' ? this.mockEnemyView : undefined),
    });

    this.effectsManager = new EffectsManager(backend);

    // Title Header
    this.add
      .text(width / 2, 32, 'CARET DEV EFFECTS BENCH [SPEC SECTION 3 / ?preview=1]', {
        fontFamily: PHASER_FONT_FAMILY,
        fontSize: '16px',
        fontStyle: '700',
        color: '#ffb84a',
      })
      .setOrigin(0.5)
      .setDepth(DEPTHS.LABELS);

    // Policy indicator / toggle button
    this.policyText = this.add
      .text(width / 2, 60, 'MOTION POLICY: FULL [CLICK TO TOGGLE]', {
        fontFamily: PHASER_FONT_FAMILY,
        fontSize: '13px',
        fontStyle: '600',
        color: '#f3f7fa',
        backgroundColor: '#16202c',
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5)
      .setDepth(DEPTHS.LABELS)
      .setInteractive({ useHandCursor: true });

    this.policyText.on('pointerdown', () => {
      this.togglePolicy();
    });

    // Telemetry counters
    this.countersText = this.add
      .text(width - 24, 24, '', {
        fontFamily: PHASER_FONT_FAMILY,
        fontSize: '12px',
        color: '#8995a1',
        align: 'right',
      })
      .setOrigin(1, 0)
      .setDepth(DEPTHS.LABELS);

    // Trigger buttons sidebar
    this.createEffectButtons();
  }

  private togglePolicy(): void {
    if (this.currentPolicy.reduced) {
      this.currentPolicy = DEFAULT_MOTION_POLICY;
      this.policyText.setText('MOTION POLICY: FULL (DEFAULT) [CLICK TO TOGGLE]');
      this.policyText.setColor('#ffb84a');
    } else {
      this.currentPolicy = REDUCED_MOTION_POLICY;
      this.policyText.setText('MOTION POLICY: REDUCED [CLICK TO TOGGLE]');
      this.policyText.setColor('#5bc0de');
    }
  }

  private createEffectButtons(): void {
    const effects: Array<{ label: string; action: () => void }> = [
      {
        label: '1. ENEMY_SPAWNED',
        action: () => {
          this.dispatchSimEvent({
            type: 'ENEMY_SPAWNED',
            enemyId: 'bench-drone',
            position: { ...this.triggerPos },
            tick: 1,
          });
        },
      },
      {
        label: '2. TARGET_LOCKED (Pulse)',
        action: () => {
          this.dispatchSimEvent({
            type: 'TARGET_LOCKED',
            enemyId: 'bench-drone',
            word: 'TARGET',
            position: { ...this.triggerPos },
            tick: 2,
          });
        },
      },
      {
        label: '3. PROJECTILE (Bolt)',
        action: () => {
          this.dispatchSimEvent({
            type: 'PROJECTILE_SPAWNED',
            from: { x: this.playerView.x, y: this.playerView.y },
            to: { ...this.triggerPos },
            targetEnemyId: 'bench-drone',
            tick: 3,
          });
        },
      },
      {
        label: '4. ENEMY_HIT (Sparks)',
        action: () => {
          this.dispatchSimEvent({
            type: 'ENEMY_HIT',
            enemyId: 'bench-drone',
            damage: 1,
            position: { ...this.triggerPos },
            tick: 4,
          });
        },
      },
      {
        label: '5. DESTROY (Word Burst)',
        action: () => {
          this.dispatchSimEvent({
            type: 'ENEMY_DESTROYED',
            enemyId: 'bench-drone',
            position: { ...this.triggerPos },
            cause: 'word',
            tick: 5,
          });
        },
      },
      {
        label: '6. DESTROY (Collision)',
        action: () => {
          this.dispatchSimEvent({
            type: 'ENEMY_DESTROYED',
            enemyId: 'bench-drone',
            position: { ...this.triggerPos },
            cause: 'collision',
            tick: 6,
          });
        },
      },
      {
        label: '7. PLAYER_DAMAGED',
        action: () => {
          this.dispatchSimEvent({
            type: 'PLAYER_DAMAGED',
            damage: 1,
            currentHealth: 2,
            tick: 7,
          });
        },
      },
      {
        label: '8. LAST_LIFE DAMAGED',
        action: () => {
          this.dispatchSimEvent({
            type: 'PLAYER_DAMAGED',
            damage: 1,
            currentHealth: 1,
            tick: 8,
          });
        },
      },
      {
        label: '9. GAME_OVER',
        action: () => {
          this.dispatchSimEvent({
            type: 'GAME_OVER',
            result: {
              outcome: 'defeat',
              finalWave: 1,
              wordsCompleted: 0,
              score: 0,
              rating: 'D',
              accuracy: 100,
              wpm: 0,
              durationSeconds: 10,
              hits: 0,
              misses: 0,
            },
            tick: 9,
          });
        },
      },
      {
        label: 'CLEAR ALL',
        action: () => {
          this.effectsManager.clear();
          this.playerView.reset();
        },
      },
    ];

    let startY = 110;
    for (const eff of effects) {
      const btn = this.add
        .text(32, startY, eff.label, {
          fontFamily: PHASER_FONT_FAMILY,
          fontSize: '12px',
          fontStyle: '600',
          color: '#f3f7fa',
          backgroundColor: '#1b232e',
          padding: { x: 10, y: 6 },
        })
        .setDepth(DEPTHS.LABELS)
        .setInteractive({ useHandCursor: true });

      btn.on('pointerdown', eff.action);
      startY += 36;
    }
  }

  private dispatchSimEvent(event: GameEvent): void {
    const ctx: EffectContext = {
      wd: TARGET_DRONE_WIDTH,
      ws: 60,
      healthAfter: event.type === 'PLAYER_DAMAGED' ? event.currentHealth : undefined,
      isNewRecord: true,
      panelDelayMs: this.currentPolicy.reduced ? 300 : 900,
      shipPosition: { x: this.playerView.x, y: this.playerView.y },
    };

    const commands = planEffects(event, ctx, this.currentPolicy);
    const priority =
      event.type === 'PLAYER_DAMAGED' || event.type === 'GAME_OVER' ? 'high' : 'normal';
    this.effectsManager.execute(commands, priority);
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;
    this.projectilePool.update(dt);
    this.playerView.update(dt);

    const counts = this.effectsManager.getCounts();
    const fps = Math.round(this.game.loop.actualFps);

    this.countersText.setText(
      `FPS: ${fps}\n` +
        `PARTICLES: ${counts.liveParticles}\n` +
        `BOLTS: ${counts.liveBolts}\n` +
        `RINGS: ${counts.liveRings}\n` +
        `GHOSTS: ${counts.ghosts}\n` +
        `SHAKE: ${counts.shakeCount}\n` +
        `EDGE FLASH: ${counts.edgeFlashCount}\n` +
        `SCENE NODES: ${counts.displayObjects}`
    );
  }
}
