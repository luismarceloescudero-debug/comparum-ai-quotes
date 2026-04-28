import { promises as fs } from 'fs';
import path from 'path';

const preferredDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const fallbackDir = '/tmp/comparum-data';

async function ensureDataDir() {
  try {
    await fs.mkdir(preferredDir, { recursive: true });
    return preferredDir;
  } catch {
    await fs.mkdir(fallbackDir, { recursive: true });
    return fallbackDir;
  }
}

async function filePath(name: string) {
  const dir = await ensureDataDir();
  return path.join(dir, name);
}

export async function readJsonFile<T>(name: string, defaultValue: T): Promise<T> {
  const fullPath = await filePath(name);
  try {
    const content = await fs.readFile(fullPath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return defaultValue;
  }
}

export async function writeJsonFile<T>(name: string, payload: T): Promise<void> {
  const fullPath = await filePath(name);
  await fs.writeFile(fullPath, JSON.stringify(payload, null, 2), 'utf-8');
}
