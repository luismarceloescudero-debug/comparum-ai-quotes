'use client';

import React, { useEffect, useState } from 'react';
import { AppConfig, AIProviderType } from '@/types';
import { DEFAULT_CONFIG, getConfig, saveConfig } from '@/utils/config';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfigChange: (config: AppConfig) => void;
}

const MODEL_OPTIONS: Record<AIProviderType, string[]> = {
  abacus: ['gpt-4.1-mini', 'gpt-4o', 'claude-3-5-sonnet', 'route-llm'],
  groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
  gemini: ['gemini-2.0-flash', 'gemini-1.5-pro'],
};

export default function AIConfigModal({ isOpen, onClose, onConfigChange }: Props) {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    if (isOpen) setConfig(getConfig());
  }, [isOpen]);

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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-[var(--border)] bg-[var(--surface)] text-[var(--text)]">
        <DialogHeader>
          <DialogTitle>Configuración de IA</DialogTitle>
          <DialogDescription>
            Mantenemos backend multi-provider actual (Abacus + Groq + Gemini) con UI estilo Replit.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {(['abacus', 'groq', 'gemini'] as AIProviderType[]).map((provider) => (
            <div key={provider} className="ai-config-section">
              <h4 className="ai-config-h">{provider.toUpperCase()}</h4>
              <div className="grid md:grid-cols-[120px_1fr] gap-3 items-center mb-2">
                <span className="ai-config-label">Habilitado</span>
                <Switch checked={config.providers[provider].enabled} onCheckedChange={(checked) => updateProvider(provider, { enabled: checked })} />
              </div>
              <div className="grid md:grid-cols-[120px_1fr] gap-3 items-center mb-2">
                <span className="ai-config-label">API Key</span>
                <Input
                  type="password"
                  value={config.providers[provider].apiKey}
                  onChange={(e) => updateProvider(provider, { apiKey: e.target.value })}
                  placeholder={`API key de ${provider}`}
                />
              </div>
              {provider === 'abacus' && (
                <div className="grid md:grid-cols-[120px_1fr] gap-3 items-center mb-2">
                  <span className="ai-config-label">Deployment ID</span>
                  <Input
                    value={config.providers.abacus.deploymentId || ''}
                    onChange={(e) => updateProvider('abacus', { deploymentId: e.target.value })}
                    placeholder="Opcional: deploymentId de Abacus"
                  />
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-3">
                <Select
                  value={config.providers[provider].model}
                  onValueChange={(value) => updateProvider(provider, { model: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODEL_OPTIONS[provider].map((model) => (
                      <SelectItem key={model} value={model}>{model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={0}
                  max={1}
                  step={0.1}
                  value={config.providers[provider].temperature}
                  onChange={(e) => updateProvider(provider, { temperature: Number(e.target.value) || 0 })}
                  placeholder="Temperature"
                />
              </div>
            </div>
          ))}

          <div className="ai-config-section">
            <h4 className="ai-config-h">Parámetros globales</h4>
            <div className="grid md:grid-cols-2 gap-3">
              <Input
                value={config.fallbackOrder.join(',')}
                onChange={(e) => {
                  const parsed = e.target.value
                    .split(',')
                    .map((v) => v.trim())
                    .filter((v): v is AIProviderType => ['abacus', 'groq', 'gemini'].includes(v));
                  if (parsed.length) setConfig((prev) => ({ ...prev, fallbackOrder: parsed }));
                }}
                placeholder="abacus,groq,gemini"
              />
              <Input
                type="number"
                value={config.rateLimitDelayMs}
                onChange={(e) => setConfig((prev) => ({ ...prev, rateLimitDelayMs: Number(e.target.value) || 0 }))}
                placeholder="Delay entre requests"
              />
              <Input
                value={config.exchangeBaseCurrency}
                onChange={(e) => setConfig((prev) => ({ ...prev, exchangeBaseCurrency: e.target.value.toUpperCase() }))}
                placeholder="Moneda base"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() => {
              saveConfig(config);
              onConfigChange(config);
              onClose();
            }}
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
