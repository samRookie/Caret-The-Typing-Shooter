import React, { useEffect, useState } from 'react';
import { devIntentLog, DevIntentEntry } from '@/game/input/devIntentLog';
import { KeyboardAdapter } from '@/game/input/keyboardAdapter';
import { InputQueue } from '@/game/input/inputQueue';

export interface DebugInputPanelProps {
  initialGameActive?: boolean;
}

export const DebugInputPanel: React.FC<DebugInputPanelProps> = ({ initialGameActive = true }) => {
  const entries = React.useSyncExternalStore(
    (cb) => devIntentLog.subscribe(cb),
    () => devIntentLog.getEntries(),
    () => []
  );
  const [gameActive, setGameActive] = useState<boolean>(initialGameActive);

  // Dedicated dev-mode keyboard adapter attachment
  useEffect(() => {
    const queue = new InputQueue();
    let lastKey = '';
    const rawKeyTracker = (e: KeyboardEvent) => {
      lastKey = e.key;
    };
    window.addEventListener('keydown', rawKeyTracker, { capture: true });

    const loggingAdapter = new KeyboardAdapter({
      getState: () => ({ gameActive }),
      onIntent: (intent, preventDefault) => {
        devIntentLog.record(lastKey || 'unknown', intent, preventDefault);
      },
    });

    loggingAdapter.attach(queue);

    return () => {
      window.removeEventListener('keydown', rawKeyTracker, { capture: true });
      loggingAdapter.detach();
    };
  }, [gameActive]);

  const renderIntentDetails = (entry: DevIntentEntry) => {
    const { intent } = entry;
    if (intent.kind === 'command') {
      if (intent.command.type === 'char') {
        return (
          <span style={{ color: 'var(--accent)' }}>
            COMMAND: char(&apos;{intent.command.char}&apos;)
          </span>
        );
      }
      return (
        <span style={{ color: 'var(--accent)' }}>
          COMMAND: release-target
        </span>
      );
    }
    if (intent.kind === 'ui') {
      return (
        <span style={{ color: 'var(--success, #00FF66)' }}>
          UI: {intent.action}
        </span>
      );
    }
    return (
      <span style={{ color: 'var(--text-secondary)' }}>
        IGNORE
      </span>
    );
  };

  return (
    <div
      data-testid="debug-input-panel"
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        width: '380px',
        maxHeight: '420px',
        background: 'rgba(10, 15, 20, 0.95)',
        border: '1px solid var(--accent, #FFB84A)',
        borderRadius: 'var(--radius-sm, 4px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: '11px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
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
            NORMALIZED INTENT MONITOR [DEV]
          </span>
          <span style={{ fontSize: '9px', color: 'var(--text-secondary, #8A9BA8)' }}>
            LAST 10 INTENTS (?debug=1)
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            type="button"
            data-testid="toggle-game-active"
            onClick={() => setGameActive((prev) => !prev)}
            style={{
              padding: '2px 6px',
              fontSize: '10px',
              cursor: 'pointer',
              background: gameActive ? 'rgba(0, 255, 102, 0.2)' : 'rgba(255, 68, 68, 0.2)',
              border: `1px solid ${gameActive ? '#00FF66' : '#FF4444'}`,
              color: gameActive ? '#00FF66' : '#FF4444',
              borderRadius: '2px',
            }}
          >
            ACTIVE: {gameActive ? 'YES' : 'NO'}
          </button>
          <button
            type="button"
            data-testid="clear-debug-log"
            onClick={() => devIntentLog.clear()}
            style={{
              padding: '2px 6px',
              fontSize: '10px',
              cursor: 'pointer',
              background: 'transparent',
              border: '1px solid var(--border, #243447)',
              color: 'var(--text-secondary, #8A9BA8)',
              borderRadius: '2px',
            }}
          >
            CLEAR
          </button>
        </div>
      </div>

      {/* Entry List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px 0',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {entries.length === 0 ? (
          <div
            style={{
              padding: '24px 12px',
              textAlign: 'center',
              color: 'var(--text-secondary, #8A9BA8)',
              fontStyle: 'italic',
            }}
          >
            Waiting for keystrokes... (type letters, Tab, Esc, Space)
          </div>
        ) : (
          entries.map((entry, idx) => (
            <div
              key={entry.id}
              data-testid="debug-intent-row"
              style={{
                display: 'grid',
                gridTemplateColumns: '24px 70px 1fr 60px',
                alignItems: 'center',
                padding: '4px 10px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                background: idx === entries.length - 1 ? 'rgba(255, 184, 74, 0.08)' : 'transparent',
              }}
            >
              <span style={{ color: 'var(--text-secondary, #8A9BA8)' }}>#{entry.id}</span>
              <span
                style={{
                  fontWeight: 'bold',
                  color: '#FFFFFF',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
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
                {entry.preventDefault ? 'PREVENT' : 'DEFAULT'}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div
        style={{
          padding: '4px 10px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          fontSize: '9px',
          color: 'var(--text-secondary, #8A9BA8)',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>RING BUFFER CAPACITY: 10</span>
        <span>FOLDED INTO STEP 7 OVERLAY</span>
      </div>
    </div>
  );
};

export default DebugInputPanel;
