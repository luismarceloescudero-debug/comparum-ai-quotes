import { AIProvider, ProviderRunInput, ProviderRunOutput } from './types';

export class AbacusProvider implements AIProvider {
  id = 'abacus' as const;

  async run(input: ProviderRunInput): Promise<ProviderRunOutput> {
    const messages = this.buildMessages(input);

    // Camino recomendado por API de Abacus Chat LLM: deploymentId + deploymentToken.
    if (input.deploymentId) {
      const payload: Record<string, unknown> = {
        deploymentId: input.deploymentId,
        deploymentToken: input.apiKey,
        llmName: input.model,
        temperature: input.temperature,
        maxTokens: 4000,
        messages,
      };

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
        throw new Error(`Abacus ${res.status}: ${err.slice(0, 350)}`);
      }

      const data = await res.json();
      const rawText = data?.result?.content || data?.result || data?.content || '';
      if (!rawText) throw new Error('Abacus devolvió respuesta vacía');

      return { provider: this.id, rawText: String(rawText) };
    }

    // Fallback: endpoint compatible OpenAI (útil cuando solo hay API key y no deploymentId configurado).
    const fallbackPayload = {
      model: input.model || 'route-llm',
      temperature: input.temperature,
      messages,
      response_format: { type: 'json_object' },
      max_tokens: 4000,
    };

    const fallbackRes = await fetch('https://routellm.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${input.apiKey}`,
      },
      body: JSON.stringify(fallbackPayload),
    });

    if (!fallbackRes.ok) {
      const err = await fallbackRes.text();
      throw new Error(`Abacus RouteLLM ${fallbackRes.status}: ${err.slice(0, 350)}`);
    }

    const fallbackData = await fallbackRes.json();
    const rawText = fallbackData?.choices?.[0]?.message?.content || '';
    if (!rawText) throw new Error('Abacus RouteLLM devolvió respuesta vacía');

    return { provider: this.id, rawText: String(rawText) };
  }

  private buildMessages(input: ProviderRunInput) {
    if (input.document.kind === 'image' && input.document.base64) {
      return [
        { role: 'system', content: input.systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: input.userPrompt },
            {
              type: 'image_url',
              image_url: { url: `data:${input.document.mimeType};base64,${input.document.base64}` },
            },
          ],
        },
      ];
    }

    const textBlock = input.document.text || '[Sin texto extraíble del documento]';
    return [
      { role: 'system', content: input.systemPrompt },
      { role: 'user', content: `${input.userPrompt}\n\nContenido detectado:\n${textBlock.slice(0, 12000)}` },
    ];
  }
}
