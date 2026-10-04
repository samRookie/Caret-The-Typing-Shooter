import React, { ButtonHTMLAttributes } from 'react';

export interface TacticalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const TacticalButton: React.FC<TacticalButtonProps> = ({
  variant = 'default',
  size = 'md',
  icon,
  children,
  className = '',
  style,
  ...props
}) => {
  const sizeStyles: Record<'sm' | 'md' | 'lg', React.CSSProperties> = {
    sm: { padding: '6px 12px', fontSize: '11px' },
    md: { padding: '10px 18px', fontSize: '13px' },
    lg: { padding: '14px 26px', fontSize: '15px' },
  };

  return (
    <button
      className={`tactical-button ${variant} ${className}`}
      style={{
        ...sizeStyles[size],
        ...style,
      }}
      {...props}
    >
      {icon && (
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
};
