import Phaser from 'phaser';
import { GameEvent, GameSnapshot } from '@/shared/domain';
import { reconcile } from './reconcile';
import { BackgroundView } from './views/BackgroundView';
import { PlayerView } from './views/PlayerView';
import { EnemyView } from './views/EnemyView';
import { GhostPool } from './views/GhostPool';
import { ProjectilePool } from './views/ProjectilePool';
import { ReticleView } from './views/ReticleView';

export class GameRenderer {
  private readonly scene: Phaser.Scene;
  private readonly background: BackgroundView;
  private readonly player: PlayerView;
  private readonly enemies: Map<string, EnemyView> = new Map();
  private readonly ghosts: GhostPool;
  private readonly projectiles: ProjectilePool;
  private readonly reticle: ReticleView;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.background = new BackgroundView(scene);
    this.player = new PlayerView(scene);
    this.ghosts = new GhostPool(scene);
    this.projectiles = new ProjectilePool(scene);
    this.reticle = new ReticleView(scene);
  }

  /**
   * Applies the latest simulation snapshot and drained events to all visual views.
   */
  apply(snapshot: GameSnapshot, events: GameEvent[], deltaSeconds: number): void {
    // 1. Advance continuous background starfield and player animation
    this.background.update(deltaSeconds);
    this.player.update(deltaSeconds, snapshot.player);
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

    // 3. Process discrete simulation events
    for (const event of events) {
      switch (event.type) {
        case 'PROJECTILE_SPAWNED':
          this.projectiles.spawn(event.from, event.to);
          break;
        case 'ENEMY_DESTROYED':
          this.ghosts.spawn(event.position.x, event.position.y);
          break;
        case 'PLAYER_DAMAGED':
          this.player.triggerDamageTint();
          break;
        case 'TARGET_LOCKED':
          // Handled below via activeTargetId
          break;
        case 'TARGET_LOST':
          this.reticle.hide();
          break;
      }
    }

    // 4. Update Reticle state & position
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

  get activeEnemiesCount(): number {
    return this.enemies.size;
  }

  get activeGhostsCount(): number {
    return this.ghosts.count;
  }

  get activeProjectilesCount(): number {
    return this.projectiles.activeCount;
  }

  clear(): void {
    for (const view of this.enemies.values()) {
      view.destroy();
    }
    this.enemies.clear();
    this.ghosts.clear();
    this.projectiles.clear();
    this.reticle.hide();
    this.player.reset();
  }

  destroy(): void {
    this.background.destroy();
    this.player.destroy();
    for (const view of this.enemies.values()) {
      view.destroy();
    }
    this.enemies.clear();
    this.ghosts.destroy();
    this.projectiles.destroy();
    this.reticle.destroy();
  }
}
