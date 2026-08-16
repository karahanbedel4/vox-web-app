import React, { useEffect, useRef } from 'react';
import { useTheme } from '../lib/ThemeContext';

interface NativeAdCardProps {
  variant?: 'feed' | 'sidebar';
  className?: string;
}

export const NativeAdCard: React.FC<NativeAdCardProps> = ({ 
  variant = 'feed',
  className = '' 
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

      {/* Google AdSense In-Feed Fluid Ad Container */}
      <div className="min-h-[100px] w-full flex items-center justify-center overflow-hidden">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block', width: '100%' }}
          data-ad-client="ca-pub-4663082689738592"
          data-ad-format="fluid"
          data-ad-layout-key="-fb+5w+4e-db+86"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
};
