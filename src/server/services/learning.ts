import { LearnedRule } from '@/types';
import { readJsonFile, writeJsonFile } from './storage';

const LEARNINGS_FILE = 'learnings.json';

export async function getLearningsFromStore() {
  return readJsonFile<LearnedRule[]>(LEARNINGS_FILE, []);
}

export async function saveLearningsToStore(learnings: LearnedRule[]) {
  await writeJsonFile(LEARNINGS_FILE, learnings);
}
