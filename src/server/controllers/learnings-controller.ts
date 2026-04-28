import { NextRequest, NextResponse } from 'next/server';
import { getLearningsFromStore, saveLearningsToStore } from '@/server/services/learning';
import { LearnedRule } from '@/types';

export async function getLearningsController() {
  const learnings = await getLearningsFromStore();
  return NextResponse.json({ success: true, learnings });
}

export async function postLearningsController(req: NextRequest) {
  try {
    const body = await req.json();
    const learnings = (body?.learnings || []) as LearnedRule[];
    await saveLearningsToStore(learnings);
    return NextResponse.json({ success: true, learnings });
  } catch {
    return NextResponse.json({ success: false, error: 'Payload inválido' }, { status: 400 });
  }
}
