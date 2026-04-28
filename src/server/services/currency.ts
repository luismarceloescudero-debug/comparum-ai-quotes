import { ExchangeRateResponse } from '@/types';
import { readJsonFile, writeJsonFile } from './storage';

const CACHE_FILE = 'rates-cache.json';
const MAX_AGE_MS = 1000 * 60 * 15;

interface CachedRates {
  base: string;
  rates: Record<string, number>;
  provider: 'exchangerate-api' | 'frankfurter' | 'cache';
  updatedAt: string;
}

async function getCached(base: string): Promise<CachedRates | null> {
  const cache = await readJsonFile<CachedRates | null>(CACHE_FILE, null);
  if (!cache || cache.base !== base) return null;
  const age = Date.now() - new Date(cache.updatedAt).getTime();
  if (age > MAX_AGE_MS) return null;
  return cache;
}

export async function getExchangeRates(base = 'USD'): Promise<ExchangeRateResponse> {
  const cached = await getCached(base);
  if (cached) {
    return { success: true, base, rates: cached.rates, provider: 'cache', updatedAt: cached.updatedAt };
  }

  try {
    const r1 = await fetch(`https://open.er-api.com/v6/latest/${base}`, { next: { revalidate: 900 } });
    if (r1.ok) {
      const d1 = await r1.json();
      if (d1?.rates) {
        const payload: CachedRates = {
          base,
          rates: d1.rates,
          provider: 'exchangerate-api',
          updatedAt: new Date().toISOString(),
        };
        await writeJsonFile(CACHE_FILE, payload);
        return { success: true, base, rates: d1.rates, provider: 'exchangerate-api', updatedAt: payload.updatedAt };
      }
    }
  } catch {}

  try {
    const r2 = await fetch(`https://api.frankfurter.app/latest?from=${base}`);
    if (r2.ok) {
      const d2 = await r2.json();
      const rates = { ...(d2?.rates || {}), [base]: 1 };
      const payload: CachedRates = {
        base,
        rates,
        provider: 'frankfurter',
        updatedAt: new Date().toISOString(),
      };
      await writeJsonFile(CACHE_FILE, payload);
      return { success: true, base, rates, provider: 'frankfurter', updatedAt: payload.updatedAt };
    }
  } catch {}

  const stale = await readJsonFile<CachedRates | null>(CACHE_FILE, null);
  if (stale?.rates) {
    return {
      success: true,
      base: stale.base,
      rates: stale.rates,
      provider: 'cache',
      updatedAt: stale.updatedAt,
    };
  }

  throw new Error('No fue posible obtener tasas de cambio (API principal y fallback fallaron).');
}

export function convertCurrency(amount: number, from: string, to: string, rates: Record<string, number>, base: string) {
  if (from === to) return amount;

  const fromRate = from === base ? 1 : rates[from];
  const toRate = to === base ? 1 : rates[to];

  if (!fromRate || !toRate) return amount;

  const amountInBase = amount / fromRate;
  return amountInBase * toRate;
}
