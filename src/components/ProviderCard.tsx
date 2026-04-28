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
  covered: { label: 'Cubierto', color: 'text-green-500' },
  supplemented: { label: 'Parcial', color: 'text-yellow-500' },
  missing: { label: 'Excluido', color: 'text-red-500' },
  unknown: { label: 'N/D', color: 'text-[var(--muted)]' },
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
        <span className={`text-xs ${statusMap[item.status].color}`}>{statusMap[item.status].label}</span>
      </div>
      {item.description && <p className="text-xs text-[var(--muted)] mt-0.5">{item.description}</p>}
    </div>
  );
}

export default function ProviderCard({ provider, exchangeRate, isBestPrice, onEdit, onRemove }: ProviderCardProps) {
  const usd = convertPrice(provider.totalPrice, provider.currency, 'USD', exchangeRate);
  const coveragePct = provider.coverage.length
    ? Math.round((provider.coverage.filter((c) => c.status === 'covered').length / provider.coverage.length) * 100)
    : 0;

  return (
    <article className={`card ${isBestPrice ? 'ring-1 ring-green-500/40 border-green-500/40' : ''}`}>
      <div className="p-4 border-b border-[var(--border)] flex justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{provider.vendor}</h4>
            {isBestPrice && <span className="text-xs text-green-500">⭐ mejor precio</span>}
          </div>
          <p className="text-xs text-[var(--muted)] mt-1">{provider.sourceFileName} · {provider.aiProvider || 'ia'} </p>
        </div>
        <div className="flex gap-1">
          <button className="btn-secondary !px-2 !py-1" onClick={() => onEdit(provider)}>✏️</button>
          <button className="btn-secondary !px-2 !py-1" onClick={() => onRemove(provider.id)}>🗑️</button>
        </div>
      </div>

      <div className="p-4 border-b border-[var(--border)] grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-[var(--muted)]">Precio original</p>
          <p className="text-lg font-semibold">{provider.currency} {provider.totalPrice.toLocaleString('es-AR')}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--muted)]">Referencia USD</p>
          <p className="text-lg font-semibold">USD {usd.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">Coberturas</p>
          <span className="text-xs text-[var(--muted)]">{coveragePct}%</span>
        </div>
        <div className="space-y-0.5">
          {provider.coverage.length ? provider.coverage.map((item) => <CoverageRow key={item.id} item={item} />) : <p className="text-sm text-[var(--muted)]">Sin coberturas detectadas.</p>}
        </div>
      </div>
    </article>
  );
}
