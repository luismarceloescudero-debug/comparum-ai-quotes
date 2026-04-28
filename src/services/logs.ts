import { ExtractionLog } from '@/types';

const STORAGE_KEY = 'aqe_logs';
const MAX_LOGS = 500;

/** Get all extraction logs */
export function getLogs(): ExtractionLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Add a new log entry (keeps most recent MAX_LOGS) */
export function addLog(log: ExtractionLog): void {
  const logs = getLogs();
  logs.unshift(log); // newest first
  if (logs.length > MAX_LOGS) logs.length = MAX_LOGS;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

/** Clear all logs */
export function clearLogs(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** Export logs as JSON string */
export function exportLogsJSON(): string {
  return JSON.stringify(getLogs(), null, 2);
}

/** Export logs as CSV string */
export function exportLogsCSV(): string {
  const logs = getLogs();
  const headers = ['timestamp', 'provider', 'model', 'fileName', 'durationMs', 'status', 'tokensUsed', 'error'];
  const rows = logs.map(l => [
    l.timestamp,
    l.provider,
    l.model,
    `"${l.fileName.replace(/"/g, '""')}"`,
    l.durationMs,
    l.status,
    l.tokensUsed ?? '',
    l.error ? `"${l.error.replace(/"/g, '""')}"` : '',
  ].join(','));
  return [headers.join(','), ...rows].join('\n');
}

/** Import logs from JSON string (appends to existing) */
export function importLogs(json: string): void {
  try {
    const imported: ExtractionLog[] = JSON.parse(json);
    const existing = getLogs();
    const ids = new Set(existing.map(l => l.id));
    const newLogs = imported.filter(l => !ids.has(l.id));
    const merged = [...newLogs, ...existing].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    if (merged.length > MAX_LOGS) merged.length = MAX_LOGS;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (err) {
    console.error('Error importing logs:', err);
    throw new Error('Formato JSON inválido');
  }
}
