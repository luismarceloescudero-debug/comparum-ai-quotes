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
    <section className="card p-4 md:p-6" style={{ marginBottom: 24 }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Tabla comparativa</h3>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Moneda normalizada: {currency}</span>
      </div>

      <div className="overflow-auto">
        <table className="quote-table" style={{ minWidth: 760 }}>
          <thead>
            <tr>
              <th>Cobertura</th>
              {providers.map((p) => (
                <th key={p.id}>
                  <div className="flex flex-col">
                    <span>{p.vendor}</span>
                    <span className="text-xs" style={{ color: comparison.bestPriceProviderId === p.id ? 'var(--success)' : 'var(--text-muted)' }}>
                      {comparison.normalizedPrices[p.id]?.toLocaleString('es-AR', { maximumFractionDigits: 2 })} {comparison.normalizedCurrency}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparison.rows.map((row) => (
              <tr key={row.coverageName}>
                <td className="font-medium">{row.coverageName}</td>
                {row.providers.map((cell) => (
                  <td
                    key={`${row.coverageName}-${cell.providerId}`}
                    style={{ background: row.bestProviderId === cell.providerId ? 'var(--success-light)' : 'transparent' }}
                  >
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
