import React, { useState, useEffect } from 'react';
import { Smartphone, Share, PlusSquare, X, CheckCircle } from 'lucide-react';
import { appStorage } from '../lib/storage';

export const InstallPwaModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    
    if (!isMobile) return;

    // Check if dismissed before
    const dismissed = appStorage.getItemSync('vox_pwa_modal_dismissed');
    if (dismissed === 'true') return;

    // Check iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Listen for beforeinstallprompt (Android / Chrome)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsOpen(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // If iOS or general mobile, show after a short delay so user sees the site first
    const timer = setTimeout(() => {
      const alreadyShown = appStorage.getItemSync('vox_pwa_modal_shown');
      if (!alreadyShown) {
        setIsOpen(true);
        appStorage.setItemSync('vox_pwa_modal_shown', 'true');
      }
    }, 3500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
      setIsOpen(false);
    } else {
      // For iOS or browsers without native prompt support, keep modal open to guide them or dismiss
      setIsOpen(false);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    appStorage.setItemSync('vox_pwa_modal_dismissed', 'true');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-md bg-[#16181c] border border-white/10 rounded-3xl p-6 shadow-2xl text-white relative animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Kapat"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 mb-0.5">VOX ÖZET UYGULAMASI</div>
            <h3 className="text-lg font-extrabold text-white leading-tight">Ana Ekrana Yükle</h3>
          </div>
        </div>

        <p className="text-xs text-gray-300 leading-relaxed mb-6">
          VOX Özet'i cihazınızın ana ekranına ekleyerek hızlı erişim, çevrimdışı okuma ve tam ekran uygulama deneyimi elde edin.
        </p>

        {/* Step-by-Step Instructions */}
        <div className="space-y-3 mb-6 bg-black/30 p-4 rounded-2xl border border-white/5">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <p className="text-xs text-gray-200 leading-snug pt-0.5">
              Tarayıcınızın alt veya üst kısmındaki <span className="inline-inline-flex items-center text-emerald-400 font-semibold px-1"><Share className="w-3.5 h-3.5 inline mx-0.5" /> Paylaş</span> butonuna dokunun.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <p className="text-xs text-gray-200 leading-snug pt-0.5">
              Açılan menüde aşağı kaydırarak <span className="inline-inline-flex items-center text-emerald-400 font-semibold px-1"><PlusSquare className="w-3.5 h-3.5 inline mx-0.5" /> Ana Ekrana Ekle</span> seçeneğini seçin.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDismiss}
            className="flex-1 py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs transition-colors cursor-pointer"
          >
            Daha Sonra
          </button>
          <button
            type="button"
            onClick={deferredPrompt ? handleInstallClick : handleDismiss}
            className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-lg cursor-pointer flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{deferredPrompt ? 'Hemen Yükle' : 'Anladım'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
