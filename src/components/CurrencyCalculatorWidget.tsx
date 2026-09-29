import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowUpDown, 
  Coins, 
  RefreshCw, 
  TrendingUp, 
  ChevronRight, 
  Sparkles, 
  Check, 
  ChevronDown,
  Info
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
import { useTheme } from '../lib/ThemeContext';

type CalculatorTab = 'forex' | 'gold' | 'crypto';

interface CurrencyCalculatorWidgetProps {
  initialAssetId?: string;
  className?: string;
}

export const CurrencyCalculatorWidget: React.FC<CurrencyCalculatorWidgetProps> = ({ 
  initialAssetId,
  className = ''
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<CalculatorTab>('forex');
  const [marketData, setMarketData] = useState<MarketDataResponse>(DEFAULT_MARKET_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Forex Tab State
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
  const loadMarket = async () => {
    setIsLoading(true);
    try {
      const data = await fetchMarketData();
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
    loadMarket();

    // Listen to ticker clicks across the app
    const handleTickerSelect = (e: CustomEvent<any>) => {
      const { assetId } = e.detail || {};
      if (!assetId) return;

      if (assetId === 'gram-altin' || assetId === 'gram-gumus') {
        setActiveTab('gold');
        setSelectedGoldId(assetId);
      } else if (assetId === 'bitcoin') {
        setActiveTab('crypto');
        setSelectedCryptoSymbol('BTC');
      } else if (assetId === 'dolar') {
        setActiveTab('forex');
        setFromCurrency('USD');
        setToCurrency('TRY');
      } else if (assetId === 'euro') {
        setActiveTab('forex');
        setFromCurrency('EUR');
        setToCurrency('TRY');
      } else if (assetId === 'sterlin') {
        setActiveTab('forex');
        setFromCurrency('GBP');
        setToCurrency('TRY');
      }
    };

    window.addEventListener('vox_select_currency_calculator' as any, handleTickerSelect);
    return () => {
      window.removeEventListener('vox_select_currency_calculator' as any, handleTickerSelect);
    };
  }, []);

  // Set initial asset if passed via prop
  useEffect(() => {
    if (initialAssetId) {
      if (initialAssetId === 'gram-altin' || initialAssetId === 'gram-gumus') {
        setActiveTab('gold');
        setSelectedGoldId(initialAssetId);
      } else if (initialAssetId === 'bitcoin') {
        setActiveTab('crypto');
        setSelectedCryptoSymbol('BTC');
      } else if (initialAssetId === 'dolar') {
        setActiveTab('forex');
        setFromCurrency('USD');
      } else if (initialAssetId === 'euro') {
        setActiveTab('forex');
        setFromCurrency('EUR');
      } else if (initialAssetId === 'sterlin') {
        setActiveTab('forex');
        setFromCurrency('GBP');
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

  // Handle reciprocal updates when fromAmount or currencies change
  useEffect(() => {
    if (lastEdited === 'from') {
      const parsed = parseFloat(fromAmount.replace(',', '.'));
      if (isNaN(parsed) || parsed < 0) {
        setToAmount('');
      } else {
        const result = parsed * exchangeRate;
        setToAmount(result.toFixed(2).replace('.', ','));
      }
    } else {
      const parsed = parseFloat(toAmount.replace(',', '.'));
      if (isNaN(parsed) || parsed < 0) {
        setFromAmount('');
      } else {
        const result = exchangeRate > 0 ? parsed / exchangeRate : 0;
        setFromAmount(result.toFixed(2).replace('.', ','));
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

  // Quick preset amount buttons
  const handlePresetClick = (amount: number) => {
    setFromAmount(String(amount));
    setLastEdited('from');
  };

  // Calculate Gold Conversion
  const goldCalculation = useMemo(() => {
    const activeGold = goldMap.get(selectedGoldId) || marketData.goldTypes[0];
    const qty = parseFloat(goldQuantity.replace(',', '.')) || 0;
    const priceInTRY = (activeGold?.rateToTRY || 0) * qty;

    if (goldTargetCurrency === 'USD') {
      const usdRate = currencyMap.get('USD')?.rateToTRY || 48.98;
      return {
        amountTRY: priceInTRY,
        amountTarget: priceInTRY / usdRate,
        targetSymbol: '$',
        targetCode: 'USD',
        unitPriceTRY: activeGold?.rateToTRY || 0
      };
    } else if (goldTargetCurrency === 'EUR') {
      const eurRate = currencyMap.get('EUR')?.rateToTRY || 55.77;
      return {
        amountTRY: priceInTRY,
        amountTarget: priceInTRY / eurRate,
        targetSymbol: '€',
        targetCode: 'EUR',
        unitPriceTRY: activeGold?.rateToTRY || 0
      };
    } else {
      return {
        amountTRY: priceInTRY,
        amountTarget: priceInTRY,
        targetSymbol: '₺',
        targetCode: 'TRY',
        unitPriceTRY: activeGold?.rateToTRY || 0
      };
    }
  }, [selectedGoldId, goldQuantity, goldTargetCurrency, goldMap, currencyMap, marketData.goldTypes]);

  // Calculate Crypto Conversion
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

  return (
    <div 
      id="vox-currency-calculator-widget"
      className={`rounded-3xl border shadow-xl p-4 sm:p-6 transition-all duration-300 ${
        theme === 'light'
          ? 'bg-white border-slate-200/80 text-slate-900 shadow-slate-100'
          : 'bg-[#121614] border-white/10 text-white shadow-2xl'
      } ${className}`}
    >
      {/* HEADER ROW: Title & Link matching Image 2 */}
      <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-inherit/10">
        <div>
          <h3 className={`text-lg sm:text-xl font-black tracking-tight flex items-center gap-2 ${
            theme === 'light' ? 'text-slate-950' : 'text-white'
          }`}>
            <span>Çevirici</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Canlı
            </span>
          </h3>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            TCMB ve serbest piyasa anlık kurlarıyla anında hesaplama
          </p>
        </div>

        <button
          type="button"
          onClick={loadMarket}
          disabled={isLoading}
          className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 flex items-center gap-1 active:scale-95 transition-all cursor-pointer p-1 rounded-lg"
          title="Kurları Güncelle"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Güncelle</span>
        </button>
      </div>

      {/* SEGMENTED TAB BUTTONS: Döviz | Altın | Kripto Para (Image 2 style) */}
      <div className="flex items-center gap-2 my-4 p-1 bg-slate-100 dark:bg-black/40 rounded-2xl border border-slate-200/60 dark:border-white/5">
        <button
          type="button"
          onClick={() => setActiveTab('forex')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 ${
            activeTab === 'forex'
              ? 'bg-[#0f274a] text-white shadow-md'
              : 'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Döviz
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gold')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 ${
            activeTab === 'gold'
              ? 'bg-[#0f274a] text-white shadow-md'
              : 'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Altın
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('crypto')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 ${
            activeTab === 'crypto'
              ? 'bg-[#0f274a] text-white shadow-md'
              : 'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Kripto Para
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DÖVİZ ÇEVİRİCİ */}
      {/* ========================================================================= */}
      {activeTab === 'forex' && (
        <div className="space-y-3.5">
          {/* FROM CURRENCY INPUT ROW */}
          <div className="relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border bg-slate-50/70 dark:bg-[#181d1a] border-slate-200 dark:border-white/10 focus-within:border-sky-500 transition-all">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl sm:text-3xl select-none" role="img" aria-label={fromCurrency}>
                {currencyMap.get(fromCurrency)?.flag || '🌐'}
              </span>
              <div className="relative">
                <select
                  value={fromCurrency}
                  onChange={(e) => {
                    setFromCurrency(e.target.value);
                    setLastEdited('from');
                  }}
                  className="appearance-none bg-transparent font-extrabold text-sm sm:text-base text-slate-900 dark:text-white pr-6 py-1 focus:outline-none cursor-pointer"
                  aria-label="Kaynak Para Birimi"
                >
                  {marketData.currencies.map(c => (
                    <option key={c.code} value={c.code} className="bg-white dark:bg-[#181d1a] text-slate-900 dark:text-white">
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

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
              className="w-32 sm:w-44 text-right font-black text-xl sm:text-2xl bg-transparent focus:outline-none text-slate-900 dark:text-white placeholder-gray-400"
              aria-label="Kaynak Miktar"
            />
          </div>

          {/* SWAP BUTTON IN THE MIDDLE */}
          <div className="flex items-center justify-center -my-1">
            <button
              type="button"
              onClick={handleSwapForex}
              className="w-9 h-9 rounded-full bg-sky-600 hover:bg-sky-500 active:scale-90 text-white shadow-md flex items-center justify-center transition-all cursor-pointer z-10"
              title="Para Birimlerini Değiştir (Swap)"
              aria-label="Para Birimlerini Değiştir"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          {/* TO CURRENCY INPUT ROW */}
          <div className="relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border bg-slate-50/70 dark:bg-[#181d1a] border-slate-200 dark:border-white/10 focus-within:border-sky-500 transition-all">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl sm:text-3xl select-none" role="img" aria-label={toCurrency}>
                {currencyMap.get(toCurrency)?.flag || '🌐'}
              </span>
              <div className="relative">
                <select
                  value={toCurrency}
                  onChange={(e) => {
                    setToCurrency(e.target.value);
                    setLastEdited('from');
                  }}
                  className="appearance-none bg-transparent font-extrabold text-sm sm:text-base text-slate-900 dark:text-white pr-6 py-1 focus:outline-none cursor-pointer"
                  aria-label="Hedef Para Birimi"
                >
                  {marketData.currencies.map(c => (
                    <option key={c.code} value={c.code} className="bg-white dark:bg-[#181d1a] text-slate-900 dark:text-white">
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

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
              className="w-32 sm:w-44 text-right font-black text-xl sm:text-2xl bg-transparent focus:outline-none text-slate-900 dark:text-white placeholder-gray-400"
              aria-label="Hesaplanan Sonuç Miktarı"
            />
          </div>

          {/* QUICK PRESET BUTTONS */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-[11px] font-bold text-gray-400 shrink-0">Hızlı Miktar:</span>
            {[10, 50, 100, 500, 1000, 5000].map(amt => (
              <button
                key={amt}
                type="button"
                onClick={() => handlePresetClick(amt)}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 text-slate-600 dark:text-gray-300 font-bold border border-slate-200 dark:border-white/5 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                {amt} {fromCurrency}
              </button>
            ))}
          </div>

          {/* EXCHANGE RATE SUMMARY FOOTER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 pt-2 border-t border-inherit/10">
            <div className="flex items-center gap-1.5 font-medium">
              <Info className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <span>
                1 {fromCurrency} = <strong className="text-slate-900 dark:text-white font-bold">{exchangeRate.toFixed(4).replace('.', ',')} {toCurrency}</strong>
              </span>
            </div>
            <span className="text-[10px] mt-1 sm:mt-0 text-gray-400">
              {marketData.source}
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ALTIN ÇEVİRİCİ */}
      {/* ========================================================================= */}
      {activeTab === 'gold' && (
        <div className="space-y-3.5">
          {/* GOLD SELECTION & QUANTITY ROW */}
          <div className="relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border bg-slate-50/70 dark:bg-[#181d1a] border-slate-200 dark:border-white/10 focus-within:border-amber-500 transition-all">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold text-base shrink-0">
                🪙
              </div>
              <div className="relative">
                <select
                  value={selectedGoldId}
                  onChange={(e) => setSelectedGoldId(e.target.value)}
                  className="appearance-none bg-transparent font-extrabold text-sm sm:text-base text-slate-900 dark:text-white pr-6 py-1 focus:outline-none cursor-pointer max-w-[160px] sm:max-w-[200px] truncate"
                  aria-label="Altın Türü"
                >
                  {marketData.goldTypes.map(g => (
                    <option key={g.id} value={g.id} className="bg-white dark:bg-[#181d1a] text-slate-900 dark:text-white">
                      {g.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                inputMode="decimal"
                value={goldQuantity}
                onChange={(e) => setGoldQuantity(e.target.value.replace(/[^0-9.,]/g, ''))}
                placeholder="1"
                className="w-20 sm:w-28 text-right font-black text-xl sm:text-2xl bg-transparent focus:outline-none text-slate-900 dark:text-white placeholder-gray-400"
                aria-label="Altın Adet veya Gram Miktarı"
              />
              <span className="text-xs font-bold text-gray-400">
                {goldMap.get(selectedGoldId)?.unit.split(' ')[0] || 'Adet'}
              </span>
            </div>
          </div>

          {/* TARGET CURRENCY SELECTOR & CALCULATED AMOUNT ROW */}
          <div className="relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border bg-slate-50/70 dark:bg-[#181d1a] border-slate-200 dark:border-white/10 focus-within:border-amber-500 transition-all">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl sm:text-3xl select-none" role="img" aria-label={goldTargetCurrency}>
                {currencyMap.get(goldTargetCurrency)?.flag || '🇹🇷'}
              </span>
              <div className="relative">
                <select
                  value={goldTargetCurrency}
                  onChange={(e) => setGoldTargetCurrency(e.target.value)}
                  className="appearance-none bg-transparent font-extrabold text-sm sm:text-base text-slate-900 dark:text-white pr-6 py-1 focus:outline-none cursor-pointer"
                  aria-label="Hesaplanacak Para Birimi"
                >
                  <option value="TRY" className="bg-white dark:bg-[#181d1a] text-slate-900 dark:text-white">TRY (Türk Lirası)</option>
                  <option value="USD" className="bg-white dark:bg-[#181d1a] text-slate-900 dark:text-white">USD (Dolar)</option>
                  <option value="EUR" className="bg-white dark:bg-[#181d1a] text-slate-900 dark:text-white">EUR (Euro)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="text-right">
              <div className="font-black text-xl sm:text-2xl text-amber-600 dark:text-amber-400 font-mono">
                {formatFinancialNumber(goldCalculation.amountTarget, 2, '', ` ${goldCalculation.targetSymbol}`)}
              </div>
            </div>
          </div>

          {/* QUICK GOLD SHORTCUT BUTTONS */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-[11px] font-bold text-gray-400 shrink-0">Hızlı Seçim:</span>
            {[
              { id: 'gram-altin', label: 'Gram' },
              { id: 'ceyrek-altin', label: 'Çeyrek' },
              { id: 'yarim-altin', label: 'Yarım' },
              { id: 'tam-altin', label: 'Tam' },
              { id: 'gram-gumus', label: 'Gümüş' }
            ].map(g => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGoldId(g.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold border active:scale-95 transition-all cursor-pointer shrink-0 ${
                  selectedGoldId === g.id
                    ? 'bg-amber-500/20 text-amber-500 border-amber-500/40 shadow-sm'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-white/5'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* GOLD SUMMARY FOOTER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 pt-2 border-t border-inherit/10">
            <div className="flex items-center gap-1.5 font-medium">
              <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                1 Birim {goldMap.get(selectedGoldId)?.name} = <strong className="text-slate-900 dark:text-white font-bold">{formatFinancialNumber(goldCalculation.unitPriceTRY, 2, '', ' ₺')}</strong>
              </span>
            </div>
            <span className="text-[10px] mt-1 sm:mt-0 text-gray-400">
              Kapalıçarşı & Serbest Piyasa
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: KRİPTO PARA ÇEVİRİCİ */}
      {/* ========================================================================= */}
      {activeTab === 'crypto' && (
        <div className="space-y-3.5">
          {/* CRYPTO SELECTION & QUANTITY ROW */}
          <div className="relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border bg-slate-50/70 dark:bg-[#181d1a] border-slate-200 dark:border-white/10 focus-within:border-purple-500 transition-all">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-base shrink-0">
                ₿
              </div>
              <div className="relative">
                <select
                  value={selectedCryptoSymbol}
                  onChange={(e) => setSelectedCryptoSymbol(e.target.value)}
                  className="appearance-none bg-transparent font-extrabold text-sm sm:text-base text-slate-900 dark:text-white pr-6 py-1 focus:outline-none cursor-pointer"
                  aria-label="Kripto Varlık"
                >
                  {marketData.cryptoTypes.map(c => (
                    <option key={c.symbol} value={c.symbol} className="bg-white dark:bg-[#181d1a] text-slate-900 dark:text-white">
                      {c.symbol} ({c.name})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                inputMode="decimal"
                value={cryptoQuantity}
                onChange={(e) => setCryptoQuantity(e.target.value.replace(/[^0-9.,]/g, ''))}
                placeholder="1"
                className="w-24 sm:w-32 text-right font-black text-xl sm:text-2xl bg-transparent focus:outline-none text-slate-900 dark:text-white placeholder-gray-400"
                aria-label="Kripto Miktarı"
              />
              <span className="text-xs font-bold text-gray-400">
                {selectedCryptoSymbol}
              </span>
            </div>
          </div>

          {/* TARGET CURRENCY SELECTOR & CALCULATED AMOUNT ROW */}
          <div className="relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border bg-slate-50/70 dark:bg-[#181d1a] border-slate-200 dark:border-white/10 focus-within:border-purple-500 transition-all">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl sm:text-3xl select-none" role="img" aria-label={cryptoTargetCurrency}>
                {currencyMap.get(cryptoTargetCurrency)?.flag || '🇺🇸'}
              </span>
              <div className="relative">
                <select
                  value={cryptoTargetCurrency}
                  onChange={(e) => setCryptoTargetCurrency(e.target.value)}
                  className="appearance-none bg-transparent font-extrabold text-sm sm:text-base text-slate-900 dark:text-white pr-6 py-1 focus:outline-none cursor-pointer"
                  aria-label="Kripto Karşılığı Para Birimi"
                >
                  <option value="USD" className="bg-white dark:bg-[#181d1a] text-slate-900 dark:text-white">USD (Dolar $)</option>
                  <option value="TRY" className="bg-white dark:bg-[#181d1a] text-slate-900 dark:text-white">TRY (Türk Lirası ₺)</option>
                  <option value="EUR" className="bg-white dark:bg-[#181d1a] text-slate-900 dark:text-white">EUR (Euro €)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="text-right">
              <div className="font-black text-xl sm:text-2xl text-purple-600 dark:text-purple-400 font-mono">
                {formatFinancialNumber(
                  cryptoCalculation.amount, 
                  cryptoCalculation.code === 'TRY' ? 2 : 2, 
                  cryptoCalculation.symbol === '$' ? '$' : '', 
                  cryptoCalculation.symbol !== '$' ? ` ${cryptoCalculation.symbol}` : ''
                )}
              </div>
            </div>
          </div>

          {/* QUICK CRYPTO SHORTCUT BUTTONS */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-[11px] font-bold text-gray-400 shrink-0">Hızlı Kripto:</span>
            {['BTC', 'ETH', 'SOL', 'USDT', 'XRP'].map(sym => (
              <button
                key={sym}
                type="button"
                onClick={() => setSelectedCryptoSymbol(sym)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold border active:scale-95 transition-all cursor-pointer shrink-0 ${
                  selectedCryptoSymbol === sym
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/40 shadow-sm'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-white/5'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>

          {/* CRYPTO SUMMARY FOOTER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 pt-2 border-t border-inherit/10">
            <div className="flex items-center gap-1.5 font-medium">
              <Info className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>
                1 {selectedCryptoSymbol} = <strong className="text-slate-900 dark:text-white font-bold">{formatFinancialNumber(cryptoCalculation.unitPrice, 2, cryptoTargetCurrency === 'USD' ? '$' : '', cryptoTargetCurrency !== 'USD' ? ` ${cryptoCalculation.symbol}` : '')}</strong>
              </span>
            </div>
            <span className="text-[10px] mt-1 sm:mt-0 text-gray-400">
              Binance & Global Canlı Veri
            </span>
          </div>
        </div>
      )}

    </div>
  );
};
