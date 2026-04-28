import { LearnedRule } from '@/types';

const STORAGE_KEY = 'aqe_learnings';

/** Get all learned rules from localStorage */
export function getLearnings(): LearnedRule[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Save all learnings to localStorage */
function saveLearnings(rules: LearnedRule[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
}

/**
 * Add a new learning rule. If a matching rule already exists
 * (same field + correctedValue + vendor), bump its hitCount instead.
 */
export function addLearning(rule: LearnedRule): void {
  const rules = getLearnings();
  const existing = rules.find(
    r => r.field === rule.field
      && r.correctedValue === rule.correctedValue
      && r.vendor === rule.vendor,
  );

  if (existing) {
    existing.hitCount += 1;
    existing.updatedAt = new Date().toISOString();
  } else {
    rules.push(rule);
  }

  saveLearnings(rules);
}

/** Remove a learning rule by ID */
export function removeLearning(id: string): void {
  const rules = getLearnings().filter(r => r.id !== id);
  saveLearnings(rules);
}

/** Update an existing rule */
export function updateLearning(id: string, patch: Partial<LearnedRule>): void {
  const rules = getLearnings().map(r =>
    r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r,
  );
  saveLearnings(rules);
}

/** Clear all learned rules */
export function clearLearnings(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Format learnings into a prompt-friendly text block.
 * Only includes rules with hitCount >= minHits for reliability.
 */
export function formatLearningsForPrompt(minHits: number = 1): string {
  const rules = getLearnings()
    .filter(r => r.hitCount >= minHits)
    .sort((a, b) => b.hitCount - a.hitCount);

  if (rules.length === 0) return '';

  const lines = rules.map(r => {
    const vendorTag = r.vendor ? ` [vendor: ${r.vendor}]` : '';
    return `- Campo "${r.field}": el valor "${r.expectedValue}" debe ser "${r.correctedValue}"${vendorTag} (confirmado ${r.hitCount}x)`;
  });

  return [
    '## Reglas aprendidas de correcciones previas (seguir estrictamente):',
    ...lines,
  ].join('\n');
}

/** Export learnings as JSON string */
export function exportLearningsJSON(): string {
  return JSON.stringify(getLearnings(), null, 2);
}

/** Import learnings from JSON, merging with existing */
export function importLearnings(json: string): void {
  try {
    const imported: LearnedRule[] = JSON.parse(json);
    const existing = getLearnings();
    const merged = [...existing];

    for (const rule of imported) {
      const match = merged.find(
        r => r.field === rule.field
          && r.correctedValue === rule.correctedValue
          && r.vendor === rule.vendor,
      );
      if (match) {
        match.hitCount += rule.hitCount;
        match.updatedAt = new Date().toISOString();
      } else {
        merged.push(rule);
      }
    }

    saveLearnings(merged);
  } catch (err) {
    console.error('Error importing learnings:', err);
    throw new Error('Formato JSON inválido');
  }
}
