import React, { useState, useEffect, useRef } from 'react';
import { 
  fetchMarketData, 
  MarketTickerItem, 
  formatFinancialNumber, 
  formatTickerBadge, 
  DEFAULT_MARKET_DATA 
} from '../lib/marketService';
import { RefreshCw, Calculator, ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { useTheme } from '../lib/ThemeContext';

interface MarketTickerBarProps {
  onSelectAsset?: (assetId: string) => void;
}

export const MarketTickerBar: React.FC<MarketTickerBarProps> = ({ onSelectAsset }) => {
  const { theme } = useTheme();
  const [items, setItems] = useState<MarketTickerItem[]>(DEFAULT_MARKET_DATA.items);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isUserInteracting, setIsUserInteracting] = useState<boolean>(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);
  const startX = useRef<number>(0);
  const scrollLeftStart = useRef<number>(0);
  const userInteractedTimeout = useRef<NodeJS.Timeout | null>(null);

  // Load live data with optional force flag
  const loadData = async (force = false) => {
    setIsLoading(true);
    try {
      const data = await fetchMarketData(force);
      if (data && data.items && data.items.length > 0) {
        setItems(data.items);
        setLastUpdatedTime(new Date());
        setSecondsAgo(0);
      }
    } catch (e) {
      console.warn('MarketTickerBar load error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and 25s auto-poll
  useEffect(() => {
    loadData(false);

    const pollInterval = setInterval(() => {
      loadData(false);
    }, 25000);

    return () => clearInterval(pollInterval);
  }, []);

  // Live seconds elapsed counter
  useEffect(() => {
    const timer = setInterval(() => {
      const diffSec = Math.floor((Date.now() - lastUpdatedTime.getTime()) / 1000);
      setSecondsAgo(diffSec);
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdatedTime]);

  // Smooth continuous auto-gliding when user is NOT actively touching or hovering
  useEffect(() => {
    let animId: number;
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const step = () => {
      if (!isHovered && !isUserInteracting && scrollContainer && !isDragging.current) {
        const halfWidth = scrollContainer.scrollWidth / 2;
        if (scrollContainer.scrollLeft >= halfWidth) {
          scrollContainer.scrollLeft -= halfWidth;
        } else {
          scrollContainer.scrollLeft += 0.75;
        }
      }
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isHovered, isUserInteracting]);

  // Touch and Mouse drag-to-scroll handlers
  const onMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDragging.current = true;
    setIsUserInteracting(true);
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftStart.current = scrollRef.current.scrollLeft;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.6;
    scrollRef.current.scrollLeft = scrollLeftStart.current - walk;
  };

  const onMouseUp = () => {
    isDragging.current = false;
    if (userInteractedTimeout.current) clearTimeout(userInteractedTimeout.current);
    userInteractedTimeout.current = setTimeout(() => {
      setIsUserInteracting(false);
    }, 2500);
  };

  const onTouchStart = () => {
    setIsUserInteracting(true);
    if (userInteractedTimeout.current) clearTimeout(userInteractedTimeout.current);
  };

  const onTouchEnd = () => {
    if (userInteractedTimeout.current) clearTimeout(userInteractedTimeout.current);
    userInteractedTimeout.current = setTimeout(() => {
      setIsUserInteracting(false);
    }, 2500);
  };

  const handleScrollNudge = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      setIsUserInteracting(true);
      const scrollAmount = direction === 'left' ? -220 : 220;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      if (userInteractedTimeout.current) clearTimeout(userInteractedTimeout.current);
      userInteractedTimeout.current = setTimeout(() => {
        setIsUserInteracting(false);
      }, 3000);
    }
  };

  const handleItemClick = (item: MarketTickerItem) => {
    if (onSelectAsset) {
      onSelectAsset(item.id);
    } else {
      window.dispatchEvent(new CustomEvent('vox_open_currency_calculator', { 
        detail: { assetId: item.id, code: item.code } 
      }));
    }
  };

  // Format relative time text
  const getRelativeTimeText = () => {
    if (secondsAgo < 5) return 'Yeni güncellendi';
    if (secondsAgo < 60) return `${secondsAgo} sn önce`;
    const mins = Math.floor(secondsAgo / 60);
    return `${mins} dk önce`;
  };

  // Duplicated items for endless seamless scrolling and swiping
  const displayItems = [...items, ...items];

  return (
    <div 
      className={`w-full border-y shadow-sm select-none relative z-30 transition-colors ${
        theme === 'light'
          ? 'bg-slate-900 border-slate-800 text-white'
          : 'bg-[#0e1217] border-white/10 text-white'
      }`}
      role="region"
      aria-label="Canlı Piyasa ve Döviz Kurları"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        onMouseUp();
      }}
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4 flex items-center justify-between h-11 sm:h-12 overflow-hidden">
        
        {/* LEFT STATUS: LIVE BADGE & PULSE */}
        <div className="flex items-center gap-2 pr-2.5 sm:pr-3 border-r border-white/10 shrink-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider">CANLI</span>
          </div>

          <span className="hidden lg:inline text-[10px] text-zinc-400 font-mono">
            {getRelativeTimeText()}
          </span>
        </div>

        {/* LEFT NUDGE CHEVRON (DESKTOP) */}
        <button
          type="button"
          onClick={() => handleScrollNudge('left')}
          className="hidden md:flex p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-1"
          title="Sola Kaydır"
          aria-label="Sola Kaydır"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* CENTER: 100% SWIPEABLE & TOUCH-SCROLLABLE TICKER WITH CONTINUOUS GLIDE */}
        <div 
          ref={scrollRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="flex-1 overflow-x-auto scrollbar-none touch-pan-x flex items-center mx-1 sm:mx-2 py-1 cursor-grab active:cursor-grabbing select-none"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="flex items-center space-x-6 sm:space-x-8 shrink-0 pr-4">
            {displayItems.map((item, idx) => {
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

              const isGold = item.type === 'gold' || item.id.includes('altin');

              return (
                <button
                  key={`${item.id}-${idx}`}
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className="flex-shrink-0 flex items-center gap-2 group hover:opacity-100 active:scale-95 transition-all text-left cursor-pointer focus:outline-none p-1 rounded-xl hover:bg-white/[0.05]"
                  title={`${item.name} (${item.code}): ${formattedPrice} - Çeviricide açmak için dokunun`}
                >
                  <div className="flex flex-col items-start leading-tight">
                    <div className="flex items-center gap-1">
                      {isGold && <span className="text-[10px]">🪙</span>}
                      <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        isGold 
                          ? 'text-amber-400 group-hover:text-amber-300' 
                          : 'text-zinc-400 group-hover:text-emerald-400'
                      }`}>
                        {item.name}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm font-black text-white font-mono tracking-tight mt-0.5">
                      {formattedPrice}
                    </span>
                  </div>

                  {/* Percentage Diff Badge in VOX brand colors */}
                  <span 
                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-bold leading-none font-mono shadow-sm border ${
                      isPositive
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-2.5 h-2.5" />
                    ) : (
                      <TrendingDown className="w-2.5 h-2.5" />
                    )}
                    <span>{badgeText}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT NUDGE CHEVRON (DESKTOP) */}
        <button
          type="button"
          onClick={() => handleScrollNudge('right')}
          className="hidden md:flex p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0 mr-1"
          title="Sağa Kaydır"
          aria-label="Sağa Kaydır"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* RIGHT CONTROLS: REFRESH BUTTON & CALCULATOR TRIGGER */}
        <div className="flex items-center gap-2 pl-2.5 sm:pl-3 border-l border-white/10 text-xs shrink-0">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={isLoading}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-emerald-400 hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
            title="Kurları Şimdi Yenile (TCMB & Serbest Piyasa)"
            aria-label="Kurları Yenile"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('vox_open_currency_calculator', {
                detail: { assetId: 'gram-altin', code: 'GLD' }
              }));
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 hover:text-emerald-300 text-[11px] font-extrabold border border-emerald-500/30 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Döviz ve Altın Çeviriciyi Aç"
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Çevirici</span>
          </button>
        </div>

      </div>
    </div>
  );
};
