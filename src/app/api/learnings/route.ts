import { NextRequest } from 'next/server';
import { getLearningsController, postLearningsController } from '@/server/controllers/learnings-controller';

export const runtime = 'nodejs';

export async function GET() {
  return getLearningsController();
}

export async function POST(req: NextRequest) {
  return postLearningsController(req);
}
