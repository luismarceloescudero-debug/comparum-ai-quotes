// ============================================================
// AI Quote Extractor — Shared Type Definitions
// ============================================================

/** Supported AI provider identifiers */
export type AIProviderType = 'gemini' | 'groq' | 'abacus';

/** Coverage status for a single item in a quote */
export type CoverageStatus = 'covered' | 'supplemented' | 'missing' | 'unknown';

/** Sorting criteria for provider cards */
export type SortCriteria = 'price-asc' | 'price-desc' | 'coverage' | 'quality' | 'date';

/** Supported file types for upload */
export type SupportedFileType = 'application/pdf' | 'image/png' | 'image/jpeg' | 'image/webp'
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

// ── Provider & Quote ────────────────────────────────────────

export interface CoverageItem {
  id: string;
  name: string;
  description: string;
  status: CoverageStatus;
  limit?: string;
  deductible?: string;
  notes?: string;
}

export interface CommercialConditions {
  paymentTerms?: string;
  validity?: string;
  currency: 'ARS' | 'USD' | string;
  installments?: number;
  discounts?: string;
  surcharges?: string;
}

export interface Provider {
  id: string;
  vendor: string;
  totalPrice: number;
  currency: 'ARS' | 'USD' | string;
  coverage: CoverageItem[];
  commercialConditions: CommercialConditions;
  qualityScore?: number;       // 0–100 AI-assessed quality
  extractedAt: string;         // ISO timestamp
  sourceFileName: string;
  sourceFileHash?: string;     // SHA-256 for cache dedup
  rawAIResponse?: string;      // raw JSON string from AI
  notes?: string;
}

// ── Learnings (corrections) ─────────────────────────────────

export interface LearnedRule {
  id: string;
  field: string;               // dotted path, e.g. "coverage.item.fire"
  expectedValue: string;
  correctedValue: string;
  vendor?: string;             // vendor-specific rule (optional)
  hitCount: number;
  createdAt: string;
  updatedAt: string;
}

// ── AI Configuration ────────────────────────────────────────

export interface AIProviderConfig {
  provider: AIProviderType;
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  enabled: boolean;
}

export interface AppConfig {
  activeProvider: AIProviderType;
  providers: Record<AIProviderType, AIProviderConfig>;
  exchangeRate: number;        // ARS per 1 USD
  rateLimitDelayMs: number;    // ms between bulk uploads
  language: 'es' | 'en';
}

// ── Extraction Log ──────────────────────────────────────────

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
  responsePreview?: string;    // first 300 chars
}

// ── Upload Queue ────────────────────────────────────────────

export interface QueueItem {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'done' | 'error';
  progress: number;            // 0–100
  result?: Provider;
  error?: string;
}

// ── API Request / Response ──────────────────────────────────

export interface ExtractQuoteRequest {
  materials: string;           // user-supplied materials description
  learnings: LearnedRule[];    // learned correction rules
}

export interface ExtractQuoteResponse {
  success: boolean;
  provider?: Provider;
  log: ExtractionLog;
  error?: string;
}

// ── Cache ───────────────────────────────────────────────────

export interface CacheEntry {
  fileHash: string;
  provider: Provider;
  extractedAt: string;
  aiProvider: AIProviderType;
}
