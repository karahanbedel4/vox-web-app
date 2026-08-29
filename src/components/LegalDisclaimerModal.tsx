import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldAlert, Mail, CheckCircle, ExternalLink, Scale } from 'lucide-react';
import { VoxLogo } from './VoxLogo';

interface LegalDisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegalDisclaimerModal: React.FC<LegalDisclaimerModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('voxozet@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-[#12141c] border border-white/15 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                    Yasal Uyarı & Uyar-Kaldır
                  </h3>
                  <p className="text-[11px] text-gray-400 font-mono">
                    5651 Sayılı Kanun & FSEK Bildirimi
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm leading-relaxed text-gray-300">
              {/* Brand Banner */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                <VoxLogo size="sm" textColor="light" />
                <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Hukuki Şeffaflık
                </span>
              </div>

              {/* Exact Legal Text */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Uyar-Kaldır (Notice and Takedown) Beyanı</span>
                </div>
                <p className="text-gray-200 leading-relaxed font-normal text-xs sm:text-sm text-justify sm:text-left">
                  VOX, halka açık haber kaynaklarından elde edilen içerikleri otomatik olarak derleyen ve yapay zeka aracılığıyla özetleyen bir aracı platformdur. Platformumuzda yer alan haberlerin orijinal içerikleri, doğruluğu ve hukuki sorumluluğu tamamen ilgili yayıncı kuruluşlara aittir. VOX, sağlanan metinler üzerinde herhangi bir editoryal denetim veya yönlendirme yapmaz. Telif hakları, kişilik hakları ihlali veya diğer geçerli hukuki gerekçelerle uygulamamızdan veya web sitemizden kaldırılmasını talep ettiğiniz içerikler için, ilgili haberin URL'si veya ekran görüntüsü ile birlikte <strong className="text-emerald-400 font-semibold">voxozet@gmail.com</strong> adresine e-posta gönderebilirsiniz. 5651 sayılı kanun kapsamında "Uyar ve Kaldır" prensibini benimseyen platformumuz, yasal taleplerinizi değerlendirerek gerekli teknik aksiyonları en kısa sürede alacaktır.
                </p>
              </div>

              {/* Contact Box */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-[11px] text-gray-400 block font-medium">Yasal Bildirim E-Posta Hattı</span>
                    <a
                      href="mailto:voxozet@gmail.com?subject=VOX%20İçerik%20Kaldırma%20Talebi%20(5651%20Sayılı%20Kanun)"
                      className="text-xs sm:text-sm font-bold text-white hover:text-emerald-400 transition-colors hover:underline"
                    >
                      voxozet@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyEmail}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Kopyalandı</span>
                      </>
                    ) : (
                      <span>E-Postayı Kopyala</span>
                    )}
                  </button>

                  <a
                    href="mailto:voxozet@gmail.com?subject=VOX%20İçerik%20Kaldırma%20Talebi%20(5651%20Sayılı%20Kanun)"
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                  >
                    <span>E-posta Gönder</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 border-t border-white/10 bg-black/30 flex items-center justify-between text-[11px] text-gray-400">
              <span>VOX Hukuk & Telif Hakları Birimi</span>
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors cursor-pointer"
              >
                Anladım
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
