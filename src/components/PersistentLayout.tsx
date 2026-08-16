import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Newspaper, 
  Target, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  X, 
  Sparkles, 
  RotateCcw, 
  Headphones, 
  Sliders, 
  Clock, 
  ExternalLink, 
  LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Article, UserProfile, PlaybackState } from '../types';
import { ttsService } from '../lib/ttsService';
import { AppStorePaywallModal } from './AppStorePaywallModal';
import { AuthModal } from './AuthModal';
import { AmbientMixerSheet, AmbientChannel } from './AmbientMixerSheet';
import { AmbientNotificationBanner } from './AmbientControls';
import { getTopicContextualImage } from '../lib/newsService';
import { woodRainSynth } from '../lib/audioSynth';

interface PersistentLayoutProps {
  user: UserProfile | null;
  subscription: any;
  readingArticle: Article | null;
  setReadingArticle: (article: Article | null) => void;
  onPlayArticle: (article: Article) => void;
  onOpenPaywall: (reason?: 'limit_reached' | 'pages_exceeded' | 'not_logged_in') => void;
  ambientChannels: AmbientChannel[];
  setAmbientChannels: React.Dispatch<React.SetStateAction<AmbientChannel[]>>;
  isAmbientMixerOpen: boolean;
  setIsAmbientMixerOpen: (open: boolean) => void;
}

export const PersistentLayout: React.FC<PersistentLayoutProps> = ({
  user,
  subscription,
  readingArticle,
  setReadingArticle,
  onPlayArticle,
  onOpenPaywall,
  ambientChannels,
  setAmbientChannels,
  isAmbientMixerOpen,
  setIsAmbientMixerOpen
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [playbackState, setPlaybackState] = useState<PlaybackState>(ttsService.getState());
  const [volume, setVolume] = useState<number>(100);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [topNotificationText, setTopNotificationText] = useState<string | null>(null);
  const modalScrollRef = useRef<HTMLDivElement>(null);

  // Active ambient channels
  const activeAmbientChannels = ambientChannels.filter(c => c.active && c.volume > 0);
  const isAmbientActive = activeAmbientChannels.length > 0;
  
  // Format ambient channel names with friendly icon
  const getAmbientDisplayTitle = () => {
    if (activeAmbientChannels.length === 0) return '';
    if (activeAmbientChannels.length === 1) {
      const ch = activeAmbientChannels[0];
      const icon = ch.id.includes('rain') ? '🌧️' : ch.id.includes('forest') ? '🌿' : ch.id.includes('cafe') ? '☕' : ch.id.includes('thunder') ? '⚡' : '🎧';
      return `${icon} ${ch.name}`;
    }
    return `🌿 Çoklu Ambiyans (${activeAmbientChannels.length} Ses)`;
  };

  // Keep track of the last active ambient channel id for toggle resume
  const lastActiveAmbientIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (activeAmbientChannels.length > 0) {
      lastActiveAmbientIdRef.current = activeAmbientChannels[0].id;
    }
  }, [activeAmbientChannels]);

  // Sync volume slider with active sound source
  useEffect(() => {
    if (!playbackState.currentArticle && activeAmbientChannels.length > 0) {
      const primaryVol = activeAmbientChannels[0].volume;
      setVolume(primaryVol);
      setIsMuted(primaryVol === 0);
    }
  }, [activeAmbientChannels.length]);

  useEffect(() => {
    const unsubscribe = ttsService.subscribe((state) => {
      setPlaybackState(state);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleTogglePlay = () => {
    if (playbackState.currentArticle) {
      if (playbackState.isPlaying) {
        ttsService.pause();
      } else {
        ttsService.play();
      }
    } else if (isAmbientActive) {
      // Pause all active ambient channels
      setAmbientChannels(prev => prev.map(c => ({ ...c, active: false })));
    } else {
      // Resume previously active ambient channel or first channel
      const targetId = lastActiveAmbientIdRef.current || (ambientChannels[0] && ambientChannels[0].id);
      if (targetId) {
        setAmbientChannels(prev => prev.map(c => c.id === targetId ? { ...c, active: true, volume: c.volume > 0 ? c.volume : (volume > 0 ? volume : 60) } : c));
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    ttsService.seek(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    ttsService.setVolume(newVol / 100);
    woodRainSynth.setMasterVolume(newVol / 100);
    setIsMuted(newVol === 0);

    // Synchronize volume to active ambient channels in real time
    setAmbientChannels(prev => prev.map(c => {
      if (c.active) {
        return { ...c, volume: newVol };
      }
      return c;
    }));
  };

  const toggleMute = () => {
    if (isMuted) {
      const restoredVol = volume > 0 ? volume : 60;
      setIsMuted(false);
      setVolume(restoredVol);
      ttsService.setVolume(restoredVol / 100);
      woodRainSynth.setMasterVolume(restoredVol / 100);
      setAmbientChannels(prev => prev.map(c => {
        if (c.active) {
          return { ...c, volume: restoredVol };
        }
        return c;
      }));
    } else {
      setIsMuted(true);
      ttsService.setVolume(0);
      woodRainSynth.setMasterVolume(0);
      setAmbientChannels(prev => prev.map(c => {
        if (c.active) {
          return { ...c, volume: 0 };
        }
        return c;
      }));
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const activeArticle = playbackState.currentArticle;

  return (
    <div className="flex min-h-screen bg-[#0a0d0b] text-gray-200 antialiased font-sans selection:bg-[#1ed760]/30">
      {/* Top Ambient Toast Banner */}
      <AmbientNotificationBanner
        notificationText={topNotificationText}
        onDismiss={() => setTopNotificationText(null)}
        onOpenMixer={() => setIsAmbientMixerOpen(true)}
      />

      {/* LEFT SIDEBAR (Desktop Fixed w-64) - SIMPLIFIED TO 2 CORE TABS */}
      <aside className="hidden md:flex w-64 flex-shrink-0 border-r border-white/5 bg-[#121814] flex-col justify-between h-screen fixed top-0 left-0 z-40">
        <div className="p-6 flex flex-col gap-6">
          <div>
            <Link 
              to="/gundem" 
              className="inline-block cursor-pointer group hover:opacity-85 transition-opacity" 
              title="Ana Sayfaya Git (Haber Akışı)"
            >
              <h1 className="text-3xl font-black text-white tracking-tighter">VOX</h1>
            </Link>
            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-bold leading-relaxed">
              READ LESS. LISTEN MORE. FOCUS BETTER.
            </p>
          </div>

          {/* SADECE İKİ ANA SEKME */}
          <nav className="flex flex-col gap-2 pt-2">
            <NavLink
              to="/gundem"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                  isActive || location.pathname === '/' || location.pathname === '/teknoloji' || location.pathname === '/ekonomi'
                    ? 'bg-[#1ed760]/15 text-[#1ed760] border border-[#1ed760]/30 shadow-[0_0_15px_rgba(30,215,96,0.12)]'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Newspaper className="w-5 h-5 text-[#1ed760]" />
              <span>📰 Haber Akışı</span>
            </NavLink>

            <NavLink
              to="/odaklan"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-[#1ed760]/15 text-[#1ed760] border border-[#1ed760]/30 shadow-[0_0_15px_rgba(30,215,96,0.12)]'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Target className="w-5 h-5 text-[#1ed760]" />
              <span>🎯 Odaklan</span>
            </NavLink>
          </nav>
        </div>

        {/* Sidebar Footer User Card */}
        <div className="p-4 border-t border-white/5">
          {user && user.authProvider !== 'guest' && user.email !== 'misafir@vox.app' ? (
            <NavLink
              to="/profil"
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-full bg-[#1ed760]/20 border border-[#1ed760]/40 flex items-center justify-center text-[#1ed760] font-bold shrink-0">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white truncate group-hover:text-[#1ed760] transition-colors">
                  {user?.displayName || 'VOX Kullanıcısı'}
                </span>
                <span className="text-[10px] text-[#1ed760] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1ed760] animate-pulse"></span>
                  Web Pro Sürümü
                </span>
              </div>
            </NavLink>
          ) : (
            <div className="flex flex-col gap-2">
              <NavLink
                to="/profil"
                className="flex items-center gap-2.5 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 font-bold shrink-0 text-xs">
                  M
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-gray-300 truncate">Misafir Kullanıcı</span>
                  <span className="text-[10px] text-gray-500">Kayıtsız Kullanıcı</span>
                </div>
              </NavLink>
              <button
                onClick={() => subscription.setIsAuthModalOpen(true)}
                className="w-full py-2 px-3 rounded-xl bg-[#1ed760]/15 hover:bg-[#1ed760]/25 text-[#1ed760] border border-[#1ed760]/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-[0_0_12px_rgba(30,215,96,0.1)]"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Giriş Yap</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR (2 Primary Tabs) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#121814]/95 backdrop-blur-xl border-t border-white/10 px-4 py-2.5 flex items-center justify-around text-xs">
        <NavLink
          to="/gundem"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
              isActive || location.pathname === '/' || location.pathname === '/teknoloji' || location.pathname === '/ekonomi' ? 'text-[#1ed760] font-bold' : 'text-gray-400'
            }`
          }
        >
          <Newspaper className="w-5 h-5" />
          <span className="text-[11px]">Haber Akışı</span>
        </NavLink>

        <NavLink
          to="/odaklan"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
              isActive ? 'text-[#1ed760] font-bold' : 'text-gray-400'
            }`
          }
        >
          <Target className="w-5 h-5" />
          <span className="text-[11px]">Odaklan</span>
        </NavLink>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 ml-0 md:ml-64 pb-28 min-h-screen overflow-y-auto">
        <Outlet />
      </main>

      {/* PERSISTENT BOTTOM AUDIO PLAYER (Fixed across all route changes) */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 h-20 bg-[#121814]/95 backdrop-blur-xl border-t border-white/5 z-40 flex items-center justify-between px-4 md:px-8 shadow-2xl">
        {/* Track / Soundscape Info */}
        <div className="flex items-center gap-3 w-1/3 min-w-0">
          {activeArticle ? (
            <>
              <div 
                onClick={() => setReadingArticle(activeArticle)}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1ed760]/20 to-teal-500/20 border border-[#1ed760]/30 flex items-center justify-center shrink-0 text-[#1ed760] cursor-pointer hover:scale-105 transition-transform overflow-hidden"
              >
                {activeArticle.imageUrl ? (
                  <img src={activeArticle.imageUrl} alt={activeArticle.title} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <Headphones className="w-6 h-6 animate-pulse" />
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-[#1ed760] uppercase tracking-wider flex items-center gap-1.5 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1ed760] animate-ping"></span>
                  {playbackState.isPlaying ? 'ŞİMDİ DİNLENİYOR' : 'DURAKLATILDI'}
                </span>
                <h4 
                  onClick={() => setReadingArticle(activeArticle)}
                  className="text-xs font-bold text-white truncate cursor-pointer hover:text-[#1ed760] transition-colors"
                >
                  {activeArticle.title}
                </h4>
                <p className="text-[10px] text-gray-400 truncate">{activeArticle.author || 'VOX Stüdyo'}</p>
              </div>
            </>
          ) : isAmbientActive ? (
            <>
              <div 
                onClick={() => setIsAmbientMixerOpen(true)}
                className="w-12 h-12 rounded-xl bg-[#1ed760]/20 border border-[#1ed760]/30 flex items-center justify-center shrink-0 text-[#1ed760] cursor-pointer relative overflow-hidden"
              >
                <div className="flex items-end gap-0.5 h-5">
                  <div className="w-1 bg-[#1ed760] rounded-full animate-eq-1" />
                  <div className="w-1 bg-[#1ed760] rounded-full animate-eq-2" />
                  <div className="w-1 bg-[#1ed760] rounded-full animate-eq-3" />
                  <div className="w-1 bg-[#1ed760] rounded-full animate-eq-4" />
                </div>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-[#1ed760] uppercase tracking-wider flex items-center gap-1.5 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1ed760] animate-pulse"></span>
                  🌿 AMBİYANS SESLERİ
                </span>
                <h4 className="text-xs font-bold text-white truncate">{getAmbientDisplayTitle()}</h4>
                <p className="text-[10px] text-gray-400">Arka planda kesintisiz çalıyor</p>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 text-gray-500">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Headphones className="w-5 h-5 text-gray-600" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-medium text-gray-400">Herhangi bir ses oynatılmıyor</h4>
                <p className="text-[10px] text-gray-600">Odaklan sekmesinden bir ambiyans sesi seçin</p>
              </div>
            </div>
          )}
        </div>

        {/* Player Controls & Seek Slider */}
        <div className="flex flex-col items-center gap-1.5 w-1/3 max-w-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => activeArticle && ttsService.seek(Math.max(0, playbackState.currentTime - 15))}
              disabled={!activeArticle}
              className="text-gray-400 hover:text-white disabled:opacity-30 transition-colors p-1"
              title="15 saniye geri sar"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={handleTogglePlay}
              disabled={!activeArticle && !isAmbientActive}
              className="w-10 h-10 rounded-full bg-[#1ed760] text-black font-bold flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(30,215,96,0.3)] disabled:opacity-40"
              title={
                activeArticle
                  ? (playbackState.isPlaying ? 'Duraklat' : 'Oynat')
                  : (isAmbientActive ? 'Ambiyans Sesini Duraklat' : 'Ambiyans Sesini Çal')
              }
            >
              {(playbackState.isPlaying || (!activeArticle && isAmbientActive)) ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={() => activeArticle && ttsService.seek(Math.min(playbackState.duration, playbackState.currentTime + 15))}
              disabled={!activeArticle}
              className="text-gray-400 hover:text-white disabled:opacity-30 transition-colors p-1"
              title="15 saniye ileri sar"
            >
              <RotateCcw className="w-4 h-4 scale-x-[-1]" />
            </button>
          </div>

          {/* Time & Seek Bar */}
          <div className="w-full flex items-center gap-2 text-[10px] font-mono text-gray-400">
            <span>{formatTime(playbackState.currentTime)}</span>
            <div className="flex-1 relative flex items-center">
              <input
                type="range"
                min={0}
                max={playbackState.duration || 100}
                value={playbackState.currentTime || 0}
                onChange={handleSeek}
                disabled={!activeArticle}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#1ed760] disabled:cursor-not-allowed"
              />
            </div>
            <span>{formatTime(playbackState.duration)}</span>
          </div>
        </div>

        {/* Right Volume Control */}
        <div className="flex items-center justify-end gap-3 w-1/3">
          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="text-gray-400 hover:text-white transition-colors">
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#1ed760]"
            />
          </div>
        </div>
      </div>

      {/* CENTERED MODAL EXPANSION WITH FRAMER MOTION (#article-modal) */}
      <AnimatePresence>
        {readingArticle && (
          <div 
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
            onClick={() => setReadingArticle(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-[#121814] border border-white/10 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col my-auto relative"
            >
              {/* TOP COVER IMAGE HERO WITH OVERLAY CONTROLS */}
              <div className="relative w-full h-60 sm:h-72 bg-[#1a221d] shrink-0 overflow-hidden">
                <img
                  src={readingArticle.imageUrl || getTopicContextualImage(readingArticle.title, readingArticle.category)}
                  alt={readingArticle.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    const fallback = getTopicContextualImage(readingArticle.title, readingArticle.category);
                    if (target.src !== fallback) {
                      target.src = fallback;
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121814] via-[#121814]/40 to-transparent pointer-events-none" />

                {/* Floating Category Badge */}
                <div className="absolute top-4 left-4 z-10">
                  <span className="text-xs font-extrabold text-[#1ed760] uppercase tracking-widest bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#1ed760]/30 shadow-lg">
                    {readingArticle.category || 'GÜNDEM'}
                  </span>
                </div>

                {/* Floating Close Button */}
                <button
                  onClick={() => setReadingArticle(null)}
                  className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/80 text-white transition-all border border-white/10 shadow-lg active:scale-95 cursor-pointer"
                  title="Pencereyi Kapat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* SCROLLABLE CONTENT BODY (Mouse Wheel Scrollable) */}
              <div 
                ref={modalScrollRef}
                tabIndex={0}
                onWheel={(e) => {
                  if (modalScrollRef.current) {
                    modalScrollRef.current.scrollTop += e.deltaY;
                  }
                }}
                className="flex-1 overflow-y-auto overscroll-contain px-6 sm:px-8 py-5 space-y-6 focus:outline-none scrollbar-thin scrollbar-thumb-white/20 hover:scrollbar-thumb-[#1ed760]/40 select-text"
                style={{ touchAction: 'pan-y' }}
              >
                {/* Header Title & Meta */}
                <div className="space-y-2.5">
                  <h1 className="font-display text-xl sm:text-2xl font-black text-white leading-snug">
                    {readingArticle.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 font-mono">
                    <span className="text-gray-300 font-semibold">{readingArticle.author || 'VOX Stüdyo / Haber'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#1ed760]" />
                      {Math.floor((readingArticle.durationSeconds || 180) / 60)} dk okuma
                    </span>
                    {readingArticle.publishedAt && (
                      <>
                        <span>•</span>
                        <span>{new Date(readingArticle.publishedAt).toLocaleDateString('tr-TR')}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* AI Summary Box */}
                <div className="bg-[#1ed760]/10 border border-[#1ed760]/30 p-4 sm:p-5 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-[#1ed760] uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-[#1ed760]" />
                    <span>Yapay Zeka Özeti</span>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed text-gray-200 font-medium">
                    {readingArticle.summary}
                  </p>
                </div>

                {/* Bullet Points / Key Points */}
                {readingArticle.keyPoints && readingArticle.keyPoints.length > 0 && (
                  <div className="bg-[#1a221d] p-4 sm:p-5 rounded-2xl space-y-3 border border-white/10">
                    <span className="text-xs font-extrabold text-[#1ed760] uppercase tracking-wider block">Öne Çıkan Başlıklar</span>
                    <ul className="space-y-2.5 text-xs sm:text-sm text-gray-200">
                      {readingArticle.keyPoints.map((kp, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                          <span className="w-2 h-2 rounded-full bg-[#1ed760] mt-1.5 shrink-0 shadow-[0_0_8px_rgba(30,215,96,0.6)]"></span>
                          <span>{kp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Full Article Text */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 pb-2">
                    Tam Metin
                  </h3>
                  <div className="text-xs sm:text-sm leading-relaxed text-gray-300 space-y-3 font-sans">
                    {readingArticle.rawHtml && (readingArticle.rawHtml.includes('<p') || readingArticle.rawHtml.includes('<li') || readingArticle.rawHtml.includes('<ol') || readingArticle.rawHtml.includes('<ul')) ? (
                      <div 
                        className="news-prose"
                        dangerouslySetInnerHTML={{ __html: readingArticle.rawHtml }}
                      />
                    ) : readingArticle.content ? (
                      readingArticle.content.split('\n\n').map((paragraph, idx) => (
                        <p key={idx} className="leading-relaxed">
                          {paragraph}
                        </p>
                      ))
                    ) : (
                      <p className="leading-relaxed">{readingArticle.summary}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* PINNED BOTTOM ACTIONS INSIDE MODAL */}
              <div className="px-6 py-4 sm:px-8 sm:py-5 border-t border-white/10 flex gap-3 shrink-0 bg-[#121814] z-10">
                <button
                  onClick={() => {
                    onOpenPaywall('limit_reached');
                  }}
                  className="flex-1 py-3.5 px-4 bg-[#1ed760] text-black font-extrabold text-xs sm:text-sm rounded-xl shadow-[0_0_20px_rgba(30,215,96,0.3)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span> Uygulamada Dinle 🔒</span>
                </button>

                <button
                  onClick={() => setReadingArticle(null)}
                  className="px-6 py-3.5 bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* App Store Paywall Modal */}
      <AppStorePaywallModal
        isOpen={subscription.isPaywallOpen}
        onClose={() => subscription.setIsPaywallOpen(false)}
        reason={subscription.paywallReason || 'limit_reached'}
      />

      {/* Auth Modal for Guest Limits */}
      <AuthModal
        isOpen={subscription.isAuthModalOpen}
        onClose={() => subscription.setIsAuthModalOpen(false)}
        onAuthSuccess={() => {}}
        reason="guest_limit"
      />

      {/* Ambient Mixer Sheet */}
      <AmbientMixerSheet
        isOpen={isAmbientMixerOpen}
        onClose={() => setIsAmbientMixerOpen(false)}
        channels={ambientChannels}
        onToggleChannel={(id) => {
          setAmbientChannels(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c));
        }}
        onVolumeChange={(id, vol) => {
          setAmbientChannels(prev => prev.map(c => c.id === id ? { ...c, volume: vol, active: vol > 0 } : c));
        }}
        onAddCustomChannel={(name, url) => {
          setAmbientChannels(prev => [...prev, {
            id: 'custom_' + Date.now(),
            name: name || 'Özel Ses Akışı',
            type: 'stream',
            url,
            volume: 80,
            active: true
          }]);
        }}
      />
    </div>
  );
};
