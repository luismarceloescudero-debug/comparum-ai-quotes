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
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: 980 }}>
        <div className="modal-header">
          <div>
            <h3>📊 Logs de Extracción</h3>
            <p className="sub">{logs.length} extracciones registradas</p>
          </div>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>

        <div className="modal-body">
          <div className="sort-toolbar" style={{ marginBottom: 12 }}>
            <span style={{ color: 'var(--success)' }}>✅ {successCount} exitosas</span>
            <span style={{ color: 'var(--danger)' }}>❌ {errorCount} errores</span>
            <span style={{ color: 'var(--info)' }}>💾 {cachedCount} cache</span>
            <span style={{ color: 'var(--text-muted)' }}>⏱ Promedio: {avgDuration}ms</span>
          </div>

          <div className="sort-toolbar" style={{ marginBottom: 12 }}>
            <div className="sort-group">
              {(['all', 'success', 'error', 'cached'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`sort-btn ${filter === f ? 'active' : ''}`}
                >
                  {f === 'all' ? 'Todos' : f === 'success' ? 'Exitosos' : f === 'error' ? 'Errores' : 'Cache'}
                </button>
              ))}
            </div>
            <div className="toolbar-right">
              <button onClick={handleExportJSON} className="tool-btn">📥 JSON</button>
              <button onClick={handleExportCSV} className="tool-btn">📥 CSV</button>
              <button onClick={handleImport} className="tool-btn">📤 Importar</button>
              <button onClick={handleClear} className="tool-btn" style={{ color: 'var(--danger)' }}>🗑️ Limpiar</button>
            </div>
          </div>

          <div className="space-y-2">
            {filtered.length === 0 ? (
              <p className="text-center py-10" style={{ color: 'var(--text-muted)' }}>Sin logs registrados</p>
            ) : (
              filtered.map(log => (
                <div key={log.id} className="card p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{log.status === 'success' ? '✅' : log.status === 'error' ? '❌' : '💾'}</span>
                      <span className="text-sm font-medium">{log.fileName}</span>
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>{log.provider}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{log.model}</span>
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{log.durationMs}ms</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span>{new Date(log.timestamp).toLocaleString('es-AR')}</span>
                    {log.tokensUsed && <span>{log.tokensUsed} tokens</span>}
                  </div>
                  {log.error && (
                    <div className="missing-items" style={{ background: 'var(--danger-light)', borderLeftColor: 'var(--danger)' }}>
                      <p className="text-xs" style={{ color: 'var(--danger)' }}>{log.error}</p>
                      {log.errorDetail && (
                        <details className="mt-1">
                          <summary className="text-xs cursor-pointer" style={{ color: 'var(--danger)' }}>Detalle</summary>
                          <pre className="text-xs mt-1 overflow-x-auto" style={{ color: 'var(--text-secondary)' }}>{log.errorDetail}</pre>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
