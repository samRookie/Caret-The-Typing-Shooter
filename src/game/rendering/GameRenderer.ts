import Phaser from 'phaser';
import { GameEvent, GameSnapshot } from '@/shared/domain';
import {
  SHOW_LOCK_RETICLE,
  TARGET_DRONE_WIDTH,
  TARGET_SHIP_SIZE,
} from '@/shared/config/defaultConfig';
import { reconcile } from './reconcile';
import { BackgroundView } from './views/BackgroundView';
import { PlayerView } from './views/PlayerView';
import { EnemyView } from './views/EnemyView';
import { GhostPool } from './views/GhostPool';
import { ProjectilePool } from './views/ProjectilePool';
import { ReticleView } from './views/ReticleView';
import { EffectsManager } from './effects/EffectsManager';
import { PhaserEffectBackend } from './effects/PhaserEffectBackend';
import { EffectCounts } from './effects/EffectBackend';
import { planEffects, EffectContext } from './effects/planEffects';
import { getMotionPolicy } from '@/shared/motion';
import { audioManager } from './audio/AudioManager';

export class GameRenderer {
  private readonly scene: Phaser.Scene;
  private readonly background: BackgroundView;
  private readonly player: PlayerView;
  private readonly enemies: Map<string, EnemyView> = new Map();
  private readonly ghosts: GhostPool;
  private readonly projectiles: ProjectilePool;
  private readonly reticle: ReticleView | null;
  private readonly backend: PhaserEffectBackend;
  private readonly effectsManager: EffectsManager;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const policy = getMotionPolicy();
    this.background = new BackgroundView(scene);
    this.player = new PlayerView(scene, policy.reduced);
    this.ghosts = new GhostPool(scene);
    this.projectiles = new ProjectilePool(scene);
    this.reticle = SHOW_LOCK_RETICLE ? new ReticleView(scene) : null;

    this.backend = new PhaserEffectBackend({
      scene,
      projectilePool: this.projectiles,
      ghostPool: this.ghosts,
      playerView: this.player,
      getEnemyView: (id) => this.enemies.get(id),
    });
    this.effectsManager = new EffectsManager(this.backend);
  }

  /**
   * Applies the latest simulation snapshot and drained events to all visual views.
   */
  apply(snapshot: GameSnapshot, events: GameEvent[], deltaSeconds: number): void {
    // 1. Advance continuous background starfield and player animation
    this.background.update(deltaSeconds);
    let targetPos: { x: number; y: number } | null = null;
    if (snapshot.activeTargetId) {
      const activeEnemy = snapshot.enemies.find((e) => e.id === snapshot.activeTargetId);
      if (activeEnemy) {
        targetPos = activeEnemy.position;
      }
    }
    this.player.update(deltaSeconds, snapshot.player, targetPos);
    this.projectiles.update(deltaSeconds);

    // 2. Reconcile enemy entity views against snapshot
    const { created, kept, removed } = reconcile(this.enemies.keys(), snapshot);

    // Destroy views for enemies that left the snapshot
    for (const id of removed) {
      const view = this.enemies.get(id);
      view?.destroy();
      this.enemies.delete(id);
    }

    // Spawn views for newly spawned enemies
    for (const id of created) {
      const enemyState = snapshot.enemies.find((e) => e.id === id);
      if (enemyState) {
        const isTargeted = snapshot.activeTargetId === id;
        const view = new EnemyView(this.scene, enemyState, isTargeted);
        view.fadeIn(200);
        this.enemies.set(id, view);
      }
    }

    // Update positions and states for kept enemies
    for (const id of kept) {
      const enemyState = snapshot.enemies.find((e) => e.id === id);
      const view = this.enemies.get(id);
      if (enemyState && view) {
        const isTargeted = snapshot.activeTargetId === id;
        view.update(enemyState, isTargeted);
      }
    }

    // 3. Process discrete simulation events through Pure Effect Planner & EffectsManager
    const motionPolicy = getMotionPolicy();
    const ctx: EffectContext = {
      wd: TARGET_DRONE_WIDTH,
      ws: TARGET_SHIP_SIZE.width,
      shipPosition: { x: this.player.x, y: this.player.y },
    };

    const isNoVfx =
      Boolean(import.meta.env.DEV) &&
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('novfx') === '1';

    for (const event of events) {
      const commands = planEffects(event, ctx, motionPolicy);
      const priority =
        event.type === 'PLAYER_DAMAGED' || event.type === 'GAME_OVER' ? 'high' : 'normal';
      if (!isNoVfx) {
        this.effectsManager.execute(commands, priority);
      }

      // Route sound commands to audioManager
      const isKeypress = event.type === 'INPUT_MATCH' || event.type === 'INPUT_MISMATCH';
      if (isKeypress) {
        audioManager.beginKeypress();
      }
      for (const cmd of commands) {
        if (cmd.type === 'sound') {
          audioManager.play(cmd.cue, {
            volume: cmd.volume,
            rate: cmd.rate,
            delayMs: cmd.delayMs,
            isKeypress,
            simStatus: snapshot.status,
          });
        }
      }

      if (event.type === 'ENEMY_DESTROYED') {
        this.ghosts.spawn(event.position.x, event.position.y);
      } else if (event.type === 'TARGET_LOST') {
        this.reticle?.hide();
      } else if (event.type === 'GAME_OVER') {
        this.player.setVisible(false);
      }
    }

    // 4. Update Reticle state & position (gated by SHOW_LOCK_RETICLE)
    if (this.reticle) {
      if (snapshot.activeTargetId) {
        const targetView = this.enemies.get(snapshot.activeTargetId);
        if (targetView) {
          this.reticle.show(targetView.x, targetView.y);
        } else {
          this.reticle.hide();
        }
      } else {
        this.reticle.hide();
      }
    }
  }

  get activeEnemiesCount(): number {
    return this.enemies.size;
  }

  get activeGhostsCount(): number {
    return this.ghosts.count;
  }

  get activeProjectilesCount(): number {
    return this.projectiles.activeCount;
  }

  getEffectCounts(): EffectCounts {
    return this.effectsManager.getCounts();
  }

  getViewMetrics() {
    const drones: Array<{
      id: string;
      displayWidth: number;
      displayHeight: number;
      labelPlateTop: number;
      labelPlateBottom: number;
      spriteTop: number;
      headroom: number;
    }> = [];

    let labelPlateHeadroomMin = Infinity;

    for (const [id, enemyView] of this.enemies.entries()) {
      const metric = {
        id,
        displayWidth: enemyView.displayWidth,
        displayHeight: enemyView.displayHeight,
        labelPlateTop: enemyView.labelPlateTop,
        labelPlateBottom: enemyView.labelPlateBottom,
        spriteTop: enemyView.spriteTop,
        headroom: enemyView.headroom,
      };
      drones.push(metric);
      if (enemyView.headroom < labelPlateHeadroomMin) {
        labelPlateHeadroomMin = enemyView.headroom;
      }
    }

    if (drones.length === 0) {
      labelPlateHeadroomMin = 7;
    }

    return {
      playerShip: {
        displayWidth: this.player.displayWidth,
        displayHeight: this.player.displayHeight,
      },
      drones,
      labelPlateHeadroomMin,
    };
  }

  clear(): void {
    for (const view of this.enemies.values()) {
      view.destroy();
    }
    this.enemies.clear();
    this.ghosts.clear();
    this.projectiles.clear();
    this.reticle?.hide();
    this.player.reset();
    this.player.setVisible(true);
    this.effectsManager.clear();
  }

  destroy(): void {
    this.effectsManager.destroy();
    this.background.destroy();
    this.player.destroy();
    for (const view of this.enemies.values()) {
      view.destroy();
    }
    this.enemies.clear();
    this.ghosts.destroy();
    this.projectiles.destroy();
    this.reticle?.destroy();
  }
}
