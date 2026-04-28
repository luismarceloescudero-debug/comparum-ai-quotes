import { Provider } from '@/types';
import { readJsonFile, writeJsonFile } from './storage';

const QUOTES_FILE = 'quotes.json';

export async function listQuotes() {
  return readJsonFile<Provider[]>(QUOTES_FILE, []);
}

export async function saveQuote(quote: Provider) {
  const current = await listQuotes();
  const updated = [quote, ...current].slice(0, 200);
  await writeJsonFile(QUOTES_FILE, updated);
  return quote;
}

export async function replaceQuotes(quotes: Provider[]) {
  await writeJsonFile(QUOTES_FILE, quotes);
}
