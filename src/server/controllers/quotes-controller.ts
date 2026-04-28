import { NextRequest, NextResponse } from 'next/server';
import { listQuotes, replaceQuotes } from '@/server/services/quotes';
import { getExchangeRates } from '@/server/services/currency';
import { buildComparison } from '@/server/services/comparison';
import { Provider } from '@/types';

export async function getQuotesController(req: NextRequest) {
  const quotes = await listQuotes();
  const baseCurrency = req.nextUrl.searchParams.get('base') || 'USD';

  try {
    const ratesResponse = await getExchangeRates(baseCurrency.toUpperCase());
    const comparison = buildComparison(quotes, ratesResponse.rates, ratesResponse.base);

    return NextResponse.json({
      success: true,
      quotes,
      comparison,
      rates: ratesResponse,
    });
  } catch {
    return NextResponse.json({ success: true, quotes });
  }
}

export async function postQuotesController(req: NextRequest) {
  try {
    const body = await req.json();
    const quotes = (body?.quotes || []) as Provider[];
    await replaceQuotes(quotes);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Payload inválido' }, { status: 400 });
  }
}
