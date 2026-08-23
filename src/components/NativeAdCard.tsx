import React, { useEffect, useRef } from 'react';
import { useTheme } from '../lib/ThemeContext';

interface NativeAdCardProps {
  variant?: 'banner' | 'feed' | 'sidebar' | 'in-article';
  className?: string;
  slotId?: string;
}

export const NativeAdCard: React.FC<NativeAdCardProps> = ({ 
  variant = 'feed',
  className = '',
  slotId
}) => {
  const { theme } = useTheme();
  const adRef = useRef<HTMLModElement>(null);
  const isLoadedRef = useRef<boolean>(false);

  useEffect(() => {
    // Prevent double-push in React Strict Mode or fast re-renders
    if (isLoadedRef.current) return;

    try {
      if (adRef.current) {
        const isAlreadyProcessed = adRef.current.getAttribute('data-adsbygoogle-status');
        if (!isAlreadyProcessed) {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          isLoadedRef.current = true;
        }
      }
    } catch (err) {
      console.warn('AdSense native ad init notice:', err);
    }
  }, []);

  if (variant === 'banner') {
    return (
      <div
        id="ad-banner-top"
        className={`w-full rounded-2xl border transition-all overflow-hidden p-2.5 sm:p-3 ${
          theme === 'light'
            ? 'bg-gradient-to-r from-slate-50 to-slate-100/80 border-slate-200 shadow-sm'
            : 'bg-gradient-to-r from-[#161c23] to-[#12161c] border-white/10 shadow-sm'
        } ${className}`}
      >
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
            theme === 'light'
              ? 'text-slate-500 bg-white border-slate-200'
              : 'text-gray-400 bg-white/5 border-white/10'
          }`}>
            Sponsorlu Reklam Alanı
          </span>
          <span className="text-[9px] text-gray-400 font-medium">Reklam</span>
        </div>

        {/* Google AdSense Responsive Leaderboard / Banner */}
        <div className="min-h-[60px] sm:min-h-[90px] w-full flex items-center justify-center overflow-hidden">
          <ins
            ref={adRef}
            className="adsbygoogle"
            style={{ display: 'block', width: '100%', minHeight: '60px' }}
            data-ad-client="ca-pub-4663082689738592"
            {...(slotId ? { 'data-ad-slot': slotId } : {})}
            data-ad-format="horizontal"
            data-full-width-responsive="true"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border transition-all overflow-hidden ${
        variant === 'sidebar' ? 'p-3 sm:p-3.5' : 'p-4 md:p-5'
      } ${
        theme === 'light'
          ? 'bg-white border-slate-200 shadow-sm'
          : 'bg-[#161c23] border-white/5 shadow-sm'
      } ${className}`}
    >
      {/* Subtle Ad / Sponsored Badge to match VOX aesthetic */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
          theme === 'light'
            ? 'text-slate-500 bg-slate-100 border-slate-200'
            : 'text-gray-400 bg-white/5 border-white/10'
        }`}>
          Sponsorlu
        </span>
      </div>

      {/* Google AdSense Fluid / In-Article Container */}
      <div className="min-h-[100px] w-full flex items-center justify-center overflow-hidden">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block', width: '100%' }}
          data-ad-client="ca-pub-4663082689738592"
          {...(slotId ? { 'data-ad-slot': slotId } : {})}
          data-ad-format={variant === 'in-article' ? 'fluid' : 'fluid'}
          data-ad-layout-key={variant === 'sidebar' ? undefined : '-fb+5w+4e-db+86'}
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
};
