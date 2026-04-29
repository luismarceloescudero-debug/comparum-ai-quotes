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
    <section className="upload-section">
      <div style={{ marginBottom: 16, textAlign: 'left' }}>
        <label className="sort-label" style={{ marginBottom: 6 }}>📋 Contexto del pedido</label>
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
        className={`upload-area ${isDragging ? 'dragover' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.docx"
          className="file-input"
          onChange={e => e.target.files && enqueueFiles(e.target.files)}
        />
        <div className="upload-icon">📄</div>
        <p className="upload-text">Arrastra imágenes/PDFs o haz clic para seleccionar</p>
        <p className="upload-hint">Soporta PDFs escaneados, imágenes y documentos de office.</p>
      </div>

      {queue.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="sort-toolbar" style={{ marginBottom: 10 }}>
            <h3 className="sort-label">Cola ({queue.filter(q => q.status === 'done').length}/{queue.length})</h3>
            <div className="toolbar-right">
              {!isProcessing ? (
                <button onClick={processQueue} disabled={!queue.some(q => q.status === 'pending')} className="btn btn-accent">Procesar</button>
              ) : (
                <button onClick={stopProcessing} className="btn-danger">Detener</button>
              )}
              <button onClick={() => setQueue([])} className="tool-btn">Limpiar</button>
            </div>
          </div>

          {queue.map(item => (
            <div key={item.id} className="uploaded-file">
              <div className="file-info">
                <span className="file-icon-box">{item.status === 'done' ? '✅' : item.status === 'error' ? '❌' : item.status === 'processing' ? '⏳' : '📄'}</span>
                <div>
                  <p className="file-name">{item.file.name}</p>
                  <p className={`file-status ${item.status === 'done' ? 'processed' : ''} ${item.status === 'error' ? 'error-status' : ''}`}>
                    {item.status === 'processing' ? <span className="processing-spinner" /> : null}
                    {item.status === 'done' && item.result
                      ? `${item.result.vendor} — ${item.result.currency} ${item.result.totalPrice.toLocaleString('es-AR')}`
                      : item.status === 'error'
                        ? item.error
                        : item.status}
                  </p>
                  {item.status === 'processing' && (
                    <div className="progress-bar-bg" style={{ marginTop: 6 }}>
                      <div className="progress-bar-fill" style={{ width: `${item.progress}%`, background: 'var(--accent)' }} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
