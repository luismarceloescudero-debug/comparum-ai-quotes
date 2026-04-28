'use client';

import React from 'react';
import { Provider, CoverageItem } from '@/types';

interface ProviderCardProps {
  provider: Provider;
  exchangeRate: number;
  isBestPrice?: boolean;
  onEdit: (provider: Provider) => void;
  onRemove: (id: string) => void;
}

const statusColors: Record<string, string> = {
  covered: 'bg-green-500/20 text-green-400 border-green-500/30',
  supplemented: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  missing: 'bg-red-500/20 text-red-400 border-red-500/30',
  unknown: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const statusLabels: Record<string, string> = {
  covered: 'Cubierto',
  supplemented: 'Suplemento',
  missing: 'No incluido',
  unknown: 'Sin datos',
};

const statusIcons: Record<string, string> = {
  covered: '✅',
  supplemented: '⚠️',
  missing: '❌',
  unknown: '❓',
};

function convertPrice(price: number, fromCurrency: string, toCurrency: string, rate: number): number {
  if (fromCurrency === toCurrency) return price;
  if (fromCurrency === 'USD' && toCurrency === 'ARS') return price * rate;
  if (fromCurrency === 'ARS' && toCurrency === 'USD') return price / rate;
  return price;
}

function CoverageRow({ item }: { item: CoverageItem }) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-gray-700/50 last:border-0">
      <span className="text-sm mt-0.5">{statusIcons[item.status]}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-200 font-medium">{item.name}</p>
        {item.description && (
          <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
        )}
        {(item.limit || item.deductible) && (
          <div className="flex gap-3 mt-1">
            {item.limit && <span className="text-xs text-gray-400">Límite: {item.limit}</span>}
            {item.deductible && <span className="text-xs text-gray-400">Deducible: {item.deductible}</span>}
          </div>
        )}
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[item.status]}`}>
        {statusLabels[item.status]}
      </span>
    </div>
  );
}

export default function ProviderCard({ provider, exchangeRate, isBestPrice, onEdit, onRemove }: ProviderCardProps) {
  const priceUSD = convertPrice(provider.totalPrice, provider.currency, 'USD', exchangeRate);
  const priceARS = convertPrice(provider.totalPrice, provider.currency, 'ARS', exchangeRate);

  const coveredCount = provider.coverage.filter(c => c.status === 'covered').length;
  const totalItems = provider.coverage.length;
  const coveragePct = totalItems > 0 ? Math.round((coveredCount / totalItems) * 100) : 0;

  return (
    <div className={`
      bg-gray-800 rounded-xl border transition-all hover:shadow-lg hover:shadow-blue-500/5
      ${isBestPrice ? 'border-green-500/50 ring-1 ring-green-500/20' : 'border-gray-700'}
    `}>
      {/* Header */}
      <div className="p-5 border-b border-gray-700">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-100">{provider.vendor}</h3>
              {isBestPrice && (
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30">
                  ⭐ Mejor precio
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Archivo: {provider.sourceFileName} · {new Date(provider.extractedAt).toLocaleDateString('es-AR')}
            </p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(provider)}
              className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
              title="Editar"
            >
              ✏️
            </button>
            <button
              onClick={() => onRemove(provider.id)}
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
              title="Eliminar"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Price */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-gray-900/50 rounded-lg p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Precio Original</p>
            <p className="text-xl font-bold text-gray-100 mt-1">
              {provider.currency} {provider.totalPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              {provider.currency === 'USD' ? 'En ARS' : 'En USD'}
            </p>
            <p className="text-lg font-semibold text-gray-300 mt-1">
              {provider.currency === 'USD'
                ? `ARS ${priceARS.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`
                : `USD ${priceUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
              }
            </p>
            <p className="text-xs text-gray-600 mt-0.5">TC: {exchangeRate.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Coverage */}
      <div className="p-5 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-400">Coberturas</h4>
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${coveragePct}%` }} />
            </div>
            <span className="text-xs text-gray-500">{coveragePct}%</span>
          </div>
        </div>
        <div className="space-y-0">
          {provider.coverage.map(item => (
            <CoverageRow key={item.id} item={item} />
          ))}
          {provider.coverage.length === 0 && (
            <p className="text-sm text-gray-600 text-center py-4">Sin coberturas extraídas</p>
          )}
        </div>
      </div>

      {/* Commercial Conditions */}
      <div className="p-5">
        <h4 className="text-sm font-medium text-gray-400 mb-2">Condiciones Comerciales</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {provider.commercialConditions.paymentTerms && (
            <div><span className="text-gray-500">Pago:</span> <span className="text-gray-300">{provider.commercialConditions.paymentTerms}</span></div>
          )}
          {provider.commercialConditions.validity && (
            <div><span className="text-gray-500">Vigencia:</span> <span className="text-gray-300">{provider.commercialConditions.validity}</span></div>
          )}
          {provider.commercialConditions.installments && (
            <div><span className="text-gray-500">Cuotas:</span> <span className="text-gray-300">{provider.commercialConditions.installments}</span></div>
          )}
          {provider.commercialConditions.discounts && (
            <div><span className="text-gray-500">Descuentos:</span> <span className="text-gray-300">{provider.commercialConditions.discounts}</span></div>
          )}
        </div>
        {provider.qualityScore !== undefined && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-500">Calidad AI:</span>
            <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${provider.qualityScore >= 70 ? 'bg-green-500' : provider.qualityScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${provider.qualityScore}%` }}
              />
            </div>
            <span className="text-xs text-gray-400">{provider.qualityScore}/100</span>
          </div>
        )}
      </div>
    </div>
  );
}
