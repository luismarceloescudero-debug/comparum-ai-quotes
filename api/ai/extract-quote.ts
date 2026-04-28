
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ABACUS_API_KEY || req.headers['x-api-key'];
  const model = process.env.AI_MODEL || 'route-llm';
  const baseUrl = 'https://routellm.abacus.ai/v1/chat/completions';

  if (!apiKey) {
    return res.status(401).json({ error: 'Falta la API Key de Abacus AI' });
  }

  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: 'Eres un extractor de datos precisos de presupuestos. Devuelve exclusivamente JSON.' },
          { role: 'user', content: req.body.prompt }
        ],
        temperature: 0
      })
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Error conectando con Abacus AI' });
  }
}
