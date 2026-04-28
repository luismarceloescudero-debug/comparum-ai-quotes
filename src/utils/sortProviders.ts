import { Provider, SortCriteria } from '@/types';

/**
 * Convert provider price to USD for comparison.
 */
function toUSD(provider: Provider, exchangeRate: number): number {
  if (provider.currency === 'USD') return provider.totalPrice;
  return provider.totalPrice / exchangeRate;
}

/**
 * Compute coverage percentage (covered items / total items).
 */
function coveragePct(provider: Provider): number {
  if (provider.coverage.length === 0) return 0;
  return provider.coverage.filter(c => c.status === 'covered').length / provider.coverage.length;
}

/**
 * Sort providers by the given criteria.
 */
export function sortProviders(
  providers: Provider[],
  criteria: SortCriteria,
  exchangeRate: number,
): Provider[] {
  const sorted = [...providers];

  switch (criteria) {
    case 'price-asc':
      return sorted.sort((a, b) => toUSD(a, exchangeRate) - toUSD(b, exchangeRate));
    case 'price-desc':
      return sorted.sort((a, b) => toUSD(b, exchangeRate) - toUSD(a, exchangeRate));
    case 'coverage':
      return sorted.sort((a, b) => coveragePct(b) - coveragePct(a));
    case 'quality':
      return sorted.sort((a, b) => (b.qualityScore ?? 0) - (a.qualityScore ?? 0));
    case 'date':
      return sorted.sort((a, b) => new Date(b.extractedAt).getTime() - new Date(a.extractedAt).getTime());
    default:
      return sorted;
  }
}

/**
 * Find the provider with the best (lowest) price in a specific currency.
 * Returns the provider ID or null.
 */
export function findBestPrice(providers: Provider[], exchangeRate: number): string | null {
  if (providers.length === 0) return null;
  let best = providers[0];
  let bestUSD = toUSD(best, exchangeRate);

  for (const p of providers) {
    const usd = toUSD(p, exchangeRate);
    if (usd < bestUSD) {
      best = p;
      bestUSD = usd;
    }
  }
  return best.id;
}

/**
 * Summary statistics for a group of providers.
 */
export interface ProviderStats {
  count: number;
  avgPriceUSD: number;
  minPriceUSD: number;
  maxPriceUSD: number;
  avgCoverage: number;
  avgQuality: number;
}

export function computeStats(providers: Provider[], exchangeRate: number): ProviderStats {
  if (providers.length === 0) {
    return { count: 0, avgPriceUSD: 0, minPriceUSD: 0, maxPriceUSD: 0, avgCoverage: 0, avgQuality: 0 };
  }
  const prices = providers.map(p => toUSD(p, exchangeRate));
  const coverages = providers.map(p => coveragePct(p) * 100);
  const qualities = providers.map(p => p.qualityScore ?? 0);

  return {
    count: providers.length,
    avgPriceUSD: prices.reduce((s, v) => s + v, 0) / prices.length,
    minPriceUSD: Math.min(...prices),
    maxPriceUSD: Math.max(...prices),
    avgCoverage: coverages.reduce((s, v) => s + v, 0) / coverages.length,
    avgQuality: qualities.reduce((s, v) => s + v, 0) / qualities.length,
  };
}
