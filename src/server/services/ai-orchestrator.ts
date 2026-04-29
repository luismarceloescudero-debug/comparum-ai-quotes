import { AIProviderType, Provider, LearnedRule, AIProviderConfig } from '@/types';
import { providers } from '@/server/providers';
import { parseDocument } from './document';
import { buildUserPrompt, SYSTEM_PROMPT } from './prompt';
import { normalizeProvider } from './normalizer';

interface ExtractionOptions {
  file: File;
  materials: string;
  learnings: LearnedRule[];
  fallbackOrder: AIProviderType[];
  providerConfig: Record<AIProviderType, AIProviderConfig>;
}

export async function extractWithFallback(options: ExtractionOptions): Promise<{ provider: Provider; logs: Array<{ provider: AIProviderType; status: 'success' | 'error'; error?: string }> }> {
  const doc = await parseDocument(options.file);
  const userPrompt = buildUserPrompt(options.materials, options.learnings, options.file.name);
  const logs: Array<{ provider: AIProviderType; status: 'success' | 'error'; error?: string }> = [];

  const order = deriveOrder(options.fallbackOrder, doc.kind === 'pdf');

  for (const providerName of order) {
    const cfg = options.providerConfig[providerName];
    if (!cfg?.enabled || !cfg.apiKey) {
      logs.push({ provider: providerName, status: 'error', error: 'No habilitado o sin API key' });
      continue;
    }

    try {
      const result = await providers[providerName].run({
        apiKey: cfg.apiKey,
        deploymentId: cfg.deploymentId,
        model: cfg.model,
        temperature: cfg.temperature,
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        document: doc,
      });

      const provider = normalizeProvider(result.rawText, options.file.name);
      provider.aiProvider = providerName;

      logs.push({ provider: providerName, status: 'success' });
      return { provider, logs };
    } catch (error: any) {
      const message = String(error?.message || 'Error desconocido');
      logs.push({ provider: providerName, status: 'error', error: message });

      if (!isRetryable(message)) {
        // Aun en errores no "retriables" intentamos el siguiente proveedor para evitar bloquear toda la extracción.
        continue;
      }
    }
  }

  throw new Error(`Falló la extracción en todos los proveedores. Detalle: ${logs.map((l) => `${l.provider}:${l.status}${l.error ? `(${l.error})` : ''}`).join(' | ')}`);
}

function deriveOrder(fallbackOrder: AIProviderType[], isPdf: boolean): AIProviderType[] {
  if (!isPdf) return fallbackOrder;
  // PDFs escaneados: si hay Gemini en orden, priorizarlo tras Abacus para soportar PDF inline vision.
  const dedup = Array.from(new Set(fallbackOrder));
  if (dedup[0] === 'abacus' && dedup.includes('gemini')) {
    return ['abacus', 'gemini', ...dedup.filter((x) => x !== 'abacus' && x !== 'gemini')];
  }
  return dedup;
}

function isRetryable(message: string) {
  const m = message.toLowerCase();
  return m.includes('rate') || m.includes('429') || m.includes('timeout') || m.includes('temporarily') || m.includes('quota');
}
