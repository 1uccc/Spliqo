/**
 * Currency Controller for Spliqo
 * Provides default and live foreign exchange rates to VND.
 */

const DEFAULT_RATES = {
  VND: 1,
  USD: 25450,
  THB: 700,
  JPY: 165,
  SGD: 19250,
  EUR: 27500,
  KRW: 18.5,
  TWD: 780,
  CNY: 3500,
  GBP: 32600,
  AUD: 16400
};

let cachedLiveRates = null;
let lastFetchedTime = 0;
const CACHE_TTL = 1000 * 60 * 60 * 6; // 6 hours

export async function getExchangeRates(req, res) {
  const now = Date.now();
  if (cachedLiveRates && now - lastFetchedTime < CACHE_TTL) {
    return res.json({
      success: true,
      rates: cachedLiveRates,
      source: 'cache'
    });
  }

  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD', {
      headers: { 'User-Agent': 'Spliqo-Server/1.0' }
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.rates && data.rates.VND) {
        const usdToVnd = data.rates.VND;
        const liveRates = { ...DEFAULT_RATES, VND: 1, USD: Math.round(usdToVnd) };

        Object.keys(DEFAULT_RATES).forEach(code => {
          if (code === 'VND' || code === 'USD') return;
          const rateToUsd = data.rates[code];
          if (rateToUsd && rateToUsd > 0) {
            liveRates[code] = Math.round((usdToVnd / rateToUsd) * 10) / 10;
          }
        });

        cachedLiveRates = liveRates;
        lastFetchedTime = now;

        return res.json({
          success: true,
          rates: liveRates,
          source: 'live'
        });
      }
    }
  } catch (err) {
    console.warn('[CurrencyController] Error fetching external rates, using default rates:', err.message);
  }

  return res.json({
    success: true,
    rates: DEFAULT_RATES,
    source: 'defaults'
  });
}
