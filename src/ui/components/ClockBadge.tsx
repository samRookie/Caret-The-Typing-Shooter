import React, { useState, useEffect } from 'react';

export interface ClockBadgeProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * ClockBadge Component (Spec 5.C)
 * Tactical local time readout aligned strictly to minute boundaries.
 * In accordance with Rule R-B, this UI component is the ONLY place in the application
 * permitted to invoke Date / Intl.DateTimeFormat (zero simulation contamination).
 */
export const ClockBadge: React.FC<ClockBadgeProps> = ({ className, style }) => {
  const [timeStr, setTimeStr] = useState<string>(() => {
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date());
  });

  useEffect(() => {
    let timeoutId: number | null = null;

    const updateTime = () => {
      setTimeStr(
        new Intl.DateTimeFormat(undefined, {
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date())
      );
    };

    const scheduleNextMinute = () => {
      const now = new Date();
      const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds() + 50;
      timeoutId = window.setTimeout(() => {
        updateTime();
        scheduleNextMinute();
      }, msToNextMinute);
    };

    scheduleNextMinute();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateTime();
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }
        scheduleNextMinute();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div
      role="timer"
      aria-label={`Local tactical time: ${timeStr}`}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 8px',
        background: 'rgba(10, 14, 20, 0.65)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        fontFamily: 'var(--font-condensed)',
        fontSize: '11px',
        letterSpacing: '0.08em',
        color: 'var(--text-secondary)',
        fontVariantNumeric: 'tabular-nums',
        userSelect: 'none',
        ...style,
      }}
    >
      <span style={{ color: 'var(--accent-bright)', marginRight: '4px', fontSize: '10px' }}>
        SYS
      </span>
      <span>{timeStr}</span>
    </div>
  );
};
