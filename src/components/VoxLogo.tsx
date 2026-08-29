import React from 'react';
import { useTheme } from '../lib/ThemeContext';

interface VoxLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: 'dark' | 'light' | 'auto';
  accentColor?: string;
}

export const VoxLogo: React.FC<VoxLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  textColor = 'auto',
  accentColor = '#20DE92',
}) => {
  const { theme } = useTheme();

  // Dimensions for full logo vs icon only
  const dimensions = {
    xs: { width: showText ? 90 : 16, height: showText ? 32 : 18 },
    sm: { width: showText ? 115 : 20, height: showText ? 40 : 22 },
    md: { width: showText ? 135 : 24, height: showText ? 48 : 28 },
    lg: { width: showText ? 170 : 32, height: showText ? 60 : 36 },
    xl: { width: showText ? 220 : 42, height: showText ? 78 : 46 },
  }[size];

  const isDarkText = textColor === 'dark' || (textColor === 'auto' && theme === 'light');
  const voxFill = isDarkText ? '#090A0F' : '#FFFFFF';
  const greenFill = accentColor || '#20DE92';

  if (!showText) {
    // Dual Pill Minimal Icon Only (||)
    return (
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox="0 0 110 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`select-none shrink-0 ${className}`}
        aria-label="VOX Logo"
      >
        <rect x="0" y="5" width="44" height="140" rx="22" fill={greenFill} />
        <rect x="66" y="5" width="44" height="140" rx="22" fill={greenFill} />
      </svg>
    );
  }

  // Full Signature Logo: [ ||  VOX  ] with [ —————— OZET ] underneath
  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox="0 0 460 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-auto h-auto max-h-full shrink-0"
        aria-label="VOX ÖZET Logo"
      >
        {/* Left Signature Dual Pillars (||) */}
        <rect x="10" y="12" width="40" height="126" rx="20" fill={greenFill} />
        <rect x="68" y="12" width="40" height="126" rx="20" fill={greenFill} />

        {/* Main Brand Wordmark: VOX */}
        <text
          x="142"
          y="120"
          fill={voxFill}
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
          fontWeight="900"
          fontSize="132"
          letterSpacing="-4"
        >
          VOX
        </text>

        {/* Baseline Underline spanning below V and O */}
        <line
          x1="152"
          y1="148"
          x2="330"
          y2="148"
          stroke={greenFill}
          strokeWidth="4.5"
          strokeLinecap="round"
        />

        {/* Subtitle Wordmark: OZET in Classical Serif */}
        <text
          x="338"
          y="157"
          fill={greenFill}
          fontFamily="Georgia, 'Times New Roman', 'Playfair Display', serif"
          fontWeight="900"
          fontSize="36"
          letterSpacing="0.5"
        >
          OZET
        </text>
      </svg>
    </div>
  );
};
