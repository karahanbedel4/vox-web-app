import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Target, 
  Play, 
  Pause, 
  RotateCcw, 
  Coffee, 
  Flame, 
  ArrowRight, 
  X, 
  ExternalLink,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFocus, formatFocusTime } from '../lib/FocusContext';
import { useTheme } from '../lib/ThemeContext';

export const FocusTopBanner: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const {
    isRunning,
    sessionType,
    timeLeft,
    workMinutes,
    breakMinutes,
    focusGoal,
    progressPercent,
    toggleTimer,
    resetTimer,
    isTopBannerDismissed,
    setIsTopBannerDismissed,
    tasks
  } = useFocus();

  // Only show when the timer is active/running AND the user is NOT currently viewing the /odaklan page
  const isFocusRoute = location.pathname === '/odaklan';
  const shouldShow = (isRunning || (timeLeft > 0 && timeLeft < (sessionType === 'work' ? workMinutes : breakMinutes) * 60)) 
    && !isFocusRoute 
    && !isTopBannerDismissed;

  const completedCount = tasks.filter(t => t.done).length;

  const handleNavigateToFocus = () => {
    navigate('/odaklan');
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ y: -70, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -70, opacity: 0, scale: 0.96 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-lg select-none pointer-events-auto"
        >
          {/* Glass Card Container (Media Player Style Floating Island) */}
          <div 
            className={`relative overflow-hidden rounded-2xl sm:rounded-full px-3.5 sm:px-4 py-2 sm:py-2.5 backdrop-blur-2xl border shadow-2xl transition-all flex items-center justify-between gap-3 ${
              theme === 'light'
                ? 'bg-slate-900/95 border-emerald-500/50 text-white shadow-emerald-950/20'
                : 'bg-[#0d1611]/95 border-[#1ed760]/45 text-white shadow-black/80'
            }`}
          >
            {/* Top Linear Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  sessionType === 'work' 
                    ? 'bg-gradient-to-r from-[#1ed760] to-teal-400' 
                    : 'bg-gradient-to-r from-amber-400 to-orange-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Left Section: Glowing Icon & Live Status Info */}
            <div 
              onClick={handleNavigateToFocus}
              className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group"
              title="Odaklanma Sayfasına Git"
            >
              {/* Animated Icon Avatar */}
              <div className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 shadow-md ${
                sessionType === 'work'
                  ? 'bg-emerald-500/20 text-[#1ed760] border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}>
                {sessionType === 'work' ? (
                  <Target className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${isRunning ? 'animate-pulse' : ''}`} />
                ) : (
                  <Coffee className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${isRunning ? 'animate-bounce' : ''}`} />
                )}
                {isRunning && (
                  <span className={`absolute inset-0 rounded-full animate-ping opacity-30 ${
                    sessionType === 'work' ? 'bg-[#1ed760]' : 'bg-amber-400'
                  }`} />
                )}
              </div>

              {/* Title & Goal Name */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 leading-tight">
                  <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider ${
                    sessionType === 'work' ? 'text-[#1ed760]' : 'text-amber-400'
                  }`}>
                    {sessionType === 'work' 
                      ? (isRunning ? 'Odak Modu Aktif' : 'Odak Duraklatıldı') 
                      : (isRunning ? 'Mola Vakti' : 'Mola Duraklatıldı')}
                  </span>
                  {tasks.length > 0 && (
                    <span className="hidden sm:inline-flex text-[9px] font-mono text-white/50 bg-white/10 px-1.5 py-0.2 rounded-full">
                      {completedCount}/{tasks.length} Görev
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 mt-0.5">
                  <p className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-[200px] group-hover:text-[#1ed760] transition-colors">
                    {focusGoal || 'Odaklanma Seansı'}
                  </p>
                </div>
              </div>
            </div>

            {/* Middle: Monospace Digital Countdown Clock */}
            <div 
              onClick={handleNavigateToFocus}
              className="flex items-center shrink-0 cursor-pointer px-1.5 py-0.5 rounded-lg hover:bg-white/5 transition-colors"
              title="Odak Sayfasına Git"
            >
              <span className={`font-mono text-base sm:text-lg font-black tracking-tight ${
                sessionType === 'work' ? 'text-[#1ed760]' : 'text-amber-400'
              }`}>
                {formatFocusTime(timeLeft)}
              </span>
            </div>

            {/* Right Controls: Play/Pause, Go to Tab & Minimize */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Play / Pause Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTimer();
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-black shadow-md active:scale-90 transition-all cursor-pointer ${
                  sessionType === 'work'
                    ? 'bg-[#1ed760] hover:brightness-110'
                    : 'bg-amber-400 hover:brightness-110'
                }`}
                title={isRunning ? 'Duraklat' : 'Devam Et'}
              >
                {isRunning ? (
                  <Pause className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                )}
              </button>

              {/* Jump to Focus Tab Button */}
              <button
                onClick={handleNavigateToFocus}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold active:scale-95 transition-all cursor-pointer"
                title="Odaklanma Ekranını Aç"
              >
                <span>Odağa Git</span>
                <ArrowRight className="w-3 h-3 text-[#1ed760]" />
              </button>

              {/* Dismiss / Close Mini Banner */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsTopBannerDismissed(true);
                }}
                className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 active:scale-90 transition-colors cursor-pointer"
                title="Bildirimi Gizle"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
