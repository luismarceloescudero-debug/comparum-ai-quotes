// ============================================================
// COMPARUM - Marcelo Escudero — Shared Type Definitions
// ============================================================

export type AIProviderType = 'abacus' | 'groq' | 'gemini';
export type CoverageStatus = 'covered' | 'supplemented' | 'missing' | 'unknown';
export type SortCriteria = 'price-asc' | 'price-desc' | 'coverage' | 'quality' | 'date';
export type ThemeMode = 'dark' | 'light';

export interface CoverageItem {
  id: string;
  name: string;
  description?: string;
  status: CoverageStatus;
  limit?: string;
  deductible?: string;
  notes?: string;
}

export interface CommercialConditions {
  paymentTerms?: string;
  validity?: string;
  currency?: string;
  installments?: number;
  discounts?: string;
  surcharges?: string;
}

export interface Provider {
  id: string;
  vendor: string;
  totalPrice: number;
  currency: string;
  coverage: CoverageItem[];
  commercialConditions: CommercialConditions;
  qualityScore?: number;
  extractedAt: string;
  sourceFileName: string;
  sourceFileHash?: string;
  notes?: string;
  aiProvider?: AIProviderType;
}

export interface LearnedRule {
  id: string;
  field: string;
  expectedValue: string;
  correctedValue: string;
  vendor?: string;
  hitCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AIProviderConfig {
  provider: AIProviderType;
  apiKey: string;
  model: string;
  temperature: number;
  enabled: boolean;
  deploymentId?: string;
}

export interface AppConfig {
  activeProvider: AIProviderType;
  providers: Record<AIProviderType, AIProviderConfig>;
  fallbackOrder: AIProviderType[];
  exchangeBaseCurrency: string;
  rateLimitDelayMs: number;
  theme: ThemeMode;
}

export interface QueueItem {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'done' | 'error';
  progress: number;
  result?: Provider;
  error?: string;
}

export interface CacheEntry {
  fileHash: string;
  provider: Provider;
  extractedAt: string;
  aiProvider: AIProviderType;
}

export interface ExtractionLog {
  id: string;
  timestamp: string;
  provider: AIProviderType;
  model: string;
  fileName: string;
  durationMs: number;
  status: 'success' | 'error' | 'cached';
  tokensUsed?: number;
  error?: string;
  errorDetail?: string;
  responsePreview?: string;
}

export interface ExchangeRateResponse {
  success: boolean;
  base: string;
  rates: Record<string, number>;
  provider: 'exchangerate-api' | 'frankfurter' | 'cache';
  updatedAt: string;
}

export interface QuoteComparisonRow {
  coverageName: string;
  bestProviderId?: string;
  providers: Array<{
    providerId: string;
    status: CoverageStatus;
    notes?: string;
  }>;
}

export interface QuoteComparisonSummary {
  bestPriceProviderId?: string;
  normalizedCurrency: string;
  normalizedPrices: Record<string, number>;
  rows: QuoteComparisonRow[];
}

export interface ExtractQuoteResponse {
  success: boolean;
  provider?: Provider;
  logs?: Array<{ provider: AIProviderType; status: 'success' | 'error'; error?: string }>;
  error?: string;
}
