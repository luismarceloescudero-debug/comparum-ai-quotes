import { LearnedRule } from '@/types';
import { formatLearningsForPrompt } from '@/services/learnings';

/**
 * Fixed system prompt for AI quote extraction.
 * Instructs the AI to return structured JSON matching the Provider type.
 */
export const SYSTEM_PROMPT = `Eres un experto analizador de cotizaciones de seguros y proveedores.
Tu tarea es extraer datos estructurados de documentos de cotización.

REGLAS ESTRICTAS:
1. Devuelve ÚNICAMENTE un objeto JSON válido, sin texto adicional, sin markdown, sin \`\`\`json.
2. Sigue exactamente el schema indicado.
3. Si un dato no está presente en el documento, usa null o "unknown".
4. Los montos deben ser números (sin símbolos de moneda).
5. Identifica la moneda correctamente (ARS o USD).
6. Para coberturas, clasifica cada item como: "covered", "supplemented", "missing", o "unknown".
7. Extrae TODAS las coberturas mencionadas, no solo las principales.
8. Si hay condiciones comerciales (forma de pago, vigencia, cuotas, descuentos), extráelas.

SCHEMA JSON REQUERIDO:
{
  "vendor": "string — nombre del proveedor/aseguradora",
  "totalPrice": number,
  "currency": "ARS" | "USD",
  "coverage": [
    {
      "name": "string — nombre de la cobertura",
      "description": "string — descripción breve",
      "status": "covered" | "supplemented" | "missing" | "unknown",
      "limit": "string | null — límite de cobertura",
      "deductible": "string | null — franquicia/deducible"
    }
  ],
  "commercialConditions": {
    "paymentTerms": "string | null",
    "validity": "string | null",
    "currency": "ARS" | "USD",
    "installments": number | null,
    "discounts": "string | null",
    "surcharges": "string | null"
  },
  "qualityScore": number (0-100) — tu evaluación de la calidad/completitud de la cotización
}`;

/**
 * Build the full user prompt including materials, learnings, and file reference.
 */
export function buildUserPrompt(
  materials: string,
  learnings: LearnedRule[],
  fileName: string,
): string {
  const parts: string[] = [];

  if (materials.trim()) {
    parts.push(`## Materiales / Descripción del riesgo:\n${materials}`);
  }

  // Include learned rules
  const learningText = formatLearningsForPrompt(1);
  if (learningText) {
    parts.push(learningText);
  }

  parts.push(`## Documento a analizar: "${fileName}"`);
  parts.push('Analiza el documento adjunto y devuelve el JSON estructurado según el schema.');

  return parts.join('\n\n');
}
