import { Provider, CacheEntry } from '@/types';

const STORAGE_KEY = 'aqe_cache';
const MAX_CACHE_ENTRIES = 50;

/**
 * Compute SHA-256 hash of a File for deduplication.
 */
export async function computeFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Get cache entries from localStorage */
function getCache(): CacheEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Save cache entries */
function saveCache(entries: CacheEntry[]): void {
  // Keep only most recent entries
  const trimmed = entries.slice(0, MAX_CACHE_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

/** Look up a cached extraction result by file hash */
export function getCachedResult(fileHash: string): Provider | null {
  const entries = getCache();
  const entry = entries.find(e => e.fileHash === fileHash);
  return entry?.provider ?? null;
}

/** Store an extraction result in cache */
export function setCachedResult(fileHash: string, provider: Provider): void {
  const entries = getCache();
  // Remove existing entry for this hash
  const filtered = entries.filter(e => e.fileHash !== fileHash);
  filtered.unshift({
    fileHash,
    provider,
    extractedAt: new Date().toISOString(),
    aiProvider: provider.aiProvider || 'abacus',
  });
  saveCache(filtered);
}

/** Clear the entire cache */
export function clearCache(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** Get number of cached entries */
export function getCacheSize(): number {
  return getCache().length;
}
