'use client';

import React, { useEffect, useState } from 'react';
import { AppConfig, AIProviderType } from '@/types';
import { DEFAULT_CONFIG, getConfig, saveConfig } from '@/utils/config';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfigChange: (config: AppConfig) => void;
}

const MODEL_OPTIONS: Record<AIProviderType, string[]> = {
  abacus: ['gpt-4.1-mini', 'gpt-4o', 'claude-3-5-sonnet'],
  groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
  gemini: ['gemini-2.0-flash', 'gemini-1.5-pro'],
};

export default function AIConfigModal({ isOpen, onClose, onConfigChange }: Props) {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    if (isOpen) setConfig(getConfig());
  }, [isOpen]);

  if (!isOpen) return null;

  const updateProvider = (provider: AIProviderType, patch: Partial<AppConfig['providers'][AIProviderType]>) => {
    setConfig((prev) => ({
      ...prev,
      providers: {
        ...prev.providers,
        [provider]: { ...prev.providers[provider], ...patch },
      },
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <h3>Configuración de proveedores IA</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body space-y-4">
          {(['abacus', 'groq', 'gemini'] as AIProviderType[]).map((provider) => (
            <div key={provider} className="card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-medium uppercase">{provider}</p>
                <label className="text-sm flex items-center gap-2">
                  <input type="checkbox" checked={config.providers[provider].enabled} onChange={(e) => updateProvider(provider, { enabled: e.target.checked })} />
                  habilitado
                </label>
              </div>

              <input
                className="input-field"
                type="password"
                placeholder={`API Key ${provider}`}
                value={config.providers[provider].apiKey}
                onChange={(e) => updateProvider(provider, { apiKey: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-2">
                <select className="input-field" value={config.providers[provider].model} onChange={(e) => updateProvider(provider, { model: e.target.value })}>
                  {MODEL_OPTIONS[provider].map((model) => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
                <input className="input-field" type="number" min={0} max={1} step={0.1} value={config.providers[provider].temperature} onChange={(e) => updateProvider(provider, { temperature: Number(e.target.value) || 0.1 })} />
              </div>
            </div>
          ))}

          <div className="card p-3 space-y-2">
            <p className="font-medium">Orden de fallback</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Formato: abacus,groq,gemini</p>
            <input
              className="input-field"
              value={config.fallbackOrder.join(',')}
              onChange={(e) => {
                const parsed = e.target.value
                  .split(',')
                  .map((v) => v.trim())
                  .filter((v): v is AIProviderType => ['abacus', 'groq', 'gemini'].includes(v));
                if (parsed.length) setConfig((prev) => ({ ...prev, fallbackOrder: parsed }));
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input className="input-field" type="number" value={config.rateLimitDelayMs} onChange={(e) => setConfig((prev) => ({ ...prev, rateLimitDelayMs: Number(e.target.value) || 0 }))} />
            <input className="input-field" value={config.exchangeBaseCurrency} onChange={(e) => setConfig((prev) => ({ ...prev, exchangeBaseCurrency: e.target.value.toUpperCase() }))} />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button
            className="btn btn-accent"
            onClick={() => {
              saveConfig(config);
              onConfigChange(config);
              onClose();
            }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
