/**
 * Currency Service for Spliqo
 * Supports multi-currency expenses for overseas trips (Thailand, Japan, Singapore, Europe, USA, etc.)
 * with live and cached exchange rates to VND.
 */

export const SUPPORTED_CURRENCIES = [
  { code: 'VND', name: 'Việt Nam Đồng', symbol: '₫', flag: '🇻🇳', defaultRate: 1, step: 1000 },
  { code: 'USD', name: 'Đô la Mỹ', symbol: '$', flag: '🇺🇸', defaultRate: 25450, step: 0.1 },
  { code: 'THB', name: 'Baht Thái Lan', symbol: '฿', flag: '🇹🇭', defaultRate: 700, step: 1 },
  { code: 'JPY', name: 'Yên Nhật', symbol: '¥', flag: '🇯🇵', defaultRate: 165, step: 1 },
  { code: 'SGD', name: 'Đô la Singapore', symbol: 'S$', flag: '🇸🇬', defaultRate: 19250, step: 0.5 },
  { code: 'EUR', name: 'Euro Châu Âu', symbol: '€', flag: '🇪🇺', defaultRate: 27500, step: 0.1 },
  { code: 'KRW', name: 'Won Hàn Quốc', symbol: '₩', flag: '🇰🇷', defaultRate: 18.5, step: 10 },
  { code: 'TWD', name: 'Tân Đài Tệ', symbol: 'NT$', flag: '🇹🇼', defaultRate: 780, step: 1 },
  { code: 'CNY', name: 'Nhân Dân Tệ', symbol: '¥', flag: '🇨🇳', defaultRate: 3500, step: 1 },
  { code: 'GBP', name: 'Bảng Anh', symbol: '£', flag: '🇬🇧', defaultRate: 32600, step: 0.1 },
  { code: 'AUD', name: 'Đô la Úc', symbol: 'A$', flag: '🇦🇺', defaultRate: 16400, step: 0.5 }
];

const RATES_STORAGE_KEY = 'spliqo_exchange_rates';

/**
 * Gets currency information by currency code
 * @param {string} code 
 * @returns {typeof SUPPORTED_CURRENCIES[0]}
 */
export function getCurrencyInfo(code = 'VND') {
  const upper = (code || 'VND').toUpperCase();
  return SUPPORTED_CURRENCIES.find(c => c.code === upper) || SUPPORTED_CURRENCIES[0];
}

/**
 * Gets default exchange rate to VND for a currency code
 * @param {string} code
 * @returns {number}
 */
export function getExchangeRate(code = 'VND') {
  if (!code || code === 'VND') return 1;

  // Check cached rates in localStorage first
  try {
    const raw = localStorage.getItem(RATES_STORAGE_KEY);
    if (raw) {
      const cached = JSON.parse(raw);
      if (cached[code] && typeof cached[code] === 'number') {
        return cached[code];
      }
    }
  } catch {}

  const info = getCurrencyInfo(code);
  return info.defaultRate || 1;
}

/**
 * Formats an amount with currency symbol or code
 * @param {number} amount
 * @param {string} currencyCode
 * @returns {string} e.g. "150 ฿" or "$25"
 */
export function formatForeignAmount(amount, currencyCode = 'VND') {
  const num = Number(amount) || 0;
  const info = getCurrencyInfo(currencyCode);

  if (currencyCode === 'VND') {
    return new Intl.NumberFormat('vi-VN').format(Math.round(num)) + 'đ';
  }

  // Formatting based on currency symbol position
  const formattedNum = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: num % 1 !== 0 ? 2 : 0
  }).format(num);

  if (['USD', 'SGD', 'AUD', 'GBP'].includes(currencyCode)) {
    return `${info.symbol}${formattedNum}`;
  }

  return `${formattedNum} ${info.symbol}`;
}

/**
 * Converts a foreign currency amount to VND
 * @param {number} amount 
 * @param {string} currencyCode 
 * @param {number} [customRate] 
 * @returns {number}
 */
export function convertToVND(amount, currencyCode = 'VND', customRate) {
  const num = Number(amount) || 0;
  if (currencyCode === 'VND') return Math.round(num);
  const rate = customRate && Number(customRate) > 0 ? Number(customRate) : getExchangeRate(currencyCode);
  return Math.round(num * rate);
}

/**
 * Fetches live exchange rates from backend or public source, with offline fallback
 */
export async function refreshExchangeRates() {
  try {
    // Open reliable public exchange rates endpoint (base USD)
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!res.ok) throw new Error('Failed to fetch external rates');
    const data = await res.json();

    if (data && data.rates && data.rates.VND) {
      const usdToVnd = data.rates.VND;
      const computedRates = { VND: 1 };

      SUPPORTED_CURRENCIES.forEach(c => {
        if (c.code === 'VND') return;
        if (c.code === 'USD') {
          computedRates.USD = Math.round(usdToVnd);
          return;
        }
        const rateAgainstUsd = data.rates[c.code];
        if (rateAgainstUsd && rateAgainstUsd > 0) {
          // 1 Foreign Currency = (USD / rateAgainstUsd) * usdToVnd
          const foreignToVnd = usdToVnd / rateAgainstUsd;
          computedRates[c.code] = Math.round(foreignToVnd * 10) / 10;
        }
      });

      localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify(computedRates));
      return computedRates;
    }
  } catch (err) {
    console.warn('[CurrencyService] Live rate fetch failed, using built-in rates:', err.message);
  }
  return null;
}
