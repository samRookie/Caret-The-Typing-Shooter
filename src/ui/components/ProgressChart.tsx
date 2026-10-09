import React, { useState } from 'react';
import { RunRecord } from '@/shared/history/historyStore';
import { TrendMetric, selectSeries } from '@/shared/history/statsMath';

export interface ProgressChartProps {
  runs: readonly RunRecord[];
  initialMetric?: TrendMetric;
  highlightLatest?: boolean;
  reducedMotion?: boolean;
}

interface MetricItem {
  readonly key: TrendMetric;
  readonly label: string;
  readonly unit: string;
}

const DEFAULT_METRIC_CONFIG: MetricItem = {
  key: 'wave',
  label: 'WAVE',
  unit: '',
};

const METRICS: readonly MetricItem[] = [
  DEFAULT_METRIC_CONFIG,
  { key: 'score', label: 'SCORE', unit: 'pts' },
  { key: 'accuracy', label: 'ACCURACY', unit: '%' },
  { key: 'netWpm', label: 'NET WPM', unit: 'wpm' },
];

export const ProgressChart: React.FC<ProgressChartProps> = ({
  runs,
  initialMetric = 'wave',
  highlightLatest = false,
  reducedMotion = false,
}) => {
  const [metric, setMetric] = useState<TrendMetric>(initialMetric);

  const metricConfig = METRICS.find((m) => m.key === metric) ?? DEFAULT_METRIC_CONFIG;
  const { series, activeIndex } = selectSeries(runs, metric, 10);

  // Keyboard navigation for metric tabs
  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    let nextIndex = currentIndex;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % METRICS.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + METRICS.length) % METRICS.length;
    }
    const target = METRICS[nextIndex];
    if (target && nextIndex !== currentIndex) {
      setMetric(target.key);
    }
  };

  // Dimensions & bounds
  const width = 400;
  const height = 150;
  const padLeft = 40;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const count = series.length;
  const minVal = count > 0 ? Math.min(...series) : 0;
  const maxVal = count > 0 ? Math.max(...series) : 0;
  const careerBest = maxVal;
  const latestVal = count > 0 ? series[series.length - 1] : 0;

  // Safe range calculation (prevent division by zero when flat)
  const isFlat = minVal === maxVal;
  const range = isFlat ? (maxVal === 0 ? 1 : maxVal) : maxVal - minVal;
  const effectiveMin = isFlat ? (maxVal === 0 ? 0 : maxVal * 0.8) : minVal;
  const effectiveRange = isFlat ? (maxVal === 0 ? 1 : maxVal * 0.4) : range;

  const points = series.map((val, idx) => {
    const x =
      count <= 1
        ? padLeft + chartW / 2
        : padLeft + (idx / (count - 1)) * chartW;
    const norm = (val - effectiveMin) / effectiveRange;
    const y = isFlat
      ? padTop + chartH / 2
      : padTop + chartH - Math.max(0, Math.min(1, norm)) * chartH;
    return { x, y, val, idx };
  });

  const polylinePoints = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  const summaryAriaLabel = `Recent ${metricConfig.label.toLowerCase()} trend over ${count} runs. Career best: ${careerBest}${metricConfig.unit ? ' ' + metricConfig.unit : ''}, latest run: ${latestVal}${metricConfig.unit ? ' ' + metricConfig.unit : ''}.`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px 14px',
        background: 'rgba(0, 0, 0, 0.45)',
        border: '1px solid var(--border, rgba(255, 184, 74, 0.2))',
        borderRadius: 'var(--radius-sm, 4px)',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Metric Selector Radiogroup */}
      <div
        role="radiogroup"
        aria-label="Progress Metric Selector"
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '6px',
        }}
      >
        {METRICS.map((m, idx) => {
          const isSelected = m.key === metric;
          return (
            <button
              key={m.key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setMetric(m.key)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              style={{
                fontFamily: 'var(--font-condensed, sans-serif)',
                fontSize: '10px',
                fontWeight: isSelected ? 700 : 400,
                letterSpacing: '0.08em',
                padding: '4px 8px',
                background: isSelected ? 'rgba(255, 184, 74, 0.2)' : 'transparent',
                color: isSelected ? 'var(--accent-bright, #ffd37a)' : 'var(--text-secondary, #8995a1)',
                border: isSelected ? '1px solid var(--accent, #ffb84a)' : '1px solid transparent',
                borderRadius: 'var(--radius-sm, 3px)',
                cursor: 'pointer',
                transition: reducedMotion ? 'none' : 'all 0.15s ease',
              }}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Inline Accessible SVG Chart */}
      <div style={{ position: 'relative', width: '100%' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={summaryAriaLabel}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          {/* Subtle Gridlines */}
          {[0.25, 0.5, 0.75, 1.0].map((frac) => {
            const y = padTop + chartH * (1 - frac);
            return (
              <line
                key={frac}
                x1={padLeft}
                y1={y}
                x2={padLeft + chartW}
                y2={y}
                stroke="rgba(255, 184, 74, 0.12)"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
            );
          })}

          {/* Y Axis Baseline */}
          <line
            x1={padLeft}
            y1={padTop + chartH}
            x2={padLeft + chartW}
            y2={padTop + chartH}
            stroke="rgba(255, 184, 74, 0.3)"
            strokeWidth="1"
          />

          {/* Y Axis Min/Max Labels */}
          <text
            x={padLeft - 6}
            y={padTop + 4}
            textAnchor="end"
            fill="var(--text-secondary, #8995a1)"
            fontFamily="var(--font-mono, monospace)"
            fontSize="9"
          >
            {maxVal}
          </text>
          <text
            x={padLeft - 6}
            y={padTop + chartH}
            textAnchor="end"
            fill="var(--text-secondary, #8995a1)"
            fontFamily="var(--font-mono, monospace)"
            fontSize="9"
          >
            {minVal}
          </text>

          {/* Connecting Line */}
          {points.length > 1 && (
            <polyline
              fill="none"
              stroke="var(--accent, #ffb84a)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polylinePoints}
            />
          )}

          {/* Data Points */}
          {points.map((p) => {
            const isLatest = p.idx === activeIndex;
            const shouldHighlight = highlightLatest && isLatest;

            return (
              <g key={p.idx}>
                {shouldHighlight && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="8"
                    fill="none"
                    stroke="var(--accent, #ffb84a)"
                    strokeWidth="1.5"
                    opacity="0.6"
                  />
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={shouldHighlight ? 5 : 3}
                  fill={shouldHighlight ? 'var(--accent-bright, #ffd37a)' : 'var(--accent, #ffb84a)'}
                  stroke="rgba(10, 14, 20, 0.9)"
                  strokeWidth="1"
                />
                {/* X Axis Run Indices */}
                <text
                  x={p.x}
                  y={height - 10}
                  textAnchor="middle"
                  fill="var(--text-secondary, #8995a1)"
                  fontFamily="var(--font-mono, monospace)"
                  fontSize="8"
                >
                  #{p.idx + 1}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Visually hidden accessibility table for screen readers (WCAG 2.1 AA) */}
        <table
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: 0,
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        >
          <caption>{summaryAriaLabel}</caption>
          <thead>
            <tr>
              <th scope="col">Run Number</th>
              <th scope="col">{metricConfig.label}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.idx}>
                <td>Run {p.idx + 1}</td>
                <td>
                  {p.val}
                  {metricConfig.unit ? ' ' + metricConfig.unit : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
