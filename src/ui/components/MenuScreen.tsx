import React, { useEffect, useRef } from 'react';
import { TacticalFrame } from './TacticalFrame';
import { TacticalButton } from './TacticalButton';
import { ClockBadge } from './ClockBadge';
import { GAME_TITLE, GAME_SUBTITLE, HOW_TO_PLAY_TEXT } from '@/shared/config/branding';

export interface MenuScreenProps {
  onPlay: () => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({
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

  return (
    <div
      className="tactical-modal-backdrop"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
        <ClockBadge />
      </div>
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
