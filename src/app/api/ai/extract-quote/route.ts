import { NextRequest, NextResponse } from 'next/server';
import { SYSTEM_PROMPT, buildUserPrompt } from '@/utils/prompt';
import { Provider, LearnedRule, AIProviderType } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';
export const maxDuration = 120;

// ── Gemini ──────────────────────────────────────────────────
async function callGemini(
  apiKey: string,
  model: string,
  temperature: number,
  systemPrompt: string,
  userPrompt: string,
  fileBase64: string,
  fileMimeType: string,
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [
      {
        parts: [
          { text: userPrompt },
          {
            inline_data: {
              mime_type: fileMimeType,
              data: fileBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText.slice(0, 500)}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini: respuesta vacía');
  return text;
}

// ── Groq ────────────────────────────────────────────────────
async function callGroq(
  apiKey: string,
  model: string,
  temperature: number,
  systemPrompt: string,
  userPrompt: string,
  fileText: string,
): Promise<string> {
  const url = 'https://api.groq.com/openai/v1/chat/completions';

  const body = {
    model,
    temperature,
    max_tokens: 8192,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `${userPrompt}\n\n## Contenido del documento:\n${fileText}` },
    ],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error ${res.status}: ${errText.slice(0, 500)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ── Abacus AI ───────────────────────────────────────────────
async function callAbacus(
  apiKey: string,
  model: string,
  temperature: number,
  systemPrompt: string,
  userPrompt: string,
  fileBase64: string,
  fileMimeType: string,
): Promise<string> {
  const url = 'https://api.abacus.ai/api/v0/getChatResponse';

  const body = {
    deploymentToken: apiKey,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: userPrompt },
          {
            type: 'image_url',
            image_url: { url: `data:${fileMimeType};base64,${fileBase64}` },
          },
        ],
      },
    ],
    llmName: model,
    temperature,
    maxTokens: 8192,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Abacus API error ${res.status}: ${errText.slice(0, 500)}`);
  }

  const data = await res.json();
  return data.result?.content ?? data.result ?? '';
}

// ── Parse AI Response ───────────────────────────────────────
function parseProviderJSON(raw: string, fileName: string): Provider {
  // Try to extract JSON from possible markdown code blocks
  let jsonStr = raw.trim();
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1].trim();

  const parsed = JSON.parse(jsonStr);

  return {
    id: uuidv4(),
    vendor: parsed.vendor || 'Desconocido',
    totalPrice: typeof parsed.totalPrice === 'number' ? parsed.totalPrice : 0,
    currency: parsed.currency || 'ARS',
    coverage: Array.isArray(parsed.coverage)
      ? parsed.coverage.map((c: any) => ({
          id: uuidv4(),
          name: c.name || '',
          description: c.description || '',
          status: ['covered', 'supplemented', 'missing', 'unknown'].includes(c.status)
            ? c.status
            : 'unknown',
          limit: c.limit || undefined,
          deductible: c.deductible || undefined,
          notes: c.notes || undefined,
        }))
      : [],
    commercialConditions: {
      paymentTerms: parsed.commercialConditions?.paymentTerms || undefined,
      validity: parsed.commercialConditions?.validity || undefined,
      currency: parsed.commercialConditions?.currency || parsed.currency || 'ARS',
      installments: parsed.commercialConditions?.installments || undefined,
      discounts: parsed.commercialConditions?.discounts || undefined,
      surcharges: parsed.commercialConditions?.surcharges || undefined,
    },
    qualityScore: typeof parsed.qualityScore === 'number' ? parsed.qualityScore : undefined,
    extractedAt: new Date().toISOString(),
    sourceFileName: fileName,
    rawAIResponse: raw.slice(0, 2000),
  };
}

// ── Main Handler ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const aiProvider = (req.headers.get('x-ai-provider') || 'gemini') as AIProviderType;
    const apiKey = req.headers.get('x-ai-api-key') || '';
    const model = req.headers.get('x-ai-model') || '';
    const temperature = parseFloat(req.headers.get('x-ai-temperature') || '0.2');

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key no proporcionada. Configure su clave en Ajustes.' },
        { status: 400 },
      );
    }

    // Parse multipart form
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const materials = (formData.get('materials') as string) || '';
    const learningsRaw = (formData.get('learnings') as string) || '[]';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionó archivo.' },
        { status: 400 },
      );
    }

    let learnings: LearnedRule[] = [];
    try { learnings = JSON.parse(learningsRaw); } catch {}

    // Read file
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileBase64 = buffer.toString('base64');
    const fileMimeType = file.type || 'application/octet-stream';

    // Build prompts
    const userPrompt = buildUserPrompt(materials, learnings, file.name);

    // Dispatch to AI provider
    let rawResponse: string;

    switch (aiProvider) {
      case 'gemini':
        rawResponse = await callGemini(
          apiKey, model || 'gemini-2.0-flash', temperature,
          SYSTEM_PROMPT, userPrompt, fileBase64, fileMimeType,
        );
        break;

      case 'groq':
        // Groq is text-only — we send base64 as text content
        rawResponse = await callGroq(
          apiKey, model || 'llama-3.3-70b-versatile', temperature,
          SYSTEM_PROMPT, userPrompt,
          `[Archivo adjunto: ${file.name}, tipo: ${fileMimeType}, tamaño: ${buffer.length} bytes, contenido base64 (primeros 2000 chars): ${fileBase64.slice(0, 2000)}...]`,
        );
        break;

      case 'abacus':
        rawResponse = await callAbacus(
          apiKey, model || 'gpt-4o', temperature,
          SYSTEM_PROMPT, userPrompt, fileBase64, fileMimeType,
        );
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Proveedor AI no soportado: ${aiProvider}` },
          { status: 400 },
        );
    }

    // Parse response
    const provider = parseProviderJSON(rawResponse, file.name);

    return NextResponse.json({
      success: true,
      provider,
      log: {
        tokensUsed: undefined, // varies by provider
      },
    });
  } catch (err: any) {
    console.error('Extract quote error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Error interno del servidor',
      },
      { status: 500 },
    );
  }
}
