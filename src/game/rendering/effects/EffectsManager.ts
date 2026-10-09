import { EffectBackend, EffectCounts } from './EffectBackend';
import { EffectCommand } from './planEffects';
import { EFFECT_CONFIG } from '@/shared/config/effectsConfig';

export class EffectsManager {
  constructor(private readonly backend: EffectBackend) {}

  /**
   * Executes a list of planned effect commands against the backend,
   * enforcing entity caps and priority eviction rules.
   */
  execute(commands: readonly EffectCommand[], priority: 'normal' | 'high' = 'normal'): void {
    for (const cmd of commands) {
      this.executeCommand(cmd, priority);
    }
  }

  private executeCommand(cmd: EffectCommand, priority: 'normal' | 'high'): void {
    const counts = this.backend.getCounts();

    switch (cmd.type) {
      case 'ring': {
        if (counts.liveRings < EFFECT_CONFIG.MAX_LIVE_RINGS) {
          this.backend.spawnRing(cmd.at, cmd.fromRadius, cmd.toRadius, cmd.ms);
        }
        break;
      }

      case 'burst': {
        const canFit = counts.liveParticles + cmd.count <= EFFECT_CONFIG.MAX_LIVE_PARTICLES;
        if (canFit || priority === 'high') {
          this.backend.spawnBurst(cmd.at, cmd.count, cmd.speed, cmd.lifeMs, priority);
        }
        break;
      }

      case 'spriteFlash': {
        this.backend.flashSprite(cmd.target, cmd.id, cmd.ms);
        break;
      }

      case 'labelPulse': {
        this.backend.pulseLabel(cmd.id, cmd.ms);
        break;
      }

      case 'bolt': {
        if (counts.liveBolts < EFFECT_CONFIG.MAX_LIVE_BOLTS) {
          this.backend.spawnBolt(cmd.from, cmd.to, cmd.travelMs, cmd.trailSegments);
        }
        break;
      }

      case 'tint': {
        if (cmd.target === 'ship') {
          this.backend.tintShip(cmd.color, cmd.ms);
        }
        break;
      }

      case 'edgeFlash': {
        this.backend.flashEdge(cmd.alpha, cmd.ms);
        break;
      }

      case 'shake': {
        this.backend.shakeCamera(cmd.px, cmd.ms);
        break;
      }

      default:
        // Sounds and hudSignals are routed by other subsystems
        break;
    }
  }

  spawnGhost(x: number, y: number): void {
    this.backend.spawnGhost(x, y);
  }

  getCounts(): EffectCounts {
    return this.backend.getCounts();
  }

  clear(): void {
    this.backend.clear();
  }

  destroy(): void {
    this.backend.destroy();
  }
}
