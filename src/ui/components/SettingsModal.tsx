import React, { useState, useEffect } from 'react';
import { TacticalFrame } from './TacticalFrame';
import { TacticalButton } from './TacticalButton';
import { useFocusTrap } from '../hooks/useFocusTrap';
import {
  useSettings,
  settingsStore,
  ReducedMotionPreference,
} from '@/shared/settings/settingsStore';
import { historyStore } from '@/shared/history/historyStore';
import { musicAvailable } from '@/shared/audio/capabilities';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatsCleared?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onStatsCleared,
}) => {
  const settings = useSettings();
  const trapRef = useFocusTrap<HTMLDivElement>(isOpen);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleToggleSfx = () => {
    // TODO(step-10): connect to sound engine when audio assets are integrated
    settingsStore.set({ sfxEnabled: !settings.sfxEnabled });
  };

  const handleToggleMusic = () => {
    // TODO(step-10): connect to sound engine when audio assets are integrated
    settingsStore.set({ musicEnabled: !settings.musicEnabled });
  };

  const handleReducedMotionChange = (pref: ReducedMotionPreference) => {
    settingsStore.set({ reducedMotion: pref });
    if (pref === 'on') {
      document.documentElement.setAttribute('data-reduced-motion', 'true');
    } else if (pref === 'off') {
      document.documentElement.removeAttribute('data-reduced-motion');
    } else {
      // system preference
      const isReduce =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (isReduce) {
        document.documentElement.setAttribute('data-reduced-motion', 'true');
      } else {
        document.documentElement.removeAttribute('data-reduced-motion');
      }
    }
  };

  const handleConfirmReset = () => {
    historyStore.clear();
    setShowResetConfirm(false);
    onStatsCleared?.();
  };

  return (
    <div
      className="tactical-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-dialog-title"
      style={{ overflowY: 'auto', padding: '16px 0', zIndex: 100 }}
    >
      <div
        ref={trapRef}
        style={{
          width: '90%',
          maxWidth: '480px',
          margin: 'auto',
        }}
      >
        <TacticalFrame
          title="TACTICAL SETTINGS"
          subtitle="SYSTEM & TELEMETRY CONFIGURATION"
          style={{
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2
              id="settings-dialog-title"
              style={{
                margin: 0,
                fontSize: '14px',
                fontFamily: 'var(--font-condensed)',
                color: 'var(--text-secondary, #8995a1)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Hardware & Accessibility Parameters
            </h2>

            {/* Audio Settings */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '10px 12px',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid var(--border, rgba(255, 184, 74, 0.2))',
                borderRadius: 'var(--radius-sm, 4px)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-condensed)',
                  fontSize: '11px',
                  color: 'var(--accent, #ffb84a)',
                  fontWeight: 'bold',
                  letterSpacing: '0.08em',
                }}
              >
                AUDIO CHANNELS
              </span>

              {/* SFX Toggle */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-condensed)',
                    fontSize: '12px',
                    color: 'var(--text-primary, #f3f7fa)',
                  }}
                >
                  Combat Sound FX
                </span>
                <TacticalButton
                  variant="default"
                  size="sm"
                  onClick={handleToggleSfx}
                  style={{
                    borderColor: settings.sfxEnabled ? 'var(--accent)' : 'var(--border)',
                    color: settings.sfxEnabled
                      ? 'var(--accent-bright)'
                      : 'var(--text-secondary)',
                  }}
                >
                  {settings.sfxEnabled ? 'ENABLED' : 'MUTED'}
                </TacticalButton>
              </div>

              {/* Music Row (strictly hidden when musicAvailable === false per Decision D6) */}
              {musicAvailable && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-condensed)',
                      fontSize: '12px',
                      color: 'var(--text-primary, #f3f7fa)',
                    }}
                  >
                    Background Music
                  </span>
                  <TacticalButton
                    variant="default"
                    size="sm"
                    onClick={handleToggleMusic}
                    style={{
                      borderColor: settings.musicEnabled ? 'var(--accent)' : 'var(--border)',
                      color: settings.musicEnabled
                        ? 'var(--accent-bright)'
                        : 'var(--text-secondary)',
                    }}
                  >
                    {settings.musicEnabled ? 'ENABLED' : 'MUTED'}
                  </TacticalButton>
                </div>
              )}
            </div>

            {/* Reduced Motion Settings */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '10px 12px',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid var(--border, rgba(255, 184, 74, 0.2))',
                borderRadius: 'var(--radius-sm, 4px)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-condensed)',
                    fontSize: '11px',
                    color: 'var(--accent, #ffb84a)',
                    fontWeight: 'bold',
                    letterSpacing: '0.08em',
                  }}
                >
                  REDUCED MOTION
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  CURRENT: {settings.reducedMotion.toUpperCase()}
                </span>
              </div>

              <div
                role="radiogroup"
                aria-label="Reduced Motion Preference"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '6px',
                }}
              >
                {(['system', 'on', 'off'] as const).map((pref) => {
                  const isSelected = settings.reducedMotion === pref;
                  return (
                    <button
                      key={pref}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => handleReducedMotionChange(pref)}
                      style={{
                        padding: '6px 8px',
                        fontFamily: 'var(--font-condensed)',
                        fontSize: '11px',
                        letterSpacing: '0.08em',
                        background: isSelected
                          ? 'rgba(255, 184, 74, 0.2)'
                          : 'transparent',
                        color: isSelected
                          ? 'var(--accent-bright)'
                          : 'var(--text-secondary)',
                        border: isSelected
                          ? '1px solid var(--accent)'
                          : '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm, 3px)',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                      }}
                    >
                      {pref.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Data Management & Statistics Reset */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '10px 12px',
                background: 'rgba(255, 95, 95, 0.05)',
                border: '1px solid rgba(255, 95, 95, 0.25)',
                borderRadius: 'var(--radius-sm, 4px)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-condensed)',
                  fontSize: '11px',
                  color: 'var(--danger, #ff5f5f)',
                  fontWeight: 'bold',
                  letterSpacing: '0.08em',
                }}
              >
                CAREER TELEMETRY STORAGE
              </span>

              {!showResetConfirm ? (
                <TacticalButton
                  variant="default"
                  size="sm"
                  onClick={() => setShowResetConfirm(true)}
                  style={{
                    borderColor: 'rgba(255, 95, 95, 0.4)',
                    color: 'var(--danger, #ff5f5f)',
                  }}
                >
                  RESET CAREER STATISTICS
                </TacticalButton>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    padding: '8px',
                    background: 'rgba(0, 0, 0, 0.5)',
                    borderRadius: 'var(--radius-sm, 3px)',
                    border: '1px solid var(--danger, #ff5f5f)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '10px',
                      color: 'var(--danger, #ff5f5f)',
                      textAlign: 'center',
                    }}
                  >
                    CONFIRM PURGE ALL PILOT RECORDS? [IRREVERSIBLE]
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <TacticalButton
                      variant="default"
                      size="sm"
                      onClick={() => setShowResetConfirm(false)}
                      style={{ flex: 1 }}
                    >
                      CANCEL
                    </TacticalButton>
                    <TacticalButton
                      variant="primary"
                      size="sm"
                      onClick={handleConfirmReset}
                      style={{
                        flex: 1,
                        background: 'var(--danger, #ff5f5f)',
                        borderColor: 'var(--danger, #ff5f5f)',
                      }}
                    >
                      CONFIRM PURGE
                    </TacticalButton>
                  </div>
                </div>
              )}
            </div>

            {/* Close Button */}
            <TacticalButton
              variant="primary"
              size="md"
              onClick={onClose}
              data-autofocus="true"
              style={{ width: '100%', marginTop: '4px' }}
            >
              APPLY & RETURN
            </TacticalButton>
          </div>
        </TacticalFrame>
      </div>
    </div>
  );
};
