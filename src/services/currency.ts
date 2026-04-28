import { ExchangeRateResponse } from '@/types';

export async function fetchRates(base: string): Promise<ExchangeRateResponse> {
  const res = await fetch(`/api/currency/rates?base=${encodeURIComponent(base)}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('No se pudieron obtener tasas de cambio');
  }
  return res.json();
}

export function convert(amount: number, from: string, to: string, rates: Record<string, number>, base: string) {
  if (from === to) return amount;
  const fromRate = from === base ? 1 : rates[from];
  const toRate = to === base ? 1 : rates[to];
  if (!fromRate || !toRate) return amount;
  return (amount / fromRate) * toRate;
}
