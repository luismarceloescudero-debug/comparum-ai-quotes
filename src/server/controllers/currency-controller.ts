import { NextRequest, NextResponse } from 'next/server';
import { getExchangeRates } from '@/server/services/currency';

export async function handleCurrencyRates(req: NextRequest) {
  try {
    const base = req.nextUrl.searchParams.get('base') || 'USD';
    const data = await getExchangeRates(base.toUpperCase());
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: String(error?.message || 'No se pudieron obtener tasas') }, { status: 500 });
  }
}
