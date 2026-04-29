'use client';

import React, { useState, useEffect } from 'react';
import { ExtractionLog } from '@/types';
import { getLogs, clearLogs, exportLogsJSON, exportLogsCSV, importLogs } from '@/services/logs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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

  const filtered = filter === 'all' ? logs : logs.filter((l) => l.status === filter);

  const download = (content: string, type: string, fileName: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden border-[var(--border)] bg-[var(--surface)] text-[var(--text)]">
        <DialogHeader>
          <DialogTitle>Logs de extracción IA</DialogTitle>
          <DialogDescription>{logs.length} registros disponibles</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 mb-3">
          {(['all', 'success', 'error', 'cached'] as const).map((f) => (
            <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
              {f.toUpperCase()}
            </Button>
          ))}
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={() => download(exportLogsJSON(), 'application/json', `extraction-logs-${Date.now()}.json`)}>Exportar JSON</Button>
            <Button variant="outline" size="sm" onClick={() => download(exportLogsCSV(), 'text/csv', `extraction-logs-${Date.now()}.csv`)}>Exportar CSV</Button>
            <Button variant="outline" size="sm" onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json';
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) return;
                importLogs(await file.text());
                setLogs(getLogs());
              };
              input.click();
            }}>Importar</Button>
            <Button variant="destructive" size="sm" onClick={() => {
              if (confirm('¿Eliminar todos los logs?')) {
                clearLogs();
                setLogs([]);
              }
            }}>Limpiar</Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto border border-[var(--border)] rounded-md">
          <table className="quote-table w-full">
            <thead>
              <tr>
                <th>Estado</th>
                <th>Archivo</th>
                <th>Provider / Modelo</th>
                <th>Duración</th>
                <th>Fecha</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id} className={log.status === 'error' ? 'row-missing' : undefined}>
                  <td>{log.status}</td>
                  <td>{log.fileName}</td>
                  <td>{log.provider} · {log.model}</td>
                  <td>{log.durationMs}ms</td>
                  <td>{new Date(log.timestamp).toLocaleString('es-AR')}</td>
                  <td>{log.error ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
