import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowUpDown, 
  RefreshCw, 
  ChevronDown,
  X as ClearIcon
} from 'lucide-react';
import { 
  fetchMarketData, 
  MarketDataResponse, 
  DEFAULT_MARKET_DATA, 
  CurrencyRate, 
  GoldRate, 
  CryptoRate,
  formatFinancialNumber 
} from '../lib/marketService';

type CalculatorTab = 'forex' | 'gold' | 'crypto';

interface CurrencyCalculatorWidgetProps {
  initialAssetId?: string;
  className?: string;
  hideHeader?: boolean;
}

export const CurrencyCalculatorWidget: React.FC<CurrencyCalculatorWidgetProps> = ({ 
  initialAssetId,
  className = '',
  hideHeader = false
}) => {
  const [activeTab, setActiveTab] = useState<CalculatorTab>('forex');
  const [marketData, setMarketData] = useState<MarketDataResponse>(DEFAULT_MARKET_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Forex Tab State - Default 1 USD = TRY
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('TRY');
  const [fromAmount, setFromAmount] = useState<string>('1');
  const [toAmount, setToAmount] = useState<string>('');
  const [lastEdited, setLastEdited] = useState<'from' | 'to'>('from');

  // Gold Tab State
  const [selectedGoldId, setSelectedGoldId] = useState<string>('gram-altin');
  const [goldTargetCurrency, setGoldTargetCurrency] = useState<string>('TRY');
  const [goldQuantity, setGoldQuantity] = useState<string>('1');

  // Crypto Tab State
  const [selectedCryptoSymbol, setSelectedCryptoSymbol] = useState<string>('BTC');
  const [cryptoTargetCurrency, setCryptoTargetCurrency] = useState<string>('USD');
  const [cryptoQuantity, setCryptoQuantity] = useState<string>('1');

  // Load live data
  const loadMarket = async (force = true) => {
    setIsLoading(true);
    try {
      const data = await fetchMarketData(force);
      if (data && data.currencies) {
        setMarketData(data);
      }
    } catch (e) {
      console.warn('Calculator market data fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMarket(false);

    // Global listener for ticker bar clicks
    const handleTickerSelect = (e: CustomEvent<any>) => {
      const { assetId, code } = e.detail || {};
      if (!assetId && !code) return;

      if (assetId === 'gram-altin' || code === 'GLD') {
        setActiveTab('forex');
        setFromCurrency('GLD');
        setToCurrency('TRY');
        setFromAmount('1');
      } else if (assetId === 'ceyrek-altin' || code === 'CEYREK') {
        setActiveTab('forex');
        setFromCurrency('CEYREK');
        setToCurrency('TRY');
        setFromAmount('1');
      } else if (assetId === 'gumus') {
        setActiveTab('gold');
        setSelectedGoldId('gumus-gram');
      } else if (assetId === 'bitcoin' || code === 'BTC') {
        setActiveTab('crypto');
        setSelectedCryptoSymbol('BTC');
      } else if (assetId === 'dolar' || code === 'USD') {
        setActiveTab('forex');
        setFromCurrency('USD');
        setToCurrency('TRY');
      } else if (assetId === 'euro' || code === 'EUR') {
        setActiveTab('forex');
        setFromCurrency('EUR');
        setToCurrency('TRY');
      } else if (assetId === 'sterlin' || code === 'GBP') {
        setActiveTab('forex');
        setFromCurrency('GBP');
        setToCurrency('TRY');
      }
    };

    const handleRefresh = () => {
      loadMarket(true);
    };
    window.addEventListener('vox_refresh_currency_calculator' as any, handleRefresh);
    window.addEventListener('vox_open_currency_calculator' as any, handleTickerSelect);
    window.addEventListener('vox_select_currency_calculator' as any, handleTickerSelect);
    return () => {
      window.removeEventListener('vox_refresh_currency_calculator' as any, handleRefresh);
      window.removeEventListener('vox_open_currency_calculator' as any, handleTickerSelect);
      window.removeEventListener('vox_select_currency_calculator' as any, handleTickerSelect);
    };
  }, []);

  // Set initial asset if passed via prop
  useEffect(() => {
    if (initialAssetId) {
      if (initialAssetId === 'gram-altin' || initialAssetId === 'GLD') {
        setActiveTab('forex');
        setFromCurrency('GLD');
        setToCurrency('TRY');
        setFromAmount('1');
      } else if (initialAssetId === 'ceyrek-altin' || initialAssetId === 'CEYREK') {
        setActiveTab('forex');
        setFromCurrency('CEYREK');
        setToCurrency('TRY');
        setFromAmount('1');
      } else if (initialAssetId === 'gumus') {
        setActiveTab('gold');
        setSelectedGoldId('gumus-gram');
      } else if (initialAssetId === 'bitcoin') {
        setActiveTab('crypto');
        setSelectedCryptoSymbol('BTC');
      } else if (initialAssetId === 'dolar') {
        setActiveTab('forex');
        setFromCurrency('USD');
        setToCurrency('TRY');
      } else if (initialAssetId === 'euro') {
        setActiveTab('forex');
        setFromCurrency('EUR');
        setToCurrency('TRY');
      } else if (initialAssetId === 'sterlin') {
        setActiveTab('forex');
        setFromCurrency('GBP');
        setToCurrency('TRY');
      }
    }
  }, [initialAssetId]);

  // Currencies lookup map
  const currencyMap = useMemo(() => {
    const map = new Map<string, CurrencyRate>();
    marketData.currencies.forEach(c => map.set(c.code, c));
    return map;
  }, [marketData.currencies]);

  // Gold lookup map
  const goldMap = useMemo(() => {
    const map = new Map<string, GoldRate>();
    marketData.goldTypes.forEach(g => map.set(g.id, g));
    return map;
  }, [marketData.goldTypes]);

  // Crypto lookup map
  const cryptoMap = useMemo(() => {
    const map = new Map<string, CryptoRate>();
    marketData.cryptoTypes.forEach(c => map.set(c.symbol, c));
    return map;
  }, [marketData.cryptoTypes]);

  // Active rate between fromCurrency and toCurrency
  const exchangeRate = useMemo(() => {
    const fromRate = currencyMap.get(fromCurrency)?.rateToTRY || 1;
    const toRate = currencyMap.get(toCurrency)?.rateToTRY || 1;
    if (toRate === 0) return 1;
    return fromRate / toRate;
  }, [fromCurrency, toCurrency, currencyMap]);

  // Reciprocal conversion logic
  useEffect(() => {
    if (lastEdited === 'from') {
      const parsed = parseFloat(fromAmount.replace(',', '.'));
      if (isNaN(parsed) || parsed < 0) {
        setToAmount('');
      } else {
        const result = parsed * exchangeRate;
        const decimals = result >= 1000 ? 2 : (result < 1 ? 4 : 2);
        setToAmount(result.toFixed(decimals).replace('.', ','));
      }
    } else {
      const parsed = parseFloat(toAmount.replace(',', '.'));
      if (isNaN(parsed) || parsed < 0) {
        setFromAmount('');
      } else {
        const result = exchangeRate > 0 ? parsed / exchangeRate : 0;
        const decimals = result >= 1000 ? 2 : (result < 1 ? 4 : 2);
        setFromAmount(result.toFixed(decimals).replace('.', ','));
      }
    }
  }, [fromAmount, toAmount, exchangeRate, lastEdited]);

  // Swap currencies
  const handleSwapForex = () => {
    const tempCurr = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(tempCurr);
    setLastEdited('from');
  };

  // Quick preset amounts
  const handlePresetClick = (amount: number) => {
    setFromAmount(String(amount));
    setLastEdited('from');
  };

  // Gold calculation
  const goldCalculation = useMemo(() => {
    const activeGold = goldMap.get(selectedGoldId) || marketData.goldTypes[0];
    const qty = parseFloat(goldQuantity.replace(',', '.')) || 0;
    const priceInTRY = (activeGold?.rateToTRY || 0) * qty;

    if (goldTargetCurrency === 'USD') {
      const usdRate = currencyMap.get('USD')?.rateToTRY || 48.98;
      return {
        amountTarget: priceInTRY / usdRate,
        targetSymbol: '$',
        targetCode: 'USD',
        unitPriceTRY: activeGold?.rateToTRY || 0
      };
    } else if (goldTargetCurrency === 'EUR') {
      const eurRate = currencyMap.get('EUR')?.rateToTRY || 55.77;
      return {
        amountTarget: priceInTRY / eurRate,
        targetSymbol: '€',
        targetCode: 'EUR',
        unitPriceTRY: activeGold?.rateToTRY || 0
      };
    } else {
      return {
        amountTarget: priceInTRY,
        targetSymbol: '₺',
        targetCode: 'TRY',
        unitPriceTRY: activeGold?.rateToTRY || 0
      };
    }
  }, [selectedGoldId, goldQuantity, goldTargetCurrency, goldMap, currencyMap, marketData.goldTypes]);

  // Crypto calculation
  const cryptoCalculation = useMemo(() => {
    const activeCrypto = cryptoMap.get(selectedCryptoSymbol) || marketData.cryptoTypes[0];
    const qty = parseFloat(cryptoQuantity.replace(',', '.')) || 0;
    const totalUSD = (activeCrypto?.priceUSD || 0) * qty;
    const usdRate = currencyMap.get('USD')?.rateToTRY || 48.98;
    const totalTRY = totalUSD * usdRate;

    if (cryptoTargetCurrency === 'TRY') {
      return {
        amount: totalTRY,
        symbol: '₺',
        code: 'TRY',
        unitPrice: activeCrypto?.priceTRY || 0
      };
    } else if (cryptoTargetCurrency === 'EUR') {
      const eurRate = currencyMap.get('EUR')?.rateToTRY || 55.77;
      return {
        amount: totalTRY / eurRate,
        symbol: '€',
        code: 'EUR',
        unitPrice: (activeCrypto?.priceUSD || 0) * (usdRate / eurRate)
      };
    } else {
      return {
        amount: totalUSD,
        symbol: '$',
        code: 'USD',
        unitPrice: activeCrypto?.priceUSD || 0
      };
    }
  }, [selectedCryptoSymbol, cryptoQuantity, cryptoTargetCurrency, cryptoMap, currencyMap, marketData.cryptoTypes]);

  // Helper for flag emojis
  const getFlagEmoji = (code: string, fallbackFlag?: string) => {
    if (fallbackFlag) return fallbackFlag;
    switch (code) {
      case 'USD': return '🇺🇸';
      case 'EUR': return '🇪🇺';
      case 'TRY': return '🇹🇷';
      case 'GLD': return '🪙';
      case 'CEYREK': return '🪙';
      case 'GBP': return '🇬🇧';
      case 'CHF': return '🇨🇭';
      case 'CAD': return '🇨🇦';
      case 'AUD': return '🇦🇺';
      case 'JPY': return '🇯🇵';
      case 'SAR': return '🇸🇦';
      case 'AED': return '🇦🇪';
      case 'KWD': return '🇰🇼';
      default: return '🌐';
    }
  };

  const getGoldShortCode = (id: string) => {
    switch (id) {
      case 'gram-altin': return 'GRAM';
      case 'ceyrek-altin': return 'ÇEYREK';
      case 'yarim-altin': return 'YARIM';
      case 'tam-altin': return 'TAM';
      case 'cumhuriyet-altini': return 'ATA';
      case '22-ayar-bilezik': return 'BİLEZİK';
      case 'ons-altin': return 'ONS';
      case 'gram-gumus':
      case 'gumus-gram': return 'GÜMÜŞ';
      default: return 'ALTIN';
    }
  };

  return (
    <div 
      id="vox-currency-calculator-widget"
      className={`w-full ${className}`}
    >
      {/* HEADER: Minimal Header */}
      {!hideHeader && (
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-200 dark:border-white/10">
          <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Döviz Çevirici
          </h3>
          <button
            type="button"
            onClick={() => loadMarket(true)}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Kurları Yenile"
            aria-label="Kurları Yenile"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-500' : ''}`} />
          </button>
        </div>
      )}

      {/* SEGMENTED TAB BUTTONS: [ Döviz ]  [ Altın ]  [ Kripto ] */}
      <div className="flex items-center gap-1.5 mb-3.5 overflow-x-auto scrollbar-none pb-0.5">
        <button
          type="button"
          onClick={() => setActiveTab('forex')}
          className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
            activeTab === 'forex'
              ? 'bg-emerald-500 text-black shadow-xs font-bold'
              : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border border-zinc-200/60 dark:border-white/10'
          }`}
        >
          Döviz
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gold')}
          className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
            activeTab === 'gold'
              ? 'bg-amber-400 text-black shadow-xs font-bold'
              : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border border-zinc-200/60 dark:border-white/10'
          }`}
        >
          Altın
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('crypto')}
          className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
            activeTab === 'crypto'
              ? 'bg-purple-500 text-white shadow-xs font-bold'
              : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border border-zinc-200/60 dark:border-white/10'
          }`}
        >
          Kripto
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DÖVİZ (Lean & Clean: Flag + USD ▾ ... Number input)                */}
      {/* ========================================================================= */}
      {activeTab === 'forex' && (
        <div className="space-y-3">
          {/* MAIN CARD */}
          <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-[#151a21] p-3.5 sm:p-4 shadow-sm space-y-3">
            
            {/* ROW 1: FROM CURRENCY */}
            <div className="flex items-center justify-between gap-2.5 sm:gap-3">
              {/* Left Selector Pill: Flag + Code (NO long currency names) + Chevron */}
              <div className="relative shrink-0 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white dark:bg-white/10 hover:bg-zinc-100 dark:hover:bg-white/15 border border-zinc-200 dark:border-white/10 cursor-pointer transition-all active:scale-95 shadow-xs">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden flex items-center justify-center text-sm sm:text-base shrink-0">
                  {getFlagEmoji(fromCurrency, currencyMap.get(fromCurrency)?.flag)}
                </span>
                <span className="font-bold text-sm sm:text-base tracking-wide text-slate-900 dark:text-white">
                  {fromCurrency}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />

                {/* Accessible native select overlay - ONLY CODE & FLAG, NO LONG NAMES */}
                <select
                  value={fromCurrency}
                  onChange={(e) => {
                    setFromCurrency(e.target.value);
                    setLastEdited('from');
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  aria-label="Kaynak Para Birimi"
                >
                  {marketData.currencies.map(c => (
                    <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                      {c.flag || getFlagEmoji(c.code)} {c.code}
                    </option>
                  ))}
                </select>
              </div>

              {/* Right Input Box (Clean, easy to tap on mobile, fully selectable) */}
              <div className="flex-1 min-w-0 flex items-center bg-white dark:bg-black/30 rounded-xl border border-zinc-200 dark:border-white/10 px-3 py-1.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                <input
                  type="text"
                  inputMode="decimal"
                  value={fromAmount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.,]/g, '');
                    setFromAmount(val);
                    setLastEdited('from');
                  }}
                  placeholder="0"
                  className="w-full text-right font-mono font-semibold text-base sm:text-lg text-slate-900 dark:text-white placeholder-zinc-400 bg-transparent outline-none cursor-text select-text"
                  aria-label="Kaynak Tutar"
                />
                {fromAmount && fromAmount !== '0' && (
                  <button
                    type="button"
                    onClick={() => {
                      setFromAmount('');
                      setLastEdited('from');
                    }}
                    className="ml-1.5 p-0.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                    title="Temizle"
                  >
                    <ClearIcon className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* MINIMAL SWAP BUTTON ROW */}
            <div className="relative flex items-center justify-center py-0.5">
              <div className="w-full border-t border-zinc-200/60 dark:border-white/10" />
              <button
                type="button"
                onClick={handleSwapForex}
                className="absolute w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-[#1a222c] hover:bg-emerald-500 hover:text-black dark:hover:bg-emerald-400 dark:hover:text-black text-zinc-500 dark:text-zinc-300 border border-zinc-200 dark:border-white/15 flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-xs"
                title="Para Birimlerini Değiştir"
                aria-label="Para Birimlerini Değiştir"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* ROW 2: TO CURRENCY */}
            <div className="flex items-center justify-between gap-2.5 sm:gap-3">
              {/* Left Selector Pill */}
              <div className="relative shrink-0 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white dark:bg-white/10 hover:bg-zinc-100 dark:hover:bg-white/15 border border-zinc-200 dark:border-white/10 cursor-pointer transition-all active:scale-95 shadow-xs">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden flex items-center justify-center text-sm sm:text-base shrink-0">
                  {getFlagEmoji(toCurrency, currencyMap.get(toCurrency)?.flag)}
                </span>
                <span className="font-bold text-sm sm:text-base tracking-wide text-slate-900 dark:text-white">
                  {toCurrency}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />

                {/* Accessible native select overlay - ONLY CODE & FLAG, NO LONG NAMES */}
                <select
                  value={toCurrency}
                  onChange={(e) => {
                    setToCurrency(e.target.value);
                    setLastEdited('from');
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  aria-label="Hedef Para Birimi"
                >
                  {marketData.currencies.map(c => (
                    <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                      {c.flag || getFlagEmoji(c.code)} {c.code}
                    </option>
                  ))}
                </select>
              </div>

              {/* Right Input Box (Clean, easy to tap on mobile, fully selectable) */}
              <div className="flex-1 min-w-0 flex items-center bg-white dark:bg-black/30 rounded-xl border border-zinc-200 dark:border-white/10 px-3 py-1.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                <input
                  type="text"
                  inputMode="decimal"
                  value={toAmount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.,]/g, '');
                    setToAmount(val);
                    setLastEdited('to');
                  }}
                  placeholder="0,00"
                  className="w-full text-right font-mono font-semibold text-base sm:text-lg text-slate-900 dark:text-white placeholder-zinc-400 bg-transparent outline-none cursor-text select-text"
                  aria-label="Hedef Tutar"
                />
              </div>
            </div>

          </div>

          {/* QUICK PRESETS ROW */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <span className="text-[11px] font-medium text-zinc-400 shrink-0 mr-0.5">Hızlı:</span>
            {(fromCurrency === 'GLD' 
              ? [1, 2.5, 5, 10, 25] 
              : fromCurrency === 'CEYREK' 
              ? [1, 2, 4, 10, 20] 
              : [10, 50, 100, 500, 1000]
            ).map(amt => (
              <button
                key={amt}
                type="button"
                onClick={() => handlePresetClick(amt)}
                className="py-1 px-2.5 rounded-lg bg-white dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 font-mono text-xs font-semibold transition-all active:scale-95 cursor-pointer whitespace-nowrap shadow-xs"
              >
                {amt} {fromCurrency === 'GLD' ? 'Gr' : fromCurrency === 'CEYREK' ? 'Adet' : fromCurrency}
              </button>
            ))}
          </div>

          {/* FOOTER RATE BANNER */}
          <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                1 {fromCurrency} = <strong className="text-slate-900 dark:text-white font-semibold">{exchangeRate.toFixed(4).replace('.', ',')} {toCurrency}</strong>
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 font-medium">
              TCMB Serbest Piyasa
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ALTIN ÇEVİRİCİ (Matching Clean 2-Row Layout)                       */}
      {/* ========================================================================= */}
      {activeTab === 'gold' && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-[#151a21] p-3.5 sm:p-4 shadow-sm space-y-3">
            
            {/* ROW 1: GOLD ASSET & QUANTITY */}
            <div className="flex items-center justify-between gap-2.5 sm:gap-3">
              <div className="relative shrink-0 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white dark:bg-white/10 hover:bg-zinc-100 dark:hover:bg-white/15 border border-zinc-200 dark:border-white/10 cursor-pointer transition-all active:scale-95 shadow-xs">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-400/20 text-amber-500 flex items-center justify-center text-sm shrink-0">
                  🪙
                </span>
                <span className="font-bold text-sm sm:text-base tracking-wide text-slate-900 dark:text-white">
                  {getGoldShortCode(selectedGoldId)}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />

                <select
                  value={selectedGoldId}
                  onChange={(e) => setSelectedGoldId(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  aria-label="Altın Türü Seç"
                >
                  {marketData.goldTypes.map(g => (
                    <option key={g.id} value={g.id} className="bg-slate-900 text-white">
                      🪙 {getGoldShortCode(g.id)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-0 flex items-center bg-white dark:bg-black/30 rounded-xl border border-zinc-200 dark:border-white/10 px-3 py-1.5 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
                <input
                  type="text"
                  inputMode="decimal"
                  value={goldQuantity}
                  onChange={(e) => setGoldQuantity(e.target.value.replace(/[^0-9.,]/g, ''))}
                  placeholder="1"
                  className="w-full text-right font-mono font-semibold text-base sm:text-lg text-slate-900 dark:text-white placeholder-zinc-400 bg-transparent outline-none cursor-text select-text"
                  aria-label="Altın Miktarı"
                />
              </div>
            </div>

            {/* DIVIDER */}
            <div className="w-full border-t border-zinc-200/60 dark:border-white/10" />

            {/* ROW 2: TARGET CURRENCY & VALUE */}
            <div className="flex items-center justify-between gap-2.5 sm:gap-3">
              <div className="relative shrink-0 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white dark:bg-white/10 hover:bg-zinc-100 dark:hover:bg-white/15 border border-zinc-200 dark:border-white/10 cursor-pointer transition-all active:scale-95 shadow-xs">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden flex items-center justify-center text-sm sm:text-base shrink-0">
                  {getFlagEmoji(goldTargetCurrency)}
                </span>
                <span className="font-bold text-sm sm:text-base tracking-wide text-slate-900 dark:text-white">
                  {goldTargetCurrency}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />

                <select
                  value={goldTargetCurrency}
                  onChange={(e) => setGoldTargetCurrency(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  aria-label="Hedef Para Birimi"
                >
                  <option value="TRY" className="bg-slate-900 text-white">🇹🇷 TRY</option>
                  <option value="USD" className="bg-slate-900 text-white">🇺🇸 USD</option>
                  <option value="EUR" className="bg-slate-900 text-white">🇪🇺 EUR</option>
                </select>
              </div>

              <div className="flex-1 min-w-0 flex items-center justify-end bg-white dark:bg-black/30 rounded-xl border border-zinc-200 dark:border-white/10 px-3 py-1.5">
                <span className="font-mono font-bold text-base sm:text-lg text-slate-900 dark:text-white select-text">
                  {formatFinancialNumber(goldCalculation.amountTarget, 2, '', ` ${goldCalculation.targetSymbol}`)}
                </span>
              </div>
            </div>

          </div>

          {/* QUICK SHORTCUT BUTTONS */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            {[
              { id: 'gram-altin', label: 'Gram' },
              { id: 'ceyrek-altin', label: 'Çeyrek' },
              { id: 'yarim-altin', label: 'Yarım' },
              { id: 'tam-altin', label: 'Tam' },
              { id: 'cumhuriyet-altini', label: 'Ata' },
              { id: 'ons-altin', label: 'Ons' },
              { id: 'gumus-gram', label: 'Gümüş' }
            ].map(g => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGoldId(g.id)}
                className={`py-1 px-2.5 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer active:scale-95 whitespace-nowrap ${
                  selectedGoldId === g.id
                    ? 'bg-amber-400 text-black border-transparent shadow-xs font-bold'
                    : 'bg-white dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* FOOTER RATE BANNER */}
          <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                Birim Fiyat: <strong className="text-slate-900 dark:text-white font-mono font-semibold">{formatFinancialNumber(goldCalculation.unitPriceTRY, 2, '', ' ₺')}</strong>
              </span>
            </div>
            <span className="text-[10px] text-zinc-400">
              Kapalıçarşı Canlı
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: KRİPTO PARA (Matching Clean 2-Row Layout)                          */}
      {/* ========================================================================= */}
      {activeTab === 'crypto' && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-[#151a21] p-3.5 sm:p-4 shadow-sm space-y-3">
            
            {/* ROW 1: CRYPTO SELECTOR & QUANTITY */}
            <div className="flex items-center justify-between gap-2.5 sm:gap-3">
              <div className="relative shrink-0 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white dark:bg-white/10 hover:bg-zinc-100 dark:hover:bg-white/15 border border-zinc-200 dark:border-white/10 cursor-pointer transition-all active:scale-95 shadow-xs">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300 flex items-center justify-center text-xs sm:text-sm shrink-0 font-bold">
                  {selectedCryptoSymbol === 'BTC' ? '₿' : selectedCryptoSymbol === 'ETH' ? 'Ξ' : '◎'}
                </span>
                <span className="font-bold text-sm sm:text-base tracking-wide text-slate-900 dark:text-white">
                  {selectedCryptoSymbol}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />

                <select
                  value={selectedCryptoSymbol}
                  onChange={(e) => setSelectedCryptoSymbol(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  aria-label="Kripto Varlık Seç"
                >
                  {marketData.cryptoTypes.map(c => (
                    <option key={c.symbol} value={c.symbol} className="bg-slate-900 text-white">
                      {c.symbol}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-0 flex items-center bg-white dark:bg-black/30 rounded-xl border border-zinc-200 dark:border-white/10 px-3 py-1.5 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
                <input
                  type="text"
                  inputMode="decimal"
                  value={cryptoQuantity}
                  onChange={(e) => setCryptoQuantity(e.target.value.replace(/[^0-9.,]/g, ''))}
                  placeholder="1"
                  className="w-full text-right font-mono font-semibold text-base sm:text-lg text-slate-900 dark:text-white placeholder-zinc-400 bg-transparent outline-none cursor-text select-text"
                  aria-label="Kripto Miktarı"
                />
              </div>
            </div>

            {/* DIVIDER */}
            <div className="w-full border-t border-zinc-200/60 dark:border-white/10" />

            {/* ROW 2: TARGET CURRENCY & VALUE */}
            <div className="flex items-center justify-between gap-2.5 sm:gap-3">
              <div className="relative shrink-0 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white dark:bg-white/10 hover:bg-zinc-100 dark:hover:bg-white/15 border border-zinc-200 dark:border-white/10 cursor-pointer transition-all active:scale-95 shadow-xs">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden flex items-center justify-center text-sm sm:text-base shrink-0">
                  {getFlagEmoji(cryptoTargetCurrency)}
                </span>
                <span className="font-bold text-sm sm:text-base tracking-wide text-slate-900 dark:text-white">
                  {cryptoTargetCurrency}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />

                <select
                  value={cryptoTargetCurrency}
                  onChange={(e) => setCryptoTargetCurrency(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  aria-label="Hedef Para Birimi"
                >
                  <option value="USD" className="bg-slate-900 text-white">🇺🇸 USD</option>
                  <option value="TRY" className="bg-slate-900 text-white">🇹🇷 TRY</option>
                  <option value="EUR" className="bg-slate-900 text-white">🇪🇺 EUR</option>
                </select>
              </div>

              <div className="flex-1 min-w-0 flex items-center justify-end bg-white dark:bg-black/30 rounded-xl border border-zinc-200 dark:border-white/10 px-3 py-1.5">
                <span className="font-mono font-bold text-base sm:text-lg text-slate-900 dark:text-white select-text">
                  {formatFinancialNumber(
                    cryptoCalculation.amount, 
                    2, 
                    cryptoCalculation.symbol === '$' ? '$' : '', 
                    cryptoCalculation.symbol !== '$' ? ` ${cryptoCalculation.symbol}` : ''
                  )}
                </span>
              </div>
            </div>

          </div>

          {/* QUICK SHORTCUT BUTTONS */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            {['BTC', 'ETH', 'SOL', 'USDT', 'XRP'].map(sym => (
              <button
                key={sym}
                type="button"
                onClick={() => setSelectedCryptoSymbol(sym)}
                className={`py-1 px-2.5 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer active:scale-95 whitespace-nowrap ${
                  selectedCryptoSymbol === sym
                    ? 'bg-purple-500 text-white border-transparent shadow-xs font-bold'
                    : 'bg-white dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>

          {/* FOOTER RATE BANNER */}
          <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                1 {selectedCryptoSymbol} = <strong className="text-slate-900 dark:text-white font-mono font-semibold">{formatFinancialNumber(cryptoCalculation.unitPrice, 2, cryptoTargetCurrency === 'USD' ? '$' : '', cryptoTargetCurrency !== 'USD' ? ` ${cryptoCalculation.symbol}` : '')}</strong>
              </span>
            </div>
            <span className="text-[10px] text-zinc-400">
              Binance Canlı
            </span>
          </div>
        </div>
      )}

    </div>
  );
};
