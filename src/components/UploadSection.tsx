'use client';

import React, { useState, useCallback, useRef } from 'react';
import { QueueItem, Provider, LearnedRule } from '@/types';
import { extractQuote } from '@/services/extractProvider';
import { getLearnings } from '@/services/learnings';
import { getConfig } from '@/utils/config';
import { getCachedResult, setCachedResult, computeFileHash } from '@/utils/cache';
import { v4 as uuidv4 } from 'uuid';

interface UploadSectionProps {
  materials: string;
  onMaterialsChange: (m: string) => void;
  onProviderExtracted: (p: Provider) => void;
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'image/png', 'image/jpeg', 'image/webp',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export default function UploadSection({ materials, onMaterialsChange, onProviderExtracted }: UploadSectionProps) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);

  const updateQueueItem = (id: string, patch: Partial<QueueItem>) =>
    setQueue(prev => prev.map(q => (q.id === id ? { ...q, ...patch } : q)));

  const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

  const validateFile = (file: File): boolean => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert(`Tipo no soportado: ${file.type}`);
      return false;
    }
    if (file.size > 20 * 1024 * 1024) {
      alert('Máximo permitido: 20 MB.');
      return false;
    }
    return true;
  };

  const enqueueFiles = (files: FileList | File[]) => {
    const items: QueueItem[] = Array.from(files)
      .filter(validateFile)
      .map(file => ({ id: uuidv4(), file, status: 'pending' as const, progress: 0 }));
    if (items.length) setQueue(prev => [...prev, ...items]);
  };

  const processQueue = useCallback(async () => {
    setIsProcessing(true);
    abortRef.current = false;
    const config = getConfig();
    const learnings: LearnedRule[] = getLearnings();

    const pending = queue.filter(q => q.status === 'pending');
    for (const item of pending) {
      if (abortRef.current) break;

      const hash = await computeFileHash(item.file);
      const cached = getCachedResult(hash);
      if (cached) {
        updateQueueItem(item.id, { status: 'done', progress: 100, result: cached });
        onProviderExtracted(cached);
        await delay(300);
        continue;
      }

      updateQueueItem(item.id, { status: 'processing', progress: 10 });

      try {
        const provider = await extractQuote(item.file, materials, learnings, config, (pct) => {
          updateQueueItem(item.id, { progress: pct });
        });
        updateQueueItem(item.id, { status: 'done', progress: 100, result: provider });
        setCachedResult(hash, provider);
        onProviderExtracted(provider);
      } catch (err: any) {
        updateQueueItem(item.id, { status: 'error', error: err.message ?? 'Error' });
      }

      if (!abortRef.current) await delay(config.rateLimitDelayMs);
    }
    setIsProcessing(false);
  }, [queue, materials, onProviderExtracted]);

  const stopProcessing = () => { abortRef.current = true; };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    enqueueFiles(e.dataTransfer.files);
  };

  return (
    <section className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1">📋 Contexto del pedido</label>
        <textarea
          className="input-field min-h-[84px]"
          rows={3}
          placeholder="Describe materiales, alcance, condiciones mínimas o aclaraciones..."
          value={materials}
          onChange={e => onMaterialsChange(e.target.value)}
        />
      </div>

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
          isDragging ? 'border-blue-500 bg-blue-500/10 scale-[1.01]' : 'border-[var(--border)] hover:border-blue-400 bg-[var(--card)]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.docx"
          className="hidden"
          onChange={e => e.target.files && enqueueFiles(e.target.files)}
        />
        <div className="text-4xl mb-3">📄</div>
        <p className="font-medium">Arrastra imágenes/PDFs o haz clic para seleccionar</p>
        <p className="text-sm text-[var(--muted)] mt-1">Soporta PDFs escaneados, imágenes y documentos de office.</p>
      </div>

      {queue.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm text-[var(--muted)]">Cola ({queue.filter(q => q.status === 'done').length}/{queue.length})</h3>
            <div className="flex gap-2">
              {!isProcessing ? (
                <button onClick={processQueue} disabled={!queue.some(q => q.status === 'pending')} className="btn-primary">Procesar</button>
              ) : (
                <button onClick={stopProcessing} className="btn-danger">Detener</button>
              )}
              <button onClick={() => setQueue([])} className="btn-secondary">Limpiar</button>
            </div>
          </div>

          {queue.map(item => (
            <div key={item.id} className="card p-3 flex items-center gap-3">
              <span>{item.status === 'done' ? '✅' : item.status === 'error' ? '❌' : item.status === 'processing' ? '⏳' : '📄'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{item.file.name}</p>
                {item.status === 'processing' && (
                  <div className="mt-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${item.progress}%` }} />
                  </div>
                )}
                {item.status === 'error' && <p className="text-xs text-red-400">{item.error}</p>}
                {item.status === 'done' && item.result && (
                  <p className="text-xs text-green-500">{item.result.vendor} — {item.result.currency} {item.result.totalPrice.toLocaleString('es-AR')}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
