import { AIProvider, ProviderRunInput, ProviderRunOutput } from './types';

export class AbacusProvider implements AIProvider {
  id = 'abacus' as const;

  async run(input: ProviderRunInput): Promise<ProviderRunOutput> {
    const payload: Record<string, unknown> = {
      deploymentToken: input.apiKey,
      llmName: input.model,
      temperature: input.temperature,
      maxTokens: 4000,
      messages: [
        { role: 'system', content: input.systemPrompt },
      ],
    };

    if (input.document.kind === 'image' && input.document.base64) {
      payload.messages = [
        { role: 'system', content: input.systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: input.userPrompt },
            { type: 'image_url', image_url: { url: `data:${input.document.mimeType};base64,${input.document.base64}` } },
          ],
        },
      ];
    } else {
      const textBlock = input.document.text || '[Sin texto extraíble del documento]';
      payload.messages = [
        { role: 'system', content: input.systemPrompt },
        { role: 'user', content: `${input.userPrompt}\n\nContenido detectado:\n${textBlock.slice(0, 12000)}` },
      ];
    }

    const res = await fetch('https://api.abacus.ai/api/v0/getChatResponse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${input.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Abacus ${res.status}: ${err.slice(0, 250)}`);
    }

    const data = await res.json();
    const rawText = data?.result?.content || data?.result || '';
    if (!rawText) throw new Error('Abacus devolvió respuesta vacía');

    return { provider: this.id, rawText: String(rawText) };
  }
}
