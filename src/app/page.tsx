'use client';

import { useEffect, useMemo, useState } from 'react';
import UploadSection from '@/components/UploadSection';
import ProviderCard from '@/components/ProviderCard';
import ProviderEditModal from '@/components/ProviderEditModal';
import AIConfigModal from '@/components/AIConfigModal';
import AILogModal from '@/components/AILogModal';
import ComparisonTable from '@/components/ComparisonTable';
import Header from '@/components/Header';
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
    document.documentElement.classList.toggle('dark', config.theme === 'dark');
    document.documentElement.setAttribute('data-theme', config.theme);
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

  const exchangeRate = rates.ARS || 1200;

  useEffect(() => {
    if (!providers.length) {
      setComparison(undefined);
      return;
    }

    setComparison({
      bestPriceProviderId: providers
        .map((p) => ({ id: p.id, amount: convert(p.totalPrice, p.currency, viewCurrency, rates, config.exchangeBaseCurrency) }))
        .sort((a, b) => a.amount - b.amount)[0]?.id,
      normalizedCurrency: viewCurrency,
      normalizedPrices: Object.fromEntries(
        providers.map((p) => [p.id, convert(p.totalPrice, p.currency, viewCurrency, rates, config.exchangeBaseCurrency)]),
      ),
      rows: buildRows(providers),
    });
  }, [providers, rates, viewCurrency, config.exchangeBaseCurrency]);

  const bestPriceId = comparison?.bestPriceProviderId;

  const sortedProviders = useMemo(() => {
    return [...providers].sort((a, b) => {
      const pa = convert(a.totalPrice, a.currency, viewCurrency, rates, config.exchangeBaseCurrency);
      const pb = convert(b.totalPrice, b.currency, viewCurrency, rates, config.exchangeBaseCurrency);
      return pa - pb;
    });
  }, [providers, rates, viewCurrency, config.exchangeBaseCurrency]);

  const handleThemeToggle = () => {
    const next: AppConfig = { ...config, theme: config.theme === 'dark' ? 'light' : 'dark' };
    setConfig(next);
    saveConfig(next);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <Header
        exchangeRate={exchangeRate}
        onExchangeRateChange={(rate) => setRates((prev) => ({ ...prev, ARS: rate }))}
        theme={config.theme}
        onToggleTheme={handleThemeToggle}
        onOpenAIConfig={() => setShowConfig(true)}
        onOpenAILog={() => setShowLogs(true)}
      />

      <main className="main-container">
        <UploadSection
          materials={materials}
          onMaterialsChange={setMaterials}
          onProviderExtracted={(provider) => setProviders((prev) => [provider, ...prev])}
        />

        <section className="sort-toolbar no-print">
          <div className="sort-group">
            <button className="sort-btn" onClick={() => refreshRates()}>Actualizar tasas</button>
            <select className="sort-btn" value={viewCurrency} onChange={(e) => setViewCurrency(e.target.value)}>
              {Object.keys(rates).slice(0, 20).map((currency) => <option key={currency} value={currency}>{currency}</option>)}
            </select>
          </div>
          <div className="toolbar-right">
            <span className="text-xs text-[var(--text-muted)]">{ratesInfo}</span>
          </div>
        </section>

        <ComparisonTable providers={sortedProviders} comparison={comparison} currency={viewCurrency} />

        {sortedProviders.length > 0 ? (
          <section className="providers-grid">
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
          <section className="modal-box" style={{ maxWidth: '100%' }}>
            <div className="modal-body" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              Sube cotizaciones para iniciar comparación de proveedores.
            </div>
          </section>
        )}

        <section className="ai-config-section no-print">
          <h4 className="ai-config-h">Sistema de aprendizaje</h4>
          <p className="ai-config-help">Reglas aprendidas: {getLearnings().length}</p>
          <div className="ai-config-actions">
            <button className="btn btn-ghost" onClick={() => {
              const blob = new Blob([exportLearningsJSON()], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `comparum-learnings-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}>Exportar reglas</button>
            <button className="btn btn-ghost" onClick={() => {
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
            <button className="btn btn-ghost" onClick={() => clearLearnings()}>Limpiar reglas</button>
          </div>
        </section>

        <footer className="print-footer-bar" style={{ display: 'block' }}>
          COMPARUM - Marcelo Escudero · Multi-provider IA (Abacus + Groq + Gemini)
        </footer>
      </main>

      {editing && (
        <ProviderEditModal
          provider={editing}
          isOpen={!!editing}
          onClose={() => setEditing(null)}
          onSave={(updated) => setProviders((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))}
        />
      )}

      <AIConfigModal isOpen={showConfig} onClose={() => setShowConfig(false)} onConfigChange={setConfig} />
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
