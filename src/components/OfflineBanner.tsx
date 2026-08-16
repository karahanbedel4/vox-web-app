import React from 'react';
import { WifiOff, BookOpen } from 'lucide-react';

interface OfflineBannerProps {
  count: number;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ count }) => {
  return (
    <div className="bg-gradient-to-r from-amber-500/15 via-surface-container-high/90 to-amber-900/10 border border-amber-500/40 p-4 rounded-2xl shadow-lg backdrop-blur-xl animate-fade-in space-y-2">
      <div className="flex items-center gap-2.5 text-amber-400">
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
          <WifiOff className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-wider bg-amber-500/20 px-2 py-0.5 rounded text-amber-300 border border-amber-500/30">
            Çevrimdışı Mod
          </span>
          <h3 className="text-xs font-bold text-on-surface mt-0.5">
            İnternet bağlantısı yok. Ancak cihazınızda kayıtlı şu makaleleri okuyabilirsiniz:
          </h3>
        </div>
      </div>

      <p className="text-xs text-on-surface-variant font-medium leading-relaxed pl-1">
        Aşağıda cihazınızda önbelleğe alınmış {count} adet metin içerikli makale listelenmiştir. (Sesli dinleme özelliği internet gerektirdiği için kapalıdır).
      </p>
    </div>
  );
};
