import React from 'react';
import { CloudRain, Sliders, Square, X, Sparkles, Check, Volume2 } from 'lucide-react';
import { triggerHapticImpact } from '../lib/haptics';

// Top Notification Toast Banner
interface AmbientNotificationBannerProps {
  notificationText: string | null;
  onDismiss: () => void;
  onOpenMixer: () => void;
}

export const AmbientNotificationBanner: React.FC<AmbientNotificationBannerProps> = ({
  notificationText,
  onDismiss,
  onOpenMixer
}) => {
  if (!notificationText) return null;

  return (
    <div className="fixed top-3 left-3 right-3 z-50 animate-in slide-in-from-top-4 duration-300 pointer-events-auto">
      <div className="bg-surface-container/95 border border-primary/40 shadow-2xl backdrop-blur-xl rounded-2xl p-3.5 flex items-center justify-between text-on-surface">
        <div 
          className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 pr-2"
          onClick={onOpenMixer}
        >
          <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shrink-0">
            <CloudRain className="w-4 h-4 animate-pulse" />
          </div>
          <div className="truncate">
            <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider block">
              SİSTEM BİLDİRİMİ
            </span>
            <p className="font-display text-xs font-bold truncate text-on-surface">
              Devam eden: Doğa sesleri ... <span className="text-primary">{notificationText}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="w-7 h-7 rounded-full bg-surface-variant flex items-center justify-center hover:bg-card-border text-on-surface-variant hover:text-on-surface shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

// Bottom Ambient Floating Mini Player Bar (Above BottomNav)
interface AmbientMiniPlayerBarProps {
  isAmbientActive: boolean;
  activeAmbientName: string;
  onStopAll: () => void;
  onOpenMixer: () => void;
  hasArticleMiniPlayer?: boolean;
}

export const AmbientMiniPlayerBar: React.FC<AmbientMiniPlayerBarProps> = ({
  isAmbientActive,
  activeAmbientName,
  onStopAll,
  onOpenMixer,
  hasArticleMiniPlayer = false
}) => {
  if (!isAmbientActive) return null;

  const triggerHaptic = () => {
    triggerHapticImpact('light').catch(() => {});
  };

  // Stack above article mini player if both are active
  const bottomPositionClass = hasArticleMiniPlayer ? 'bottom-32' : 'bottom-16 sm:bottom-20';

  return (
    <div className={`fixed ${bottomPositionClass} left-3 right-3 z-40 animate-in slide-in-from-bottom-3 duration-300 pointer-events-auto`}>
      <div className="bg-surface-container/95 border border-primary/40 shadow-xl backdrop-blur-md rounded-2xl p-2.5 px-3.5 flex items-center justify-between text-on-surface">
        <div 
          className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 pr-2"
          onClick={() => { triggerHaptic(); onOpenMixer(); }}
        >
          <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shrink-0">
            <CloudRain className="w-4 h-4 animate-pulse" />
          </div>
          <div className="truncate">
            <span className="text-[9px] font-extrabold text-primary uppercase tracking-wider block">
              DOĞA SESLERİ ÇALINIYOR
            </span>
            <p className="font-display text-xs font-bold truncate text-on-surface">
              {activeAmbientName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => { triggerHaptic(); onStopAll(); }}
            className="px-2.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-xs font-extrabold flex items-center gap-1 active:scale-95 transition-transform"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>Durdur</span>
          </button>

          <button
            onClick={() => { triggerHaptic(); onOpenMixer(); }}
            className="px-2.5 py-1.5 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-xs font-extrabold flex items-center gap-1 active:scale-95 transition-transform"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Mikser</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Conflict Question Modal when user plays Converted Content (Podcast/Article)
interface AmbientConflictModalProps {
  isOpen: boolean;
  activeAmbientName: string;
  pendingArticleTitle?: string;
  onConfirmKeepAmbient: () => void;
  onStopAmbientAndPlay: () => void;
}

export const AmbientConflictModal: React.FC<AmbientConflictModalProps> = ({
  isOpen,
  activeAmbientName,
  pendingArticleTitle,
  onConfirmKeepAmbient,
  onStopAmbientAndPlay
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-sm bg-surface-container border border-card-border rounded-3xl p-6 space-y-5 shadow-2xl text-on-surface text-center">
        
        {/* Header Icon */}
        <div className="mx-auto w-14 h-14 rounded-3xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-lg">
          <CloudRain className="w-7 h-7 animate-pulse" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h3 className="font-display font-extrabold text-base text-on-surface">
            Doğa Sesi Çalmaya Devam Etsin mi?
          </h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            <strong className="text-primary">{activeAmbientName}</strong> arka planda çalmaya devam etsin mi?
          </p>
          {pendingArticleTitle && (
            <div className="bg-surface-variant/60 border border-card-border rounded-xl p-2.5 text-[11px] font-medium text-on-surface-variant truncate mt-1">
              🎵 İçerik: <span className="text-on-surface font-semibold">{pendingArticleTitle}</span>
            </div>
          )}
        </div>

        {/* Info Note */}
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-2.5 text-[10px] text-primary font-semibold flex items-center gap-2 text-left">
          <Volume2 className="w-4 h-4 shrink-0" />
          <span>Dönüştürülen içerik cihaz sesinizle, doğa sesleri ise mikser ayarlarınızla bağımsız çalışacaktır.</span>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <button
            onClick={onConfirmKeepAmbient}
            className="w-full bg-primary text-on-primary py-3 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
          >
            <Check className="w-4 h-4" />
            <span>Evet, Birlikte Çalsın</span>
          </button>

          <button
            onClick={onStopAmbientAndPlay}
            className="w-full bg-surface-variant hover:bg-card-border text-red-400 border border-red-500/20 py-2.5 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Hayır, Doğa Sesini Durdur</span>
          </button>
        </div>
      </div>
    </div>
  );
};
