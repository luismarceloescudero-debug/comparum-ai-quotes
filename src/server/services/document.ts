import pdf from 'pdf-parse';
import { DocumentPart } from '@/server/providers/types';

export async function parseDocument(file: File): Promise<DocumentPart> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = file.type || 'application/octet-stream';

  if (mime.startsWith('image/')) {
    return {
      kind: 'image',
      mimeType: mime,
      base64: buffer.toString('base64'),
    };
  }

  if (mime === 'application/pdf') {
    let text = '';
    try {
      const parsed = await pdf(buffer);
      text = (parsed?.text || '').trim();
    } catch {
      text = '';
    }

    // Robusto para PDF escaneado: mantenemos el PDF completo en base64 para proveedor de visión (Gemini)
    return {
      kind: 'pdf',
      mimeType: 'application/pdf',
      base64: buffer.toString('base64'),
      text,
    };
  }

  return {
    kind: 'text',
    mimeType: mime,
    text: buffer.toString('utf-8').slice(0, 20000),
  };
}

export function isVisionFriendlyDocument(doc: DocumentPart) {
  return doc.kind === 'image' || doc.kind === 'pdf';
}
