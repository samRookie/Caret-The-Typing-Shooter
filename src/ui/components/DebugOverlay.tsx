import React, { useEffect, useState } from 'react';
import { devIntentLog, DevIntentEntry } from '@/game/input/devIntentLog';

export interface DebugCounts {
  tick: number;
  enemyCount: number;
  enemyViews: number;
  ghosts: number;
  projectiles: number;
  childrenCount: number;
  listenerCount: number;
  fps: number;
}

export const DebugOverlay: React.FC = () => {
  const [counts, setCounts] = useState<DebugCounts>({
    tick: 0,
    enemyCount: 0,
    enemyViews: 0,
    ghosts: 0,
    projectiles: 0,
    childrenCount: 0,
    listenerCount: 0,
    fps: 60,
  });

  const entries = React.useSyncExternalStore(
    (cb) => devIntentLog.subscribe(cb),
    () => devIntentLog.getEntries(),
    () => []
  );

  // Poll debug counts from window.__caret at 10Hz
  useEffect(() => {
    const timer = setInterval(() => {
      if (typeof window !== 'undefined' && window.__caret) {
        setCounts(window.__caret.getDebugCounts());
      }
    }, 100);

    return () => clearInterval(timer);
  }, []);

  const renderIntentDetails = (entry: DevIntentEntry) => {
    const { intent } = entry;
    if (intent.kind === 'command') {
      if (intent.command.type === 'char') {
        return (
          <span style={{ color: 'var(--accent, #FFB84A)' }}>
            char(&apos;{intent.command.char}&apos;)
          </span>
        );
      }
      return (
        <span style={{ color: 'var(--accent, #FFB84A)' }}>
          release-target
        </span>
      );
    }
    if (intent.kind === 'ui') {
      return (
        <span style={{ color: 'var(--success, #00FF66)' }}>
          {intent.action}
        </span>
      );
    }
    return <span style={{ color: 'var(--text-secondary, #8A9BA8)' }}>ignore</span>;
  };

  return (
    <div
      data-testid="debug-overlay"
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        width: '420px',
        maxHeight: '480px',
        background: 'rgba(10, 15, 20, 0.95)',
        border: '1px solid var(--accent, #FFB84A)',
        borderRadius: 'var(--radius-sm, 4px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: '11px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: '#f3f7fa',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          background: 'rgba(255, 184, 74, 0.1)',
          borderBottom: '1px solid rgba(255, 184, 74, 0.3)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 'bold', color: 'var(--accent, #FFB84A)', letterSpacing: '0.08em' }}>
            ENGINE &amp; INPUT MONITOR [DEV ?debug=1]
          </span>
          <span style={{ fontSize: '9px', color: 'var(--text-secondary, #8A9BA8)' }}>
            REAL-TIME PHASER &amp; SIMULATION TELEMETRY
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span
            style={{
              padding: '2px 6px',
              fontSize: '10px',
              background: 'rgba(255, 184, 74, 0.15)',
              border: '1px solid var(--accent, #FFB84A)',
              color: 'var(--accent, #FFB84A)',
              borderRadius: '2px',
            }}
          >
            FPS: {counts.fps.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Engine Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
          padding: '8px 12px',
          background: 'rgba(0, 0, 0, 0.25)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '10px',
        }}
      >
        <div>
          <span style={{ color: 'var(--text-secondary, #8A9BA8)' }}>TICK: </span>
          <span style={{ color: '#fff', fontWeight: 'bold' }}>{counts.tick}</span>
        </div>
        <div>
          <span style={{ color: 'var(--text-secondary, #8A9BA8)' }}>SIM ENEMIES: </span>
          <span style={{ color: '#fff', fontWeight: 'bold' }}>{counts.enemyCount}</span>
        </div>
        <div>
          <span style={{ color: 'var(--text-secondary, #8A9BA8)' }}>ENEMY VIEWS: </span>
          <span style={{ color: '#fff', fontWeight: 'bold' }}>{counts.enemyViews}</span>
        </div>
        <div>
          <span style={{ color: 'var(--text-secondary, #8A9BA8)' }}>GHOSTS (CAP 20): </span>
          <span style={{ color: '#fff', fontWeight: 'bold' }}>{counts.ghosts}</span>
        </div>
        <div>
          <span style={{ color: 'var(--text-secondary, #8A9BA8)' }}>PROJECTILES (CAP 12): </span>
          <span style={{ color: '#fff', fontWeight: 'bold' }}>{counts.projectiles}</span>
        </div>
        <div>
          <span style={{ color: 'var(--text-secondary, #8A9BA8)' }}>SCENE CHILDREN: </span>
          <span style={{ color: '#fff', fontWeight: 'bold' }}>{counts.childrenCount}</span>
        </div>
        <div>
          <span style={{ color: 'var(--text-secondary, #8A9BA8)' }}>LISTENERS: </span>
          <span style={{ color: '#fff', fontWeight: 'bold' }}>{counts.listenerCount}</span>
        </div>
      </div>

      {/* Keystroke Intent Log Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 12px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          fontSize: '9px',
          color: 'var(--text-secondary, #8A9BA8)',
        }}
      >
        <span>LAST 10 NORMALIZED INTENTS</span>
        <button
          type="button"
          onClick={() => devIntentLog.clear()}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent, #FFB84A)',
            fontSize: '9px',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          [CLEAR INTENTS]
        </button>
      </div>

      {/* Keystroke Entry List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '2px 0',
          maxHeight: '180px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {entries.length === 0 ? (
          <div
            style={{
              padding: '16px 12px',
              textAlign: 'center',
              color: 'var(--text-secondary, #8A9BA8)',
              fontStyle: 'italic',
            }}
          >
            No keystrokes recorded yet...
          </div>
        ) : (
          entries.map((entry, idx) => (
            <div
              key={entry.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '24px 60px 1fr 50px',
                alignItems: 'center',
                padding: '3px 10px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                background: idx === entries.length - 1 ? 'rgba(255, 184, 74, 0.08)' : 'transparent',
              }}
            >
              <span style={{ color: 'var(--text-secondary, #8A9BA8)' }}>#{entry.id}</span>
              <span style={{ fontWeight: 'bold', color: '#fff' }}>
                [{entry.key === ' ' ? 'Space' : entry.key}]
              </span>
              <div>{renderIntentDetails(entry)}</div>
              <span
                style={{
                  fontSize: '9px',
                  textAlign: 'right',
                  color: entry.preventDefault ? 'var(--accent, #FFB84A)' : 'var(--text-secondary, #8A9BA8)',
                }}
              >
                {entry.preventDefault ? 'PREV' : 'DEF'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DebugOverlay;
