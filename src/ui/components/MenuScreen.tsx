import React, { useEffect, useRef } from 'react';
import { TacticalFrame } from './TacticalFrame';
import { TacticalButton } from './TacticalButton';
import { DifficultyPresetId } from '@/shared/domain';
import { DIFFICULTY_PRESETS } from '@/shared/config/defaultConfig';
import { GAME_TITLE, GAME_SUBTITLE, HOW_TO_PLAY_TEXT } from '@/shared/config/branding';

export interface MenuScreenProps {
  difficulty: DifficultyPresetId;
  onSelectDifficulty: (difficulty: DifficultyPresetId) => void;
  onPlay: () => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({
  difficulty,
  onSelectDifficulty,
  onPlay,
}) => {
  const playButtonRef = useRef<HTMLButtonElement | null>(null);

  // Auto-focus play button on mount so Enter activates it immediately
  useEffect(() => {
    playButtonRef.current?.focus();
  }, []);

  // Global Enter key listener while menu is mounted
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onPlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPlay]);

  const presetIds: DifficultyPresetId[] = ['relaxed', 'normal', 'intense'];

  return (
    <div
      className="tactical-modal-backdrop"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <TacticalFrame
        title="COMMAND HEADQUARTERS"
        subtitle="MISSION DISPATCH READY"
        style={{
          width: '90%',
          maxWidth: '540px',
          padding: '28px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Header & Branding */}
          <div style={{ textAlign: 'center' }}>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '24px',
                color: 'var(--accent-bright)',
                letterSpacing: '0.14em',
                marginBottom: '6px',
                textShadow: 'var(--glow-accent)',
              }}
            >
              {GAME_TITLE}
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-condensed)',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                letterSpacing: '0.08em',
              }}
            >
              {GAME_SUBTITLE}
            </p>
          </div>

          {/* Difficulty Preset Selector */}
          <fieldset
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 16px',
              margin: 0,
            }}
          >
            <legend
              style={{
                fontFamily: 'var(--font-condensed)',
                fontSize: '11px',
                color: 'var(--accent)',
                letterSpacing: '0.1em',
                padding: '0 6px',
              }}
            >
              SELECT THREAT INTENSITY
            </legend>

            <div
              role="radiogroup"
              aria-label="Threat Intensity"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginTop: '4px',
              }}
            >
              {presetIds.map((id) => {
                const preset = DIFFICULTY_PRESETS[id];
                const isSelected = difficulty === id;

                return (
                  <label
                    key={id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'var(--accent-glow)' : 'transparent',
                      border: isSelected
                        ? '1px solid var(--accent)'
                        : '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="radio"
                      name="difficulty"
                      value={id}
                      checked={isSelected}
                      onChange={() => onSelectDifficulty(id)}
                      style={{
                        accentColor: 'var(--accent)',
                        cursor: 'pointer',
                      }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-condensed)',
                          fontSize: '13px',
                          color: isSelected ? 'var(--accent-bright)' : 'var(--text-primary)',
                          fontWeight: isSelected ? 'bold' : 'normal',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {preset.name}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-condensed)',
                          fontSize: '11px',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        Speed {preset.enemySpeed} px/s &bull; Max {preset.maxConcurrentEnemies} Drones &bull; Words {preset.wordLengthRange.min}-{preset.wordLengthRange.max} chars
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Action Button */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <TacticalButton
              ref={playButtonRef}
              variant="primary"
              size="lg"
              onClick={onPlay}
              data-autofocus="true"
              style={{ width: '100%' }}
            >
              INITIATE ENGAGEMENT [ENTER]
            </TacticalButton>
          </div>

          {/* How to Play Section */}
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              textAlign: 'center',
            }}
          >
            <span
              style={{
                display: 'block',
                fontFamily: 'var(--font-condensed)',
                fontSize: '11px',
                color: 'var(--accent)',
                letterSpacing: '0.08em',
                marginBottom: '4px',
                fontWeight: 'bold',
              }}
            >
              TACTICAL DIRECTIVE:
            </span>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-condensed)',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                lineHeight: 1.45,
                letterSpacing: '0.03em',
              }}
            >
              {HOW_TO_PLAY_TEXT}
            </p>
          </div>
        </div>
      </TacticalFrame>
    </div>
  );
};
