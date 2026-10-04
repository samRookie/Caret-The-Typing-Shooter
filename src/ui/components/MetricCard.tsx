import React from 'react';

export interface MetricCardProps {
  label: string;
  value: string | number;
  suffix?: string;
  variant?: 'default' | 'accent' | 'danger' | 'success';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  suffix,
  variant = 'default',
}) => {
  const colorMap = {
    default: 'var(--text-primary)',
    accent: 'var(--accent-bright)',
    danger: 'var(--danger)',
    success: 'var(--success)',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: '6px 12px',
        minWidth: '80px',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-condensed)',
          fontSize: '10px',
          color: 'var(--text-secondary)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: '2px',
        }}
      >
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '16px',
            color: colorMap[variant],
            letterSpacing: '0.05em',
          }}
        >
          {value}
        </span>
        {suffix && (
          <span
            style={{
              fontFamily: 'var(--font-condensed)',
              fontSize: '11px',
              color: 'var(--text-secondary)',
            }}
          >
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
};
