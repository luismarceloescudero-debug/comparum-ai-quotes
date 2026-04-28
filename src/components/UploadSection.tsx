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

  // ── helpers ───────────────────────────────────────────────
  const updateQueueItem = (id: string, patch: Partial<QueueItem>) =>
    setQueue(prev => prev.map(q => (q.id === id ? { ...q, ...patch } : q)));

  const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

  // ── file validation ───────────────────────────────────────
  const validateFile = (file: File): boolean => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert(`Tipo de archivo no soportado: ${file.type}\nUse PDF, PNG, JPG, WEBP, XLSX o DOCX.`);
      return false;
    }
    if (file.size > 20 * 1024 * 1024) {
      alert('El archivo excede 20 MB.');
      return false;
    }
    return true;
  };

  // ── add files to queue ────────────────────────────────────
  const enqueueFiles = (files: FileList | File[]) => {
    const items: QueueItem[] = Array.from(files)
      .filter(validateFile)
      .map(file => ({ id: uuidv4(), file, status: 'pending' as const, progress: 0 }));
    if (items.length) setQueue(prev => [...prev, ...items]);
  };

  // ── process queue ─────────────────────────────────────────
  const processQueue = useCallback(async () => {
    setIsProcessing(true);
    abortRef.current = false;
    const config = getConfig();
    const learnings: LearnedRule[] = getLearnings();

    const pending = queue.filter(q => q.status === 'pending');
    for (const item of pending) {
      if (abortRef.current) break;

      // Check cache
      const hash = await computeFileHash(item.file);
      const cached = getCachedResult(hash);
      if (cached) {
        updateQueueItem(item.id, { status: 'done', progress: 100, result: cached });
        onProviderExtracted(cached);
        await delay(500);
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
        updateQueueItem(item.id, { status: 'error', error: err.message ?? 'Unknown error' });
      }

      // Rate-limit delay between files
      if (!abortRef.current) await delay(config.rateLimitDelayMs);
    }
    setIsProcessing(false);
  }, [queue, materials, onProviderExtracted]);

  const stopProcessing = () => { abortRef.current = true; };

  // ── drag & drop handlers ──────────────────────────────────
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    enqueueFiles(e.dataTransfer.files);
  };

  // ── render ────────────────────────────────────────────────
  return (
    <section className="space-y-6">
      {/* Materials textarea */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          📋 Materiales / Descripción del riesgo
        </label>
        <textarea
          className="w-full rounded-lg bg-gray-800 border border-gray-700 p-3 text-sm text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[80px]"
          rows={3}
          placeholder="Describa los materiales o riesgos a cotizar…"
          value={materials}
          onChange={e => onMaterialsChange(e.target.value)}
        />
      </div>

      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all
          ${isDragging
            ? 'border-blue-400 bg-blue-500/10 scale-[1.01]'
            : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'}
        `}
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
        <p className="text-gray-300 font-medium">
          Arrastre archivos aquí o haga clic para seleccionar
        </p>
        <p className="text-gray-500 text-sm mt-1">
          PDF, imágenes (PNG/JPG/WEBP), XLSX, DOCX — máx 20 MB
        </p>
      </div>

      {/* Queue display */}
      {queue.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-400">
              Cola de extracción ({queue.filter(q => q.status === 'done').length}/{queue.length})
            </h3>
            <div className="flex gap-2">
              {!isProcessing ? (
                <button
                  onClick={processQueue}
                  disabled={!queue.some(q => q.status === 'pending')}
                  className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-lg font-medium transition-colors"
                >
                  ▶ Procesar cola
                </button>
              ) : (
                <button
                  onClick={stopProcessing}
                  className="px-4 py-1.5 text-sm bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
                >
                  ⏹ Detener
                </button>
              )}
              <button
                onClick={() => setQueue([])}
                className="px-4 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>

          {queue.map(item => (
            <div key={item.id} className="bg-gray-800 rounded-lg p-3 flex items-center gap-3">
              <span className="text-lg">
                {item.status === 'done' ? '✅' : item.status === 'error' ? '❌' : item.status === 'processing' ? '⏳' : '📄'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 truncate">{item.file.name}</p>
                {item.status === 'processing' && (
                  <div className="mt-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
                {item.status === 'error' && (
                  <p className="text-xs text-red-400 mt-0.5">{item.error}</p>
                )}
                {item.status === 'done' && item.result && (
                  <p className="text-xs text-green-400 mt-0.5">
                    {item.result.vendor} — {item.result.currency} {item.result.totalPrice.toLocaleString()}
                  </p>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {(item.file.size / 1024).toFixed(0)} KB
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
