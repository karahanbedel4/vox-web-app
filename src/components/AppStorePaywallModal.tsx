import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Smartphone, Download, CheckCircle2, FileText, Zap } from 'lucide-react';

interface AppStorePaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: 'limit_reached' | 'pages_exceeded' | 'not_logged_in' | 'bookmark_action' | 'audio_action';
}

export const AppStorePaywallModal: React.FC<AppStorePaywallModalProps> = ({
  isOpen,
  onClose,
  reason = 'limit_reached'
}) => {
  if (!isOpen) return null;

  const handleDownloadClick = () => {
    alert('VOX iOS uygulaması indirme sayfasına yönlendiriliyorsunuz...');
  };

  const getModalTitle = () => {
    if (reason === 'bookmark_action') return 'Haberleri Kaydetmek İçin VOX iOS';
    if (reason === 'audio_action') return 'Sınırsız Sesli Dinleme VOX iOS';
    if (reason === 'pages_exceeded' || reason === 'limit_reached') return 'Günlük Özetleme Sınırına Ulaştınız';
    return 'VOX iOS Uygulamasını İndirin';
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-[#121814] border-2 border-emerald-500/50 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(16,185,129,0.25)] text-white"
        >
          {/* Header Image & Badge */}
          <div className="relative p-6 bg-gradient-to-b from-emerald-950/60 via-[#121814] to-[#121814] text-center space-y-3 border-b border-white/10">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>VOX PREMIUM & MOBİL UYGULAMA</span>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 mx-auto shadow-xl">
              <div className="w-full h-full bg-[#121814] rounded-[14px] flex items-center justify-center text-emerald-400">
                <Smartphone className="w-8 h-8" />
              </div>
            </div>

            <h2 className="font-display text-xl font-black tracking-tight text-white leading-snug">
              {getModalTitle()}
            </h2>
          </div>

          {/* Main Notice Body */}
          <div className="p-6 space-y-5 text-center">
            <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-2xl space-y-2 text-left">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-100 font-medium leading-relaxed">
                  "Bu özellik yalnızca VOX iOS uygulamasında mevcuttur. Sınırsız sesli bülten, uzun belge özetleri ve cihazlar arası senkronizasyon için uygulamamızı indirin."
                </p>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-2 text-left text-xs">
              <div className="flex items-center gap-2 text-gray-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Sınırsız PDF, TXT ve Web Sayfası özetleme</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Yolda kilit ekranından ve kulaklıktan kesintisiz dinleme</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Çevrimdışı kayıt, favoriler ve HD Stüdyo seslendirme</span>
              </div>
            </div>

            {/* App Store CTA Button */}
            <div className="pt-2">
              <button
                onClick={handleDownloadClick}
                className="w-full py-3.5 px-5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-extrabold text-sm rounded-2xl shadow-[0_0_20px_rgba(249,115,22,0.35)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                {/* Apple Logo SVG */}
                <svg className="w-6 h-6 fill-white" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.91.13-9.79-1.93-14.64-6.17-3.38-2.88-7.25-7.6-11.62-14.17-6.26-9.33-11.22-19.89-14.88-31.68-3.66-11.79-5.49-22.86-5.49-33.2 0-14.28 3.57-25.9 10.72-34.86 7.15-8.96 16.14-13.52 26.97-13.68 4.8 0 10.02 1.18 15.66 3.55 5.64 2.37 9.4 3.56 11.28 3.56 1.58 0 5.48-1.25 11.71-3.75 6.23-2.5 11.29-3.68 15.18-3.55 12.18.63 21.82 4.96 28.92 12.99-10.76 6.53-16.03 15.49-15.8 26.88.24 8.96 3.65 16.42 10.23 22.38 6.58 5.96 14.45 9.29 23.61 9.99-2.47 7.23-5.74 14.44-9.82 21.62zM119.22 31.81c0-6.61 2.39-12.87 7.18-18.78 4.79-5.91 10.74-9.36 17.85-10.35.32 1.34.48 2.68.48 4.02 0 6.6-2.42 12.88-7.26 18.83-4.84 5.95-10.77 9.26-17.78 9.93-.16-1.12-.47-2.34-.47-3.65z"/>
                </svg>
                <div className="text-left leading-tight">
                  <span className="text-[10px] opacity-90 uppercase block tracking-wider font-semibold">App Store'dan İndir</span>
                  <span className="text-xs font-black block">VOX iOS Uygulamasını Alın</span>
                </div>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
