import { LearnedRule } from '@/types';

export const SYSTEM_PROMPT = `Eres un extractor avanzado de cotizaciones comerciales.
Debes devolver EXCLUSIVAMENTE JSON válido sin markdown.
Esquema esperado:
{
  "vendor": "string",
  "totalPrice": number,
  "currency": "USD|ARS|EUR|...",
  "coverage": [{"name":"string","description":"string","status":"covered|supplemented|missing|unknown","limit":"string","deductible":"string","notes":"string"}],
  "commercialConditions": {"paymentTerms":"string","validity":"string","currency":"string","installments": number, "discounts":"string", "surcharges":"string"},
  "qualityScore": number,
  "notes": "string"
}`;

export function buildUserPrompt(materials: string, learnings: LearnedRule[], fileName: string) {
  const learned = learnings
    .sort((a, b) => b.hitCount - a.hitCount)
    .slice(0, 20)
    .map((l) => `- Campo ${l.field}: cuando veas "${l.expectedValue}", corregir a "${l.correctedValue}"${l.vendor ? ` (vendor ${l.vendor})` : ''}`)
    .join('\n');

  return [
    `Archivo: ${fileName}`,
    materials ? `Contexto de materiales/riesgo:\n${materials}` : 'Sin contexto adicional.',
    learned ? `Reglas aprendidas a aplicar:\n${learned}` : 'Sin reglas aprendidas previas.',
    'Extrae la cotización completa con la mejor precisión posible, incluso si el documento tiene baja calidad.',
  ].join('\n\n');
}
