import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  Mic, 
  Headphones, 
  FileText, 
  Cloud,
  CheckCircle2
} from 'lucide-react';

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

  const handleAppStoreClick = () => {
    alert('VOX iOS uygulaması App Store sayfasına yönlendiriliyorsunuz...');
  };

  const handleGooglePlayClick = () => {
    alert('VOX Android uygulaması Google Play sayfasına yönlendiriliyorsunuz...');
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xl"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 25 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg bg-[#101713]/95 border border-emerald-500/30 rounded-3xl overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.15)] text-white backdrop-blur-2xl"
        >
          {/* Subtle Ambient Light Gradients */}
          <div className="absolute -top-24 -left-24 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close Icon Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer border border-white/5"
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Modal Content */}
          <div className="relative p-6 sm:p-8 space-y-6">
            
            {/* Header Area */}
            <div className="text-center space-y-3">
              {/* Premium Badge */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 text-white text-[11px] font-black uppercase tracking-widest shadow-[0_0_18px_rgba(249,115,22,0.45)] border border-white/20">
                <Sparkles className="w-3 h-3 fill-current animate-pulse" />
                <span>PREMIUM</span>
              </div>

              {/* Main Title */}
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                Sınırları Kaldırın. <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-[#1ed760]">
                  VOX'u Cebinize Taşıyın.
                </span>
              </h2>

              {/* Subtitle */}
              <p className="text-xs sm:text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
                Bu özellik yalnızca VOX Mobil Uygulaması'nda mevcuttur. Kesintisiz deneyim için uygulamamızı ücretsiz indirin.
              </p>
            </div>

            {/* Premium Features List */}
            <div className="space-y-3 bg-black/40 border border-white/5 p-4 sm:p-5 rounded-2xl">
              {/* Feature 1 */}
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 shadow-sm">
                  <Mic className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-gray-100">Sınırsız Sesli Haber</h4>
                  <p className="text-[11px] sm:text-xs text-gray-400 leading-snug">
                    Tüm gündemi yapay zeka stüdyo kalitesiyle dinleyin.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 shadow-sm">
                  <Headphones className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-gray-100">Arka Planda Çalma</h4>
                  <p className="text-[11px] sm:text-xs text-gray-400 leading-snug">
                    Ekranınız kapalıyken bile haberleri ve doğa seslerini dinlemeye devam edin.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 shadow-sm">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-gray-100">PDF ve Belge Özetleme</h4>
                  <p className="text-[11px] sm:text-xs text-gray-400 leading-snug">
                    Uzun makaleleri saniyeler içinde analiz edin.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 shadow-sm">
                  <Cloud className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-gray-100">Cihazlar Arası Senkronizasyon</h4>
                  <p className="text-[11px] sm:text-xs text-gray-400 leading-snug">
                    Kaldığınız yeri asla kaybetmeyin.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons (App Store & Google Play) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* App Store Button */}
              <button
                onClick={handleAppStoreClick}
                className="py-3 px-4 bg-black hover:bg-neutral-900 border border-white/20 hover:border-white/40 active:border-emerald-500 text-white rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg active:scale-95 group cursor-pointer"
              >
                {/* Apple Logo SVG */}
                <svg className="w-6 h-6 fill-white shrink-0 group-hover:scale-105 transition-transform" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.91.13-9.79-1.93-14.64-6.17-3.38-2.88-7.25-7.6-11.62-14.17-6.26-9.33-11.22-19.89-14.88-31.68-3.66-11.79-5.49-22.86-5.49-33.2 0-14.28 3.57-25.9 10.72-34.86 7.15-8.96 16.14-13.52 26.97-13.68 4.8 0 10.02 1.18 15.66 3.55 5.64 2.37 9.4 3.56 11.28 3.56 1.58 0 5.48-1.25 11.71-3.75 6.23-2.5 11.29-3.68 15.18-3.55 12.18.63 21.82 4.96 28.92 12.99-10.76 6.53-16.03 15.49-15.8 26.88.24 8.96 3.65 16.42 10.23 22.38 6.58 5.96 14.45 9.29 23.61 9.99-2.47 7.23-5.74 14.44-9.82 21.62zM119.22 31.81c0-6.61 2.39-12.87 7.18-18.78 4.79-5.91 10.74-9.36 17.85-10.35.32 1.34.48 2.68.48 4.02 0 6.6-2.42 12.88-7.26 18.83-4.84 5.95-10.77 9.26-17.78 9.93-.16-1.12-.47-2.34-.47-3.65z"/>
                </svg>
                <div className="text-left leading-tight">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-medium">App Store'dan</span>
                  <span className="text-xs font-bold block text-white">İndirin</span>
                </div>
              </button>

              {/* Google Play Button */}
              <button
                onClick={handleGooglePlayClick}
                className="py-3 px-4 bg-black hover:bg-neutral-900 border border-white/20 hover:border-white/40 active:border-emerald-500 text-white rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg active:scale-95 group cursor-pointer"
              >
                {/* Google Play Logo SVG */}
                <svg className="w-5 h-5 shrink-0 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M3.609 1.814L13.792 12 3.61 22.186a2.38 2.38 0 0 1-.61-1.614V3.428c0-.623.23-1.196.609-1.614z"/>
                  <path fill="#FBBC04" d="M17.207 8.586L4.764 1.407C4.385 1.189 3.978 1.058 3.609 1.814L13.792 12l3.415-3.414z"/>
                  <path fill="#EA4335" d="M17.207 15.414L13.792 12 3.61 22.186c.369.756.776.625 1.154.407l12.443-7.179z"/>
                  <path fill="#34A853" d="M20.59 10.518l-3.383-1.932-3.415 3.414 3.415 3.414 3.383-1.932a1.71 1.71 0 0 0 0-2.964z"/>
                </svg>
                <div className="text-left leading-tight">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-medium">Google Play'den</span>
                  <span className="text-xs font-bold block text-white">Alın</span>
                </div>
              </button>
            </div>

            {/* Dismiss / Later Button */}
            <div className="text-center pt-1">
              <button
                onClick={onClose}
                className="text-xs text-gray-500 hover:text-gray-300 font-medium py-1.5 px-4 rounded-lg transition-colors cursor-pointer"
              >
                Belki Daha Sonra
              </button>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

