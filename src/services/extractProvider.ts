import { Provider, LearnedRule, AppConfig, ExtractionLog } from '@/types';
import { addLog } from '@/services/logs';
import { v4 as uuidv4 } from 'uuid';

export async function extractQuote(
  file: File,
  materials: string,
  learnings: LearnedRule[],
  config: AppConfig,
  onProgress?: (pct: number) => void,
): Promise<Provider> {
  const started = Date.now();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('materials', materials);
  formData.append('learnings', JSON.stringify(learnings));

  onProgress?.(25);

  const res = await fetch('/api/ai/extract-quote', {
    method: 'POST',
    headers: {
      'x-ai-order': JSON.stringify(config.fallbackOrder),
      'x-ai-config': JSON.stringify({
        abacus: config.providers.abacus,
        groq: config.providers.groq,
        gemini: config.providers.gemini,
      }),
      'x-active-provider': config.activeProvider,
    },
    body: formData,
  });

  onProgress?.(85);

  const body = await res.json();

  if (!res.ok || !body.success || !body.provider) {
    const errorText = body?.error || `Error ${res.status}`;
    addLog(buildLog(file.name, config.activeProvider, config.providers[config.activeProvider].model, 'error', Date.now() - started, errorText));
    throw new Error(errorText);
  }

  const chosenProvider = body.provider.aiProvider ?? config.activeProvider;
  addLog(buildLog(file.name, chosenProvider, config.providers[chosenProvider].model, 'success', Date.now() - started));
  onProgress?.(100);

  return body.provider as Provider;
}

function buildLog(
  fileName: string,
  provider: 'abacus' | 'groq' | 'gemini',
  model: string,
  status: ExtractionLog['status'],
  durationMs: number,
  error?: string,
): ExtractionLog {
  return {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    provider,
    model,
    fileName,
    durationMs,
    status,
    error,
  };
}
