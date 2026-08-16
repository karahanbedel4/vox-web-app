import React from 'react';
import { Play, RotateCcw, X, Headphones } from 'lucide-react';
import { Article } from '../types';
import { ResumePosition } from '../lib/ttsService';

interface ResumeBannerProps {
  article: Article;
  position: ResumePosition;
  onResume: () => void;
  onDismiss: () => void;
}

export const ResumeBanner: React.FC<ResumeBannerProps> = ({
  article,
  position,
  onResume,
  onDismiss,
}) => {
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const progressPercent = position.duration > 0 
    ? Math.min(100, Math.round((position.currentTime / position.duration) * 100)) 
    : 0;

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-surface-container-high/95 via-surface-container/90 to-surface-container-high/95 backdrop-blur-xl border border-primary/30 p-3.5 rounded-2xl shadow-[0_8px_24px_rgba(78,222,163,0.15)] animate-fade-in group hover:border-primary/50 transition-all">
      {/* Background Accent Gradient Glow */}
      <div className="absolute top-0 left-0 w-1/3 h-full bg-primary/10 blur-xl pointer-events-none" />

      {/* Top Thin Progress Bar */}
      <div className="w-full bg-white/10 h-[3px] absolute top-0 left-0 right-0 overflow-hidden">
        <div
          className="bg-primary h-full transition-all duration-300 ease-linear shadow-[0_0_8px_var(--color-primary)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-3 relative z-10 pt-1">
        {/* Left Side: Thumbnail / Icon & Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer" onClick={onResume}>
          <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-surface-container border border-primary/20 shadow-md flex items-center justify-center">
            {article.imageUrl ? (
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <Headphones className="w-5 h-5 text-primary" />
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <RotateCcw className="w-4 h-4 text-primary animate-pulse" />
            </div>
          </div>

          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-ping" />
              <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
                Kaldığın Yerden Dinle
              </span>
              {position.languageMode === 'en' && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-primary/20 text-primary border border-primary/30">
                  🇬🇧 EN
                </span>
              )}
            </div>

            <h4 className="text-xs font-bold text-on-surface truncate group-hover:text-primary transition-colors mt-0.5">
              {article.title}
            </h4>

            <p className="text-[11px] text-on-surface-variant font-mono mt-0.5">
              {formatTime(position.currentTime)} / {formatTime(position.duration)} (%{progressPercent} kaldı)
            </p>
          </div>
        </div>

        {/* Right Side: Resume Button & Dismiss */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onResume}
            className="bg-primary text-on-primary px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-transform shadow-[0_0_12px_rgba(78,222,163,0.3)]"
          >
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            <span className="hidden sm:inline">Devam Et</span>
          </button>

          <button
            onClick={onDismiss}
            className="w-7 h-7 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-white/10 flex items-center justify-center transition-colors"
            title="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
