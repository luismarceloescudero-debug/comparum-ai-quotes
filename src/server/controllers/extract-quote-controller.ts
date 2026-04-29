import { NextRequest, NextResponse } from 'next/server';
import { extractWithFallback } from '@/server/services/ai-orchestrator';
import { saveQuote } from '@/server/services/quotes';
import { AIProviderType, AIProviderConfig, LearnedRule } from '@/types';

const defaultConfig: Record<AIProviderType, AIProviderConfig> = {
  abacus: { provider: 'abacus', apiKey: '', model: 'gpt-4.1-mini', temperature: 0.1, enabled: true, deploymentId: '' },
  groq: { provider: 'groq', apiKey: '', model: 'llama-3.3-70b-versatile', temperature: 0.1, enabled: true },
  gemini: { provider: 'gemini', apiKey: '', model: 'gemini-2.0-flash', temperature: 0.1, enabled: true },
};

export async function handleExtractQuote(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const materials = String(form.get('materials') || '');
    const learnings = parseLearnings(form.get('learnings'));

    if (!file) {
      return NextResponse.json({ success: false, error: 'No se recibió archivo' }, { status: 400 });
    }

    const fallbackOrder = parseOrder(req.headers.get('x-ai-order'));
    const providerConfig = parseConfig(req.headers.get('x-ai-config'));

    const { provider, logs } = await extractWithFallback({
      file,
      materials,
      learnings,
      fallbackOrder,
      providerConfig,
    });

    await saveQuote(provider);

    return NextResponse.json({ success: true, provider, logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: String(error?.message || 'Error interno') }, { status: 500 });
  }
}

function parseLearnings(input: FormDataEntryValue | null): LearnedRule[] {
  if (!input || typeof input !== 'string') return [];
  try {
    return JSON.parse(input) as LearnedRule[];
  } catch {
    return [];
  }
}

function parseOrder(raw: string | null): AIProviderType[] {
  try {
    const parsed = JSON.parse(raw || '[]') as AIProviderType[];
    return parsed.length ? parsed : ['abacus', 'groq', 'gemini'];
  } catch {
    return ['abacus', 'groq', 'gemini'];
  }
}

function parseConfig(raw: string | null): Record<AIProviderType, AIProviderConfig> {
  try {
    const parsed = JSON.parse(raw || '{}');
    return {
      abacus: {
        ...defaultConfig.abacus,
        ...(parsed.abacus || {}),
        apiKey: parsed.abacus?.apiKey || process.env.ABACUS_API_KEY || '',
        deploymentId: parsed.abacus?.deploymentId || process.env.ABACUS_DEPLOYMENT_ID || '',
      },
      groq: {
        ...defaultConfig.groq,
        ...(parsed.groq || {}),
        apiKey: parsed.groq?.apiKey || process.env.GROQ_API_KEY || '',
      },
      gemini: {
        ...defaultConfig.gemini,
        ...(parsed.gemini || {}),
        apiKey: parsed.gemini?.apiKey || process.env.GEMINI_API_KEY || '',
      },
    };
  } catch {
    return {
      ...defaultConfig,
      abacus: {
        ...defaultConfig.abacus,
        apiKey: process.env.ABACUS_API_KEY || '',
        deploymentId: process.env.ABACUS_DEPLOYMENT_ID || '',
      },
      groq: { ...defaultConfig.groq, apiKey: process.env.GROQ_API_KEY || '' },
      gemini: { ...defaultConfig.gemini, apiKey: process.env.GEMINI_API_KEY || '' },
    };
  }
}
