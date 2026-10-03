import React, { useState } from 'react';
import { X, Calculator, RefreshCw } from 'lucide-react';
import { CurrencyCalculatorWidget } from './CurrencyCalculatorWidget';

interface CurrencyCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAssetId?: string;
}

export const CurrencyCalculatorModal: React.FC<CurrencyCalculatorModalProps> = ({
  isOpen,
  onClose,
  initialAssetId
}) => {
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    // Dispatch refresh event to widget
    window.dispatchEvent(new CustomEvent('vox_refresh_currency_calculator'));
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Canlı Kur ve Döviz Çevirici"
    >
      <div 
        className="relative w-full max-w-md rounded-3xl bg-[#12161a] border border-white/10 text-white shadow-2xl overflow-hidden transition-all transform scale-100"
      >
        {/* Sleek Modern Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shadow-inner">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg tracking-tight text-white leading-tight">
                Canlı Kur & Çevirici
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] text-zinc-400 font-medium">
                  TCMB & Serbest Piyasa
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleManualRefresh}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-300 hover:text-emerald-400 transition-all cursor-pointer"
              title="Kurları Yenile"
              aria-label="Kurları Yenile"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer"
              title="Kapat"
              aria-label="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body with zero horizontal scrollbar */}
        <div className="p-4 sm:p-5 max-h-[85vh] overflow-y-auto overflow-x-hidden scrollbar-none">
          <CurrencyCalculatorWidget 
            initialAssetId={initialAssetId} 
            hideHeader={true} 
            className="border-0 shadow-none p-0" 
          />
        </div>
      </div>
    </div>
  );
};
