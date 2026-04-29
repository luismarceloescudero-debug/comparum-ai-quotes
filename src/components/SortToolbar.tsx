'use client';

import { ArrowDownWideNarrow, Printer, RotateCcw, Trash2 } from 'lucide-react';
import { SortCriteria } from '@/types';

interface SortToolbarProps {
  sortKey: SortCriteria;
  onSortChange: (key: SortCriteria) => void;
  onResetAll: () => void;
  onPrintAll: () => void;
  onClearProviders: () => void;
}

const SORTS: { key: SortCriteria; label: string }[] = [
  { key: 'price-asc', label: 'Precio ↑' },
  { key: 'price-desc', label: 'Precio ↓' },
  { key: 'coverage', label: 'Cobertura' },
  { key: 'quality', label: 'Calidad' },
  { key: 'date', label: 'Fecha' },
];

export default function SortToolbar({ sortKey, onSortChange, onResetAll, onPrintAll, onClearProviders }: SortToolbarProps) {
  return (
    <section className="sort-toolbar no-print">
      <span className="sort-label">
        <ArrowDownWideNarrow size={14} style={{ marginRight: 4 }} />
        Ordenar por:
      </span>

      <div className="sort-group">
        {SORTS.map((sort) => (
          <button
            key={sort.key}
            className={`sort-btn ${sortKey === sort.key ? 'active' : ''}`}
            onClick={() => onSortChange(sort.key)}
            type="button"
          >
            {sort.label}
          </button>
        ))}
      </div>

      <div className="toolbar-right">
        <button className="tool-btn" onClick={onPrintAll} type="button">
          <Printer size={13} /> Imprimir
        </button>
        <button className="tool-btn" onClick={onClearProviders} type="button">
          <Trash2 size={13} /> Limpiar tarjetas
        </button>
        <button className="tool-btn" onClick={onResetAll} type="button">
          <RotateCcw size={13} /> Resetear
        </button>
      </div>
    </section>
  );
}
