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
  ChevronRight,
  Menu,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Article, UserProfile, PlaybackState } from '../types';
import { ttsService } from '../lib/ttsService';
import { AppStorePaywallModal } from './AppStorePaywallModal';
import { AmbientMixerSheet, AmbientChannel, PlaylistInfo } from './AmbientMixerSheet';
import { AmbientNotificationBanner } from './AmbientControls';
import { FocusTopBanner } from './FocusTopBanner';
import { useFocus, formatFocusTime } from '../lib/FocusContext';
import { getTopicContextualImage, sanitizeImageUrl, DEFAULT_VOX_FALLBACK_IMAGE } from '../lib/newsService';
import { woodRainSynth } from '../lib/audioSynth';
import { useTheme } from '../lib/ThemeContext';
import { InfoModal, InfoModalType } from './InfoModal';
import { LegalDisclaimerModal } from './LegalDisclaimerModal';
import { VoxLogo } from './VoxLogo';
import { XLogoIcon } from './XLogoIcon';
import { appStorage, getCookie, setCookie } from '../lib/storage';

const DEFAULT_FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%230e1217'/%3E%3Cpolygon points='8,8 16,24 24,8' fill='%231ed760'/%3E%3C/svg%3E";
const PLAYING_FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%230e1217'/%3E%3Crect x='5' y='11' width='3.5' height='10' rx='1.75' fill='%231ed760'/%3E%3Crect x='11' y='6' width='3.5' height='20' rx='1.75' fill='%231ed760'/%3E%3Crect x='17' y='9' width='3.5' height='14' rx='1.75' fill='%231ed760'/%3E%3Crect x='23' y='13' width='3.5' height='6' rx='1.75' fill='%231ed760'/%3E%3C/svg%3E";

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
  onNextAmbientTrack?: () => void;
  onPrevAmbientTrack?: () => void;
  onAmbientTrackEnded?: () => void;
  playlistInfo?: PlaylistInfo | null;
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
  setIsAmbientMixerOpen,
  onNextAmbientTrack,
  onPrevAmbientTrack,
  onAmbientTrackEnded,
  playlistInfo
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { isRunning: isFocusRunning, timeLeft: focusTimeLeft, sessionType: focusSessionType } = useFocus();

  // "Lights Out" / Zen Focus Minimal Mode (Synchronized with FocusTab)
  const [isLightsOut, setIsLightsOut] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return appStorage.getItemSync('vox_lights_out_mode') === 'true';
  });

  useEffect(() => {
    const handleLightsOutEvent = (e: any) => {
      if (e && typeof e.detail === 'boolean') {
        setIsLightsOut(e.detail);
      }
    };
    window.addEventListener('vox_toggle_lights_out', handleLightsOutEvent);
    return () => {
      window.removeEventListener('vox_toggle_lights_out', handleLightsOutEvent);
    };
  }, []);

  const [playbackState, setPlaybackState] = useState<PlaybackState>(ttsService.getState());
  const [volume, setVolume] = useState<number>(100);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [topNotificationText, setTopNotificationText] = useState<string | null>(null);
  const [infoModalType, setInfoModalType] = useState<InfoModalType>(null);
  const [isLegalDisclaimerOpen, setIsLegalDisclaimerOpen] = useState<boolean>(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const modalScrollRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLElement>(null);

  // Scroll to top, close mobile drawer, and track page view on route change
  useEffect(() => {
    setIsMobileDrawerOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.body.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      mainContentRef.current.scrollTop = 0;
    }

    // Google Analytics 4 SPA page view tracking
    try {
      if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
        (window as any).gtag('config', 'G-88Y5LRRF66', {
          page_path: location.pathname + location.search,
          page_title: document.title
        });
      }
    } catch (e) {}
  }, [location.pathname, location.search]);

  // Cookie Consent State
  const [showCookieBanner, setShowCookieBanner] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const stored = appStorage.getItemSync('vox_cookie_consent');
      const cookie = getCookie('vox_cookie_consent');
      return !(stored === 'accepted' || cookie === 'accepted');
    } catch (e) {
      return false;
    }
  });

  const handleAcceptCookies = () => {
    try {
      appStorage.setItemSync('vox_cookie_consent', 'accepted');
      setCookie('vox_cookie_consent', 'accepted', 365);
    } catch (e) {}
    setShowCookieBanner(false);
  };

  // Active ambient channels
  const activeAmbientChannels = ambientChannels.filter(c => c.active && c.volume > 0);
  const isAmbientActive = activeAmbientChannels.length > 0;
  const isAudioPlaying = playbackState.isPlaying || isAmbientActive;

  // Global Dynamic Document Title & Favicon Effect (Persistent Audio State)
  useEffect(() => {
    const updateFavicon = (href: string) => {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = href;
    };

    if (isAudioPlaying) {
      document.title = '(🔊 Çalıyor) VOX | Odaklan';
      updateFavicon(PLAYING_FAVICON);
    } else if (isFocusRunning) {
      const emoji = focusSessionType === 'work' ? '🎯' : '☕';
      const modeLabel = focusSessionType === 'work' ? 'Odak' : 'Mola';
      document.title = `(${emoji} ${formatFocusTime(focusTimeLeft)}) VOX | ${modeLabel}`;
      updateFavicon(DEFAULT_FAVICON);
    } else {
      const path = location.pathname;
      const isEnglish = path.startsWith('/en') || path === '/focus' || location.search.includes('lang=en');
      
      let pageTitle = isEnglish ? 'VOX | Read Less, Listen More, Focus Better' : 'VOX | Oku, Dinle, Odaklan';
      if (path === '/odaklan' || path === '/focus' || path === '/en/focus') {
        pageTitle = isEnglish ? 'VOX Focus | Read Less, Listen More, Focus Better' : 'VOX | Odaklan';
      } else if (path === '/kitaplik' || path === '/en/library') {
        pageTitle = isEnglish ? 'VOX | Library' : 'VOX | Kitaplık';
      } else if (path === '/profil' || path === '/en/profile') {
        pageTitle = isEnglish ? 'VOX | Profile' : 'VOX | Profil';
      } else if (path === '/teknoloji' || path === '/en/tech') {
        pageTitle = isEnglish ? 'VOX | Tech News' : 'VOX | Teknoloji Haberleri';
      } else if (path === '/ekonomi' || path === '/en/economy') {
        pageTitle = isEnglish ? 'VOX | Economy News' : 'VOX | Ekonomi Haberleri';
      }

      document.title = pageTitle;
      updateFavicon(DEFAULT_FAVICON);

      // Update meta description dynamically for single-page navigation
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute(
          'content',
          isEnglish ? 'Read less. Listen more. Focus better.' : 'Daha az oku. Daha çok dinle. Daha iyi odaklan.'
        );
      }
    }
  }, [isAudioPlaying, isFocusRunning, focusTimeLeft, focusSessionType, location.pathname, location.search]);
  
  // Track and persist last active ambient sound in localStorage and cookies
  const [lastActiveAmbientId, setLastActiveAmbientId] = useState<string>(() => {
    return appStorage.getItemSync('vox_last_ambient_id') || getCookie('vox_last_ambient_id') || 'yt-nature-rain';
  });

  useEffect(() => {
    if (activeAmbientChannels.length > 0) {
      const activeId = activeAmbientChannels[0].id;
      setLastActiveAmbientId(activeId);
      appStorage.setItemSync('vox_last_ambient_id', activeId);
    }
  }, [activeAmbientChannels]);

  // Determine the primary or last played ambient channel
  const lastAmbientChannel = ambientChannels.find(c => c.id === lastActiveAmbientId) || ambientChannels[0];

  const getAmbientIcon = (id: string = '', name: string = '') => {
    const n = (name + ' ' + id).toLowerCase();
    if (n.includes('yağmur') || n.includes('rain')) return '🌧️';
    if (n.includes('fırtına') || n.includes('şimşek') || n.includes('thunder')) return '⚡';
    if (n.includes('orman') || n.includes('forest') || n.includes('kuş') || n.includes('doğa')) return '🌿';
    if (n.includes('kafe') || n.includes('kahve') || n.includes('cafe')) return '☕';
    if (n.includes('derin') || n.includes('çalışma') || n.includes('work') || n.includes('müzik')) return '🎧';
    return '🍃';
  };

  // Format ambient channel names with friendly icon
  const getAmbientDisplayTitle = () => {
    if (activeAmbientChannels.length === 0) {
      if (lastAmbientChannel) {
        return `${getAmbientIcon(lastAmbientChannel.id, lastAmbientChannel.name)} ${lastAmbientChannel.name}`;
      }
      return '';
    }
    if (activeAmbientChannels.length === 1) {
      const ch = activeAmbientChannels[0];
      return `${getAmbientIcon(ch.id, ch.name)} ${ch.name}`;
    }
    return `🌿 Çoklu Ambiyans (${activeAmbientChannels.length} Ses)`;
  };

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
      // Pause all active ambient channels and remember the active one in cookies/storage
      if (activeAmbientChannels.length > 0) {
        const id = activeAmbientChannels[0].id;
        setLastActiveAmbientId(id);
        appStorage.setItemSync('vox_last_ambient_id', id);
      }
      setAmbientChannels(prev => prev.map(c => ({ ...c, active: false })));
    } else {
      // Resume previously active ambient channel or first channel from cookie/storage
      const targetId = lastActiveAmbientId || (ambientChannels[0] && ambientChannels[0].id);
      if (targetId) {
        setLastActiveAmbientId(targetId);
        appStorage.setItemSync('vox_last_ambient_id', targetId);
        setAmbientChannels(prev =>
          prev.map(c =>
            c.id === targetId
              ? { ...c, active: true, volume: c.volume > 0 ? c.volume : (volume > 0 ? volume : 60) }
              : c
          )
        );
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
      <aside className={`${isLightsOut ? 'hidden' : 'hidden md:flex'} w-64 lg:w-72 flex-shrink-0 flex-col justify-between h-[calc(100vh-1.5rem)] fixed top-3 left-3 z-40 bg-black rounded-[32px] border border-white/10 p-5 shadow-2xl overflow-y-auto scrollbar-none text-white select-none transition-all duration-300`}>
        <div className="flex flex-col gap-4">
          {/* LOGO & BRANDING */}
          <div className="px-1 pt-1">
            <Link 
              to="/" 
              className="inline-flex items-center cursor-pointer group hover:opacity-90 transition-opacity" 
              title="VOX Ana Sayfası"
            >
              <VoxLogo size="md" textColor="light" />
            </Link>
          </div>

          {/* MAIN SECTION NAVIGATION */}
          <nav className="flex flex-col gap-1.5 pt-1">
            {/* GÜNDEM */}
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-black tracking-wider transition-all ${
                  isActive || location.pathname === '/' || location.pathname === '/gundem' || location.pathname === '/teknoloji' || location.pathname === '/ekonomi'
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
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-medium">
              <button onClick={() => setInfoModalType('impressum')} className="hover:text-white transition-colors cursor-pointer">Künye</button>
              <button onClick={() => setIsLegalDisclaimerOpen(true)} className="hover:text-emerald-400 text-gray-400 transition-colors cursor-pointer font-medium">Yasal Uyarı ve İletişim</button>
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

      {/* TOP MOBILE APP BAR (Bundle-Style: Hamburger Menu + VOX Brand Logo + Ambient/PRO Controls) */}
      <header className={`md:hidden fixed top-0 left-0 right-0 z-40 h-14 px-3.5 flex items-center justify-between border-b backdrop-blur-xl transition-colors duration-300 ${
        theme === 'light'
          ? 'bg-white/95 border-slate-200 text-slate-900 shadow-sm'
          : 'bg-[#121814]/95 border-white/10 text-white shadow-md'
      }`}>
        {/* Left: Hamburger Menu Button */}
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="p-2 -ml-1 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
          title="Menüyü Aç"
          aria-label="Menüyü Aç"
        >
          <Menu className="w-5 h-5 text-current" />
        </button>

        {/* Center: VOX Logo (Identical to Desktop) */}
        <Link 
          to="/" 
          className="flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
          title="VOX Ana Sayfası"
        >
          <VoxLogo size="md" />
        </Link>

        {/* Right: Quick Controls (Ambient Sound / PRO Button) */}
        <div className="flex items-center gap-1.5 -mr-1">
          <button
            onClick={() => setIsAmbientMixerOpen(true)}
            className={`p-2 rounded-xl transition-all relative cursor-pointer ${
              isAmbientActive 
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
            title="Doğa Sesleri Mikseri"
            aria-label="Doğa Sesleri Mikseri"
          >
            <Headphones className="w-4 h-4" />
            {isAmbientActive && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => onOpenPaywall('limit_reached')}
            className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black tracking-wider flex items-center gap-1 uppercase hover:bg-emerald-500/25 active:scale-95 transition-all"
            title="VOX Premium"
          >
            <Sparkles className="w-3 h-3 fill-current" />
            <span>PRO</span>
          </button>
        </div>
      </header>

      {/* SLIDE-OVER MOBILE SIDEBAR DRAWER */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <>
            {/* Dark Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileDrawerOpen(false)}
              className="md:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
            />

            {/* Slide-in Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="md:hidden fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] z-50 bg-black border-r border-white/10 p-5 shadow-2xl overflow-y-auto text-white flex flex-col justify-between select-none"
            >
              <div className="flex flex-col gap-4">
                {/* Header row with logo and close button */}
                <div className="flex items-center justify-between pt-1 pb-3 border-b border-white/10">
                  <Link 
                    to="/" 
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="inline-flex items-center cursor-pointer"
                  >
                    <VoxLogo size="md" textColor="light" />
                  </Link>
                  <button
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                    title="Kapat"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Main Navigation */}
                <nav className="flex flex-col gap-2 pt-1">
                  <NavLink
                    to="/"
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-black tracking-wider transition-all ${
                        isActive || location.pathname === '/' || location.pathname === '/gundem' || location.pathname === '/teknoloji' || location.pathname === '/ekonomi'
                          ? 'bg-[#1f2521] text-white border border-white/15 shadow-lg scale-[1.01]'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Newspaper className="w-4 h-4 text-[#10b981]" />
                      <span>GÜNDEM (Haber Akışı)</span>
                    </div>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                  </NavLink>

                  <NavLink
                    to="/odaklan"
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-black tracking-wider transition-all ${
                        isActive
                          ? 'bg-[#1f2521] text-white border border-white/15 shadow-lg scale-[1.01]'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Target className="w-4 h-4 text-[#10b981]" />
                      <span>ODAKLAN (Pomodoro)</span>
                    </div>
                  </NavLink>
                </nav>

                {/* Mobile App Download Prompt */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 space-y-2 mt-1">
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

              {/* Bottom Elements: Pro, Theme, Social, Links, Powered by */}
              <div className="flex flex-col gap-3 pt-3 border-t border-white/10 mt-4">
                {/* Premium Promo */}
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onOpenPaywall('limit_reached');
                  }}
                  className="flex items-center justify-between w-full p-3 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-[#121814] border border-emerald-500/30 text-left transition-all group shadow-md cursor-pointer active:scale-95"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shrink-0">
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

                {/* Theme Switch */}
                <div className="flex items-center justify-between py-1 px-1">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-gray-200">
                    {theme === 'light' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-400" />}
                    <span className="tracking-wider">{theme === 'light' ? 'AÇIK TEMA' : 'KOYU TEMA'}</span>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className={`w-12 h-6 rounded-full p-0.5 flex items-center transition-all cursor-pointer ${
                      theme === 'light' ? 'bg-[#3b82f6] justify-end' : 'bg-white/20 justify-start'
                    }`}
                    title="Açık/Koyu Tema Değiştir"
                  >
                    <motion.div layout className="w-5 h-5 rounded-full bg-white shadow-md" />
                  </button>
                </div>

                {/* Social Media Icons */}
                <div className="flex items-center justify-between px-1 text-gray-400">
                  <a href="https://threads.net/@voxozet" target="_blank" rel="noreferrer" className="hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"><Hash className="w-4 h-4" /></a>
                  <a href="https://linkedin.com/company/voxozet" target="_blank" rel="noreferrer" className="hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"><Linkedin className="w-4 h-4" /></a>
                  <a href="https://x.com/voxozet" target="_blank" rel="noreferrer" className="hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"><Twitter className="w-4 h-4" /></a>
                  <a href="https://instagram.com/voxozet" target="_blank" rel="noreferrer" className="hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"><Instagram className="w-4 h-4" /></a>
                </div>

                {/* Informational links */}
                <div className="space-y-1 text-[11px] text-gray-400 px-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-medium">
                    <button onClick={() => { setIsMobileDrawerOpen(false); setInfoModalType('ads'); }} className="hover:text-white cursor-pointer">Reklam</button>
                    <button onClick={() => { setIsMobileDrawerOpen(false); setInfoModalType('about'); }} className="hover:text-white cursor-pointer">Hakkımızda</button>
                    <button onClick={() => { setIsMobileDrawerOpen(false); setInfoModalType('contact'); }} className="hover:text-white cursor-pointer">İletişim</button>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-medium">
                    <button onClick={() => { setIsMobileDrawerOpen(false); setInfoModalType('terms'); }} className="hover:text-white cursor-pointer">Kullanım Koşulları</button>
                    <button onClick={() => { setIsMobileDrawerOpen(false); setInfoModalType('privacy'); }} className="hover:text-white cursor-pointer">Gizlilik Politikası</button>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-medium">
                    <button onClick={() => { setIsMobileDrawerOpen(false); setInfoModalType('impressum'); }} className="hover:text-white cursor-pointer">Künye</button>
                    <button onClick={() => { setIsMobileDrawerOpen(false); setIsLegalDisclaimerOpen(true); }} className="hover:text-emerald-400 text-gray-400 cursor-pointer font-medium">Yasal Uyarı ve İletişim</button>
                  </div>
                </div>

                {/* Powered by Google AI Studio */}
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
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* FLOATING EXPANDABLE MOBILE BOTTOM DOCK (Clean, Minimal: Gündem + Odaklan + Tema) */}
      <div className="md:hidden fixed bottom-3 left-3 right-3 z-50 pointer-events-none flex justify-center">
        <nav className={`pointer-events-auto w-full max-w-xs h-14 rounded-full backdrop-blur-2xl border px-3 py-1.5 flex items-center justify-around shadow-2xl transition-all duration-300 ${
          theme === 'light'
            ? 'bg-white/95 border-slate-200 text-slate-700 shadow-slate-900/10'
            : 'bg-[#101612]/95 border-white/10 text-gray-300'
        }`}>
          {/* TAB 1: GÜNDEM (Haber Akışı) */}
          {(() => {
            const isGundemActive = location.pathname === '/' || location.pathname === '/gundem' || location.pathname === '/teknoloji' || location.pathname === '/ekonomi';
            return (
              <NavLink
                to="/"
                className={`relative flex items-center justify-center gap-1.5 py-2 px-4 rounded-full transition-all duration-300 active:scale-95 ${
                  isGundemActive
                    ? theme === 'light' ? 'text-white font-bold' : 'text-emerald-300 font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {isGundemActive && (
                  <motion.div
                    layoutId="mobileActiveDockPill"
                    className={`absolute inset-0 rounded-full shadow-sm ${
                      theme === 'light'
                        ? 'bg-emerald-800 text-white'
                        : 'bg-[#143d2b] border border-emerald-500/40 text-emerald-300'
                    }`}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <div className="relative z-10 flex items-center gap-1.5">
                  <Newspaper className="w-4 h-4 shrink-0" />
                  <motion.span
                    initial={false}
                    animate={{ width: isGundemActive ? 'auto' : 0, opacity: isGundemActive ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-xs whitespace-nowrap overflow-hidden leading-none font-medium"
                  >
                    Gündem
                  </motion.span>
                </div>
              </NavLink>
            );
          })()}

          {/* TAB 2: ODAKLAN (Pomodoro & Odaklanma) */}
          {(() => {
            const isFocusActive = location.pathname === '/odaklan';
            return (
              <NavLink
                to="/odaklan"
                className={`relative flex items-center justify-center gap-1.5 py-2 px-4 rounded-full transition-all duration-300 active:scale-95 ${
                  isFocusActive
                    ? theme === 'light' ? 'text-white font-bold' : 'text-emerald-300 font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {isFocusActive && (
                  <motion.div
                    layoutId="mobileActiveDockPill"
                    className={`absolute inset-0 rounded-full shadow-sm ${
                      theme === 'light'
                        ? 'bg-emerald-800 text-white'
                        : 'bg-[#143d2b] border border-emerald-500/40 text-emerald-300'
                    }`}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <div className="relative z-10 flex items-center gap-1.5">
                  <Target className="w-4 h-4 shrink-0" />
                  <motion.span
                    initial={false}
                    animate={{ width: isFocusActive ? 'auto' : 0, opacity: isFocusActive ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-xs whitespace-nowrap overflow-hidden leading-none font-medium"
                  >
                    Odaklan
                  </motion.span>
                </div>
              </NavLink>
            );
          })()}

          {/* TAB 3: TEMA DEĞİŞTİR (Karanlık / Aydınlık Modu) */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center p-2.5 rounded-full text-gray-400 hover:text-white active:scale-90 transition-all cursor-pointer hover:bg-white/10"
            title="Açık / Koyu Tema Değiştir"
            aria-label="Açık / Koyu Tema Değiştir"
          >
            {theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Moon className="w-4 h-4 text-gray-300" />
            )}
          </button>
        </nav>
      </div>

      {/* GLOBAL FLOATING FOCUS TOP BANNER (Persistent across all routes like Gündem, Teknoloji, Kitaplık) */}
      <FocusTopBanner />

      {/* MAIN CONTENT AREA */}
      <main ref={mainContentRef} className={`flex-1 ${isLightsOut ? 'ml-0' : 'ml-0 md:ml-72 lg:ml-80'} pt-14 md:pt-0 pb-36 min-h-screen overflow-y-auto transition-all duration-300 ${
        theme === 'light' ? 'bg-[#f4f6f8] text-slate-900' : 'bg-[#0a0d0b] text-gray-200'
      }`}>
        <Outlet />
      </main>

      {/* INFORMATIONAL POPUP MODAL */}
      <InfoModal
        type={infoModalType}
        onClose={() => setInfoModalType(null)}
      />

      {/* LEGAL DISCLAIMER & UYAR-KALDIR MODAL (5651 Sayılı Kanun) */}
      <LegalDisclaimerModal
        isOpen={isLegalDisclaimerOpen}
        onClose={() => setIsLegalDisclaimerOpen(false)}
      />

      {/* MOBILE FLOATING MINI-PLAYER (Only shown when playing TTS News Article) */}
      <AnimatePresence>
        {activeArticle && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`md:hidden fixed bottom-20 left-3 right-3 z-40 rounded-2xl p-2.5 backdrop-blur-2xl border shadow-xl flex items-center justify-between gap-3 transition-colors ${
              theme === 'light'
                ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-900/10'
                : 'bg-[#101712]/95 border-emerald-500/25 text-white shadow-black/80'
            }`}
          >
            {/* Left: Thumbnail & Title */}
            <div 
              onClick={() => setReadingArticle(activeArticle)}
              className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400 overflow-hidden">
                {activeArticle.imageUrl ? (
                  <img 
                    src={sanitizeImageUrl(activeArticle.imageUrl)} 
                    alt={activeArticle.title} 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_VOX_FALLBACK_IMAGE;
                    }}
                  />
                ) : (
                  <Headphones className="w-5 h-5 animate-pulse" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] font-bold uppercase text-emerald-400 tracking-wider truncate">
                    {playbackState.isPlaying ? 'Dinleniyor' : 'Duraklatıldı'}
                  </span>
                </div>
                <h4 className="text-xs font-bold truncate leading-tight mt-0.5">
                  {activeArticle.title}
                </h4>
              </div>
            </div>

            {/* Right: Quick Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleTogglePlay}
                className="w-9 h-9 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer"
                title="Oynat / Duraklat"
              >
                {playbackState.isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DESKTOP PERSISTENT BOTTOM AUDIO PLAYER (Only shown when TTS News Article is active) */}
      <AnimatePresence>
        {activeArticle && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`hidden md:flex fixed bottom-0 left-72 lg:left-80 right-0 h-20 backdrop-blur-xl border-t z-40 items-center justify-between px-6 lg:px-8 shadow-2xl transition-colors duration-300 ${
              theme === 'light'
                ? 'bg-white/95 border-slate-200 text-slate-900'
                : 'bg-[#121814]/95 border-white/5 text-gray-200'
            }`}
          >
            {/* Track Info */}
            <div className="flex items-center gap-3 w-1/3 min-w-0">
              <div 
                onClick={() => setReadingArticle(activeArticle)}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1ed760]/20 to-teal-500/20 border border-[#1ed760]/30 flex items-center justify-center shrink-0 text-[#1ed760] cursor-pointer hover:scale-105 transition-transform overflow-hidden"
              >
                {activeArticle.imageUrl ? (
                  <img
                    src={sanitizeImageUrl(activeArticle.imageUrl)}
                    alt={activeArticle.title}
                    className="w-full h-full object-cover rounded-xl"
                    onError={(e) => {
                      const target = e.currentTarget;
                      const fallback = getTopicContextualImage(activeArticle.title, activeArticle.category) || DEFAULT_VOX_FALLBACK_IMAGE;
                      if (target.src !== fallback) {
                        target.src = fallback;
                      }
                    }}
                  />
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
            </div>

            {/* Player Controls & Seek Slider */}
            <div className="flex flex-col items-center gap-1.5 w-1/3 max-w-md">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => ttsService.seek(Math.max(0, playbackState.currentTime - 15))}
                  className={`transition-colors p-1 ${
                    theme === 'light' ? 'text-slate-400 hover:text-slate-800' : 'text-gray-400 hover:text-white'
                  }`}
                  title="15 saniye geri sar"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={handleTogglePlay}
                  className="w-10 h-10 rounded-full bg-[#1ed760] text-black font-bold flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(30,215,96,0.3)] cursor-pointer"
                  title={playbackState.isPlaying ? 'Duraklat' : 'Oynat'}
                >
                  {playbackState.isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  onClick={() => ttsService.seek(Math.min(playbackState.duration, playbackState.currentTime + 15))}
                  className={`transition-colors p-1 ${
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
                    className={`w-full h-1 rounded-lg appearance-none cursor-pointer accent-[#1ed760] ${
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
          </motion.div>
        )}
      </AnimatePresence>

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
                  src={sanitizeImageUrl(readingArticle.imageUrl) || getTopicContextualImage(readingArticle.title, readingArticle.category) || DEFAULT_VOX_FALLBACK_IMAGE}
                  alt={readingArticle.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    const fallback = getTopicContextualImage(readingArticle.title, readingArticle.category) || DEFAULT_VOX_FALLBACK_IMAGE;
                    if (target.src !== fallback) {
                      target.src = fallback;
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121814] via-[#121814]/40 to-transparent pointer-events-none" />

                {/* Floating Category Badge */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                  <span className="text-xs font-extrabold text-[#1ed760] uppercase tracking-widest bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#1ed760]/30 shadow-lg flex items-center gap-1.5">
                    {readingArticle.sourceType === 'twitter' && <XLogoIcon className="w-3 h-3 text-[#1ed760]" />}
                    <span>{readingArticle.sourceType === 'twitter' ? '𝕏 Twitter Canlı Akış' : (readingArticle.category || 'GÜNDEM')}</span>
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
                    {readingArticle.sourceType === 'twitter' ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-full font-bold border border-emerald-500/30">
                        <XLogoIcon className="w-3.5 h-3.5 text-[#1ed760]" />
                        <span>{(() => {
                          const a = (readingArticle.author || '').trim();
                          const aLower = a.toLowerCase();
                          if (aLower.includes('ozetgechaber') || aLower.includes('özet geç')) return 'Özet Geç Haber';
                          if (aLower.includes('conflicttr') || aLower.includes('conflict tr')) return 'Conflict TR';
                          if (aLower.includes('vaziyet')) return 'Vaziyet';
                          return a.replace(/^@/, '') || 'Özet Geç Haber';
                        })()}</span>
                      </span>
                    ) : (
                      <span className="text-gray-300 font-semibold">{readingArticle.author || 'Anadolu Ajansı'}</span>
                    )}
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#1ed760]" />
                      {Math.floor((readingArticle.durationSeconds || 90) / 60)} dk okuma
                    </span>
                    {readingArticle.createdAt && (
                      <>
                        <span>•</span>
                        <span>{new Date(readingArticle.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* AI Summary Box */}
                <div className="bg-[#1ed760]/10 border border-[#1ed760]/30 p-4 sm:p-5 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-[#1ed760] uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-[#1ed760]" />
                    <span>{readingArticle.sourceType === 'twitter' ? '𝕏 Anlık Tweet Özeti' : 'Yapay Zeka Özeti'}</span>
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
                    {readingArticle.sourceType === 'twitter' ? 'Haber ve Tweet Metni' : 'Tam Metin'}
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

      {/* Floating Cookie Consent Banner */}
      <AnimatePresence>
        {showCookieBanner && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-24 md:bottom-20 left-4 z-50 max-w-sm rounded-xl bg-surface-variant/90 backdrop-blur-md border border-[#1ed760]/30 shadow-2xl p-4 text-white"
          >
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5" role="img" aria-label="cookie">🍪</span>
              <div className="space-y-3 min-w-0 flex-1">
                <p className="text-xs text-gray-200 leading-relaxed font-medium">
                  Size daha iyi bir deneyim sunmak için çerezleri kullanıyoruz.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleAcceptCookies}
                    className="px-3.5 py-1.5 rounded-lg bg-[#1ed760] text-black font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(30,215,96,0.3)] cursor-pointer"
                  >
                    Kabul Et
                  </button>
                  <button
                    onClick={() => setInfoModalType('privacy')}
                    className="text-xs text-gray-400 hover:text-white underline transition-colors cursor-pointer"
                  >
                    Gizlilik Politikası
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient Mixer Sheet */}
      <AmbientMixerSheet
        isOpen={isAmbientMixerOpen}
        onClose={() => setIsAmbientMixerOpen(false)}
        onOpen={() => setIsAmbientMixerOpen(true)}
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
        onNextTrack={onNextAmbientTrack}
        onPrevTrack={onPrevAmbientTrack}
        onTrackEnded={onAmbientTrackEnded}
        playlistInfo={playlistInfo}
      />
    </div>
  );
};
