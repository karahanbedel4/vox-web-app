import React, { useState, useEffect, useRef } from 'react';
import { 
  fetchMarketData, 
  MarketTickerItem, 
  formatFinancialNumber, 
  formatTickerBadge, 
  DEFAULT_MARKET_DATA 
} from '../lib/marketService';
import { RefreshCw, TrendingUp, TrendingDown, ChevronRight, Calculator } from 'lucide-react';

interface MarketTickerBarProps {
  onSelectAsset?: (assetId: string) => void;
}

export const MarketTickerBar: React.FC<MarketTickerBarProps> = ({ onSelectAsset }) => {
  const [items, setItems] = useState<MarketTickerItem[]>(DEFAULT_MARKET_DATA.items);
  const [lastUpdated, setLastUpdated] = useState<string>(DEFAULT_MARKET_DATA.lastUpdated);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLivePulsing, setIsLivePulsing] = useState<boolean>(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadData = async (showLoadingIndicator = false) => {
    if (showLoadingIndicator) setIsLoading(true);
    try {
      const data = await fetchMarketData();
      if (data && data.items && data.items.length > 0) {
        setItems(data.items);
        setLastUpdated(data.lastUpdated);
      }
    } catch (e) {
      console.warn('MarketTickerBar load error:', e);
    } finally {
      if (showLoadingIndicator) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(false);

    // Refresh every 45 seconds for active real-time experience
    const interval = setInterval(() => {
      loadData(false);
    }, 45000);

    return () => clearInterval(interval);
  }, []);

  const handleItemClick = (item: MarketTickerItem) => {
    if (onSelectAsset) {
      onSelectAsset(item.id);
    } else {
      window.dispatchEvent(new CustomEvent('vox_open_currency_calculator', { 
        detail: { assetId: item.id, code: item.code } 
      }));
    }
  };

  return (
    <div 
      className="w-full bg-[#0a254d] border-y border-[#1a3d74] shadow-md select-none relative z-30 transition-colors"
      role="region"
      aria-label="Canlı Piyasa ve Döviz Kurları"
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4 flex items-center justify-between">
        
        {/* HORIZONTALLY SCROLLABLE TICKER ITEMS (Touch swipe friendly on mobile) */}
        <div 
          ref={scrollRef}
          className="flex-1 flex items-center overflow-x-auto scrollbar-none py-2 md:py-2.5 space-x-5 md:space-x-8 px-1 scroll-smooth"
        >
          {items.map((item) => {
            const { badgeText, isPositive } = formatTickerBadge(
              item.changePercent, 
              item.changeAmount,
              item.prefix || '',
              item.suffix || ''
            );

            const formattedPrice = formatFinancialNumber(
              item.price, 
              item.decimalDigits ?? (item.price >= 1000 ? 2 : 4), 
              item.prefix || '', 
              item.suffix || ''
            );

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item)}
                className="flex-shrink-0 flex flex-col items-start group hover:opacity-90 active:scale-95 transition-all text-left cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-400 rounded-sm"
                title={`${item.name} - Hesap makinesinde açmak için dokunun`}
              >
                {/* Currency / Asset Name */}
                <span className="text-[10px] md:text-[11px] font-extrabold uppercase tracking-wider text-[#8ec0f9] group-hover:text-white transition-colors">
                  {item.name}
                </span>

                {/* Price and Badge Line */}
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-sm md:text-base font-black text-white tracking-tight font-mono leading-none">
                    {formattedPrice}
                  </span>

                  {/* Percentage & Diff Badge (Exact replica of screenshot) */}
                  <span 
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] md:text-[10px] font-bold leading-none tracking-tight shadow-sm ${
                      isPositive
                        ? 'bg-[#15803d] text-emerald-100'
                        : 'bg-[#b91c1c] text-rose-100'
                    }`}
                  >
                    {badgeText}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* RIGHT CONTROLS: LIVE PULSE & QUICK CONVERTER TRIGGER */}
        <div className="hidden sm:flex items-center gap-2 pl-3 ml-2 border-l border-[#1a3d74] text-xs shrink-0">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={isLoading}
            className="p-1 rounded text-[#8ec0f9] hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            title="Kurları Yenile (TCMB & Piyasa)"
            aria-label="Kurları Yenile"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-white' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('vox_open_currency_calculator'));
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#13376e] hover:bg-[#1a478b] text-[#c0dcff] hover:text-white text-[11px] font-bold border border-[#234e94] transition-all cursor-pointer shadow-sm active:scale-95"
            title="Döviz ve Altın Çeviriciyi Aç"
          >
            <Calculator className="w-3 h-3 text-sky-400" />
            <span>Çevirici</span>
          </button>
        </div>

      </div>
    </div>
  );
};
