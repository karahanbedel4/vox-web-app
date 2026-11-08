import React, { useState, useEffect, useRef } from 'react';
import { 
  Smartphone, 
  Share, 
  PlusSquare, 
  X, 
  CheckCircle, 
  Download, 
  Zap, 
  WifiOff, 
  ArrowDown,
  Monitor,
  MoreVertical,
  Layers,
  Bell,
  Tv,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { appStorage } from '../lib/storage';
import { triggerHapticImpact } from '../lib/haptics';
import { useTheme } from '../lib/ThemeContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

type DevicePlatform = 'android' | 'ios' | 'desktop' | 'tv';

export const InstallPwaModal: React.FC = () => {
  const { theme } = useTheme();
  const [isBannerOpen, setIsBannerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [detectedPlatform, setDetectedPlatform] = useState<DevicePlatform>('android');
  const [activeTab, setActiveTab] = useState<DevicePlatform>('android');
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [browserName, setBrowserName] = useState<string>('Tarayıcı');
  const bannerTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 1. Detect if the app is already installed / running in standalone mode
    const standalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    if (standalone) {
      return; // Already running as native PWA, no prompt needed
    }

    // 2. Intelligent Device, Browser and Smart TV Detection
    const ua = navigator.userAgent || '';
    const isTV = /Android.*TV|SmartTV|GoogleTV|HbbTV|Tizen|webOS|AppleTV|BRAVIA|PlayStation|Xbox|NetCast|POV_TV|viera/i.test(ua);
    const isIos = !isTV && (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
    const isAndroid = !isTV && /Android/i.test(ua);
    const isDesktop = !isTV && !isIos && !isAndroid && !/Mobile|Tablet/i.test(ua);

    let platform: DevicePlatform = 'android';
    if (isTV) platform = 'tv';
    else if (isIos) platform = 'ios';
    else if (isDesktop) platform = 'desktop';
    else platform = 'android';

    setDetectedPlatform(platform);
    setActiveTab(platform);

    // Browser detection
    if (/CriOS|Chrome/i.test(ua) && !/Edg/i.test(ua)) setBrowserName('Chrome');
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) setBrowserName('Safari');
    else if (/Edg/i.test(ua)) setBrowserName('Edge');
    else if (/SamsungBrowser/i.test(ua)) setBrowserName('Samsung İnternet');
    else if (/Firefox|FxiOS/i.test(ua)) setBrowserName('Firefox');
    else setBrowserName('Tarayıcı');

    // 3. Listen for beforeinstallprompt (Android, Chrome, Edge, Chromium)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      (window as any).__vox_deferred_prompt = promptEvent;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Listen for app installed event
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setIsBannerOpen(false);
      setIsModalOpen(false);
      setDeferredPrompt(null);
      appStorage.setItemSync('vox_pwa_installed', 'true');
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // 5. Allow manual opening via custom event (e.g. from Sidebar or Settings button)
    const handleManualOpen = () => {
      triggerHapticImpact('light');
      setIsBannerOpen(false);
      setIsModalOpen(true);
    };
    window.addEventListener('vox_open_pwa_install', handleManualOpen);

    // 6. DELAY RULE FOR NON-INTRUSIVE BOTTOM BANNER
    // Check if dismissed within the last 7 days
    const dismissedTimeStr = appStorage.getItemSync('vox_pwa_banner_dismissed_at');
    const hasInstalledBefore = appStorage.getItemSync('vox_pwa_installed') === 'true';
    
    let isRecentlyDismissed = false;
    if (dismissedTimeStr) {
      const dismissedTime = parseInt(dismissedTimeStr, 10);
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < sevenDaysMs) {
        isRecentlyDismissed = true;
      }
    }

    // Show floating non-intrusive banner 3.5 seconds after page load
    if (!isRecentlyDismissed && !hasInstalledBefore) {
      bannerTimerRef.current = setTimeout(() => {
        setIsBannerOpen(true);
      }, 3500);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('vox_open_pwa_install', handleManualOpen);
      if (bannerTimerRef.current) {
        clearTimeout(bannerTimerRef.current);
      }
    };
  }, []);

  // DIRECT INSTALL TRIGGER (Android / Chrome / Edge)
  const handleDirectInstall = async () => {
    triggerHapticImpact('medium');
    setIsInstalling(true);

    const prompt = deferredPrompt || (window as any).__vox_deferred_prompt;

    if (prompt) {
      try {
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === 'accepted') {
          appStorage.setItemSync('vox_pwa_installed', 'true');
          setDeferredPrompt(null);
          (window as any).__vox_deferred_prompt = null;
          setIsBannerOpen(false);
          setIsModalOpen(false);
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      } finally {
        setIsInstalling(false);
      }
    } else {
      // If direct prompt is unavailable, open full visual step-by-step guide
      setIsInstalling(false);
      setIsBannerOpen(false);
      setIsModalOpen(true);
    }
  };

  useEffect(() => {
    const isShowing = isBannerOpen && !isModalOpen;
    window.dispatchEvent(new CustomEvent('vox_pwa_banner_change', { detail: isShowing }));
  }, [isBannerOpen, isModalOpen]);

  const handleDismissBanner = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerHapticImpact('light');
    setIsBannerOpen(false);
    appStorage.setItemSync('vox_pwa_banner_dismissed_at', Date.now().toString());
    window.dispatchEvent(new CustomEvent('vox_pwa_banner_change', { detail: false }));
  };

  const handleDismissModal = () => {
    triggerHapticImpact('light');
    setIsModalOpen(false);
    appStorage.setItemSync('vox_pwa_banner_dismissed_at', Date.now().toString());
  };

  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. NON-INTRUSIVE FLOATING BOTTOM BANNER (MATCHING USER REFERENCE DESIGN) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isBannerOpen && !isModalOpen && (
          <motion.div
            initial={{ opacity: 0, y: 35, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.96 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className={`fixed bottom-[74px] sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 rounded-2xl p-3 sm:p-3.5 backdrop-blur-2xl border shadow-2xl transition-all duration-200 select-none pointer-events-auto ${
              theme === 'light'
                ? 'bg-white/95 border-slate-200/90 text-slate-900 shadow-slate-900/15'
                : 'bg-[#111713]/95 border-emerald-500/25 text-white shadow-black/80'
            }`}
          >
            <div className="flex items-center gap-3">
              {/* App Icon (VOX Squircle with gradient) */}
              <div 
                onClick={() => {
                  if (detectedPlatform === 'android' && deferredPrompt) {
                    handleDirectInstall();
                  } else {
                    setIsBannerOpen(false);
                    setIsModalOpen(true);
                  }
                }}
                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0d3b27] to-[#10b981] p-1.5 flex items-center justify-center shrink-0 shadow-sm border border-emerald-400/30 cursor-pointer active:scale-95 transition-transform"
                title="VOX Uygulaması"
              >
                <img 
                  src="/logo.png" 
                  alt="VOX Logo" 
                  className="w-8 h-8 object-contain rounded-xl"
                  onError={(e) => {
                    const el = e.target as HTMLElement;
                    el.style.display = 'none';
                    if (el.parentElement) {
                      el.parentElement.innerHTML = '<span class="text-white font-black text-xs">VOX</span>';
                    }
                  }} 
                />
              </div>

              {/* Central Copy: Crystal clear, zero-clutter */}
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <h4 className="text-[13px] sm:text-sm font-black tracking-tight text-slate-900 dark:text-white truncate">
                    VOX’u ana ekrana ekle
                  </h4>
                </div>

                {detectedPlatform === 'ios' ? (
                  // iOS Safari concise instructions with exact Apple Share Icon
                  <p className="text-[11px] sm:text-xs text-slate-600 dark:text-zinc-300 leading-snug">
                    Alttaki{' '}
                    <span className="inline-flex items-center justify-center text-[#007AFF] font-bold mx-0.5 align-baseline">
                      <svg 
                        className="w-3.5 h-3.5 inline-block" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2.3" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                        <polyline points="16 6 12 2 8 6" />
                        <line x1="12" y1="2" x2="12" y2="15" />
                      </svg>
                    </span>{' '}
                    simgesine, sonra <strong className="font-bold text-slate-900 dark:text-white">“Ana Ekrana Ekle”</strong>ye dokun.
                  </p>
                ) : deferredPrompt ? (
                  // Android / Chromium with direct install button
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] sm:text-xs text-slate-600 dark:text-zinc-300 leading-tight truncate">
                      Tek dokunuşla kurun, reklamsız okuyun.
                    </p>
                    <button
                      type="button"
                      onClick={handleDirectInstall}
                      disabled={isInstalling}
                      className="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-black text-xs transition-all shadow-sm cursor-pointer shrink-0 border border-emerald-300"
                    >
                      {isInstalling ? 'Yükleniyor...' : 'Yükle'}
                    </button>
                  </div>
                ) : detectedPlatform === 'tv' ? (
                  <p className="text-[11px] sm:text-xs text-slate-600 dark:text-zinc-300 leading-snug">
                    Akıllı TV'nizde tam ekran reklamsız canlı TV ve sesli haberler.
                  </p>
                ) : (
                  // General Android or Chromium fallback
                  <p className="text-[11px] sm:text-xs text-slate-600 dark:text-zinc-300 leading-snug">
                    Tarayıcı menüsünden (⋮) <strong className="font-bold text-slate-900 dark:text-white">“Ana Ekrana Ekle”</strong>ye dokunun.
                  </p>
                )}

                {/* Subtle auxiliary link to open full step-by-step guide if requested */}
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsBannerOpen(false);
                      setIsModalOpen(true);
                    }}
                    className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-2.5 h-2.5" />
                    <span>Detaylı rehber</span>
                  </button>
                </div>
              </div>

              {/* Dismiss (X) Button */}
              <button
                type="button"
                onClick={handleDismissBanner}
                className="w-7 h-7 -mr-1 -mt-2 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                aria-label="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 2. ON-DEMAND FULL INTERACTIVE STEP-BY-STEP MODAL (TV / DESKTOP / MANUAL)  */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isModalOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-install-title"
            onClick={handleDismissModal}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-[#12151a] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl text-white relative overflow-hidden max-h-[90vh] overflow-y-auto scrollbar-none"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Subtle decorative glow */}
              <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={handleDismissModal}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer z-10"
                aria-label="Kapat"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header with App Icon & Device Detection Status */}
              <div className="flex items-center gap-3.5 mb-3">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-inner">
                  <img 
                    src="/logo.png" 
                    alt="VOX Logo" 
                    className="w-9 h-9 object-contain rounded-xl"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }} 
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400">
                      VOX Mobil &amp; TV Uygulaması
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      PWA • Ücretsiz
                    </span>
                  </div>
                  <h3 id="pwa-install-title" className="text-lg sm:text-xl font-black text-white leading-tight">
                    {activeTab === 'ios' && "iPhone & iPad'inize Ekleyin"}
                    {activeTab === 'android' && "Android Cihazınıza Yükleyin"}
                    {activeTab === 'desktop' && "Masaüstü Bilgisayarınıza Kurun"}
                    {activeTab === 'tv' && "Smart TV & Android TV'nize Kurun"}
                  </h3>
                </div>
              </div>

              {/* INTERACTIVE DEVICE SELECTOR TABS */}
              <div className="mb-4">
                <div className="text-[11px] font-bold text-zinc-400 mb-1.5 flex items-center justify-between">
                  <span>Cihazınıza Özel Kurulum Rehberi:</span>
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {detectedPlatform === 'ios' ? 'iPhone algılandı' : detectedPlatform === 'android' ? 'Android algılandı' : detectedPlatform === 'tv' ? 'Akıllı TV algılandı' : 'Bilgisayar algılandı'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-white/[0.04] border border-white/10 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setActiveTab('android')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'android'
                        ? 'bg-emerald-500 text-black shadow-md font-black'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Android</span>
                    {detectedPlatform === 'android' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-black ml-0.5" title="Mevcut cihazınız" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('ios')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'ios'
                        ? 'bg-emerald-500 text-black shadow-md font-black'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>iPhone</span>
                    {detectedPlatform === 'ios' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-black ml-0.5" title="Mevcut cihazınız" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('desktop')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'desktop'
                        ? 'bg-emerald-500 text-black shadow-md font-black'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Masaüstü</span>
                    {detectedPlatform === 'desktop' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-black ml-0.5" title="Mevcut cihazınız" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('tv')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'tv'
                        ? 'bg-emerald-500 text-black shadow-md font-black'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>Smart TV</span>
                    {detectedPlatform === 'tv' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-black ml-0.5" title="Mevcut cihazınız" />
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Value Highlights */}
              <div className="grid grid-cols-4 gap-1.5 mb-4">
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2 text-center">
                  <Zap className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
                  <span className="text-[9px] sm:text-[10px] font-bold text-gray-200 block leading-tight">Tek Tıkla Giriş</span>
                </div>
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2 text-center">
                  <WifiOff className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-1" />
                  <span className="text-[9px] sm:text-[10px] font-bold text-gray-200 block leading-tight">Çevrimdışı Oku</span>
                </div>
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2 text-center">
                  <Layers className="w-3.5 h-3.5 text-teal-400 mx-auto mb-1" />
                  <span className="text-[9px] sm:text-[10px] font-bold text-gray-200 block leading-tight">Tam Ekran</span>
                </div>
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2 text-center">
                  <Bell className="w-3.5 h-3.5 text-rose-400 mx-auto mb-1" />
                  <span className="text-[9px] sm:text-[10px] font-bold text-gray-200 block leading-tight">Hızlı Bildirim</span>
                </div>
              </div>

              {/* ============================================================= */}
              {/* TAB 1: ANDROID REHBERİ (GÖRSEL ŞEMA + 1-TIK YÜKLEME)         */}
              {/* ============================================================= */}
              {activeTab === 'android' && (
                <div className="space-y-3.5">
                  <div className="bg-black/50 border border-white/10 rounded-2xl p-3 relative overflow-hidden">
                    <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400 mb-2 flex items-center justify-between">
                      <span>Android {browserName} Arayüzü</span>
                      <span className="text-zinc-500 font-mono">voxozet.com</span>
                    </div>

                    <div className="bg-white/[0.06] rounded-xl px-3 py-2 flex items-center justify-between border border-white/10">
                      <div className="flex items-center gap-2 text-xs text-zinc-300">
                        <span className="text-emerald-400 font-bold">🔒</span>
                        <span className="font-mono text-zinc-200 text-xs">voxozet.com</span>
                      </div>

                      <div className="relative">
                        <span className="animate-ping absolute -inset-1 rounded-full bg-emerald-400 opacity-60"></span>
                        <div className="relative w-7 h-7 rounded-lg bg-emerald-500 text-black flex items-center justify-center font-bold shadow-lg">
                          <MoreVertical className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 bg-[#181c22] border border-white/10 rounded-xl p-2 space-y-1.5 shadow-xl">
                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                        <div className="flex items-center gap-2">
                          <Download className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Uygulamayı Yükle / Ana Ekrana Ekle</span>
                        </div>
                        <span className="text-[10px] font-black uppercase bg-emerald-500 text-black px-1.5 py-0.5 rounded">
                          BURAYA DOKUNUN
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-2.5 py-1 text-zinc-500 text-[11px]">
                        <span>⭐ Yer İşareti Ekle</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 bg-white/[0.02] p-3 rounded-2xl border border-white/5 text-xs text-zinc-300">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <p>Sağ üstteki <strong>üç nokta (⋮)</strong> menüsüne dokunun.</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <p><strong>"Uygulamayı Yükle"</strong> veya <strong>"Ana Ekrana Ekle"</strong> butonuna basın.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleDismissModal}
                      className="flex-1 py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 text-gray-300 font-bold text-xs transition-all cursor-pointer border border-white/5"
                    >
                      Kapat
                    </button>

                    <button
                      type="button"
                      onClick={handleDirectInstall}
                      disabled={isInstalling}
                      className="flex-1 py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-black text-xs transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2 border border-emerald-300"
                    >
                      <Download className={`w-4 h-4 ${isInstalling ? 'animate-bounce' : ''}`} />
                      <span>{isInstalling ? 'Yükleniyor...' : 'Hemen Yükle'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================= */}
              {/* TAB 2: IPHONE / IPAD (IOS SAFARI GÖRSEL ŞEMASI)              */}
              {/* ============================================================= */}
              {activeTab === 'ios' && (
                <div className="space-y-3.5">
                  <div className="bg-black/50 border border-white/10 rounded-2xl p-3 relative overflow-hidden">
                    <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400 mb-2 flex items-center justify-between">
                      <span>iPhone / iPad Safari Menüsü</span>
                      <span className="text-zinc-500 font-mono">iOS 14+</span>
                    </div>

                    <div className="bg-white/[0.06] rounded-xl px-4 py-2.5 flex items-center justify-around border border-white/10">
                      <span className="text-zinc-500 text-sm font-bold">‹</span>
                      <span className="text-zinc-500 text-sm font-bold">›</span>

                      <div className="relative">
                        <span className="animate-ping absolute -inset-1.5 rounded-full bg-emerald-400 opacity-60"></span>
                        <div className="relative w-8 h-8 rounded-xl bg-emerald-500 text-black flex items-center justify-center font-bold shadow-lg">
                          <Share className="w-4 h-4" />
                        </div>
                      </div>

                      <span className="text-zinc-500 text-xs">📖</span>
                      <span className="text-zinc-500 text-xs">📑</span>
                    </div>

                    <div className="mt-2.5 bg-[#181c22] border border-white/10 rounded-xl p-2 space-y-1.5 shadow-xl">
                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                        <div className="flex items-center gap-2">
                          <PlusSquare className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Ana Ekrana Ekle</span>
                        </div>
                        <span className="text-[10px] font-black uppercase bg-emerald-500 text-black px-1.5 py-0.5 rounded">
                          2. ADIM
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 bg-white/[0.02] p-3 rounded-2xl border border-white/5 text-xs text-zinc-300">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <p>Safari'nin altındaki <strong className="text-white">Paylaş (<Share className="w-3 h-3 inline mx-0.5" />)</strong> butonuna dokunun.</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <p>Açılan menüde aşağı kaydırıp <strong className="text-white">"Ana Ekrana Ekle" (<PlusSquare className="w-3 h-3 inline mx-0.5" />)</strong> seçeneğine dokunun.</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-400 font-semibold py-0.5 animate-pulse">
                    <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Safari'nin altındaki paylaş simgesi</span>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleDismissModal}
                      className="flex-1 py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 text-gray-300 font-bold text-xs transition-all cursor-pointer border border-white/5"
                    >
                      Kapat
                    </button>

                    <button
                      type="button"
                      onClick={handleDismissModal}
                      className="flex-1 py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-black text-xs transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2 border border-emerald-300"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Anladım</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================= */}
              {/* TAB 3: MASAÜSTÜ BİLGİSAYAR (CHROME, EDGE, MAC, WINDOWS)       */}
              {/* ============================================================= */}
              {activeTab === 'desktop' && (
                <div className="space-y-3.5">
                  <div className="bg-black/50 border border-white/10 rounded-2xl p-3 relative overflow-hidden">
                    <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400 mb-2 flex items-center justify-between">
                      <span>Masaüstü {browserName} Adres Çubuğu</span>
                      <span className="text-zinc-500 font-mono">Windows / Mac</span>
                    </div>

                    <div className="bg-white/[0.06] rounded-xl px-3 py-2 flex items-center justify-between border border-white/10">
                      <div className="flex items-center gap-2 text-xs text-zinc-300">
                        <span className="text-emerald-400 font-bold">🔒</span>
                        <span className="font-mono text-zinc-200 text-xs">https://voxozet.com</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <span className="animate-ping absolute -inset-1 rounded-full bg-emerald-400 opacity-60"></span>
                          <div className="relative px-2 py-1 rounded-lg bg-emerald-500 text-black text-xs font-black flex items-center gap-1 shadow-lg">
                            <Download className="w-3.5 h-3.5" />
                            <span>Yükle</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 text-center text-[11px] text-zinc-400 font-mono">
                      Adres çubuğundaki yükleme simgesiyle tarayıcısız bağımsız uygulama
                    </div>
                  </div>

                  <div className="space-y-2 bg-white/[0.02] p-3 rounded-2xl border border-white/5 text-xs text-zinc-300">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <p>Aşağıdaki <strong>"Bilgisayara Yükle"</strong> butonuna basın veya tarayıcınızın adres çubuğunun en sağındaki <strong>(⊕ Yükle)</strong> simgesine tıklayın.</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <p>VOX, masaüstünüzde ayrı bir pencerede bağımsız bir uygulama olarak açılır.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleDismissModal}
                      className="flex-1 py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 text-gray-300 font-bold text-xs transition-all cursor-pointer border border-white/5"
                    >
                      Kapat
                    </button>

                    <button
                      type="button"
                      onClick={handleDirectInstall}
                      disabled={isInstalling}
                      className="flex-1 py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-black text-xs transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2 border border-emerald-300"
                    >
                      <Download className={`w-4 h-4 ${isInstalling ? 'animate-bounce' : ''}`} />
                      <span>{isInstalling ? 'Yükleniyor...' : 'Bilgisayara Yükle'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================= */}
              {/* TAB 4: AKILLI TELEVİZYON (ANDROID TV, GOOGLE TV, SAMSUNG, LG) */}
              {/* ============================================================= */}
              {activeTab === 'tv' && (
                <div className="space-y-3.5">
                  <div className="bg-black/50 border border-white/10 rounded-2xl p-3 relative overflow-hidden">
                    <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400 mb-2 flex items-center justify-between">
                      <span>Android TV / Google TV / Smart TV</span>
                      <span className="text-zinc-500 font-mono">Büyük Ekran TV Deneyimi</span>
                    </div>

                    <div className="bg-[#0b0e13] rounded-xl p-3 border border-emerald-500/20 relative">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="font-bold text-white">VOX TV</span>
                          <span className="text-[10px] text-zinc-400">Canlı Yayınlar &amp; Sesli Özetler</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                          16:9 Full HD
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white/[0.04] p-2 rounded-lg border border-white/5 text-center">
                          <span className="text-base block mb-0.5">📺</span>
                          <span className="text-[10px] font-bold text-zinc-200">20+ Canlı TV</span>
                        </div>
                        <div className="bg-white/[0.04] p-2 rounded-lg border border-white/5 text-center">
                          <span className="text-base block mb-0.5">🎙️</span>
                          <span className="text-[10px] font-bold text-zinc-200">Sesli Özet</span>
                        </div>
                        <div className="bg-white/[0.04] p-2 rounded-lg border border-white/5 text-center">
                          <span className="text-base block mb-0.5">🎯</span>
                          <span className="text-[10px] font-bold text-zinc-200">Odak Müzikleri</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 text-center text-[11px] text-zinc-400 font-mono">
                      TV kumandanızın yön tuşları (D-Pad) ve OK tuşuyla kolay kullanım
                    </div>
                  </div>

                  <div className="space-y-2.5 bg-white/[0.02] p-3 rounded-2xl border border-white/5 text-xs text-zinc-300">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <div>
                        <strong className="text-white">Android TV &amp; Google TV (Tavsiye Edilen):</strong>
                        <p className="text-zinc-400 mt-0.5">
                          Televizyonunuzun Google Play Store'undan ücretsiz bir TV tarayıcısı (örn. <strong className="text-emerald-400">TV Bro</strong>, <strong className="text-emerald-400">JioPages</strong> veya <strong className="text-emerald-400">Chrome</strong>) açıp <strong>voxozet.com</strong> adresine girin. Tarayıcı menüsünden <strong>"Ana Ekrana Ekle / Uygulamayı Yükle"</strong> butonuna basın. VOX, TV ana menünüzdeki "Uygulamalarım" satırına kalıcı olarak eklenir!
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <div>
                        <strong className="text-white">Samsung (Tizen) &amp; LG (webOS) Smart TV:</strong>
                        <p className="text-zinc-400 mt-0.5">
                          TV'nin dahili "İnternet / Web Browser" uygulamasından <strong>voxozet.com</strong> adresine gidin. Kumandadan Yıldız/Menü simgesine basıp <strong>"Hızlı Erişim'e / Ana Menüye Ekle"</strong> deyin. Kumandanızla tek tıkla açın.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                      <div>
                        <strong className="text-white">Kumanda (D-Pad) ile Tam Ekran Deneyimi:</strong>
                        <p className="text-zinc-400 mt-0.5">
                          Kumandanızın <strong>Yukarı / Aşağı / Sağ / Sol</strong> yön tuşlarıyla kanallar ve haberler arasında gezinin, <strong>OK (Enter)</strong> tuşu ile Canlı TV'yi televizyonunuzda tam ekran reklamsız ve kesintisiz izleyin.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleDismissModal}
                      className="flex-1 py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 text-gray-300 font-bold text-xs transition-all cursor-pointer border border-white/5"
                    >
                      Kapat
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleDismissModal();
                        window.location.href = '/canli-tv';
                      }}
                      className="flex-1 py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-black text-xs transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2 border border-emerald-300"
                    >
                      <Tv className="w-4 h-4" />
                      <span>Canlı TV'yi Aç</span>
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
