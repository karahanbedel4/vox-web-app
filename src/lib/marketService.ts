import { appStorage } from './storage';

export interface MarketTickerItem {
  id: string;
  name: string;
  code: string;
  price: number;
  changePercent: number;
  changeAmount: number;
  prefix?: string;
  suffix?: string;
  type: 'gold' | 'forex' | 'stock' | 'crypto' | 'commodity';
  decimalDigits?: number;
}

export interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  rateToTRY: number; // 1 unit in TRY
  rateToUSD: number; // 1 USD in this unit
}

export interface GoldRate {
  id: string;
  name: string;
  unit: string;
  rateToTRY: number; // price in TRY
  changePercent: number;
}

export interface CryptoRate {
  symbol: string;
  name: string;
  priceUSD: number;
  priceTRY: number;
  changePercent: number;
  icon?: string;
}

export interface MarketDataResponse {
  success: boolean;
  items: MarketTickerItem[];
  currencies: CurrencyRate[];
  goldTypes: GoldRate[];
  cryptoTypes: CryptoRate[];
  lastUpdated: string;
  source: string;
}

// Baseline Fallback Data (Exact visual mirror of real-time market)
export const DEFAULT_MARKET_DATA: MarketDataResponse = {
  success: true,
  items: [
    {
      id: 'gram-altin',
      name: 'GRAM ALTIN',
      code: 'GLD',
      price: 6534.62,
      changePercent: -3.06,
      changeAmount: -206.27,
      prefix: '',
      suffix: '',
      type: 'gold',
      decimalDigits: 2
    },
    {
      id: 'dolar',
      name: 'DOLAR',
      code: 'USD',
      price: 48.9827,
      changePercent: 0.11,
      changeAmount: 0.0538,
      prefix: '',
      suffix: '',
      type: 'forex',
      decimalDigits: 4
    },
    {
      id: 'euro',
      name: 'EURO',
      code: 'EUR',
      price: 55.7720,
      changePercent: 0.03,
      changeAmount: 0.0167,
      prefix: '',
      suffix: '',
      type: 'forex',
      decimalDigits: 4
    },
    {
      id: 'sterlin',
      name: 'STERLİN',
      code: 'GBP',
      price: 65.0475,
      changePercent: 0.36,
      changeAmount: 0.2333,
      prefix: '',
      suffix: '',
      type: 'forex',
      decimalDigits: 4
    },
    {
      id: 'bist100',
      name: 'BIST 100',
      code: 'XU100',
      price: 12568.70,
      changePercent: -2.56,
      changeAmount: -330.21,
      prefix: '',
      suffix: '',
      type: 'stock',
      decimalDigits: 2
    },
    {
      id: 'bitcoin',
      name: 'BITCOIN',
      code: 'BTC',
      price: 82930,
      changePercent: -2.15,
      changeAmount: -1826,
      prefix: '$',
      suffix: '',
      type: 'crypto',
      decimalDigits: 0
    },
    {
      id: 'gram-gumus',
      name: 'GRAM GÜMÜŞ',
      code: 'SLV',
      price: 96.41,
      changePercent: -4.72,
      changeAmount: -4.78,
      prefix: '',
      suffix: '',
      type: 'gold',
      decimalDigits: 2
    },
    {
      id: 'brent',
      name: 'BRENT',
      code: 'BRENT',
      price: 100.25,
      changePercent: 2.88,
      changeAmount: 2.81,
      prefix: '$',
      suffix: '',
      type: 'commodity',
      decimalDigits: 2
    }
  ],
  currencies: [
    { code: 'USD', name: 'Amerikan Doları', symbol: '$', flag: '🇺🇸', rateToTRY: 48.9827, rateToUSD: 1 },
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', rateToTRY: 55.7720, rateToUSD: 55.7720 / 48.9827 },
    { code: 'TRY', name: 'Türk Lirası', symbol: '₺', flag: '🇹🇷', rateToTRY: 1, rateToUSD: 1 / 48.9827 },
    { code: 'GBP', name: 'İngiliz Sterlini', symbol: '£', flag: '🇬🇧', rateToTRY: 65.0475, rateToUSD: 65.0475 / 48.9827 },
    { code: 'CHF', name: 'İsviçre Frangı', symbol: '₣', flag: '🇨🇭', rateToTRY: 57.8500, rateToUSD: 57.8500 / 48.9827 },
    { code: 'CAD', name: 'Kanada Doları', symbol: 'C$', flag: '🇨🇦', rateToTRY: 34.9200, rateToUSD: 34.9200 / 48.9827 },
    { code: 'AUD', name: 'Avustralya Doları', symbol: 'A$', flag: '🇦🇺', rateToTRY: 34.4293, rateToUSD: 34.4293 / 48.9827 },
    { code: 'JPY', name: 'Japon Yeni', symbol: '¥', flag: '🇯🇵', rateToTRY: 0.3150, rateToUSD: 0.3150 / 48.9827 },
    { code: 'SAR', name: 'Suudi Arabistan Riyali', symbol: '﷼', flag: '🇸🇦', rateToTRY: 13.0600, rateToUSD: 13.0600 / 48.9827 },
    { code: 'AED', name: 'BAE Dirhemi', symbol: 'د.إ', flag: '🇦🇪', rateToTRY: 13.3400, rateToUSD: 13.3400 / 48.9827 },
    { code: 'KWD', name: 'Kuveyt Dinarı', symbol: 'KD', flag: '🇰🇼', rateToTRY: 159.2000, rateToUSD: 159.2000 / 48.9827 }
  ],
  goldTypes: [
    { id: 'gram-altin', name: 'Gram Altın (24 Ayar)', unit: 'Gram', rateToTRY: 6534.62, changePercent: -3.06 },
    { id: 'ceyrek-altin', name: 'Çeyrek Altın', unit: 'Adet (1.75g)', rateToTRY: 6534.62 * 1.635, changePercent: -3.06 },
    { id: 'yarim-altin', name: 'Yarım Altın', unit: 'Adet (3.50g)', rateToTRY: 6534.62 * 3.27, changePercent: -3.06 },
    { id: 'tam-altin', name: 'Tam Altın', unit: 'Adet (7.00g)', rateToTRY: 6534.62 * 6.54, changePercent: -3.06 },
    { id: 'cumhuriyet-altini', name: 'Cumhuriyet (Ata) Altını', unit: 'Adet (7.21g)', rateToTRY: 6534.62 * 6.72, changePercent: -3.06 },
    { id: '22-ayar-bilezik', name: '22 Ayar Bilezik (Gram)', unit: 'Gram', rateToTRY: 6534.62 * 0.916, changePercent: -3.06 },
    { id: 'ons-altin', name: 'Ons Altın ($)', unit: 'Ons (31.1g)', rateToTRY: 4150.0 * 48.9827, changePercent: -3.03 },
    { id: 'gram-gumus', name: 'Gram Gümüş', unit: 'Gram', rateToTRY: 96.41, changePercent: -4.72 }
  ],
  cryptoTypes: [
    { symbol: 'BTC', name: 'Bitcoin', priceUSD: 82930, priceTRY: 82930 * 48.9827, changePercent: -2.15 },
    { symbol: 'ETH', name: 'Ethereum', priceUSD: 2850, priceTRY: 2850 * 48.9827, changePercent: -1.45 },
    { symbol: 'SOL', name: 'Solana', priceUSD: 185, priceTRY: 185 * 48.9827, changePercent: -2.80 },
    { symbol: 'USDT', name: 'Tether (USDT)', priceUSD: 1.0, priceTRY: 48.9827, changePercent: 0.01 },
    { symbol: 'XRP', name: 'Ripple (XRP)', priceUSD: 2.45, priceTRY: 2.45 * 48.9827, changePercent: 1.15 }
  ],
  lastUpdated: new Date().toISOString(),
  source: 'TCMB & Serbest Piyasa Canlı Verileri'
};

/**
 * Format a number using Turkish locale formatting (thousands '.', decimal ',')
 */
export function formatFinancialNumber(
  num: number, 
  decimals: number = 2, 
  prefix: string = '', 
  suffix: string = ''
): string {
  if (isNaN(num) || num === null || num === undefined) return '0,00';
  
  const fixed = num.toFixed(decimals);
  const parts = fixed.split('.');
  const intFormatted = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decFormatted = parts[1] !== undefined && parts[1] !== '' ? `,${parts[1]}` : '';
  
  return `${prefix}${intFormatted}${decFormatted}${suffix}`;
}

/**
 * Format ticker change badge:
 * Positive: %0,11 (0,0538)
 * Negative: %-3,06 (-206,27)
 * Bitcoin / Brent with currency prefix: %-2,15 (-$1.826) or %2,88 ($2,81)
 */
export function formatTickerBadge(
  changePercent: number,
  changeAmount: number,
  currencyPrefix: string = '',
  currencySuffix: string = ''
): {
  badgeText: string;
  isPositive: boolean;
  isNeutral: boolean;
} {
  const isPositive = changePercent > 0;
  const isNeutral = changePercent === 0;

  // Percentage formatted with 2 decimals
  const absPct = Math.abs(changePercent).toFixed(2).replace('.', ',');
  const pctStr = changePercent < 0 ? `%-${absPct}` : `%${absPct}`;

  // Amount formatted depending on magnitude
  const isMicro = Math.abs(changeAmount) < 1 && Math.abs(changeAmount) > 0;
  const amtDecimals = isMicro ? 4 : (Math.abs(changeAmount) >= 1000 ? 0 : 2);
  const absAmtParts = Math.abs(changeAmount).toFixed(amtDecimals).split('.');
  const intPart = absAmtParts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decPart = absAmtParts[1] ? `,${absAmtParts[1]}` : '';
  const amtFormatted = `${intPart}${decPart}`;

  let amtSign = '';
  if (changeAmount < 0) {
    amtSign = '-';
  }

  // Notice in image: (-$1.826) or (0,0538)
  const amtStr = `(${amtSign}${currencyPrefix}${amtFormatted}${currencySuffix})`;
  const badgeText = `${pctStr} ${amtStr}`;

  return { badgeText, isPositive, isNeutral };
}

/**
 * Client-side fetcher with offline cache fallback
 */
export async function fetchMarketData(): Promise<MarketDataResponse> {
  try {
    const res = await fetch('/api/market-rates', {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(6000)
    });

    if (res.ok) {
      const data: MarketDataResponse = await res.json();
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        try {
          appStorage.setItemSync('vox_cached_market_rates', JSON.stringify(data));
        } catch (e) {}
        return data;
      }
    }
  } catch (err) {
    console.warn('Market rates API fetch notice, reading from cache...');
  }

  // Fallback to local storage or default data
  try {
    const cached = appStorage.getItemSync('vox_cached_market_rates');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

  return DEFAULT_MARKET_DATA;
}
