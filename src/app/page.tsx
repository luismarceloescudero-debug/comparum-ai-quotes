'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import UploadSection from '@/components/UploadSection';
import SortToolbar from '@/components/SortToolbar';
import ProviderCard from '@/components/ProviderCard';
import ProviderEditModal from '@/components/ProviderEditModal';
import AIConfigModal from '@/components/AIConfigModal';
import AILogModal from '@/components/AILogModal';
import Header from '@/components/Header';
import { AppConfig, Provider, SortCriteria } from '@/types';
import { getConfig, saveConfig } from '@/utils/config';
import { fetchRates, convert } from '@/services/currency';

export default function HomePage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [materials, setMaterials] = useState('');
  const [editing, setEditing] = useState<Provider | null>(null);
  const [config, setConfig] = useState<AppConfig>(getConfig());
  const [showConfig, setShowConfig] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [sortKey, setSortKey] = useState<SortCriteria>('price-asc');
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1, ARS: 1200 });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', config.theme);
    document.documentElement.classList.toggle('dark', config.theme === 'dark');
  }, [config.theme]);

  useEffect(() => {
    const loadRates = async () => {
      try {
        const response = await fetchRates(config.exchangeBaseCurrency);
        setRates(response.rates);
      } catch {
        // noop: conservamos tasas existentes
      }
    };

    loadRates();
  }, [config.exchangeBaseCurrency]);

  const exchangeRate = rates.ARS || 1200;

  const sortedProviders = useMemo(() => {
    const toARS = (provider: Provider) =>
      convert(provider.totalPrice, provider.currency, 'ARS', rates, config.exchangeBaseCurrency);

    const byCoverage = (provider: Provider) => {
      const covered = provider.coverage.filter((item) => item.status === 'covered' || item.status === 'supplemented').length;
      return provider.coverage.length ? covered / provider.coverage.length : 0;
    };

    const sorted = [...providers];

    switch (sortKey) {
      case 'price-asc':
        return sorted.sort((a, b) => toARS(a) - toARS(b));
      case 'price-desc':
        return sorted.sort((a, b) => toARS(b) - toARS(a));
      case 'coverage':
        return sorted.sort((a, b) => byCoverage(b) - byCoverage(a));
      case 'quality':
        return sorted.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
      case 'date':
      default:
        return sorted;
    }
  }, [providers, sortKey, rates, config.exchangeBaseCurrency]);

  const bestPriceId = useMemo(() => {
    return [...providers]
      .map((provider) => ({
        id: provider.id,
        price: convert(provider.totalPrice, provider.currency, 'ARS', rates, config.exchangeBaseCurrency),
      }))
      .sort((a, b) => a.price - b.price)[0]?.id;
  }, [providers, rates, config.exchangeBaseCurrency]);

  const handleThemeToggle = () => {
    const next: AppConfig = { ...config, theme: config.theme === 'dark' ? 'light' : 'dark' };
    setConfig(next);
    saveConfig(next);
  };

  const parseMaterialsFile = useCallback(async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (!ext) throw new Error('No se pudo detectar el tipo de archivo');

    if (['txt', 'csv', 'md', 'json'].includes(ext)) {
      return await file.text();
    }

    if (ext === 'xlsx' || ext === 'xls') {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const lines: string[] = [];

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet, { FS: ';' });
        if (csv.trim()) {
          lines.push(`# Hoja: ${sheetName}`);
          lines.push(csv.trim());
        }
      }

      return lines.join('\n');
    }

    throw new Error('Formato no soportado para materiales. Usá TXT, CSV o XLSX.');
  }, []);

  const handleLoadMaterials = useCallback(
    async (file: File) => {
      try {
        if (file.size > 20 * 1024 * 1024) {
          throw new Error('El archivo supera el máximo permitido (20MB)');
        }

        const parsedText = await parseMaterialsFile(file);
        const normalized = parsedText.trim();
        if (!normalized) {
          throw new Error('El archivo no contiene materiales legibles');
        }

        setMaterials((prev) => (prev.trim() ? `${prev.trim()}\n\n${normalized}` : normalized));
      } catch (err) {
        window.alert(err instanceof Error ? err.message : 'No se pudo cargar el listado de materiales.');
      }
    },
    [parseMaterialsFile],
  );

  const handleResetAll = () => {
    if (!window.confirm('¿Resetear tarjetas y contexto del pedido?')) return;
    setProviders([]);
    setMaterials('');
  };

  const today = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

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

      <div className="print-header-bar">
        <h1>⚖ COMPARUM — Comparativa de Proveedores</h1>
        <p>
          Cliente: <strong>Marcelo Escudero</strong> &nbsp;|&nbsp; {providers.length} proveedores &nbsp;|&nbsp; Generado: {today}
        </p>
      </div>

      <main className="main-container">
        <UploadSection materials={materials} onProviderExtracted={(provider) => setProviders((prev) => [provider, ...prev])} />

        <SortToolbar
          sortKey={sortKey}
          onSortChange={setSortKey}
          onPrintAll={() => window.print()}
          onClearProviders={() => setProviders([])}
          onResetAll={handleResetAll}
          onLoadMaterials={handleLoadMaterials}
        />

        {sortedProviders.length > 0 ? (
          <section className="providers-grid">
            {sortedProviders.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                exchangeRate={exchangeRate}
                isBestPrice={provider.id === bestPriceId}
                onEdit={setEditing}
                onRemove={(id) => setProviders((prev) => prev.filter((item) => item.id !== id))}
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
      </main>

      <footer className="print-footer-bar">
        COMPARUM — Generado: {today} | Tipo de cambio: 1 USD = {new Intl.NumberFormat('es-AR').format(exchangeRate)} ARS
      </footer>

      {editing && (
        <ProviderEditModal
          provider={editing}
          isOpen={!!editing}
          onClose={() => setEditing(null)}
          onSave={(updated) => setProviders((prev) => prev.map((provider) => (provider.id === updated.id ? updated : provider)))}
        />
      )}

      <AIConfigModal isOpen={showConfig} onClose={() => setShowConfig(false)} onConfigChange={setConfig} />
      <AILogModal isOpen={showLogs} onClose={() => setShowLogs(false)} />
    </div>
  );
}
