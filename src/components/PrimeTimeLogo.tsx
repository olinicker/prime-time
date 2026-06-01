/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface PrimeTimeLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textColorClass?: string;
}

export const PrimeTimeLogo: React.FC<PrimeTimeLogoProps> = ({
  className = '',
  size = 36,
  showText = false,
  textColorClass = 'text-zinc-100',
}) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <defs>
          {/* Main glowing mint-green-cyan to rich emerald gradient */}
          <linearGradient id="pt-glow" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0d9488" /> {/* teal-600 */}
            <stop offset="35%" stopColor="#10b981" /> {/* emerald-500 */}
            <stop offset="80%" stopColor="#34d399" /> {/* emerald-400 */}
            <stop offset="100%" stopColor="#a7f3d0" /> {/* mint-200 */}
          </linearGradient>

          {/* Dark rich shadow gradient for back fold */}
          <linearGradient id="pt-deep" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#042f2e" />
            <stop offset="50%" stopColor="#064e3b" />
            <stop offset="100%" stopColor="#022c22" />
          </linearGradient>

          {/* Bright neon gloss for highlights */}
          <linearGradient id="pt-highlight" x1="10%" y1="100%" x2="90%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#6ee7b7" />
          </linearGradient>

          {/* Premium soft drop shadow filter to elevate the 3D planes */}
          <filter id="pt-shadow" x="-20%" y="-20%" width="150%" height="150%">
            <feDropShadow dx="1" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.45" />
          </filter>
        </defs>

        {/* 3D Folded Wing Geometry mimicking the user-provided logo */}
        <g>
          {/* Facet 1: The Under/Back Dark Wing (adds depth and shadow) */}
          <polygon
            points="18,48 76,33 60,54"
            fill="url(#pt-deep)"
          />

          {/* Facet 2: The bottom shadow flap */}
          <polygon
            points="18,48 60,54 48,70"
            fill="#011f18"
          />

          {/* Facet 3: Main top wing surface (bright emerald gradient) */}
          <polygon
            points="15,45 80,35 48,58"
            fill="url(#pt-glow)"
            filter="url(#pt-shadow)"
          />

          {/* Facet 4: Front bottom folded wing crease (adds 3D metallic feel) */}
          <polygon
            points="15,45 48,58 38,76"
            fill="url(#pt-highlight)"
            filter="url(#pt-shadow)"
          />

          {/* Facet 5: Dynamic glowing center crease overlay */}
          <polygon
            points="48,58 80,35 70,52"
            fill="url(#pt-highlight)"
            opacity="0.6"
            filter="url(#pt-shadow)"
          />
        </g>
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span className={`${textColorClass} font-bold tracking-tight leading-none text-base uppercase font-sans`}>
            PRIME TIME
          </span>
          <span className="text-[10px] text-emerald-500 font-medium font-mono uppercase tracking-wider mt-0.5">
            enterprise v1.4
          </span>
        </div>
      )}
    </div>
  );
};
