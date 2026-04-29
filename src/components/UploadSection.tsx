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
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
      .map((file) => ({ id: uuidv4(), file, status: 'pending' as const, progress: 0 }));
    if (items.length) setQueue((prev) => [...prev, ...items]);
  };

  const processQueue = useCallback(async () => {
    setIsProcessing(true);
    abortRef.current = false;
    const config = getConfig();
    const learnings: LearnedRule[] = getLearnings();

    const pending = queue.filter((q) => q.status === 'pending');
    for (const item of pending) {
      if (abortRef.current) break;

      const hash = await computeFileHash(item.file);
      const cached = getCachedResult(hash);
      if (cached) {
        updateQueueItem(item.id, { status: 'done', progress: 100, result: cached });
        onProviderExtracted(cached);
        await delay(250);
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

  return (
    <section className="upload-section no-print">
      <div className="upload-title"><span>✨</span> Importación de archivos con IA</div>
      <div className="upload-subtitle">Subí cotizaciones (PDF/imagen/Office). Se procesa con multi-provider IA + fallback.</div>

      <div className="mb-4 text-left">
        <label className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">Contexto del pedido</label>
        <textarea
          className="input-field min-h-[84px] mt-2"
          rows={3}
          placeholder="Describe materiales, alcance y condiciones comerciales..."
          value={materials}
          onChange={(e) => onMaterialsChange(e.target.value)}
        />
      </div>

      <div
        className={`upload-area ${isDragging ? 'dragover' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          enqueueFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.docx"
          className="file-input"
          onChange={(e) => e.target.files && enqueueFiles(e.target.files)}
        />
        <div className="upload-icon">📄</div>
        <div className="upload-text">Arrastrá archivos aquí o hacé clic para seleccionar</div>
        <div className="upload-hint">Máximo 20MB por archivo</div>
      </div>

      {queue.length > 0 && (
        <div className="ai-result active">
          <div className="ai-header">
            <div className="ai-icon">🤖</div>
            <div className="ai-title">Cola de procesamiento ({queue.filter((q) => q.status === 'done').length}/{queue.length})</div>
          </div>

          <div className="flex gap-2 mb-3">
            {!isProcessing ? (
              <button onClick={processQueue} disabled={!queue.some((q) => q.status === 'pending')} className="btn btn-accent">Procesar</button>
            ) : (
              <button onClick={() => { abortRef.current = true; }} className="btn btn-ghost">Detener</button>
            )}
            <button onClick={() => setQueue([])} className="btn btn-ghost">Limpiar</button>
          </div>

          {queue.map((item) => (
            <div key={item.id} className="uploaded-file">
              <div className="file-info">
                <div className="file-icon-box">📎</div>
                <div>
                  <div className="file-name">{item.file.name}</div>
                  <div className={`file-status ${item.status === 'done' ? 'processed' : item.status === 'error' ? 'error-status' : ''}`}>
                    {item.status === 'processing' ? (
                      <><span className="processing-spinner" />Procesando... {item.progress}%</>
                    ) : item.status === 'done' && item.result ? (
                      `${item.result.vendor} · ${item.result.currency} ${item.result.totalPrice.toLocaleString('es-AR')}`
                    ) : item.status === 'error' ? item.error : 'Pendiente'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
