import React from 'react';
import { HudState } from '@/game/controller/GameController';

export interface HUDOverlayProps {
  hud?: HudState;
  children?: React.ReactNode;
}

/**
 * Tactical in-viewport HUD overlay container (Spec 5.E).
 * Obsolete in-canvas 5-box stats row, 100 HP bar, and Target Lock panels purged (Rule R-C).
 */
export const HUDOverlay: React.FC<HUDOverlayProps> = ({ children }) => {
  return (
    <div
      className="hud-overlay"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {children}
    </div>
  );
};
