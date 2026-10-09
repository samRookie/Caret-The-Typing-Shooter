import React, { useEffect, useRef } from 'react';
import { TacticalFrame } from './TacticalFrame';
import { TacticalButton } from './TacticalButton';
import { ClockBadge } from './ClockBadge';
import { StatCard } from './StatCard';
import { BootStatusLine } from './BootStatusLine';
import { ProgressChart } from './ProgressChart';
import { GAME_TITLE, GAME_SUBTITLE, HOW_TO_PLAY_TEXT } from '@/shared/config/branding';
import { RunRecord, useHistory } from '@/shared/history/historyStore';
import { computeStats, GRAPH_MIN_RUNS } from '@/shared/history/statsMath';
import { formatAccuracy, formatElapsed } from '@/shared/formatters';

export interface MenuScreenProps {
  onPlay: () => void;
  onOpenSettings?: () => void;
  runs?: readonly RunRecord[];
  reducedMotion?: boolean;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({
  onPlay,
  onOpenSettings,
  runs: propRuns,
  reducedMotion = false,
}) => {
  const historyRuns = useHistory();
  const activeRuns = propRuns ?? historyRuns;
  const stats = computeStats(activeRuns);

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

  const runsNeededForChart = Math.max(0, GRAPH_MIN_RUNS - stats.totalRuns);

  return (
    <div
      className="tactical-modal-backdrop"
      role="dialog"
      aria-modal="true"
      style={{ overflowY: 'auto', padding: '16px 0' }}
    >
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
        <ClockBadge />
      </div>

      <div
        style={{
          width: '90%',
          maxWidth: '560px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          margin: 'auto',
        }}
      >
        {/* Ephemeral Boot Status Line (Decision D9) */}
        <BootStatusLine reducedMotion={reducedMotion} />

        <TacticalFrame
          title="COMMAND HEADQUARTERS"
          subtitle="MISSION DISPATCH READY"
          style={{
            width: '100%',
            padding: '24px 28px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header & Branding */}
            <div style={{ textAlign: 'center' }}>
              <h1
                style={{
                  fontFamily: 'var(--font-display, Tektur)',
                  fontSize: '22px',
                  color: 'var(--accent-bright, #ffd37a)',
                  letterSpacing: '0.14em',
                  marginBottom: '4px',
                  textShadow: 'var(--glow-accent)',
                }}
              >
                {GAME_TITLE}
              </h1>
              <p
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-condensed)',
                  fontSize: '11px',
                  color: 'var(--text-secondary, #8995a1)',
                  letterSpacing: '0.08em',
                }}
              >
                {GAME_SUBTITLE}
              </p>
            </div>

            {/* Career Pilot Records Telemetry */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontFamily: 'var(--font-condensed)',
                  fontSize: '11px',
                  color: 'var(--accent, #ffb84a)',
                  letterSpacing: '0.08em',
                  fontWeight: 'bold',
                }}
              >
                <span>PILOT TELEMETRY & CAREER RECORDS</span>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                  MISSIONS: {stats.totalRuns}
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '6px',
                }}
              >
                <StatCard
                  label="BEST SCORE"
                  value={stats.bestScore.toLocaleString()}
                  variant="accent"
                />
                <StatCard
                  label="BEST WAVE"
                  value={String(stats.bestWave).padStart(2, '0')}
                  variant="default"
                />
                <StatCard
                  label="BEST ACCURACY"
                  value={
                    stats.bestAccuracy !== null
                      ? formatAccuracy(stats.bestAccuracy, 0)
                      : '--'
                  }
                  qualified={stats.bestAccuracy !== null}
                  qualificationHint="< 100 keys"
                  variant="success"
                />
                <StatCard
                  label="BEST NET WPM"
                  value={stats.bestNetWpm !== null ? stats.bestNetWpm : '--'}
                  qualified={stats.bestNetWpm !== null}
                  qualificationHint="< 30s"
                  variant="accent"
                />
                <StatCard
                  label="TOTAL MISSIONS"
                  value={stats.totalRuns}
                  variant="default"
                />
                <StatCard
                  label="TIME LOGGED"
                  value={formatElapsed(stats.totalTimeSeconds)}
                  variant="default"
                />
              </div>

              <span
                style={{
                  fontFamily: 'var(--font-condensed)',
                  fontSize: '9px',
                  color: 'var(--text-muted, #556270)',
                  textAlign: 'right',
                  fontStyle: 'italic',
                }}
              >
                * WPM reflects net combat throughput including enemy wait times.
              </span>
            </div>

            {/* Last Mission Summary Row */}
            {stats.lastRun && (
              <div
                style={{
                  padding: '6px 10px',
                  background: 'rgba(255, 184, 74, 0.05)',
                  border: '1px solid rgba(255, 184, 74, 0.15)',
                  borderRadius: 'var(--radius-sm, 3px)',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '10px',
                  color: 'var(--text-secondary, #8995a1)',
                  letterSpacing: '0.04em',
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '4px',
                }}
              >
                <span style={{ color: 'var(--accent, #ffb84a)', fontWeight: 'bold' }}>
                  LAST MISSION:
                </span>
                <span>WAVE {String(stats.lastRun.wave).padStart(2, '0')}</span>
                <span>SCORE {stats.lastRun.score}</span>
                <span>ACC {stats.lastRun.accuracy}%</span>
                <span>NET WPM {stats.lastRun.netWpm}</span>
                <span>TIME {formatElapsed(stats.lastRun.durationSeconds)}</span>
              </div>
            )}

            {/* Progress Trend Chart or Lock Hint (Decision D8) */}
            {stats.totalRuns >= GRAPH_MIN_RUNS ? (
              <ProgressChart
                runs={activeRuns}
                reducedMotion={reducedMotion}
              />
            ) : (
              <div
                style={{
                  padding: '8px 12px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px dashed rgba(255, 184, 74, 0.25)',
                  borderRadius: 'var(--radius-sm, 4px)',
                  textAlign: 'center',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '10px',
                  color: 'var(--text-muted, #556270)',
                  letterSpacing: '0.06em',
                }}
              >
                [TACTICAL TELEMETRY LOCKED: COMPLETE {runsNeededForChart} MORE RUN(S) TO UNLOCK PROGRESS GRAPH]
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <TacticalButton
                ref={playButtonRef}
                variant="primary"
                size="lg"
                onClick={onPlay}
                data-autofocus="true"
                aria-label="NEW GAME / INITIATE ENGAGEMENT [ENTER]"
                style={{ width: '100%' }}
              >
                NEW GAME [ENTER]
              </TacticalButton>

              {onOpenSettings && (
                <TacticalButton
                  variant="default"
                  size="md"
                  onClick={onOpenSettings}
                  style={{ width: '100%' }}
                >
                  TACTICAL SETTINGS
                </TacticalButton>
              )}
            </div>

            {/* How to Play Section */}
            <div
              style={{
                padding: '8px 12px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--border, rgba(255, 184, 74, 0.2))',
                borderRadius: 'var(--radius-sm, 4px)',
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-condensed)',
                  fontSize: '10px',
                  color: 'var(--accent, #ffb84a)',
                  letterSpacing: '0.08em',
                  marginBottom: '2px',
                  fontWeight: 'bold',
                }}
              >
                TACTICAL DIRECTIVE:
              </span>
              <p
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-condensed)',
                  fontSize: '11px',
                  color: 'var(--text-secondary, #8995a1)',
                  lineHeight: 1.4,
                  letterSpacing: '0.03em',
                }}
              >
                {HOW_TO_PLAY_TEXT}
              </p>
            </div>
          </div>
        </TacticalFrame>
      </div>
    </div>
  );
};
