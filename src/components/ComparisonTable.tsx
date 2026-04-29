'use client';

import { Provider, QuoteComparisonSummary } from '@/types';

interface Props {
  providers: Provider[];
  comparison?: QuoteComparisonSummary;
  currency: string;
}

const statusLabel: Record<string, string> = {
  covered: '✅ Cubierto',
  supplemented: '⚠️ Suplementado',
  missing: '❌ Faltante',
  unknown: '➖ N/D',
};

export default function ComparisonTable({ providers, comparison, currency }: Props) {
  if (!providers.length || !comparison) return null;

  return (
    <section className="modal-box" style={{ maxWidth: '100%' }}>
      <div className="modal-header">
        <div>
          <h3>Comparativa profesional</h3>
          <div className="sub">Moneda normalizada: {currency}</div>
        </div>
      </div>
      <div className="modal-body">
        <div className="overflow-auto">
          <table className="quote-table min-w-[880px]">
            <thead>
              <tr>
                <th>Cobertura</th>
                {providers.map((p) => (
                  <th key={p.id}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontWeight: 800 }}>{p.vendor}</span>
                      <span style={{ color: comparison.bestPriceProviderId === p.id ? 'var(--success)' : 'var(--text-muted)' }}>
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
                  <td>{row.coverageName}</td>
                  {row.providers.map((cell) => (
                    <td key={`${row.coverageName}-${cell.providerId}`} style={{ background: row.bestProviderId === cell.providerId ? 'var(--success-light)' : undefined }}>
                      {statusLabel[cell.status]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
