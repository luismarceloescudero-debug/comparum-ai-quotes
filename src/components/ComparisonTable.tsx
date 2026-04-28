'use client';

import { Provider, QuoteComparisonSummary } from '@/types';

interface Props {
  providers: Provider[];
  comparison?: QuoteComparisonSummary;
  currency: string;
}

const statusLabel: Record<string, string> = {
  covered: '✅ Cubierto',
  supplemented: '⚠️ Parcial',
  missing: '❌ Excluido',
  unknown: '➖ N/D',
};

export default function ComparisonTable({ providers, comparison, currency }: Props) {
  if (!providers.length || !comparison) return null;

  return (
    <section className="card p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Tabla comparativa</h3>
        <span className="text-xs text-[var(--muted)]">Moneda normalizada: {currency}</span>
      </div>

      <div className="overflow-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="text-left border-b border-[var(--border)]">
              <th className="py-2 pr-2">Cobertura</th>
              {providers.map((p) => (
                <th key={p.id} className="py-2 px-2">
                  <div className="flex flex-col">
                    <span>{p.vendor}</span>
                    <span className={`text-xs ${comparison.bestPriceProviderId === p.id ? 'text-green-500 font-semibold' : 'text-[var(--muted)]'}`}>
                      {comparison.normalizedPrices[p.id]?.toLocaleString('es-AR', { maximumFractionDigits: 2 })} {comparison.normalizedCurrency}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparison.rows.map((row) => (
              <tr key={row.coverageName} className="border-b border-[var(--border)]/60">
                <td className="py-2 pr-2 font-medium">{row.coverageName}</td>
                {row.providers.map((cell) => (
                  <td key={`${row.coverageName}-${cell.providerId}`} className={`py-2 px-2 ${row.bestProviderId === cell.providerId ? 'bg-green-500/10' : ''}`}>
                    {statusLabel[cell.status]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
