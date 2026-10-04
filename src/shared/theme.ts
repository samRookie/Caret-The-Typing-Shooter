/**
 * Part A & B Design Tokens - Minimalist Dark Sci-Fi Tactical Console
 */
export const THEME = {
  colors: {
    bg0: '#07090c',
    bg1: '#0d1218',
    surface: 'rgba(18, 24, 31, 0.86)',
    surfaceRaised: 'rgba(26, 34, 43, 0.94)',
    textPrimary: '#f3f7fa',
    textSecondary: '#8995a1',
    textMuted: '#52606d',
    accent: '#ffb84a',
    accentBright: '#ffd37a',
    accentDim: '#6d4b1e',
    danger: '#ff5f5f',
    dangerDim: '#6e2424',
    success: '#70e0b0',
    border: 'rgba(255, 184, 74, 0.28)',
    borderHover: 'rgba(255, 211, 122, 0.65)',
    plateBg: 'rgba(10, 14, 20, 0.92)',
  },
  typography: {
    fontDisplay: "'KenneyFuture', monospace, sans-serif",
    fontCondensed: "'KenneyFutureNarrow', monospace, sans-serif",
    fontSans:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    fontMono: "'Courier New', Courier, monospace",
    sizes: {
      xs: '11px',
      sm: '12px',
      base: '14px',
      md: '16px',
      lg: '20px',
      xl: '28px',
      hero: '36px',
    },
    letterSpacing: {
      tight: '0.02em',
      normal: '0.05em',
      wide: '0.12em',
      widest: '0.2em',
    },
  },
  phaserColors: {
    amber: 0xffb84a,
    bright: 0xfff0c2,
    accentDim: 0x6d4b1e,
    danger: 0xff5f5f,
    success: 0x70e0b0,
    bg: 0x07090c,
    bgGrid: 0x0d1218,
    textPrimary: 0xf3f7fa,
    textSecondary: 0x8995a1,
  },
  shadows: {
    panel: '0 8px 32px rgba(0, 0, 0, 0.65)',
    glow: '0 0 12px rgba(255, 184, 74, 0.35)',
    glowBright: '0 0 20px rgba(255, 211, 122, 0.65)',
  },
} as const;
