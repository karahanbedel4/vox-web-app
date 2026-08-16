import React from 'react';

interface VoxLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const VoxLogo: React.FC<VoxLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  const iconDimensions = {
    sm: { width: 18, height: 22, barW: 5.5, barH: 20, rx: 2.75, gap: 4 },
    md: { width: 24, height: 28, barW: 7, barH: 26, rx: 3.5, gap: 5 },
    lg: { width: 32, height: 36, barW: 9.5, barH: 34, rx: 4.75, gap: 6 },
  }[size];

  const textSize = {
    sm: 'text-lg tracking-tight',
    md: 'text-2xl tracking-tighter',
    lg: 'text-3xl tracking-tighter',
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Symbol: Two vertical, thick, rounded rectangles with emerald gradient */}
      <svg
        width={iconDimensions.width}
        height={iconDimensions.height}
        viewBox={`0 0 ${iconDimensions.width} ${iconDimensions.height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-[0_2px_8px_rgba(16,185,129,0.3)]"
      >
        <defs>
          <linearGradient id="vox-emerald-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        {/* Left Bar */}
        <rect
          x="0"
          y={(iconDimensions.height - iconDimensions.barH) / 2}
          width={iconDimensions.barW}
          height={iconDimensions.barH}
          rx={iconDimensions.rx}
          fill="url(#vox-emerald-grad)"
        />
        {/* Right Bar */}
        <rect
          x={iconDimensions.barW + iconDimensions.gap}
          y={(iconDimensions.height - iconDimensions.barH) / 2}
          width={iconDimensions.barW}
          height={iconDimensions.barH}
          rx={iconDimensions.rx}
          fill="url(#vox-emerald-grad)"
        />
      </svg>

      {/* Text: "VOX" in heavy, bold sans-serif font in solid white */}
      {showText && (
        <span className={`font-black font-sans text-white uppercase ${textSize} leading-none`}>
          VOX
        </span>
      )}
    </div>
  );
};
