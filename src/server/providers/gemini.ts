import { AIProvider, ProviderRunInput, ProviderRunOutput } from './types';

export class GeminiProvider implements AIProvider {
  id = 'gemini' as const;

  async run(input: ProviderRunInput): Promise<ProviderRunOutput> {
    const parts: Array<Record<string, unknown>> = [{ text: input.userPrompt }];

    if ((input.document.kind === 'image' || input.document.kind === 'pdf') && input.document.base64) {
      parts.push({
        inline_data: {
          mime_type: input.document.mimeType,
          data: input.document.base64,
        },
      });
    } else if (input.document.text) {
      parts.push({ text: `Texto del documento:\n${input.document.text.slice(0, 16000)}` });
    }

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${input.model}:generateContent?key=${input.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: input.systemPrompt }] },
        contents: [{ parts }],
        generationConfig: {
          temperature: input.temperature,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini ${res.status}: ${err.slice(0, 250)}`);
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!rawText) throw new Error('Gemini devolvió respuesta vacía');

    return { provider: this.id, rawText: String(rawText) };
  }
}
