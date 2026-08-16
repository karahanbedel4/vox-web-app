import React from 'react';
import { Flame, CheckCircle2, Trophy, Sparkles } from 'lucide-react';
import { StreakInfo } from '../lib/streakService';

interface StreakWidgetProps {
  streakInfo: StreakInfo | null;
  onOpenDetails?: () => void;
}

export const StreakWidget: React.FC<StreakWidgetProps> = ({ streakInfo, onOpenDetails }) => {
  if (!streakInfo) return null;

  const { currentStreak, todaySeconds, todayTargetSeconds, isTodayCompleted, todayProgressPercent } = streakInfo;

  const formatMinSec = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  // Circular progress ring calculation (Radius: 18, Circumference: 2 * PI * 18 = 113.1)
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (todayProgressPercent / 100) * circumference;

  return (
    <div
      onClick={onOpenDetails}
      className={`relative overflow-hidden rounded-2xl p-4 transition-all duration-300 border backdrop-blur-xl shadow-lg cursor-pointer group ${
        isTodayCompleted
          ? 'bg-gradient-to-br from-amber-500/15 via-surface-container-high/90 to-amber-900/10 border-amber-500/40 shadow-[0_4px_20px_rgba(245,158,11,0.15)] hover:border-amber-400/60'
          : 'bg-surface-container-high/80 border-white/10 hover:border-white/20'
      }`}
    >
      {/* Background ambient glow effect when streak target completed */}
      {isTodayCompleted && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
      )}

      <div className="flex items-center justify-between gap-3 relative z-10">
        {/* Left Side: Circular Flame Icon with Progress Ring */}
        <div className="flex items-center gap-3.5">
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            {/* Circular Progress SVG */}
            <svg className="w-12 h-12 -rotate-90 transform" viewBox="0 0 44 44">
              {/* Background Track Circle */}
              <circle
                cx="22"
                cy="22"
                r={radius}
                className="text-white/10 stroke-current"
                strokeWidth="3.5"
                fill="transparent"
              />
              {/* Animated Progress Circle */}
              <circle
                cx="22"
                cy="22"
                r={radius}
                className={`transition-all duration-500 ease-out stroke-current ${
                  isTodayCompleted
                    ? 'text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                    : 'text-primary'
                }`}
                strokeWidth="3.5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Inner Flame Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Flame
                className={`w-6 h-6 transition-all duration-300 ${
                  isTodayCompleted
                    ? 'text-amber-400 fill-amber-400 scale-110 drop-shadow-[0_0_10px_rgba(245,158,11,0.9)] animate-bounce-short'
                    : 'text-zinc-400 fill-zinc-500/30 group-hover:text-zinc-300'
                }`}
              />
            </div>
          </div>

          {/* Text & Streak Count */}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-black tracking-tight text-on-surface">
                {currentStreak > 0 ? `${currentStreak} Günlük Seri` : 'Serini Başlat'}
              </span>
              {isTodayCompleted && (
                <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                  <CheckCircle2 className="w-3 h-3 text-amber-400" />
                  Hedef Tamam
                </span>
              )}
            </div>

            <p className="text-xs text-on-surface-variant font-medium mt-0.5">
              {isTodayCompleted
                ? 'Harika gidiyorsun! Bugünkü 5dk hedefini tamamladın. 🔥'
                : `Bugün ${formatMinSec(todaySeconds)} / 5:00 dinledin (%${todayProgressPercent})`}
            </p>
          </div>
        </div>

        {/* Right Side: Badge / Trophy Status */}
        <div className="shrink-0 flex flex-col items-end justify-center">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
              isTodayCompleted
                ? 'bg-amber-500 text-on-primary border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                : 'bg-white/5 text-on-surface-variant border-white/10'
            }`}
          >
            {isTodayCompleted ? (
              <Trophy className="w-5 h-5 fill-current" />
            ) : (
              <Sparkles className="w-4 h-4 text-primary" />
            )}
          </div>
        </div>
      </div>

      {/* Horizontal Bottom Progress Bar */}
      <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out rounded-full ${
            isTodayCompleted
              ? 'bg-gradient-to-r from-amber-500 to-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.8)]'
              : 'bg-gradient-to-r from-primary/60 to-primary shadow-[0_0_6px_var(--color-primary)]'
          }`}
          style={{ width: `${Math.max(4, todayProgressPercent)}%` }}
        />
      </div>
    </div>
  );
};
