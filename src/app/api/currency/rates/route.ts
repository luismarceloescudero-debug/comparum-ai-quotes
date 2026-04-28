import { NextRequest } from 'next/server';
import { handleCurrencyRates } from '@/server/controllers/currency-controller';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  return handleCurrencyRates(req);
}
