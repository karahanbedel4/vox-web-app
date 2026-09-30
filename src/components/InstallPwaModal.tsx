import React, { useState, useEffect, useRef } from 'react';
import { 
  Smartphone, 
  Share, 
  PlusSquare, 
  X, 
  CheckCircle, 
  Download, 
  Sparkles, 
  Zap, 
  WifiOff, 
  ArrowDown 
} from 'lucide-react';
import { appStorage } from '../lib/storage';
import { triggerHapticImpact } from '../lib/haptics';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const InstallPwaModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 1. Detect if the app is already installed / running in standalone mode
    const standalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    if (standalone) {
      return; // Already running as native PWA, no prompt needed
    }

    // 2. Detect iOS device (iPhone, iPad, iPod)
    const ua = navigator.userAgent || '';
    const isIosDevice = 
      /iPad|iPhone|iPod/.test(ua) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIosDevice);

    // 3. Listen for beforeinstallprompt (Android, Chrome, Edge, Chromium)
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent browser's default banner so WE control the timing
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      // Keep in window so other buttons can access if needed
      (window as any).__vox_deferred_prompt = promptEvent;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Listen for app installed event
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setIsOpen(false);
      setDeferredPrompt(null);
      appStorage.setItemSync('vox_pwa_installed', 'true');
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // 5. Allow manual opening via custom event (e.g. from Sidebar or Settings button)
    const handleManualOpen = () => {
      triggerHapticImpact('light');
      setIsOpen(true);
    };
    window.addEventListener('vox_open_pwa_install', handleManualOpen);

    // 6. DELAY RULE: Show strictly 30 seconds after opening the site
    // Check if dismissed recently (within 7 days)
    const dismissedTimeStr = appStorage.getItemSync('vox_pwa_dismissed_at');
    const hasInstalledBefore = appStorage.getItemSync('vox_pwa_installed') === 'true';
    
    let isRecentlyDismissed = false;
    if (dismissedTimeStr) {
      const dismissedTime = parseInt(dismissedTimeStr, 10);
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < sevenDaysMs) {
        isRecentlyDismissed = true;
      }
    }

    if (!isRecentlyDismissed && !hasInstalledBefore) {
      // Exactly 30 seconds timer (30000 ms)
      timerRef.current = setTimeout(() => {
        setIsOpen(true);
      }, 30000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('vox_open_pwa_install', handleManualOpen);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // DIRECT INSTALL TRIGGER (Android / Chrome / Edge)
  const handleDirectInstall = async () => {
    triggerHapticImpact('medium');
    setIsInstalling(true);

    // Check if deferredPrompt is ready
    const prompt = deferredPrompt || (window as any).__vox_deferred_prompt;

    if (prompt) {
      try {
        // Trigger the browser native installation prompt directly!
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === 'accepted') {
          appStorage.setItemSync('vox_pwa_installed', 'true');
          setDeferredPrompt(null);
          (window as any).__vox_deferred_prompt = null;
          setIsOpen(false);
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      } finally {
        setIsInstalling(false);
      }
    } else {
      // Fallback for browsers without direct prompt event
      setIsInstalling(false);
      setIsOpen(false);
    }
  };

  const handleDismiss = () => {
    triggerHapticImpact('light');
    setIsOpen(false);
    // Dismiss for 7 days
    appStorage.setItemSync('vox_pwa_dismissed_at', Date.now().toString());
  };

  if (!isOpen || isStandalone) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-title"
    >
      <div 
        className="w-full max-w-md bg-[#12151a] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl text-white relative animate-slideUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer z-10"
          aria-label="Kapat"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with App Icon */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-inner">
            <img 
              src="/logo.png" 
              alt="VOX Logo" 
              className="w-9 h-9 object-contain rounded-xl"
              onError={(e) => {
                // Fallback to Smartphone icon if logo not loaded
                (e.target as HTMLElement).style.display = 'none';
              }} 
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400">
                VOX Özet Uygulaması
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Ücretsiz
              </span>
            </div>
            <h3 id="pwa-install-title" className="text-lg font-black text-white leading-tight">
              {isIOS ? "iPhone'unuza Ekleyin" : "Ana Ekrana Ekle"}
            </h3>
          </div>
        </div>

        {/* Quick Value Highlights */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2 text-center">
            <Zap className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-gray-200 block leading-tight">1 Tıkla Erişim</span>
          </div>
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2 text-center">
            <WifiOff className="w-4 h-4 text-sky-400 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-gray-200 block leading-tight">Çevrimdışı Oku</span>
          </div>
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2 text-center">
            <Smartphone className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-gray-200 block leading-tight">Tam Ekran</span>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* CASE 1: ANDROID / CHROME / EDGE (DIRECT 1-CLICK NATIVE PROMPT) */}
        {/* ------------------------------------------------------------- */}
        {!isIOS && (
          <div className="space-y-4">
            <p className="text-xs text-gray-300 leading-relaxed">
              VOX Özet'i ana ekranınıza ekleyerek haberleri kesintisiz takip edin, yapay zeka özetlerini ve canlı TV'yi tam ekran deneyimleyin.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleDismiss}
                className="flex-1 py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 text-gray-300 font-bold text-xs transition-all cursor-pointer border border-white/5"
              >
                Daha Sonra
              </button>

              <button
                type="button"
                onClick={handleDirectInstall}
                disabled={isInstalling}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-black text-xs transition-all shadow-lg shadow-emerald-900/40 cursor-pointer flex items-center justify-center gap-2 border border-emerald-400/30"
              >
                <Download className={`w-4 h-4 ${isInstalling ? 'animate-bounce' : ''}`} />
                <span>{isInstalling ? 'Yükleniyor...' : 'Ana Ekrana Ekle'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* CASE 2: IPHONE / IPAD (IOS SAFARI STREAMLINED 2-STEP GUIDE)   */}
        {/* ------------------------------------------------------------- */}
        {isIOS && (
          <div className="space-y-4">
            <p className="text-xs text-gray-300 leading-relaxed">
              Safari'de 2 kolay adımda ana ekranınıza ekleyip bağımsız bir mobil uygulama gibi kullanabilirsiniz:
            </p>

            <div className="space-y-2.5 bg-black/40 p-3.5 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-black text-xs flex items-center justify-center shrink-0">
                  1
                </div>
                <p className="text-xs text-gray-200 leading-snug">
                  Safari'nin alt menüsündeki <span className="inline-flex items-center font-bold text-sky-400 px-1 bg-sky-500/10 rounded mx-0.5"><Share className="w-3 h-3 inline mr-1" /> Paylaş</span> simgesine dokunun.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0">
                  2
                </div>
                <p className="text-xs text-gray-200 leading-snug">
                  Açılan menüde aşağı kaydırıp <span className="inline-flex items-center font-bold text-emerald-400 px-1 bg-emerald-500/10 rounded mx-0.5"><PlusSquare className="w-3 h-3 inline mr-1" /> Ana Ekrana Ekle</span> seçeneğine dokunun.
                </p>
              </div>
            </div>

            {/* Visual bouncing pointer towards bottom bar on iPhone */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-medium py-1 animate-pulse">
              <ArrowDown className="w-3.5 h-3.5 text-sky-400" />
              <span>Safari'nin altındaki paylaş simgesi</span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleDismiss}
                className="flex-1 py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 text-gray-300 font-bold text-xs transition-all cursor-pointer border border-white/5"
              >
                Daha Sonra
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-black text-xs transition-all shadow-lg shadow-emerald-900/40 cursor-pointer flex items-center justify-center gap-2 border border-emerald-400/30"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Anladım</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
