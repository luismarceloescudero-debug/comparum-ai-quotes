import { Provider, QuoteComparisonSummary } from '@/types';
import { convertCurrency } from './currency';

export function buildComparison(
  providers: Provider[],
  rates: Record<string, number>,
  baseCurrency: string,
): QuoteComparisonSummary {
  const normalizedPrices: Record<string, number> = {};

  providers.forEach((provider) => {
    normalizedPrices[provider.id] = convertCurrency(
      provider.totalPrice,
      provider.currency,
      baseCurrency,
      rates,
      baseCurrency,
    );
  });

  const bestPriceProviderId = Object.entries(normalizedPrices)
    .sort((a, b) => a[1] - b[1])
    .at(0)?.[0];

  const coverageNames = new Set<string>();
  providers.forEach((p) => p.coverage.forEach((c) => coverageNames.add(c.name)));

  const rows = Array.from(coverageNames).map((coverageName) => {
    const row = {
      coverageName,
      providers: providers.map((provider) => {
        const item = provider.coverage.find((c) => c.name === coverageName);
        return {
          providerId: provider.id,
          status: item?.status || 'unknown',
          notes: item?.notes,
        };
      }),
    };

    const best = row.providers.find((p) => p.status === 'covered')?.providerId;
    return { ...row, bestProviderId: best };
  });

  return {
    bestPriceProviderId,
    normalizedCurrency: baseCurrency,
    normalizedPrices,
    rows,
  };
}
