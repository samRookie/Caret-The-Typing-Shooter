import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from '@/game/config';
import type { GameRuntime } from '@/game/controller';

interface PhaserContainerProps {
  onGameReady?: (game: Phaser.Game) => void;
  runtime?: GameRuntime | null;
}

export const PhaserContainer: React.FC<PhaserContainerProps> = ({ onGameReady, runtime }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const onGameReadyRef = useRef(onGameReady);
  const runtimeRef = useRef(runtime);
  const [isReady, setIsReady] = useState(false);

  // Keep latest onGameReady in ref without re-triggering the instantiation effect
  useEffect(() => {
    onGameReadyRef.current = onGameReady;
  }, [onGameReady]);

  // Synchronize runtime instance to Phaser registry
  useEffect(() => {
    runtimeRef.current = runtime;
    if (gameRef.current?.registry) {
      gameRef.current.registry.set('runtime', runtime ?? null);
    }
  }, [runtime]);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config = createGameConfig(containerRef.current);
    const game = new Phaser.Game(config);
    gameRef.current = game;
    if (game.registry) {
      game.registry.set('runtime', runtimeRef.current ?? null);
    }

    // Listen for the engine READY event rather than setting ready immediately
    game.events.once(Phaser.Core.Events.READY, () => {
      setIsReady(true);
      if (onGameReadyRef.current) {
        onGameReadyRef.current(game);
      }
    });

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []); // Explicitly empty deps; single instance guard maintained

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
