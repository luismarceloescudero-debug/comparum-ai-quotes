import { AIProvider, ProviderRunInput, ProviderRunOutput } from './types';

export class GroqProvider implements AIProvider {
  id = 'groq' as const;

  async run(input: ProviderRunInput): Promise<ProviderRunOutput> {
    const textContext = input.document.text || '[Documento sin texto extraíble. Reintentar con proveedor de visión.]';

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${input.apiKey}`,
      },
      body: JSON.stringify({
        model: input.model,
        temperature: input.temperature,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: input.systemPrompt },
          { role: 'user', content: `${input.userPrompt}\n\nTexto del documento:\n${textContext.slice(0, 16000)}` },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq ${res.status}: ${err.slice(0, 250)}`);
    }

    const data = await res.json();
    const rawText = data?.choices?.[0]?.message?.content || '';
    if (!rawText) throw new Error('Groq devolvió respuesta vacía');

    return { provider: this.id, rawText: String(rawText) };
  }
}
