import { LearnedRule } from '@/types';

const STORAGE_KEY = 'comparum_learnings';

export function getLearnings(): LearnedRule[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLearnings(rules: LearnedRule[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
}

export async function syncLearningsFromServer(): Promise<LearnedRule[]> {
  const res = await fetch('/api/learnings', { cache: 'no-store' });
  if (!res.ok) return getLearnings();

  const data = await res.json();
  const rules = (data?.learnings || []) as LearnedRule[];
  saveLearnings(rules);
  return rules;
}

export async function addLearning(rule: LearnedRule): Promise<void> {
  const current = getLearnings();
  const existing = current.find(
    (r) => r.field === rule.field && r.correctedValue === rule.correctedValue && r.vendor === rule.vendor,
  );

  if (existing) {
    existing.hitCount += 1;
    existing.updatedAt = new Date().toISOString();
  } else {
    current.push(rule);
  }

  saveLearnings(current);

  await fetch('/api/learnings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ learnings: current }),
  });
}

export function clearLearnings() {
  saveLearnings([]);
}

export function exportLearningsJSON(): string {
  return JSON.stringify(getLearnings(), null, 2);
}

export function importLearnings(json: string): void {
  const parsed = JSON.parse(json) as LearnedRule[];
  if (!Array.isArray(parsed)) throw new Error('JSON inválido');
  saveLearnings(parsed);
}
