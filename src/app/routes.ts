export const ScreenRoutes = {
  CONSOLE: 'CONSOLE',
  SETTINGS: 'SETTINGS',
  ABOUT: 'ABOUT',
} as const;

export type ScreenRoute = (typeof ScreenRoutes)[keyof typeof ScreenRoutes];
