'use client';

import React, { useState, useEffect } from 'react';
import { ExtractionLog } from '@/types';
import { getLogs, clearLogs, exportLogsJSON, exportLogsCSV, importLogs } from '@/services/logs';

interface AILogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AILogModal({ isOpen, onClose }: AILogModalProps) {
  const [logs, setLogs] = useState<ExtractionLog[]>([]);
  const [filter, setFilter] = useState<'all' | 'success' | 'error' | 'cached'>('all');

  useEffect(() => {
    if (isOpen) setLogs(getLogs());
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = filter === 'all' ? logs : logs.filter(l => l.status === filter);
  const successCount = logs.filter(l => l.status === 'success').length;
  const errorCount = logs.filter(l => l.status === 'error').length;
  const cachedCount = logs.filter(l => l.status === 'cached').length;
  const avgDuration = logs.length > 0
    ? Math.round(logs.reduce((s, l) => s + l.durationMs, 0) / logs.length)
    : 0;

  const handleExportJSON = () => {
    const blob = new Blob([exportLogsJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `extraction-logs-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const blob = new Blob([exportLogsCSV()], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `extraction-logs-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      importLogs(text);
      setLogs(getLogs());
    };
    input.click();
  };

  const handleClear = () => {
    if (confirm('¿Está seguro de que desea eliminar todos los logs?')) {
      clearLogs();
      setLogs([]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-100">📊 Logs de Extracción</h2>
            <p className="text-sm text-gray-500">{logs.length} extracciones registradas</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-700 text-gray-400">✕</button>
        </div>

        {/* Stats bar */}
        <div className="px-5 py-3 border-b border-gray-700 flex flex-wrap gap-4 text-sm">
          <span className="text-green-400">✅ {successCount} exitosas</span>
          <span className="text-red-400">❌ {errorCount} errores</span>
          <span className="text-blue-400">💾 {cachedCount} cache</span>
          <span className="text-gray-400">⏱ Promedio: {avgDuration}ms</span>
        </div>

        {/* Toolbar */}
        <div className="px-5 py-3 border-b border-gray-700 flex items-center justify-between flex-wrap gap-2">
          <div className="flex gap-1">
            {(['all', 'success', 'error', 'cached'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filter === f ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {f === 'all' ? 'Todos' : f === 'success' ? 'Exitosos' : f === 'error' ? 'Errores' : 'Cache'}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleExportJSON} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-gray-300 transition-colors">
              📥 JSON
            </button>
            <button onClick={handleExportCSV} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-gray-300 transition-colors">
              📥 CSV
            </button>
            <button onClick={handleImport} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-gray-300 transition-colors">
              📤 Importar
            </button>
            <button onClick={handleClear} className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-xs text-red-400 transition-colors">
              🗑️ Limpiar
            </button>
          </div>
        </div>

        {/* Log list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-600 py-10">Sin logs registrados</p>
          ) : (
            filtered.map(log => (
              <div key={log.id} className="bg-gray-900 rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {log.status === 'success' ? '✅' : log.status === 'error' ? '❌' : '💾'}
                    </span>
                    <span className="text-sm text-gray-200 font-medium">{log.fileName}</span>
                    <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{log.provider}</span>
                    <span className="text-xs text-gray-600">{log.model}</span>
                  </div>
                  <span className="text-xs text-gray-500">{log.durationMs}ms</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{new Date(log.timestamp).toLocaleString('es-AR')}</span>
                  {log.tokensUsed && <span>{log.tokensUsed} tokens</span>}
                </div>
                {log.error && (
                  <div className="mt-1 bg-red-500/10 border border-red-500/20 rounded p-2">
                    <p className="text-xs text-red-400">{log.error}</p>
                    {log.errorDetail && (
                      <details className="mt-1">
                        <summary className="text-xs text-red-500 cursor-pointer">Detalle</summary>
                        <pre className="text-xs text-red-300 mt-1 overflow-x-auto">{log.errorDetail}</pre>
                      </details>
                    )}
                  </div>
                )}
                {log.responsePreview && log.status === 'success' && (
                  <details className="mt-1">
                    <summary className="text-xs text-gray-500 cursor-pointer">Vista previa</summary>
                    <pre className="text-xs text-gray-400 mt-1 bg-gray-800 rounded p-2 overflow-x-auto max-h-32">
                      {log.responsePreview}
                    </pre>
                  </details>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
