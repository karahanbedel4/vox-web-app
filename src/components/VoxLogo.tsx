import React from 'react';
import { useTheme } from '../lib/ThemeContext';

interface VoxLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: 'dark' | 'light' | 'auto';
}

export const VoxLogo: React.FC<VoxLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  textColor = 'auto',
}) => {
  const { theme } = useTheme();

  // Dimensions for the 2 pause bars symbol (||)
  const iconDimensions = {
    sm: { width: 16, height: 20, barW: 5, barH: 18, rx: 2.5, gap: 4 },
    md: { width: 22, height: 26, barW: 6.5, barH: 22, rx: 3, gap: 5 },
    lg: { width: 28, height: 32, barW: 8.5, barH: 28, rx: 4, gap: 6 },
    xl: { width: 36, height: 40, barW: 11, barH: 36, rx: 5, gap: 7 },
  }[size];

  const textSize = {
    sm: 'text-xl tracking-tight',
    md: 'text-2xl tracking-tighter',
    lg: 'text-3xl tracking-tighter',
    xl: 'text-4xl tracking-tighter',
  }[size];

  const isDarkText = textColor === 'dark' || (textColor === 'auto' && theme === 'light');
  const textClass = isDarkText ? 'text-slate-950' : 'text-white';

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* The 2 Vertical Emerald Bars Symbol (Pause / Equalizer Icon) */}
      <svg
        width={iconDimensions.width}
        height={iconDimensions.height}
        viewBox={`0 0 ${iconDimensions.width} ${iconDimensions.height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Left Bar (Deep Emerald) */}
        <rect
          x="0"
          y={(iconDimensions.height - iconDimensions.barH) / 2}
          width={iconDimensions.barW}
          height={iconDimensions.barH}
          rx={iconDimensions.rx}
          fill="#10b981"
        />
        {/* Right Bar (Deep Emerald) */}
        <rect
          x={iconDimensions.barW + iconDimensions.gap}
          y={(iconDimensions.height - iconDimensions.barH) / 2}
          width={iconDimensions.barW}
          height={iconDimensions.barH}
          rx={iconDimensions.rx}
          fill="#059669"
        />
      </svg>

      {/* Text: "VOX" */}
      {showText && (
        <span className={`font-black font-sans uppercase ${textClass} ${textSize} leading-none transition-colors duration-200`}>
          VOX
        </span>
      )}
    </div>
  );
};


