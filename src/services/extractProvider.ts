import { Provider, LearnedRule, AppConfig, ExtractionLog } from '@/types';
import { addLog } from '@/services/logs';
import { v4 as uuidv4 } from 'uuid';

/**
 * Client-side service that sends the file + context to our Next.js API route.
 * The API route handles multi-provider dispatch.
 */
export async function extractQuote(
  file: File,
  materials: string,
  learnings: LearnedRule[],
  config: AppConfig,
  onProgress?: (pct: number) => void,
): Promise<Provider> {
  const startTime = Date.now();
  const providerConfig = config.providers[config.activeProvider];

  onProgress?.(20);

  // Build FormData
  const formData = new FormData();
  formData.append('file', file);
  formData.append('materials', materials);
  formData.append('learnings', JSON.stringify(learnings));

  onProgress?.(30);

  try {
    const res = await fetch('/api/ai/extract-quote', {
      method: 'POST',
      headers: {
        'x-ai-provider': config.activeProvider,
        'x-ai-api-key': providerConfig.apiKey,
        'x-ai-model': providerConfig.model || '',
        'x-ai-temperature': String(providerConfig.temperature ?? 0.2),
      },
      body: formData,
    });

    onProgress?.(80);

    if (!res.ok) {
      const errorBody = await res.text();
      const durationMs = Date.now() - startTime;
      addLog({
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        provider: config.activeProvider,
        model: providerConfig.model || 'default',
        fileName: file.name,
        durationMs,
        status: 'error',
        error: `HTTP ${res.status}`,
        errorDetail: errorBody,
      });
      throw new Error(`Error del servidor: ${res.status} — ${errorBody.slice(0, 200)}`);
    }

    const data = await res.json();
    const durationMs = Date.now() - startTime;

    onProgress?.(95);

    if (!data.success) {
      addLog({
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        provider: config.activeProvider,
        model: providerConfig.model || 'default',
        fileName: file.name,
        durationMs,
        status: 'error',
        error: data.error || 'Extraction failed',
        errorDetail: JSON.stringify(data),
      });
      throw new Error(data.error || 'Extracción fallida');
    }

    // Log success
    addLog({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      provider: config.activeProvider,
      model: providerConfig.model || 'default',
      fileName: file.name,
      durationMs,
      status: 'success',
      tokensUsed: data.log?.tokensUsed,
      responsePreview: JSON.stringify(data.provider).slice(0, 300),
    });

    onProgress?.(100);
    return data.provider as Provider;
  } catch (err: any) {
    if (!err.message.includes('Error del servidor')) {
      const durationMs = Date.now() - startTime;
      addLog({
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        provider: config.activeProvider,
        model: providerConfig.model || 'default',
        fileName: file.name,
        durationMs,
        status: 'error',
        error: err.message,
        errorDetail: err.stack,
      });
    }
    throw err;
  }
}
