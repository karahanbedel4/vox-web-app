import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  Send, 
  MessageCircle, 
  Mail, 
  FileText, 
  ExternalLink,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Article } from '../types';
import { useTheme } from '../lib/ThemeContext';
import { XLogoIcon } from './XLogoIcon';
import { sanitizeNewsText, sanitizeImageUrl, getTopicContextualImage, DEFAULT_VOX_FALLBACK_IMAGE } from '../lib/newsService';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: Article | null;
  customUrl?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  article,
  customUrl
}) => {
  const { theme } = useTheme();
  const [isUrlCopied, setIsUrlCopied] = useState(false);
  const [isTextCopied, setIsTextCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !article) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://voxozet.com';
  const shareUrl = customUrl || (typeof window !== 'undefined' ? window.location.href : `${origin}/haber/${article.id}`);
  const title = sanitizeNewsText(article.title);
  const summary = sanitizeNewsText(article.summary || article.content || '');
  const author = sanitizeNewsText(article.author) || 'VOX Haber';
  const category = article.category || 'Gündem';
  const imgUrl = sanitizeImageUrl(article.imageUrl) || getTopicContextualImage(article.title, article.category) || DEFAULT_VOX_FALLBACK_IMAGE;

  // Formatted summary text for copying / messaging
  const fullShareText = `${title}\n\n${summary}\n\nKaynak: ${author}\nDetay: ${shareUrl}`;

  const handleCopyUrl = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setIsUrlCopied(true);
      setTimeout(() => setIsUrlCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleCopyTextWithLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fullShareText);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = fullShareText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setIsTextCopied(true);
      setTimeout(() => setIsTextCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  // Social share triggers
  const socialChannels = [
    {
      id: 'x',
      name: 'X (Twitter)',
      icon: <XLogoIcon className="w-4 h-4 text-white" />,
      bg: 'bg-black hover:bg-zinc-800 text-white border-zinc-700',
      action: () => {
        const text = `${title} | @VOXOzet`;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: <MessageCircle className="w-4 h-4 text-white" />,
      bg: 'bg-[#25D366] hover:bg-[#20bd5a] text-white border-transparent',
      action: () => {
        const text = `*${title}*\n\n${summary ? summary.slice(0, 160) + '...\n\n' : ''}${shareUrl}`;
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: <Send className="w-4 h-4 text-white" />,
      bg: 'bg-[#229ED9] hover:bg-[#1e8ec3] text-white border-transparent',
      action: () => {
        const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: <Globe className="w-4 h-4 text-white" />,
      bg: 'bg-[#0A66C2] hover:bg-[#095196] text-white border-transparent',
      action: () => {
        const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    },
    {
      id: 'mail',
      name: 'E-Posta',
      icon: <Mail className="w-4 h-4 text-white" />,
      bg: 'bg-slate-700 hover:bg-slate-600 text-white border-transparent',
      action: () => {
        const subject = `${title} - VOX Özet`;
        const body = `Merhaba,\n\nŞu haberi seninle paylaşmak istedim:\n\n${title}\n\n${summary}\n\nHaberi oku: ${shareUrl}`;
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      }
    }
  ];

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${title} - VOX`,
          text: summary || title,
          url: shareUrl
        });
      } catch {
        // User cancelled share
      }
    }
  };

  const hasNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.96 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border max-h-[90vh] sm:max-h-[85vh] ${
            theme === 'light'
              ? 'bg-white border-slate-200 text-slate-900'
              : 'bg-[#121814] border-white/10 text-white'
          }`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-6 py-4 border-b ${
            theme === 'light' ? 'border-slate-100 bg-slate-50/75' : 'border-white/10 bg-[#151d18]'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-500">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold leading-none">
                  Haberi Paylaş
                </h3>
                <span className={`text-[11px] font-medium ${
                  theme === 'light' ? 'text-slate-500' : 'text-zinc-400'
                }`}>
                  Sosyal ağlar veya doğrudan bağlantı
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Kapat"
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                theme === 'light'
                  ? 'bg-slate-200/70 hover:bg-slate-300 text-slate-600'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-6 space-y-5 overflow-y-auto">
            {/* Article Mini Preview Card */}
            <div className={`flex items-center gap-3.5 p-3 rounded-2xl border ${
              theme === 'light'
                ? 'bg-slate-50 border-slate-200'
                : 'bg-white/5 border-white/10'
            }`}>
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-black/10 relative">
                <img
                  src={imgUrl}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">
                  <span>{category}</span>
                  <span className="text-zinc-400">•</span>
                  <span className={theme === 'light' ? 'text-slate-500' : 'text-zinc-400'}>{author}</span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold line-clamp-2 leading-snug">
                  {title}
                </h4>
              </div>
            </div>

            {/* Social Media Share Grid */}
            <div className="space-y-2">
              <label className={`text-[11px] font-bold uppercase tracking-wider block ${
                theme === 'light' ? 'text-slate-500' : 'text-zinc-400'
              }`}>
                Sosyal Medyada Paylaş
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {socialChannels.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={ch.action}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95 border ${ch.bg}`}
                  >
                    {ch.icon}
                    <span>{ch.name}</span>
                  </button>
                ))}

                {hasNativeShare && (
                  <button
                    onClick={handleNativeShare}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95 border ${
                      theme === 'light'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-black border-transparent'
                    }`}
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Diğer...</span>
                  </button>
                )}
              </div>
            </div>

            {/* Primary Action: Direct Copy Link Field */}
            <div className="space-y-2">
              <label className={`text-[11px] font-bold uppercase tracking-wider block ${
                theme === 'light' ? 'text-slate-500' : 'text-zinc-400'
              }`}>
                Bağlantıyı Kopyala
              </label>

              <div className={`flex items-center gap-2 p-1.5 pl-3 rounded-2xl border ${
                theme === 'light'
                  ? 'bg-slate-100 border-slate-200'
                  : 'bg-white/5 border-white/10'
              }`}>
                <span className={`text-xs truncate flex-1 font-mono select-all ${
                  theme === 'light' ? 'text-slate-600' : 'text-zinc-400'
                }`}>
                  {shareUrl}
                </span>

                <button
                  id="btn-copy-share-url"
                  onClick={handleCopyUrl}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm active:scale-95 ${
                    isUrlCopied
                      ? 'bg-emerald-500 text-white'
                      : theme === 'light'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-black'
                  }`}
                >
                  {isUrlCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Kopyalandı!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kopyala</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Secondary Action: Copy Full Summary with Link */}
            <button
              onClick={handleCopyTextWithLink}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors border cursor-pointer ${
                isTextCopied
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                  : theme === 'light'
                    ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300'
              }`}
            >
              {isTextCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="font-bold">Haber Başlığı ve Özeti Panoya Kopyalandı!</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  <span>Başlık, Özet ve Bağlantıyı Birlikte Kopyala</span>
                </>
              )}
            </button>
          </div>

          {/* Footer */}
          <div className={`px-6 py-3 border-t flex items-center justify-between text-[11px] ${
            theme === 'light' ? 'border-slate-100 bg-slate-50 text-slate-500' : 'border-white/10 bg-[#151d18] text-zinc-400'
          }`}>
            <span>VOX Doğrulanmış Haber Paylaşımı</span>
            <button
              onClick={onClose}
              className={`font-semibold hover:underline cursor-pointer ${
                theme === 'light' ? 'text-slate-700' : 'text-white'
              }`}
            >
              Kapat
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
