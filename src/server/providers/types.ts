import { AIProviderType } from '@/types';

export interface DocumentPart {
  kind: 'text' | 'image' | 'pdf';
  mimeType: string;
  base64?: string;
  text?: string;
}

export interface ProviderRunInput {
  systemPrompt: string;
  userPrompt: string;
  model: string;
  temperature: number;
  apiKey: string;
  document: DocumentPart;
}

export interface ProviderRunOutput {
  provider: AIProviderType;
  rawText: string;
}

export interface AIProvider {
  id: AIProviderType;
  run(input: ProviderRunInput): Promise<ProviderRunOutput>;
}
