import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserProfile } from '../types';
import { Sparkles, Flame } from 'lucide-react';
import { StreakInfo } from '../lib/streakService';
import { VoxLogo } from './VoxLogo';

interface HeaderProps {
  user: UserProfile | null;
  onOpenProfile: () => void;
  focusScore?: number;
  isHidden?: boolean;
  isPremium?: boolean;
  isGuest?: boolean;
  onOpenPaywall?: () => void;
  onOpenAuthModal?: () => void;
  streakInfo?: StreakInfo | null;
}

export const Header: React.FC<HeaderProps> = ({ 
  user, 
  onOpenProfile, 
  focusScore = 0, 
  isHidden = false,
  isPremium = false,
  isGuest = false,
  onOpenPaywall,
  onOpenAuthModal,
  streakInfo
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-surface-container border-b border-card-border flex justify-between items-center px-4 max-w-md mx-auto shadow-md transition-all duration-300 ease-in-out pt-[calc(0.5rem+env(safe-area-inset-top,0px))] ${
      isScrolled ? 'pb-2 h-[calc(3.25rem+env(safe-area-inset-top,0px))] shadow-lg' : 'pb-3 h-[calc(4rem+env(safe-area-inset-top,0px))]'
    } ${
      isHidden ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
    }`}>
      {/* Brand Logo & Compact Streak Badge */}
      <div className="flex items-center gap-2">
        <Link 
          to="/" 
          className="flex items-center gap-1.5 cursor-pointer group active:scale-95 transition-transform"
          title="Ana Sayfaya Git (Haber Akışı)"
        >
          <VoxLogo size={isScrolled ? 'xs' : 'sm'} />
        </Link>

        {isPremium && (
          <span className="bg-primary/15 border border-primary/40 text-primary text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-sm">
            <Sparkles className="w-2.5 h-2.5 fill-current" />
            PRO
          </span>
        )}
        {streakInfo && streakInfo.currentStreak > 0 && (
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border transition-all ${
              streakInfo.isTodayCompleted
                ? 'bg-amber-500/20 text-amber-500 border-amber-500/40 shadow-sm'
                : 'bg-surface-variant text-on-surface-variant border-card-border'
            }`}
            title={`Günlük Seri: ${streakInfo.currentStreak} gün`}
          >
            <Flame
              className={`w-3 h-3 ${
                streakInfo.isTodayCompleted ? 'text-amber-500 fill-amber-500 animate-pulse' : 'text-on-surface-variant/60'
              }`}
            />
            <span>{streakInfo.currentStreak}</span>
          </div>
        )}
      </div>

      {/* Right Section: User Name Pill & Profile Avatar */}
      <div className="flex items-center gap-2">
        {isGuest && onOpenAuthModal ? (
          <button
            onClick={onOpenAuthModal}
            className="bg-primary/15 hover:bg-primary/25 text-primary border border-primary/40 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 active:scale-95 transition-all shadow-sm"
          >
            <span>GİRİŞ YAP</span>
          </button>
        ) : !isPremium && onOpenPaywall ? (
          <button
            onClick={onOpenPaywall}
            className="bg-gradient-to-r from-amber-500/15 to-primary/15 hover:from-amber-500/25 hover:to-primary/25 text-primary border border-primary/40 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 active:scale-95 transition-all shadow-sm"
          >
            <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span>YÜKSELT</span>
          </button>
        ) : null}

        {/* User Name Badge */}
        <div 
          onClick={onOpenProfile}
          className="cursor-pointer bg-surface-variant border border-card-border rounded-full px-2.5 py-1 flex items-center gap-1.5 shadow-sm hover:border-primary transition-colors"
        >
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          <span className="text-xs font-semibold text-on-surface tracking-wide max-w-[85px] truncate">
            {user?.displayName || 'Misafir'}
          </span>
        </div>

        {/* User Avatar */}
        <button 
          onClick={onOpenProfile}
          className={`relative rounded-full border border-primary/40 p-0.5 overflow-hidden active:scale-95 transition-all duration-300 ${
            isScrolled ? 'w-7 h-7' : 'w-8 h-8'
          }`}
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
          ) : (
            <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
              {user?.displayName ? user.displayName.substring(0, 2).toUpperCase() : 'VX'}
            </div>
          )}
        </button>
      </div>
    </header>
  );
};

