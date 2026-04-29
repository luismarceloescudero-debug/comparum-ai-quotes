'use client';

import React, { useRef, useState, useCallback } from 'react';
import { CloudUpload, CheckCircle, FileText, FileSpreadsheet, Upload } from 'lucide-react';
import type { Provider, LearnedRule } from '@/types';
import { extractQuote } from '@/services/extractProvider';
import { getLearnings } from '@/services/learnings';
import { getConfig } from '@/utils/config';
import { computeFileHash, getCachedResult, setCachedResult } from '@/utils/cache';

interface UploadedFile {
  name: string;
  status: 'processing' | 'done' | 'error';
  message?: string;
  type: 'provider' | 'materials';
}

interface UploadSectionProps {
  materials: string;
  onMaterialsChange: (materials: string) => void;
  onProviderExtracted: (provider: Provider) => void;
}

export default function UploadSection({ materials, onMaterialsChange, onProviderExtracted }: UploadSectionProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragover, setDragover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const materialsInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File, idx: number) => {
      try {
        const hash = await computeFileHash(file);
        const cached = getCachedResult(hash);

        if (cached) {
          onProviderExtracted(cached);
          setUploadedFiles((prev) => {
            const next = [...prev];
            next[idx] = {
              ...next[idx],
              status: 'done',
              message: `✅ (cache) ${cached.vendor} — ${cached.currency} ${cached.totalPrice.toLocaleString('es-AR')}`,
            };
            return next;
          });
          return;
        }

        const config = getConfig();
        const learnings: LearnedRule[] = getLearnings();
        const provider = await extractQuote(file, materials, learnings, config);

        setCachedResult(hash, provider);
        onProviderExtracted(provider);

        setUploadedFiles((prev) => {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            status: 'done',
            message: `✅ Proveedor importado por IA: ${provider.vendor}`,
          };
          return next;
        });
      } catch (err) {
        setUploadedFiles((prev) => {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            status: 'error',
            message: `❌ Error: ${err instanceof Error ? err.message : 'Error desconocido'}`,
          };
          return next;
        });
      }
    },
    [materials, onProviderExtracted],
  );

  const parseMaterialsFile = useCallback(async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (!ext) throw new Error('No se pudo detectar el tipo de archivo');

    if (['txt', 'csv', 'md', 'json'].includes(ext)) {
      return await file.text();
    }

    if (ext === 'xlsx' || ext === 'xls') {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const lines: string[] = [];

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet, { FS: ';' });
        if (csv.trim()) {
          lines.push(`# Hoja: ${sheetName}`);
          lines.push(csv.trim());
        }
      }

      return lines.join('\n');
    }

    throw new Error('Formato no soportado para materiales. Usá TXT, CSV o XLSX.');
  }, []);

  const handleMaterialsFile = useCallback(
    async (file: File) => {
      const idx = uploadedFiles.length;
      setUploadedFiles((prev) => [...prev, { name: file.name, status: 'processing', type: 'materials', message: 'Procesando listado…' }]);

      try {
        if (file.size > 20 * 1024 * 1024) {
          throw new Error('El archivo supera el máximo permitido (20MB)');
        }

        const parsedText = await parseMaterialsFile(file);
        const normalized = parsedText.trim();
        if (!normalized) {
          throw new Error('El archivo no contiene materiales legibles');
        }

        const nextMaterials = materials.trim() ? `${materials.trim()}\n\n${normalized}` : normalized;
        onMaterialsChange(nextMaterials);

        setUploadedFiles((prev) => {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            status: 'done',
            message: '✅ Listado de materiales cargado en el contexto del pedido',
          };
          return next;
        });
      } catch (err) {
        setUploadedFiles((prev) => {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            status: 'error',
            message: `❌ Error: ${err instanceof Error ? err.message : 'Error desconocido'}`,
          };
          return next;
        });
      }
    },
    [materials, onMaterialsChange, parseMaterialsFile, uploadedFiles.length],
  );

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      if (!files.length) return;

      const accepted = files.filter((f) => {
        const okType = [
          'application/pdf',
          'image/png',
          'image/jpeg',
          'image/webp',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ].includes(f.type);
        return okType && f.size <= 20 * 1024 * 1024;
      });

      const newEntries: UploadedFile[] = accepted.map((f) => ({
        name: f.name,
        status: 'processing',
        type: 'provider',
      }));

      const offset = uploadedFiles.length;
      setUploadedFiles((prev) => [...prev, ...newEntries]);

      await Promise.all(accepted.map((f, i) => processFile(f, offset + i)));
    },
    [processFile, uploadedFiles.length],
  );

  return (
    <section className="upload-section no-print">
      <div className="upload-title">
        <span>✨</span> Importación de archivos con IA
      </div>
      <div className="upload-subtitle">
        Subí cotizaciones en formato PDF/imagen/Office. El sistema extrae proveedor, precios y cobertura automáticamente con fallback multi-provider.
      </div>

      <div className="materials-context-box">
        <label className="materials-context-label" htmlFor="materials-context">CONTEXTO DEL PEDIDO</label>
        <textarea
          id="materials-context"
          className="materials-context-input"
          placeholder="Describe materiales, alcance y condiciones comerciales..."
          value={materials}
          onChange={(e) => onMaterialsChange(e.target.value)}
        />
        <button
          type="button"
          className="tool-btn materials-upload-btn"
          onClick={() => materialsInputRef.current?.click()}
        >
          <Upload size={14} /> Cargar listado de materiales
        </button>
        <input
          ref={materialsInputRef}
          type="file"
          className="file-input"
          accept=".txt,.csv,.xlsx,.xls,.md,.json"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleMaterialsFile(file);
            e.currentTarget.value = '';
          }}
        />
      </div>

      <div
        className={`upload-area ${dragover ? 'dragover' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragover(true);
        }}
        onDragLeave={() => setDragover(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragover(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <div className="upload-icon">
          <CloudUpload size={40} />
        </div>
        <div className="upload-text">Arrastrá archivos aquí o hacé clic para seleccionar</div>
        <div className="upload-hint">Máximo 20MB por archivo</div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="file-input"
        multiple
        accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.xlsx"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {uploadedFiles.length > 0 && (
        <div className="ai-result active">
          <div className="ai-header">
            <div className="ai-icon">
              <CheckCircle size={20} />
            </div>
            <div className="ai-title">Archivos procesados</div>
          </div>
          <div className="uploaded-files-list">
            {uploadedFiles.map((f, i) => (
              <div key={`${f.name}-${i}`} className="uploaded-file">
                <div className="file-info">
                  <div className="file-icon-box">
                    {f.type === 'materials' ? <FileSpreadsheet size={18} /> : <FileText size={18} />}
                  </div>
                  <div>
                    <div className="file-name">{f.name}</div>
                    <div className={`file-status ${f.status === 'done' ? 'processed' : f.status === 'error' ? 'error-status' : ''}`}>
                      {f.status === 'processing' ? (
                        <>
                          <span className="processing-spinner" /> Procesando...
                        </>
                      ) : (
                        f.message
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
