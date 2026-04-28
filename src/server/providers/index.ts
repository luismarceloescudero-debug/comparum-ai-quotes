import { AbacusProvider } from './abacus';
import { GeminiProvider } from './gemini';
import { GroqProvider } from './groq';

export const providers = {
  abacus: new AbacusProvider(),
  groq: new GroqProvider(),
  gemini: new GeminiProvider(),
};
