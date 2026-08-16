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
  LogIn,
  Sun,
  Moon,
  Linkedin,
  Twitter,
  Instagram,
  Hash,
  MapPin,
  Plus,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Article, UserProfile, PlaybackState } from '../types';
import { ttsService } from '../lib/ttsService';
import { AppStorePaywallModal } from './AppStorePaywallModal';
import { AmbientMixerSheet, AmbientChannel } from './AmbientMixerSheet';
import { AmbientNotificationBanner } from './AmbientControls';
import { getTopicContextualImage } from '../lib/newsService';
import { woodRainSynth } from '../lib/audioSynth';
import { useTheme } from '../lib/ThemeContext';
import { InfoModal, InfoModalType } from './InfoModal';
import { VoxLogo } from './VoxLogo';

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
  const { theme, toggleTheme } = useTheme();

  const [playbackState, setPlaybackState] = useState<PlaybackState>(ttsService.getState());
  const [volume, setVolume] = useState<number>(100);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [topNotificationText, setTopNotificationText] = useState<string | null>(null);
  const [infoModalType, setInfoModalType] = useState<InfoModalType>(null);
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
    <div className={`flex min-h-screen antialiased font-sans transition-colors duration-300 ${
      theme === 'light' ? 'bg-[#f4f6f8] text-slate-900' : 'bg-[#0a0d0b] text-gray-200'
    }`}>
      {/* Top Ambient Toast Banner */}
      <AmbientNotificationBanner
        notificationText={topNotificationText}
        onDismiss={() => setTopNotificationText(null)}
        onOpenMixer={() => setIsAmbientMixerOpen(true)}
      />

      {/* LEFT FLOATING OVAL SIDEBAR (Inspired by Bundle Web App Architecture) */}
      <aside className="hidden md:flex w-64 lg:w-72 flex-shrink-0 flex-col justify-between h-[calc(100vh-1.5rem)] fixed top-3 left-3 z-40 bg-black rounded-[32px] border border-white/10 p-5 shadow-2xl overflow-y-auto scrollbar-none text-white select-none">
        <div className="flex flex-col gap-4">
          {/* LOGO & BRANDING */}
          <div className="px-1 pt-1">
            <Link 
              to="/gundem" 
              className="inline-flex items-center cursor-pointer group hover:opacity-90 transition-opacity" 
              title="VOX Ana Sayfası"
            >
              <VoxLogo size="md" />
            </Link>
          </div>

          {/* MAIN SECTION NAVIGATION */}
          <nav className="flex flex-col gap-1.5 pt-1">
            {/* GÜNDEM */}
            <NavLink
              to="/gundem"
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-black tracking-wider transition-all ${
                  isActive || location.pathname === '/' || location.pathname === '/teknoloji' || location.pathname === '/ekonomi'
                    ? 'bg-[#1f2521] text-white border border-white/15 shadow-lg scale-[1.01]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <div className="flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-[#10b981]" />
                <span>GÜNDEM</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
            </NavLink>

            {/* ODAKLAN */}
            <NavLink
              to="/odaklan"
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-black tracking-wider transition-all ${
                  isActive
                    ? 'bg-[#1f2521] text-white border border-white/15 shadow-lg scale-[1.01]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#10b981]" />
                <span>ODAKLAN</span>
              </div>
            </NavLink>
          </nav>

          {/* MOBILE APP DOWNLOAD PROMPT (YAKINDA) */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                <span>📱</span>
                <span>Mobil Uygulama</span>
              </span>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm">
                Yakında!
              </span>
            </div>
            <p className="text-[10px] text-gray-400 leading-snug">
              iOS App Store & Google Play'de çok yakında sizlerle!
            </p>
          </div>
        </div>

        {/* BOTTOM SECTION: VOX PREMIUM LEAD MAGNET, THEME TOGGLE, SOCIAL, INFO LINKS & POWERED BY GOOGLE AI STUDIO */}
        <div className="flex flex-col gap-3 pt-3 border-t border-white/10">
          {/* VOX PREMIUM LEAD MAGNET PROFILE AREA */}
          <button
            onClick={() => onOpenPaywall('limit_reached')}
            className="flex items-center justify-between w-full p-3 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-[#121814] border border-emerald-500/30 hover:border-emerald-500/60 text-left transition-all group shadow-md cursor-pointer hover:scale-[1.02] active:scale-95"
            title="VOX iOS Uygulamasını İndirin"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shrink-0 shadow-sm">
                <div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-4 h-4 fill-emerald-400" />
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-white tracking-wide">VOX Premium</span>
                  <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">PRO</span>
                </div>
                <p className="text-[10px] text-gray-400 truncate">Sınırsız Sesli Deneyim</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </button>

          {/* THEME TOGGLE (AÇIK / KOYU SWITCH AS SEEN IN BUNDLE) */}
          <div className="flex items-center justify-between py-1 px-1">
            <div className="flex items-center gap-2 text-xs font-extrabold text-gray-200">
              {theme === 'light' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-gray-400" />
              )}
              <span className="tracking-wider">{theme === 'light' ? 'AÇIK' : 'KOYU'}</span>
            </div>
            <button
              onClick={toggleTheme}
              className={`w-12 h-6 rounded-full p-0.5 flex items-center transition-all cursor-pointer ${
                theme === 'light' ? 'bg-[#3b82f6] justify-end' : 'bg-white/20 justify-start'
              }`}
              title="Açık/Koyu Tema Değiştir"
            >
              <motion.div
                layout
                className="w-5 h-5 rounded-full bg-white shadow-md"
              />
            </button>
          </div>

          {/* SOCIAL MEDIA ICONS ROW (/voxozet) */}
          <div className="flex items-center justify-between px-1 text-gray-400">
            <a 
              href="https://threads.net/@voxozet" 
              target="_blank" 
              rel="noreferrer" 
              className="hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
              title="Threads (@voxozet)"
            >
              <Hash className="w-4 h-4" />
            </a>
            <a 
              href="https://linkedin.com/company/voxozet" 
              target="_blank" 
              rel="noreferrer" 
              className="hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
              title="LinkedIn (/voxozet)"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a 
              href="https://x.com/voxozet" 
              target="_blank" 
              rel="noreferrer" 
              className="hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
              title="Twitter (X) (/voxozet)"
            >
              <Twitter className="w-4 h-4" />
            </a>
            <a 
              href="https://instagram.com/voxozet" 
              target="_blank" 
              rel="noreferrer" 
              className="hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
              title="Instagram (@voxozet)"
            >
              <Instagram className="w-4 h-4" />
            </a>
          </div>

          {/* INFORMATIONAL LINKS (Hakkımızda, Gizlilik, Künye vs.) */}
          <div className="space-y-1 text-[11px] text-gray-400 px-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-medium">
              <button onClick={() => setInfoModalType('ads')} className="hover:text-white transition-colors cursor-pointer">Reklam</button>
              <button onClick={() => setInfoModalType('about')} className="hover:text-white transition-colors cursor-pointer">Hakkımızda</button>
              <button onClick={() => setInfoModalType('contact')} className="hover:text-white transition-colors cursor-pointer">İletişim</button>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-medium">
              <button onClick={() => setInfoModalType('terms')} className="hover:text-white transition-colors cursor-pointer">Kullanım Koşulları</button>
              <button onClick={() => setInfoModalType('privacy')} className="hover:text-white transition-colors cursor-pointer">Gizlilik Politikası</button>
            </div>
            <div>
              <button onClick={() => setInfoModalType('impressum')} className="hover:text-white transition-colors cursor-pointer">Künye</button>
            </div>
          </div>

          {/* POWERED BY GOOGLE AI STUDIO */}
          <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono pt-1 border-t border-white/10">
            <span>© 2026 VOX</span>
            <span className="text-gray-700">|</span>
            <span className="flex items-center gap-1 text-gray-300 font-medium">
              Powered by
              <span className="text-white font-black inline-flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded">
                <Sparkles className="w-3 h-3 text-[#4285F4] animate-pulse" />
                Google AI Studio
              </span>
            </span>
          </div>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
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

        <button
          onClick={toggleTheme}
          className="flex flex-col items-center gap-1 py-1 px-4 rounded-xl text-gray-400 hover:text-white"
        >
          {theme === 'light' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-gray-400" />}
          <span className="text-[11px]">{theme === 'light' ? 'Açık' : 'Koyu'}</span>
        </button>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className={`flex-1 ml-0 md:ml-72 lg:ml-80 pb-28 min-h-screen overflow-y-auto transition-colors duration-300 ${
        theme === 'light' ? 'bg-[#f4f6f8] text-slate-900' : 'bg-[#0a0d0b] text-gray-200'
      }`}>
        <Outlet />
      </main>

      {/* INFORMATIONAL POPUP MODAL */}
      <InfoModal
        type={infoModalType}
        onClose={() => setInfoModalType(null)}
      />

      {/* PERSISTENT BOTTOM AUDIO PLAYER (Fixed across all route changes) */}
      <div className={`fixed bottom-0 left-0 md:left-72 lg:left-80 right-0 h-20 backdrop-blur-xl border-t z-40 flex items-center justify-between px-4 md:px-8 shadow-2xl transition-colors duration-300 ${
        theme === 'light'
          ? 'bg-white/95 border-slate-200 text-slate-900'
          : 'bg-[#121814]/95 border-white/5 text-gray-200'
      }`}>
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
                  className={`text-xs font-bold truncate cursor-pointer hover:text-[#1ed760] transition-colors ${
                    theme === 'light' ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  {activeArticle.title}
                </h4>
                <p className={`text-[10px] truncate ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>
                  {activeArticle.author || 'VOX Stüdyo'}
                </p>
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
                <h4 className={`text-xs font-bold truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  {getAmbientDisplayTitle()}
                </h4>
                <p className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>
                  Arka planda kesintisiz çalıyor
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 text-gray-500">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-white/5 border-white/10 text-gray-600'
              }`}>
                <Headphones className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className={`text-xs font-medium ${theme === 'light' ? 'text-slate-600' : 'text-gray-400'}`}>
                  Herhangi bir ses oynatılmıyor
                </h4>
                <p className={`text-[10px] ${theme === 'light' ? 'text-slate-400' : 'text-gray-600'}`}>
                  Odaklan sekmesinden bir ambiyans sesi seçin
                </p>
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
              className={`disabled:opacity-30 transition-colors p-1 ${
                theme === 'light' ? 'text-slate-400 hover:text-slate-800' : 'text-gray-400 hover:text-white'
              }`}
              title="15 saniye geri sar"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={handleTogglePlay}
              disabled={!activeArticle && !isAmbientActive}
              className="w-10 h-10 rounded-full bg-[#1ed760] text-black font-bold flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(30,215,96,0.3)] disabled:opacity-40 cursor-pointer"
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
              className={`disabled:opacity-30 transition-colors p-1 ${
                theme === 'light' ? 'text-slate-400 hover:text-slate-800' : 'text-gray-400 hover:text-white'
              }`}
              title="15 saniye ileri sar"
            >
              <RotateCcw className="w-4 h-4 scale-x-[-1]" />
            </button>
          </div>

          {/* Time & Seek Bar */}
          <div className={`w-full flex items-center gap-2 text-[10px] font-mono ${
            theme === 'light' ? 'text-slate-400' : 'text-gray-400'
          }`}>
            <span>{formatTime(playbackState.currentTime)}</span>
            <div className="flex-1 relative flex items-center">
              <input
                type="range"
                min={0}
                max={playbackState.duration || 100}
                value={playbackState.currentTime || 0}
                onChange={handleSeek}
                disabled={!activeArticle}
                className={`w-full h-1 rounded-lg appearance-none cursor-pointer accent-[#1ed760] disabled:cursor-not-allowed ${
                  theme === 'light' ? 'bg-slate-200' : 'bg-white/10'
                }`}
              />
            </div>
            <span>{formatTime(playbackState.duration)}</span>
          </div>
        </div>

        {/* Right Volume Control */}
        <div className="flex items-center justify-end gap-3 w-1/3">
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleMute} 
              className={`transition-colors ${theme === 'light' ? 'text-slate-500 hover:text-slate-800' : 'text-gray-400 hover:text-white'}`}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className={`w-20 h-1 rounded-lg appearance-none cursor-pointer accent-[#1ed760] ${
                theme === 'light' ? 'bg-slate-200' : 'bg-white/10'
              }`}
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
