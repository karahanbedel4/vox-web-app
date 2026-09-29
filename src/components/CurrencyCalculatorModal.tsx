import React from 'react';
import { X, Calculator } from 'lucide-react';
import { CurrencyCalculatorWidget } from './CurrencyCalculatorWidget';
import { useTheme } from '../lib/ThemeContext';

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
  const { theme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className={`relative w-full max-w-lg rounded-3xl shadow-2xl border overflow-hidden transition-all transform scale-100 animate-scaleUp ${
          theme === 'light' 
            ? 'bg-white border-slate-200 text-slate-900' 
            : 'bg-[#121614] border-white/10 text-white'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-inherit/10 bg-slate-50/50 dark:bg-black/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/15 flex items-center justify-center text-sky-500 font-bold">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-base tracking-tight">Canlı Kur & Döviz Çevirici</h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">TCMB, Altın ve Kripto Anlık Hesaplama</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/60 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 flex items-center justify-center text-slate-700 dark:text-gray-200 transition-all cursor-pointer"
            title="Kapat"
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
          <CurrencyCalculatorWidget initialAssetId={initialAssetId} className="border-0 shadow-none p-0" />
        </div>
      </div>
    </div>
  );
};
