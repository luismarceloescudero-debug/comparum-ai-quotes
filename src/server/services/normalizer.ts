import { Provider, CoverageStatus } from '@/types';
import { v4 as uuidv4 } from 'uuid';

function safeJsonParse(raw: string): any {
  const trimmed = raw.trim();
  const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const normalized = codeBlock ? codeBlock[1].trim() : trimmed;
  return JSON.parse(normalized);
}

function mapStatus(status: string): CoverageStatus {
  if (['covered', 'supplemented', 'missing', 'unknown'].includes(status)) return status as CoverageStatus;
  const s = status.toLowerCase();
  if (s.includes('cubi')) return 'covered';
  if (s.includes('suple') || s.includes('parcial')) return 'supplemented';
  if (s.includes('no') || s.includes('excl')) return 'missing';
  return 'unknown';
}

export function normalizeProvider(raw: string, fileName: string): Provider {
  const parsed = safeJsonParse(raw);

  return {
    id: uuidv4(),
    vendor: parsed.vendor || parsed.provider || 'Proveedor no identificado',
    totalPrice: Number(parsed.totalPrice || parsed.price || 0),
    currency: (parsed.currency || parsed.commercialConditions?.currency || 'USD').toUpperCase(),
    coverage: Array.isArray(parsed.coverage)
      ? parsed.coverage.map((item: any) => ({
          id: uuidv4(),
          name: String(item.name || 'Cobertura no identificada'),
          description: item.description ? String(item.description) : undefined,
          status: mapStatus(String(item.status || 'unknown')),
          limit: item.limit ? String(item.limit) : undefined,
          deductible: item.deductible ? String(item.deductible) : undefined,
          notes: item.notes ? String(item.notes) : undefined,
        }))
      : [],
    commercialConditions: {
      paymentTerms: parsed.commercialConditions?.paymentTerms,
      validity: parsed.commercialConditions?.validity,
      currency: parsed.commercialConditions?.currency,
      installments: parsed.commercialConditions?.installments,
      discounts: parsed.commercialConditions?.discounts,
      surcharges: parsed.commercialConditions?.surcharges,
    },
    qualityScore: parsed.qualityScore ? Number(parsed.qualityScore) : undefined,
    notes: parsed.notes,
    extractedAt: new Date().toISOString(),
    sourceFileName: fileName,
  };
}
