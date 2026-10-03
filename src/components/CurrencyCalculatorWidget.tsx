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
  Info,
  DollarSign
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

  // Forex Tab State
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('TRY');
  const [fromAmount, setFromAmount] = useState<string>('100');
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
      className={`w-full text-white ${className}`}
    >
      {/* OPTIONAL HEADER IF RENDERED EMBEDDED OUTSIDE MODAL */}
      {!hideHeader && (
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
          <div>
            <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <span>Canlı Kur & Döviz Çevirici</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                CANLI
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              TCMB ve serbest piyasa kurlarıyla anında hesaplama
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadMarket(true)}
            disabled={isLoading}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer p-1.5 rounded-xl hover:bg-white/5"
            title="Kurları Yenile"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Yenile</span>
          </button>
        </div>
      )}

      {/* SEGMENTED TAB BUTTONS: DÖVİZ | ALTIN | KRİPTO (High Contrast Pill Switcher) */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/[0.04] border border-white/10 rounded-2xl mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('forex')}
          className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer text-center ${
            activeTab === 'forex'
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/25'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          💱 Döviz
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gold')}
          className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer text-center ${
            activeTab === 'gold'
              ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/25'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          🪙 Altın
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('crypto')}
          className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer text-center ${
            activeTab === 'crypto'
              ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          ₿ Kripto
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DÖVİZ ÇEVİRİCİ */}
      {/* ========================================================================= */}
      {activeTab === 'forex' && (
        <div className="space-y-2.5">
          {/* FROM CARD */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 sm:p-4 hover:border-emerald-500/40 focus-within:border-emerald-500 transition-all">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-bold mb-1.5">
              <span>Çevrilen Tutar</span>
              <span>Para Birimi</span>
            </div>

            <div className="flex items-center justify-between gap-3">
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
                className="w-full font-mono font-black text-2xl sm:text-3xl text-white placeholder-zinc-600 bg-transparent outline-none"
                aria-label="Kaynak Miktar"
              />

              <div className="relative shrink-0">
                <select
                  value={fromCurrency}
                  onChange={(e) => {
                    setFromCurrency(e.target.value);
                    setLastEdited('from');
                  }}
                  className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/10 font-bold text-sm text-white cursor-pointer focus:outline-none"
                  aria-label="Kaynak Para Birimi"
                >
                  {marketData.currencies.map(c => (
                    <option key={c.code} value={c.code} className="bg-[#12161a] text-white">
                      {c.flag} {c.code} - {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* SWAP BUTTON */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              type="button"
              onClick={handleSwapForex}
              className="w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-90 text-black shadow-lg shadow-emerald-500/30 flex items-center justify-center transition-all cursor-pointer border border-emerald-300"
              title="Para Birimlerini Değiştir"
              aria-label="Para Birimlerini Değiştir"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          {/* TO CARD */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 sm:p-4 hover:border-emerald-500/40 focus-within:border-emerald-500 transition-all">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-bold mb-1.5">
              <span>Hesaplanan Değer</span>
              <span>Hedef Birim</span>
            </div>

            <div className="flex items-center justify-between gap-3">
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
                className="w-full font-mono font-black text-2xl sm:text-3xl text-emerald-400 placeholder-emerald-800 bg-transparent outline-none"
                aria-label="Hesaplanan Tutar"
              />

              <div className="relative shrink-0">
                <select
                  value={toCurrency}
                  onChange={(e) => {
                    setToCurrency(e.target.value);
                    setLastEdited('from');
                  }}
                  className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/10 font-bold text-sm text-white cursor-pointer focus:outline-none"
                  aria-label="Hedef Para Birimi"
                >
                  {marketData.currencies.map(c => (
                    <option key={c.code} value={c.code} className="bg-[#12161a] text-white">
                      {c.flag} {c.code} - {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* QUICK PRESETS (Wrapped cleanly, NO ugly horizontal scrollbar) */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-bold mb-2">
              <span>Hızlı Tutarlar:</span>
              <span className="text-[11px] text-zinc-400 font-mono">
                {currencyMap.get(fromCurrency)?.name}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
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
                  className="py-1.5 px-1 rounded-xl bg-white/[0.05] hover:bg-emerald-500/20 text-zinc-300 hover:text-emerald-300 border border-white/10 font-mono text-xs font-bold transition-all text-center active:scale-95 cursor-pointer"
                >
                  {amt} {fromCurrency === 'GLD' ? 'Gr' : fromCurrency === 'CEYREK' ? 'Adet' : fromCurrency}
                </button>
              ))}
            </div>
          </div>

          {/* FOOTER RATE BANNER */}
          <div className="mt-3 p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-zinc-300 font-mono">
                1 {fromCurrency} = <strong className="text-white font-black">{exchangeRate.toFixed(4).replace('.', ',')} {toCurrency}</strong>
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 font-medium">
              TCMB & Serbest Piyasa
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ALTIN ÇEVİRİCİ */}
      {/* ========================================================================= */}
      {activeTab === 'gold' && (
        <div className="space-y-3">
          {/* GOLD SELECTION */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 sm:p-4 hover:border-amber-400/40 focus-within:border-amber-400 transition-all">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-bold mb-1.5">
              <span>Altın Türü</span>
              <span>Miktar ({goldMap.get(selectedGoldId)?.unit.split(' ')[0] || 'Adet'})</span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="relative w-full">
                <select
                  value={selectedGoldId}
                  onChange={(e) => setSelectedGoldId(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/10 font-bold text-sm text-white cursor-pointer focus:outline-none"
                  aria-label="Altın Türü"
                >
                  {marketData.goldTypes.map(g => (
                    <option key={g.id} value={g.id} className="bg-[#12161a] text-white">
                      {g.name} ({formatFinancialNumber(g.rateToTRY, 2, '', ' ₺')})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <input
                type="text"
                inputMode="decimal"
                value={goldQuantity}
                onChange={(e) => setGoldQuantity(e.target.value.replace(/[^0-9.,]/g, ''))}
                placeholder="1"
                className="w-24 sm:w-32 text-right font-mono font-black text-2xl sm:text-3xl text-white placeholder-zinc-600 bg-transparent outline-none"
                aria-label="Altın Miktarı"
              />
            </div>
          </div>

          {/* TARGET CURRENCY & VALUE */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 sm:p-4 hover:border-amber-400/40 focus-within:border-amber-400 transition-all">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-bold mb-1.5">
              <span>Hesaplanan Toplam Tutar</span>
              <span>Hedef Para Birimi</span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="font-mono font-black text-2xl sm:text-3xl text-amber-400">
                {formatFinancialNumber(goldCalculation.amountTarget, 2, '', ` ${goldCalculation.targetSymbol}`)}
              </div>

              <div className="relative shrink-0">
                <select
                  value={goldTargetCurrency}
                  onChange={(e) => setGoldTargetCurrency(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/10 font-bold text-sm text-white cursor-pointer focus:outline-none"
                  aria-label="Hesaplanacak Para Birimi"
                >
                  <option value="TRY" className="bg-[#12161a] text-white">🇹🇷 TRY (₺)</option>
                  <option value="USD" className="bg-[#12161a] text-white">🇺🇸 USD ($)</option>
                  <option value="EUR" className="bg-[#12161a] text-white">🇪🇺 EUR (€)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* QUICK SHORTCUT BUTTONS */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2 pt-1">
            {[
              { id: 'gram-altin', label: 'Gram' },
              { id: 'ceyrek-altin', label: 'Çeyrek' },
              { id: 'yarim-altin', label: 'Yarım' },
              { id: 'tam-altin', label: 'Tam' },
              { id: 'gumus-gram', label: 'Gümüş' }
            ].map(g => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGoldId(g.id)}
                className={`py-1.5 px-1 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer active:scale-95 ${
                  selectedGoldId === g.id
                    ? 'bg-amber-400 text-black border-amber-300 shadow-md font-extrabold'
                    : 'bg-white/[0.05] hover:bg-white/10 text-zinc-300 border-white/10'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* FOOTER RATE BANNER */}
          <div className="mt-2 p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-zinc-300">
                Birim: <strong className="text-white font-mono font-bold">{formatFinancialNumber(goldCalculation.unitPriceTRY, 2, '', ' ₺')}</strong>
              </span>
            </div>
            <span className="text-[11px] text-zinc-400">
              Kapalıçarşı Canlı
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: KRİPTO PARA ÇEVİRİCİ */}
      {/* ========================================================================= */}
      {activeTab === 'crypto' && (
        <div className="space-y-3">
          {/* CRYPTO SELECTION */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 sm:p-4 hover:border-purple-400/40 focus-within:border-purple-400 transition-all">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-bold mb-1.5">
              <span>Kripto Varlık</span>
              <span>Miktar</span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="relative w-full">
                <select
                  value={selectedCryptoSymbol}
                  onChange={(e) => setSelectedCryptoSymbol(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/10 font-bold text-sm text-white cursor-pointer focus:outline-none"
                  aria-label="Kripto Varlık"
                >
                  {marketData.cryptoTypes.map(c => (
                    <option key={c.symbol} value={c.symbol} className="bg-[#12161a] text-white">
                      {c.symbol} - {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <input
                type="text"
                inputMode="decimal"
                value={cryptoQuantity}
                onChange={(e) => setCryptoQuantity(e.target.value.replace(/[^0-9.,]/g, ''))}
                placeholder="1"
                className="w-24 sm:w-32 text-right font-mono font-black text-2xl sm:text-3xl text-white placeholder-zinc-600 bg-transparent outline-none"
                aria-label="Kripto Miktarı"
              />
            </div>
          </div>

          {/* TARGET CURRENCY & VALUE */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 sm:p-4 hover:border-purple-400/40 focus-within:border-purple-400 transition-all">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-bold mb-1.5">
              <span>Hesaplanan Değer</span>
              <span>Karşılık Birim</span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="font-mono font-black text-2xl sm:text-3xl text-purple-400">
                {formatFinancialNumber(
                  cryptoCalculation.amount, 
                  cryptoCalculation.code === 'TRY' ? 2 : 2, 
                  cryptoCalculation.symbol === '$' ? '$' : '', 
                  cryptoCalculation.symbol !== '$' ? ` ${cryptoCalculation.symbol}` : ''
                )}
              </div>

              <div className="relative shrink-0">
                <select
                  value={cryptoTargetCurrency}
                  onChange={(e) => setCryptoTargetCurrency(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/10 font-bold text-sm text-white cursor-pointer focus:outline-none"
                  aria-label="Kripto Karşılığı Para Birimi"
                >
                  <option value="USD" className="bg-[#12161a] text-white">🇺🇸 USD ($)</option>
                  <option value="TRY" className="bg-[#12161a] text-white">🇹🇷 TRY (₺)</option>
                  <option value="EUR" className="bg-[#12161a] text-white">🇪🇺 EUR (€)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* QUICK SHORTCUT BUTTONS */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2 pt-1">
            {['BTC', 'ETH', 'SOL', 'USDT', 'XRP'].map(sym => (
              <button
                key={sym}
                type="button"
                onClick={() => setSelectedCryptoSymbol(sym)}
                className={`py-1.5 px-1 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer active:scale-95 ${
                  selectedCryptoSymbol === sym
                    ? 'bg-purple-500 text-white border-purple-400 shadow-md font-extrabold'
                    : 'bg-white/[0.05] hover:bg-white/10 text-zinc-300 border-white/10'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>

          {/* FOOTER RATE BANNER */}
          <div className="mt-2 p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span className="text-zinc-300">
                1 {selectedCryptoSymbol} = <strong className="text-white font-mono font-bold">{formatFinancialNumber(cryptoCalculation.unitPrice, 2, cryptoTargetCurrency === 'USD' ? '$' : '', cryptoTargetCurrency !== 'USD' ? ` ${cryptoCalculation.symbol}` : '')}</strong>
              </span>
            </div>
            <span className="text-[11px] text-zinc-400">
              Binance Canlı
            </span>
          </div>
        </div>
      )}

    </div>
  );
};
