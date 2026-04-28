import { AppConfig } from '@/types';

const STORAGE_KEY = 'aqe_config';

export const DEFAULT_CONFIG: AppConfig = {
  activeProvider: 'gemini',
  providers: {
    gemini: {
      provider: 'gemini',
      apiKey: '',
      model: 'gemini-2.0-flash',
      temperature: 0.2,
      maxTokens: 8192,
      enabled: true,
    },
    groq: {
      provider: 'groq',
      apiKey: '',
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      maxTokens: 8192,
      enabled: true,
    },
    abacus: {
      provider: 'abacus',
      apiKey: '',
      model: 'gpt-4o',
      temperature: 0.2,
      maxTokens: 8192,
      enabled: false,
    },
  },
  exchangeRate: 1200,
  rateLimitDelayMs: 4000,
  language: 'es',
};

/** Get current config from localStorage (with defaults) */
export function getConfig(): AppConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const saved = JSON.parse(raw);
    // Merge with defaults to handle new fields
    return {
      ...DEFAULT_CONFIG,
      ...saved,
      providers: {
        gemini: { ...DEFAULT_CONFIG.providers.gemini, ...saved.providers?.gemini },
        groq: { ...DEFAULT_CONFIG.providers.groq, ...saved.providers?.groq },
        abacus: { ...DEFAULT_CONFIG.providers.abacus, ...saved.providers?.abacus },
      },
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

/** Save config to localStorage */
export function saveConfig(config: AppConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/** Reset config to defaults */
export function resetConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}
