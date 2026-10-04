import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from '@/game/config';

interface PhaserContainerProps {
  onGameReady?: (game: Phaser.Game) => void;
}

export const PhaserContainer: React.FC<PhaserContainerProps> = ({ onGameReady }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config = createGameConfig(containerRef.current);
    const game = new Phaser.Game(config);
    gameRef.current = game;
    setIsReady(true);

    if (onGameReady) {
      onGameReady(game);
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [onGameReady]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
      {!isReady && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-0)',
            color: 'var(--accent)',
            fontFamily: 'var(--font-condensed)',
            fontSize: '14px',
            letterSpacing: '0.1em',
          }}
        >
          INITIALIZING TACTICAL SUBSYSTEMS...
        </div>
      )}
    </div>
  );
};
