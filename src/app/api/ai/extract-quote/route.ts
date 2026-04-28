import { NextRequest } from 'next/server';
import { handleExtractQuote } from '@/server/controllers/extract-quote-controller';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  return handleExtractQuote(req);
}
