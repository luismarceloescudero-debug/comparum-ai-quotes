'use client';

import { Provider, CoverageItem } from '@/types';

interface ProviderCardProps {
  provider: Provider;
  exchangeRate: number;
  isBestPrice?: boolean;
  onEdit: (provider: Provider) => void;
  onRemove: (id: string) => void;
}

const statusMap: Record<string, { label: string; color: string }> = {
  covered: { label: 'Cubierto', color: 'var(--success)' },
  supplemented: { label: 'Parcial', color: 'var(--warning)' },
  missing: { label: 'Excluido', color: 'var(--danger)' },
  unknown: { label: 'N/D', color: 'var(--text-muted)' },
};

function convertPrice(price: number, fromCurrency: string, toCurrency: string, rate: number): number {
  if (fromCurrency === toCurrency) return price;
  if (fromCurrency === 'USD' && toCurrency === 'ARS') return price * rate;
  if (fromCurrency === 'ARS' && toCurrency === 'USD') return price / rate;
  return price;
}

function CoverageRow({ item }: { item: CoverageItem }) {
  return (
    <div className="py-1.5 border-b border-[var(--border)]/60 last:border-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{item.name}</p>
        <span className="text-xs" style={{ color: statusMap[item.status].color }}>{statusMap[item.status].label}</span>
      </div>
      {item.description && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.description}</p>}
    </div>
  );
}

export default function ProviderCard({ provider, exchangeRate, isBestPrice, onEdit, onRemove }: ProviderCardProps) {
  const usd = convertPrice(provider.totalPrice, provider.currency, 'USD', exchangeRate);
  const coveragePct = provider.coverage.length
    ? Math.round((provider.coverage.filter((c) => c.status === 'covered').length / provider.coverage.length) * 100)
    : 0;

  return (
    <article className={`provider-card ${coveragePct > 75 ? 'complete-card' : ''}`}>
      <div className={`quality-strip ${coveragePct > 85 ? 'premium' : coveragePct > 60 ? 'standard-plus' : 'standard'}`} />
      <div className="card-body">
        <div className="card-top-row">
          <div className={`rank-badge ${isBestPrice ? 'gold' : 'other'}`}>
            {isBestPrice ? '1' : '•'}
          </div>
          <div className="card-title-area">
            <div className={`status-ribbon ${coveragePct > 85 ? 'complete' : coveragePct > 60 ? 'near-complete' : 'partial'}`}>
              {coveragePct}% cobertura
            </div>
            <h4 className="provider-name">{provider.vendor}</h4>
            <p className="provider-location">📄 {provider.sourceFileName} · {provider.aiProvider || 'ia'}</p>
          </div>
          <div className="flex gap-1">
            <button className="tool-btn" onClick={() => onEdit(provider)}>✏️</button>
            <button className="tool-btn" onClick={() => onRemove(provider.id)}>🗑️</button>
          </div>
        </div>

        <div className="price-dual">
          <div className={`price-side ${provider.currency === 'ARS' ? 'ars' : 'usd'} primary`}>
            <div className="price-side-label">Precio original ({provider.currency})</div>
            <div className="price-side-value">{provider.totalPrice.toLocaleString('es-AR')}</div>
          </div>
          <div className="price-divider" />
          <div className="price-side usd">
            <div className="price-side-label">Referencia USD</div>
            <div className="price-side-value">{usd.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
          </div>
        </div>

        <div className="card-footer">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Coberturas</p>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{coveragePct}%</span>
          </div>
          <div className="space-y-0.5">
            {provider.coverage.length
              ? provider.coverage.map((item) => <CoverageRow key={item.id} item={item} />)
              : <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sin coberturas detectadas.</p>}
          </div>
        </div>
      </div>
    </article>
  );
}
