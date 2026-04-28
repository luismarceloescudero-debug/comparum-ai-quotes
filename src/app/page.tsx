'use client';

import React, { useState, useEffect } from 'react';
import { Provider, SortCriteria, AppConfig } from '@/types';
import UploadSection from '@/components/UploadSection';
import ProviderCard from '@/components/ProviderCard';
import ProviderEditModal from '@/components/ProviderEditModal';
import AIConfigModal from '@/components/AIConfigModal';
import AILogModal from '@/components/AILogModal';
import { sortProviders, findBestPrice, computeStats } from '@/utils/sortProviders';
import { getConfig } from '@/utils/config';
import { getLearnings, clearLearnings, exportLearningsJSON, importLearnings } from '@/services/learnings';
import { getCacheSize, clearCache } from '@/utils/cache';

export default function HomePage() {
  // ── State ─────────────────────────────────────────────────
  const [providers, setProviders] = useState<Provider[]>([]);
  const [materials, setMaterials] = useState('');
  const [sortBy, setSortBy] = useState<SortCriteria>('price-asc');
  const [config, setConfig] = useState<AppConfig>(getConfig());
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showLearnings, setShowLearnings] = useState(false);

  // Hydrate config on mount
  useEffect(() => { setConfig(getConfig()); }, []);

  // ── Handlers ──────────────────────────────────────────────
  const handleProviderExtracted = (p: Provider) => {
    setProviders(prev => [...prev, p]);
  };

  const handleProviderUpdate = (updated: Provider) => {
    setProviders(prev => prev.map(p => (p.id === updated.id ? updated : p)));
  };

  const handleProviderRemove = (id: string) => {
    if (confirm('¿Eliminar este proveedor?')) {
      setProviders(prev => prev.filter(p => p.id !== id));
    }
  };

  // ── Derived data ──────────────────────────────────────────
  const sorted = sortProviders(providers, sortBy, config.exchangeRate);
  const bestPriceId = findBestPrice(providers, config.exchangeRate);
  const stats = computeStats(providers, config.exchangeRate);
  const learningsCount = getLearnings().length;
  const cacheSize = getCacheSize();

  // ── Learnings panel ───────────────────────────────────────
  const handleExportLearnings = () => {
    const blob = new Blob([exportLearningsJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `learnings-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportLearnings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        importLearnings(text);
        alert('Reglas importadas correctamente.');
      } catch (err: any) {
        alert(`Error: ${err.message}`);
      }
    };
    input.click();
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <h1 className="text-xl font-bold text-gray-100">AI Quote Extractor</h1>
              <p className="text-xs text-gray-500">Comparador inteligente de cotizaciones</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLearnings(!showLearnings)}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors flex items-center gap-1.5"
            >
              🧠 <span className="hidden sm:inline">Reglas</span>
              {learningsCount > 0 && (
                <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">{learningsCount}</span>
              )}
            </button>
            <button
              onClick={() => setShowLogs(true)}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors flex items-center gap-1.5"
            >
              📊 <span className="hidden sm:inline">Logs</span>
            </button>
            <button
              onClick={() => setShowConfig(true)}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors flex items-center gap-1.5"
            >
              ⚙️ <span className="hidden sm:inline">Config</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Upload Section */}
        <div className="mb-10">
          <UploadSection
            materials={materials}
            onMaterialsChange={setMaterials}
            onProviderExtracted={handleProviderExtracted}
          />
        </div>

        {/* Stats bar */}
        {providers.length > 0 && (
          <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Proveedores</p>
              <p className="text-2xl font-bold text-gray-100 mt-1">{stats.count}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Precio promedio</p>
              <p className="text-2xl font-bold text-gray-100 mt-1">
                USD {stats.avgPriceUSD.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Cobertura promedio</p>
              <p className="text-2xl font-bold text-gray-100 mt-1">{stats.avgCoverage.toFixed(0)}%</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Rango precio</p>
              <p className="text-lg font-bold text-gray-100 mt-1">
                ${stats.minPriceUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })} – ${stats.maxPriceUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        )}

        {/* Sort controls */}
        {providers.length > 1 && (
          <div className="mb-6 flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-500">Ordenar por:</span>
            {([
              { value: 'price-asc' as SortCriteria, label: '💲 Precio ↑' },
              { value: 'price-desc' as SortCriteria, label: '💲 Precio ↓' },
              { value: 'coverage' as SortCriteria, label: '🛡️ Cobertura' },
              { value: 'quality' as SortCriteria, label: '⭐ Calidad' },
              { value: 'date' as SortCriteria, label: '📅 Fecha' },
            ]).map(opt => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Provider Cards Grid */}
        {providers.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sorted.map(p => (
              <ProviderCard
                key={p.id}
                provider={p}
                exchangeRate={config.exchangeRate}
                isBestPrice={p.id === bestPriceId}
                onEdit={setEditingProvider}
                onRemove={handleProviderRemove}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <span className="text-6xl">📋</span>
            <p className="text-gray-500 mt-4 text-lg">
              Cargue cotizaciones para comenzar la comparación
            </p>
            <p className="text-gray-600 mt-2 text-sm">
              Suba archivos PDF, imágenes, XLSX o DOCX de sus proveedores
            </p>
          </div>
        )}

        {/* Learnings sidebar */}
        {showLearnings && (
          <div className="fixed right-0 top-0 h-full w-80 bg-gray-900 border-l border-gray-700 z-50 overflow-y-auto p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-100">🧠 Reglas Aprendidas</h3>
              <button onClick={() => setShowLearnings(false)} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400">✕</button>
            </div>
            <div className="space-y-2 mb-4">
              {getLearnings().map(rule => (
                <div key={rule.id} className="bg-gray-800 rounded-lg p-3 text-sm">
                  <p className="text-gray-300 font-mono text-xs">{rule.field}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    &quot;{rule.expectedValue}&quot; → &quot;{rule.correctedValue}&quot;
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-600">{rule.vendor || 'Global'}</span>
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">{rule.hitCount}x</span>
                  </div>
                </div>
              ))}
              {getLearnings().length === 0 && (
                <p className="text-gray-600 text-sm text-center py-4">Sin reglas aprendidas aún</p>
              )}
            </div>
            <div className="space-y-2 border-t border-gray-700 pt-4">
              <button onClick={handleExportLearnings} className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors">
                📥 Exportar reglas
              </button>
              <button onClick={handleImportLearnings} className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors">
                📤 Importar reglas
              </button>
              <button
                onClick={() => { if (confirm('¿Eliminar todas las reglas?')) { clearLearnings(); } }}
                className="w-full px-3 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm text-red-400 transition-colors"
              >
                🗑️ Limpiar reglas
              </button>
              {cacheSize > 0 && (
                <button
                  onClick={() => { clearCache(); alert('Caché limpiado.'); }}
                  className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
                >
                  💾 Limpiar caché ({cacheSize} entradas)
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-6 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs text-gray-600">
          <p>AI Quote Extractor — Datos almacenados localmente en su navegador</p>
          <p className="mt-1">
            💡 Futuro: migración a Supabase/Firebase para multi-usuario y persistencia en la nube
          </p>
        </div>
      </footer>

      {/* Modals */}
      {editingProvider && (
        <ProviderEditModal
          provider={editingProvider}
          isOpen={!!editingProvider}
          onClose={() => setEditingProvider(null)}
          onSave={handleProviderUpdate}
        />
      )}
      <AIConfigModal isOpen={showConfig} onClose={() => setShowConfig(false)} onConfigChange={setConfig} />
      <AILogModal isOpen={showLogs} onClose={() => setShowLogs(false)} />
    </div>
  );
}
