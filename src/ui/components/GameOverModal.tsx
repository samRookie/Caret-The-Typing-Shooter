import React from 'react';
import { TacticalFrame } from './TacticalFrame';
import { TacticalButton } from './TacticalButton';
import { MetricCard } from './MetricCard';
import { ProgressChart } from './ProgressChart';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { GameResult } from '@/shared/domain';
import { RunRecord } from '@/shared/history/historyStore';
import { RecordEvaluation, GRAPH_MIN_RUNS } from '@/shared/history/statsMath';

export interface GameOverModalProps {
  score: number;
  wave: number;
  streak: number;
  accuracy: number;
  result?: GameResult | null;
  seed?: number;
  evaluation?: RecordEvaluation | null;
  comparison?: {
    bestScore: number;
    bestWave: number;
    prevScore: number;
    prevWave: number;
  } | null;
  localBest?: { score: number; wave: number } | null;
  runs?: readonly RunRecord[];
  onRestart: () => void;
  onQuitToMenu?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  wave,
  streak,
  accuracy,
  result,
  seed,
  evaluation,
  comparison,
  localBest,
  runs = [],
  onRestart,
  onQuitToMenu,
}) => {
  const trapRef = useFocusTrap<HTMLDivElement>(true);

  const displayWpm = result?.wpm ?? 0;
  const displayRating = result?.rating ?? 'C';
  const displaySeed = seed !== undefined ? seed : result ? 1337 : 0;
  const formattedWave = String(wave).padStart(2, '0');

  // Contextual Header determination (Decision D13)
  const renderHeader = () => {
    if (evaluation?.isNewWaveRecord) {
      return (
        <h2
          id="game-over-dialog-title"
          style={{
            fontFamily: 'var(--font-display, Tektur)',
            fontSize: '20px',
            color: 'var(--accent-bright, #ffd37a)',
            letterSpacing: '0.12em',
            margin: '0 0 4px 0',
            textShadow: 'var(--glow-accent)',
          }}
        >
          NEW RECORD! WAVE {formattedWave} REACHED
        </h2>
      );
    }
    if (evaluation?.isFirstRun) {
      return (
        <h2
          id="game-over-dialog-title"
          style={{
            fontFamily: 'var(--font-display, Tektur)',
            fontSize: '20px',
            color: 'var(--cyan, #8be9fd)',
            letterSpacing: '0.12em',
            margin: '0 0 4px 0',
          }}
        >
          FIRST MISSION LOGGED · WAVE {formattedWave}
        </h2>
      );
    }
    return (
      <h2
        id="game-over-dialog-title"
        style={{
          fontFamily: 'var(--font-display, Tektur)',
          fontSize: '20px',
          color: 'var(--danger, #ff5f5f)',
          letterSpacing: '0.12em',
          margin: '0 0 4px 0',
        }}
      >
        VESSEL DESTROYED · WAVE {formattedWave}
      </h2>
    );
  };

  return (
    <div
      className="tactical-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-dialog-title"
      style={{ overflowY: 'auto', padding: '16px 0' }}
    >
      <div
        ref={trapRef}
        style={{
          width: '90%',
          maxWidth: '560px',
          margin: 'auto',
        }}
      >
        <TacticalFrame
          title="MISSION DEBRIEFING"
          subtitle="HULL INTEGRITY COMPROMISED"
          bracketColor="#ff2b42"
          style={{
            padding: '24px',
            border: '2.5px solid #ff2b42',
            boxShadow:
              '0 0 32px rgba(255, 43, 66, 0.45), 0 0 10px rgba(255, 43, 66, 0.75), inset 0 0 18px rgba(255, 43, 66, 0.16)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Header Status & Simulation Meta */}
            <div style={{ textAlign: 'center' }}>
              {renderHeader()}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '12px',
                  fontFamily: 'var(--font-condensed)',
                  fontSize: '11px',
                  color: 'var(--text-secondary, #8995a1)',
                }}
              >
                <span>
                  SIMULATION SEED:{' '}
                  <strong style={{ color: 'var(--accent, #ffb84a)' }}>{displaySeed}</strong>
                </span>
                <span>&bull;</span>
                <span>
                  PERFORMANCE RANK:{' '}
                  <strong style={{ color: 'var(--accent-bright, #ffd37a)' }}>
                    GRADE {displayRating}
                  </strong>
                </span>
              </div>
            </div>

            {/* New Best Score Banner */}
            {evaluation?.isNewScoreRecord && (
              <div
                style={{
                  background: 'rgba(255, 184, 74, 0.15)',
                  border: '1px solid var(--accent, #ffb84a)',
                  borderRadius: 'var(--radius-sm, 4px)',
                  padding: '6px 12px',
                  textAlign: 'center',
                  fontFamily: 'var(--font-display, Tektur)',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--accent-bright, #ffd37a)',
                  letterSpacing: '0.1em',
                  boxShadow: 'var(--glow-accent)',
                }}
              >
                ★ NEW BEST SCORE: {score.toLocaleString()} PTS ★
              </div>
            )}

            {/* Primary Performance Telemetry Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
              }}
            >
              <MetricCard label="FINAL SCORE" value={score} variant="accent" />
              <MetricCard label="WAVE REACHED" value={formattedWave} variant="default" />
              <MetricCard label="MAX STREAK" value={streak} variant="success" />
              <MetricCard label="ACCURACY" value={`${accuracy}%`} variant="default" />
              <MetricCard label="TYPING WPM" value={displayWpm} variant="accent" />
              <MetricCard label="RATING" value={displayRating} variant="success" />
            </div>

            {/* Historical Comparison Row (THIS RUN vs CAREER BEST vs PREVIOUS MISSION) */}
            {comparison && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid var(--border, rgba(255, 184, 74, 0.15))',
                  borderRadius: 'var(--radius-sm, 4px)',
                  padding: '8px 10px',
                  fontFamily: 'var(--font-condensed)',
                  fontSize: '10px',
                }}
              >
                <div>
                  <span style={{ color: 'var(--accent, #ffb84a)', fontWeight: 'bold' }}>
                    THIS MISSION
                  </span>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    Wave {formattedWave} · {score} pts
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--accent, #ffb84a)', fontWeight: 'bold' }}>
                    CAREER BEST
                  </span>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    Wave {String(comparison.bestWave).padStart(2, '0')} ·{' '}
                    {comparison.bestScore} pts
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--accent, #ffb84a)', fontWeight: 'bold' }}>
                    PREVIOUS MISSION
                  </span>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    {comparison.prevWave > 0
                      ? `Wave ${String(comparison.prevWave).padStart(2, '0')} · ${comparison.prevScore} pts`
                      : '--'}
                  </div>
                </div>
              </div>
            )}

            {/* Local Best Indicator (Step 11 Spec) */}
            {localBest && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: '1px dashed var(--border, rgba(255, 184, 74, 0.3))',
                  borderRadius: 'var(--radius-sm, 4px)',
                  padding: '6px 12px',
                  fontFamily: 'var(--font-condensed)',
                  fontSize: '11px',
                  letterSpacing: '0.06em',
                }}
              >
                <span style={{ color: 'var(--text-secondary, #8995a1)' }}>
                  LOCAL BEST (not verified)
                </span>
                <span style={{ color: 'var(--accent-bright, #ffd37a)', fontWeight: 'bold' }}>
                  {localBest.score.toLocaleString()} PTS · WAVE {String(localBest.wave).padStart(2, '0')}
                </span>
              </div>
            )}

            {/* Embedded Trend Visualizer for >= 5 runs */}
            {runs.length >= GRAPH_MIN_RUNS && (
              <ProgressChart
                runs={runs}
                highlightLatest={true}
              />
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <TacticalButton
                variant="primary"
                size="lg"
                onClick={onRestart}
                data-autofocus="true"
                style={{ width: '100%' }}
              >
                RESTART / INITIALIZE NEW RUN [ENTER]
              </TacticalButton>

              {onQuitToMenu && (
                <TacticalButton
                  variant="default"
                  size="md"
                  onClick={onQuitToMenu}
                  style={{ width: '100%' }}
                >
                  RETURN TO COMMAND MENU
                </TacticalButton>
              )}
            </div>
          </div>
        </TacticalFrame>
      </div>
    </div>
  );
};
