import { describe, it, expect, vi } from 'vitest';
import { getExchangeRates } from '../controllers/currencyController.js';

describe('Currency Controller Tests', () => {
  it('returns valid exchange rates with VND equal to 1', async () => {
    let responseData = null;
    const res = {
      json: (data) => {
        responseData = data;
        return data;
      }
    };
    const req = {};

    await getExchangeRates(req, res);

    expect(responseData).toBeDefined();
    expect(responseData.success).toBe(true);
    expect(responseData.rates).toBeDefined();
    expect(responseData.rates.VND).toBe(1);
    expect(responseData.rates.USD).toBeGreaterThan(20000);
    expect(responseData.rates.THB).toBeGreaterThan(100);
    expect(responseData.rates.JPY).toBeGreaterThan(50);
    expect(responseData.rates.EUR).toBeGreaterThan(20000);
  });

  it('contains all required major currencies', async () => {
    let responseData = null;
    const res = {
      json: (data) => {
        responseData = data;
        return data;
      }
    };
    const req = {};

    await getExchangeRates(req, res);

    const requiredCurrencies = ['VND', 'USD', 'THB', 'JPY', 'SGD', 'EUR', 'KRW', 'TWD', 'CNY', 'GBP', 'AUD'];
    requiredCurrencies.forEach(code => {
      expect(responseData.rates[code]).toBeDefined();
      expect(typeof responseData.rates[code]).toBe('number');
      expect(responseData.rates[code]).toBeGreaterThan(0);
    });
  });
});
