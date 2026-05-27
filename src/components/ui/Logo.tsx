import React from 'react';

export interface LogoProps {
  size?: number;
}

export function MotiveLogo({ size = 32 }: LogoProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="motive-logo-grad-reusable" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-motive-light-blue)" />
            <stop offset="100%" stopColor="var(--color-motive-dark-blue)" />
          </linearGradient>
        </defs>
        <path d="M20,80 L35,20 L50,55 L65,20 L80,80 L68,80 L57,38 L50,55 L43,38 L32,80 Z" fill="url(#motive-logo-grad-reusable)" />
        <circle cx="50" cy="72" r="5" fill="var(--color-motive-light-blue)" />
      </svg>
    </div>
  );
}
