import React, { CSSProperties } from 'react';

interface TacticalFrameProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: CSSProperties;
  className?: string;
  bracketColor?: string;
}

export const TacticalFrame: React.FC<TacticalFrameProps> = ({
  title,
  subtitle,
  children,
  style,
  className = '',
  bracketColor,
}) => {
  const activeBracketColor = bracketColor ?? 'var(--accent)';
  return (
    <div
      className={`tactical-frame ${className}`}
      style={{
        position: 'relative',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        padding: '16px',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.45)',
        ...style,
      }}
    >
      {/* Corner bracket accents */}
      <div
        style={{
          position: 'absolute',
          top: -1,
          left: -1,
          width: 8,
          height: 8,
          borderTop: `2px solid ${activeBracketColor}`,
          borderLeft: `2px solid ${activeBracketColor}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: -1,
          right: -1,
          width: 8,
          height: 8,
          borderTop: `2px solid ${activeBracketColor}`,
          borderRight: `2px solid ${activeBracketColor}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -1,
          left: -1,
          width: 8,
          height: 8,
          borderBottom: `2px solid ${activeBracketColor}`,
          borderLeft: `2px solid ${activeBracketColor}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -1,
          right: -1,
          width: 8,
          height: 8,
          borderBottom: `2px solid ${activeBracketColor}`,
          borderRight: `2px solid ${activeBracketColor}`,
        }}
      />

      {(title || subtitle) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            borderBottom: '1px solid rgba(255, 184, 74, 0.15)',
            paddingBottom: '8px',
            marginBottom: '12px',
          }}
        >
          {title && (
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '12px',
                color: 'var(--accent)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              {title}
            </span>
          )}
          {subtitle && (
            <span
              style={{
                fontFamily: 'var(--font-condensed)',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                letterSpacing: '0.08em',
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}

      {children}
    </div>
  );
};
