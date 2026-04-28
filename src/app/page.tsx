'use client';

import { useEffect, useMemo, useState } from 'react';
import UploadSection from '@/components/UploadSection';
import ProviderCard from '@/components/ProviderCard';
import ProviderEditModal from '@/components/ProviderEditModal';
import AIConfigModal from '@/components/AIConfigModal';
import AILogModal from '@/components/AILogModal';
import ComparisonTable from '@/components/ComparisonTable';
import ThemeToggle from '@/components/ThemeToggle';
import { AppConfig, Provider, QuoteComparisonSummary } from '@/types';
import { getConfig, saveConfig } from '@/utils/config';
import { clearLearnings, exportLearningsJSON, getLearnings, importLearnings, syncLearningsFromServer } from '@/services/learnings';
import { fetchRates, convert } from '@/services/currency';

export default function HomePage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [materials, setMaterials] = useState('');
  const [editing, setEditing] = useState<Provider | null>(null);
  const [config, setConfig] = useState<AppConfig>(getConfig());
  const [showConfig, setShowConfig] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [comparison, setComparison] = useState<QuoteComparisonSummary>();
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 });
  const [ratesInfo, setRatesInfo] = useState('');
  const [viewCurrency, setViewCurrency] = useState('USD');

  useEffect(() => {
    syncLearningsFromServer().catch(() => undefined);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', config.theme === 'dark');
  }, [config.theme]);

  const refreshRates = async (base = config.exchangeBaseCurrency) => {
    try {
      const res = await fetchRates(base);
      setRates(res.rates);
      setRatesInfo(`${res.provider} · actualizado ${new Date(res.updatedAt).toLocaleTimeString('es-AR')}`);
    } catch {
      setRatesInfo('No se pudieron actualizar tasas');
    }
  };

  useEffect(() => {
    refreshRates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.exchangeBaseCurrency]);

  const exchangeRate = rates['ARS'] || 1200;

  useEffect(() => {
    if (!providers.length) {
      setComparison(undefined);
      return;
    }

    const payload = {
      bestPriceProviderId: providers
        .map((p) => ({ id: p.id, amount: convert(p.totalPrice, p.currency, viewCurrency, rates, config.exchangeBaseCurrency) }))
        .sort((a, b) => a.amount - b.amount)[0]?.id,
      normalizedCurrency: viewCurrency,
      normalizedPrices: Object.fromEntries(
        providers.map((p) => [p.id, convert(p.totalPrice, p.currency, viewCurrency, rates, config.exchangeBaseCurrency)]),
      ),
      rows: buildRows(providers),
    } as QuoteComparisonSummary;

    setComparison(payload);
  }, [providers, rates, viewCurrency, config.exchangeBaseCurrency]);

  const bestPriceId = comparison?.bestPriceProviderId;

  const sortedProviders = useMemo(() => {
    return [...providers].sort((a, b) => {
      const pa = convert(a.totalPrice, a.currency, viewCurrency, rates, config.exchangeBaseCurrency);
      const pb = convert(b.totalPrice, b.currency, viewCurrency, rates, config.exchangeBaseCurrency);
      return pa - pb;
    });
  }, [providers, rates, viewCurrency, config.exchangeBaseCurrency]);

  const handleThemeChange = (theme: 'dark' | 'light') => {
    const next = { ...config, theme };
    setConfig(next);
    saveConfig(next);
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold">Comparum v2</h1>
            <p className="text-xs text-[var(--muted)]">Extracción + comparación inteligente de cotizaciones</p>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle theme={config.theme} onChange={handleThemeChange} />
            <button className="btn-secondary" onClick={() => setShowLogs(true)}>📊 Logs</button>
            <button className="btn-secondary" onClick={() => setShowConfig(true)}>⚙️ IA</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <UploadSection
          materials={materials}
          onMaterialsChange={setMaterials}
          onProviderExtracted={(provider) => setProviders((prev) => [provider, ...prev])}
        />

        <section className="card p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-[var(--muted)]">Moneda de visualización:</label>
              <select className="input-field max-w-[120px]" value={viewCurrency} onChange={(e) => setViewCurrency(e.target.value)}>
                {Object.keys(rates).slice(0, 10).map((currency) => <option key={currency} value={currency}>{currency}</option>)}
              </select>
              <button className="btn-secondary" onClick={() => refreshRates()}>Actualizar tasas</button>
            </div>
            <span className="text-xs text-[var(--muted)]">{ratesInfo}</span>
          </div>
        </section>

        <ComparisonTable providers={sortedProviders} comparison={comparison} currency={viewCurrency} />

        {sortedProviders.length > 0 ? (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {sortedProviders.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                exchangeRate={exchangeRate}
                isBestPrice={provider.id === bestPriceId}
                onEdit={setEditing}
                onRemove={(id) => setProviders((prev) => prev.filter((p) => p.id !== id))}
              />
            ))}
          </section>
        ) : (
          <section className="card p-10 text-center text-[var(--muted)]">
            Sube cotizaciones para iniciar comparación de proveedores.
          </section>
        )}

        <section className="card p-4">
          <h3 className="font-semibold mb-2">Sistema de aprendizaje</h3>
          <p className="text-sm text-[var(--muted)] mb-3">Reglas aprendidas: {getLearnings().length}</p>
          <div className="flex gap-2 flex-wrap">
            <button className="btn-secondary" onClick={() => {
              const blob = new Blob([exportLearningsJSON()], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `comparum-learnings-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}>Exportar reglas</button>
            <button className="btn-secondary" onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json';
              input.onchange = async (event) => {
                const file = (event.target as HTMLInputElement).files?.[0];
                if (!file) return;
                importLearnings(await file.text());
                await syncLearningsFromServer();
              };
              input.click();
            }}>Importar reglas</button>
            <button className="btn-danger" onClick={() => clearLearnings()}>Limpiar reglas</button>
          </div>
        </section>
      </main>

      {editing && (
        <ProviderEditModal
          provider={editing}
          isOpen={!!editing}
          onClose={() => setEditing(null)}
          onSave={(updated) => setProviders((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))}
        />
      )}

      <AIConfigModal
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
        onConfigChange={setConfig}
      />

      <AILogModal isOpen={showLogs} onClose={() => setShowLogs(false)} />
    </div>
  );
}

function buildRows(providers: Provider[]) {
  const coverageNames = new Set<string>();
  providers.forEach((p) => p.coverage.forEach((c) => coverageNames.add(c.name)));

  return Array.from(coverageNames).map((coverageName) => {
    const cells = providers.map((provider) => {
      const item = provider.coverage.find((c) => c.name === coverageName);
      return {
        providerId: provider.id,
        status: item?.status || 'unknown',
      };
    });

    const bestProviderId = cells.find((c) => c.status === 'covered')?.providerId;
    return { coverageName, providers: cells, bestProviderId };
  });
}
