import { NextRequest } from 'next/server';
import { getQuotesController, postQuotesController } from '@/server/controllers/quotes-controller';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  return getQuotesController(req);
}

export async function POST(req: NextRequest) {
  return postQuotesController(req);
}
