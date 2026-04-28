'use client';

import React, { useState, useEffect } from 'react';
import { AppConfig, AIProviderType, AIProviderConfig } from '@/types';
import { getConfig, saveConfig, DEFAULT_CONFIG } from '@/utils/config';

interface AIConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChange: (config: AppConfig) => void;
}

const PROVIDER_INFO: Record<AIProviderType, { name: string; icon: string; desc: string; models: string[] }> = {
  gemini: {
    name: 'Google Gemini',
    icon: '💎',
    desc: 'Gratuito · Visión (imágenes/PDF) · Streaming',
    models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  },
  groq: {
    name: 'Groq',
    icon: '⚡',
    desc: 'Gratuito · Solo texto · Ultra rápido',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
  },
  abacus: {
    name: 'Abacus AI',
    icon: '🧮',
    desc: 'Pago · Múltiples modelos · Alta calidad',
    models: ['gpt-4o', 'claude-sonnet', 'gemini-pro'],
  },
};

export default function AIConfigModal({ isOpen, onClose, onConfigChange }: AIConfigModalProps) {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    setConfig(getConfig());
  }, [isOpen]);

  if (!isOpen) return null;

  const updateProvider = (key: AIProviderType, patch: Partial<AIProviderConfig>) => {
    setConfig(prev => ({
      ...prev,
      providers: {
        ...prev.providers,
        [key]: { ...prev.providers[key], ...patch },
      },
    }));
  };

  const handleSave = () => {
    saveConfig(config);
    onConfigChange(config);
    onClose();
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-100">⚙️ Configuración AI</h2>
            <p className="text-sm text-gray-500">Proveedores de IA, claves API y parámetros</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-700 text-gray-400">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Active provider selector */}
          <div>
            <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wide">Proveedor activo</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(PROVIDER_INFO) as AIProviderType[]).map(key => (
                <button
                  key={key}
                  onClick={() => setConfig(prev => ({ ...prev, activeProvider: key }))}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    config.activeProvider === key
                      ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30'
                      : 'border-gray-700 hover:border-gray-600 bg-gray-900/50'
                  }`}
                >
                  <span className="text-2xl">{PROVIDER_INFO[key].icon}</span>
                  <p className="text-xs text-gray-300 font-medium mt-1">{PROVIDER_INFO[key].name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Provider configurations */}
          {(Object.keys(PROVIDER_INFO) as AIProviderType[]).map(key => (
            <div key={key} className="bg-gray-900 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{PROVIDER_INFO[key].icon}</span>
                  <div>
                    <h3 className="text-sm font-medium text-gray-200">{PROVIDER_INFO[key].name}</h3>
                    <p className="text-xs text-gray-500">{PROVIDER_INFO[key].desc}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={config.providers[key].enabled}
                    onChange={e => updateProvider(key, { enabled: e.target.checked })}
                  />
                  <div className="w-9 h-5 bg-gray-700 peer-checked:bg-blue-600 rounded-full peer-focus:ring-2 peer-focus:ring-blue-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">API Key</label>
                <input
                  type="password"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:ring-2 focus:ring-blue-500 font-mono"
                  value={config.providers[key].apiKey}
                  onChange={e => updateProvider(key, { apiKey: e.target.value })}
                  placeholder={`Ingrese su ${PROVIDER_INFO[key].name} API key…`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Modelo</label>
                  <select
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-sm text-gray-200"
                    value={config.providers[key].model}
                    onChange={e => updateProvider(key, { model: e.target.value })}
                  >
                    {PROVIDER_INFO[key].models.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Temperatura</label>
                  <input
                    type="number"
                    min={0} max={2} step={0.1}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
                    value={config.providers[key].temperature ?? 0.2}
                    onChange={e => updateProvider(key, { temperature: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Global settings */}
          <div className="bg-gray-900 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-medium text-gray-200">🌐 Configuración General</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tipo de cambio (ARS/USD)</label>
                <input
                  type="number"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
                  value={config.exchangeRate}
                  onChange={e => setConfig(prev => ({ ...prev, exchangeRate: parseFloat(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Delay entre archivos (ms)</label>
                <input
                  type="number"
                  min={0} step={500}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
                  value={config.rateLimitDelayMs}
                  onChange={e => setConfig(prev => ({ ...prev, rateLimitDelayMs: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Idioma</label>
              <select
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-sm text-gray-200"
                value={config.language}
                onChange={e => setConfig(prev => ({ ...prev, language: e.target.value as 'es' | 'en' }))}
              >
                <option value="es">🇦🇷 Español</option>
                <option value="en">🇺🇸 English</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-700 flex justify-between">
          <button onClick={handleReset} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors">
            🔄 Restablecer
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors">
              Cancelar
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors">
              💾 Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
