'use client';

import { Provider } from '@/types';

interface ProviderCardProps {
  provider: Provider;
  exchangeRate: number;
  isBestPrice?: boolean;
  onEdit: (provider: Provider) => void;
  onRemove: (id: string) => void;
}

function convertPrice(price: number, fromCurrency: string, toCurrency: string, rate: number): number {
  if (fromCurrency === toCurrency) return price;
  if (fromCurrency === 'USD' && toCurrency === 'ARS') return price * rate;
  if (fromCurrency === 'ARS' && toCurrency === 'USD') return price / rate;
  return price;
}

const statusLabel = {
  covered: 'Cubierto',
  supplemented: 'Suplementado',
  missing: 'Faltante',
  unknown: 'N/D',
} as const;

const statusClass = {
  covered: 'text-[var(--success)]',
  supplemented: 'text-[var(--warning)]',
  missing: 'text-[var(--danger)]',
  unknown: 'text-[var(--text-muted)]',
} as const;

export default function ProviderCard({ provider, exchangeRate, isBestPrice, onEdit, onRemove }: ProviderCardProps) {
  const arsVal = convertPrice(provider.totalPrice, provider.currency, 'ARS', exchangeRate);
  const usdVal = convertPrice(provider.totalPrice, provider.currency, 'USD', exchangeRate);
  const covered = provider.coverage.filter((c) => c.status === 'covered' || c.status === 'supplemented').length;
  const pct = provider.coverage.length ? Math.round((covered / provider.coverage.length) * 100) : 0;
  const quality = provider.qualityScore ?? 0;

  return (
    <article className={`provider-card ${pct === 100 ? 'complete-card' : ''} ${isBestPrice ? 'ring-2 ring-[var(--success)]/40' : ''}`}>
      <div className={`quality-strip ${quality >= 85 ? 'premium' : quality >= 70 ? 'standard-plus' : 'standard'}`} />
      <div className="card-body">
        <div className="card-top-row">
          <div className={`rank-badge ${isBestPrice ? 'gold' : 'other'}`}>{isBestPrice ? '1' : '•'}</div>
          <div className="card-title-area">
            <div className={`status-ribbon ${pct >= 90 ? 'complete' : pct >= 70 ? 'near-complete' : pct >= 40 ? 'partial' : 'low'}`}>
              {covered}/{provider.coverage.length || 0} ítems
            </div>
            <h3 className="provider-name">{provider.vendor}</h3>
            <div className="provider-location">{provider.sourceFileName} · {provider.aiProvider ?? 'ia'}</div>
          </div>
        </div>

        <div className="price-dual">
          <div className={`price-side ars ${provider.currency === 'ARS' ? 'primary' : ''}`}>
            <span className="price-side-label">ARS</span>
            <span className="price-side-value">{arsVal.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
          </div>
          <div className="price-divider" />
          <div className={`price-side usd ${provider.currency === 'USD' ? 'primary' : ''}`}>
            <span className="price-side-label">USD</span>
            <span className="price-side-value">{usdVal.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="card-stats-3">
          <div className="stat-box">
            <div className="stat-box-label">Cobertura</div>
            <div className="stat-box-value green">{pct}%</div>
          </div>
          <div className="stat-box">
            <div className="stat-box-label">Score</div>
            <div className="stat-box-value blue">{quality || 'N/D'}</div>
          </div>
          <div className="stat-box">
            <div className="stat-box-label">Moneda origen</div>
            <div className="stat-box-value">{provider.currency}</div>
          </div>
        </div>

        <div className="notes-block">
          <button className="notes-toggle" type="button">
            Análisis y coberturas ({provider.coverage.length})
          </button>
          <ul className="notes-list open">
            {provider.coverage.map((item) => (
              <li key={item.id} className="note-item note-meta">
                <span className="note-text">
                  <strong>{item.name}:</strong>{' '}
                  <span className={statusClass[item.status]}>{statusLabel[item.status]}</span>
                  {item.description ? ` · ${item.description}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {provider.commercialConditions && Object.values(provider.commercialConditions).some(Boolean) && (
          <div className="commercial-block">
            <div className="commercial-block-title">Condiciones comerciales</div>
            <dl className="commercial-list">
              {provider.commercialConditions.paymentTerms && (
                <div className="commercial-row"><dt>Pago</dt><dd>{provider.commercialConditions.paymentTerms}</dd></div>
              )}
              {provider.commercialConditions.validity && (
                <div className="commercial-row"><dt>Validez</dt><dd>{provider.commercialConditions.validity}</dd></div>
              )}
              {provider.commercialConditions.discounts && (
                <div className="commercial-row"><dt>Descuentos</dt><dd>{provider.commercialConditions.discounts}</dd></div>
              )}
              {provider.commercialConditions.surcharges && (
                <div className="commercial-row"><dt>Recargos</dt><dd>{provider.commercialConditions.surcharges}</dd></div>
              )}
            </dl>
          </div>
        )}

        <div className="card-footer">
          <div className="card-actions-3">
            <button className="action-btn btn-detail" onClick={() => onEdit(provider)}>Editar</button>
            <button className="action-btn btn-detail" onClick={() => onRemove(provider.id)}>Quitar</button>
            <button className="action-btn btn-detail" onClick={() => window.print()}>Imprimir</button>
          </div>
        </div>
      </div>
    </article>
  );
}
