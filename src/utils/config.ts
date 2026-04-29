import { AppConfig } from '@/types';

const STORAGE_KEY = 'comparum_config';

export const DEFAULT_CONFIG: AppConfig = {
  activeProvider: 'abacus',
  providers: {
    abacus: {
      provider: 'abacus',
      apiKey: '',
      model: 'gpt-4.1-mini',
      temperature: 0.1,
      enabled: true,
      deploymentId: '',
    },
    groq: {
      provider: 'groq',
      apiKey: '',
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      enabled: true,
    },
    gemini: {
      provider: 'gemini',
      apiKey: '',
      model: 'gemini-2.0-flash',
      temperature: 0.1,
      enabled: true,
    },
  },
  fallbackOrder: ['abacus', 'groq', 'gemini'],
  exchangeBaseCurrency: 'USD',
  rateLimitDelayMs: 2200,
  theme: 'dark',
};

export function getConfig(): AppConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);

    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      providers: {
        abacus: { ...DEFAULT_CONFIG.providers.abacus, ...parsed.providers?.abacus },
        groq: { ...DEFAULT_CONFIG.providers.groq, ...parsed.providers?.groq },
        gemini: { ...DEFAULT_CONFIG.providers.gemini, ...parsed.providers?.gemini },
      },
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: AppConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function resetConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}
