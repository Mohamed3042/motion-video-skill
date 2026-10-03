// Shared by act 0 (cold open) and act 1 (reveal): the exact Explore window at the f600 seam.
import React from 'react';
import {Screen, WINDOW_RECT} from '../../kit';
import {K} from './world';

export const SEAM_RIM = 0.55;
export const SEAM_W = WINDOW_RECT.w * K; // 1712.9 px (window 1586×936 src → 1713×1011)

// The Explore window as a flat 2D element centered at (cx, cy). At the seam: width SEAM_W at (960, 540).
export const ExploreWindow: React.FC<{width?: number; cx?: number; cy?: number; rim?: number; shadow?: number; style?: React.CSSProperties; children?: React.ReactNode}> = ({
  width = SEAM_W,
  cx = 960,
  cy = 540,
  rim = SEAM_RIM,
  shadow = 1,
  style,
  children,
}) => {
  const h = (WINDOW_RECT.h * width) / WINDOW_RECT.w;
  return (
    <div style={{position: 'absolute', left: cx - width / 2, top: cy - h / 2, ...style}}>
      <Screen id="04-explore" width={width} rim={rim} shadow={shadow}>
        {children}
      </Screen>
    </div>
  );
};
