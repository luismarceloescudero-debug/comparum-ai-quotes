'use client';

import React, { useState, useEffect } from 'react';
import { Provider, CoverageItem, CoverageStatus } from '@/types';
import { addLearning } from '@/services/learnings';
import { v4 as uuidv4 } from 'uuid';

interface ProviderEditModalProps {
  provider: Provider;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Provider) => void;
}

const STATUS_OPTIONS: { value: CoverageStatus; label: string }[] = [
  { value: 'covered', label: '✅ Cubierto' },
  { value: 'supplemented', label: '⚠️ Parcial' },
  { value: 'missing', label: '❌ Excluido' },
  { value: 'unknown', label: '➖ N/D' },
];

export default function ProviderEditModal({ provider, isOpen, onClose, onSave }: ProviderEditModalProps) {
  const [editData, setEditData] = useState<Provider>(provider);

  useEffect(() => {
    setEditData(provider);
  }, [provider]);

  if (!isOpen) return null;

  const updateCoverageItem = async (idx: number, patch: Partial<CoverageItem>) => {
    const prev = editData.coverage[idx];
    const updated = [...editData.coverage];
    updated[idx] = { ...prev, ...patch };

    if (patch.status && patch.status !== prev.status) {
      await addLearning({
        id: uuidv4(),
        field: `coverage.${prev.name}.status`,
        expectedValue: prev.status,
        correctedValue: patch.status,
        vendor: editData.vendor,
        hitCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    setEditData({ ...editData, coverage: updated });
  };

  const addCoverageItem = () => {
    const item: CoverageItem = { id: uuidv4(), name: 'Nueva cobertura', status: 'covered' };
    setEditData((prev) => ({ ...prev, coverage: [...prev.coverage, item] }));
  };

  const removeCoverageItem = (idx: number) => {
    setEditData((prev) => ({ ...prev, coverage: prev.coverage.filter((_, i) => i !== idx) }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="card w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <h3 className="font-semibold">Editar cotización de {editData.vendor}</h3>
          <button onClick={onClose} className="btn-secondary !px-2 !py-1">✕</button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input className="input-field" value={editData.vendor} onChange={(e) => setEditData({ ...editData, vendor: e.target.value })} />
            <div className="flex gap-2">
              <select className="input-field" value={editData.currency} onChange={(e) => setEditData({ ...editData, currency: e.target.value })}>
                <option value="USD">USD</option>
                <option value="ARS">ARS</option>
                <option value="EUR">EUR</option>
              </select>
              <input className="input-field" type="number" value={editData.totalPrice} onChange={(e) => setEditData({ ...editData, totalPrice: Number(e.target.value) || 0 })} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <p className="text-sm font-medium">Coberturas</p>
              <button className="btn-secondary !py-1 !px-2" onClick={addCoverageItem}>+ agregar</button>
            </div>
            {editData.coverage.map((item, idx) => (
              <div key={item.id} className="card p-3 space-y-2">
                <div className="flex gap-2">
                  <input className="input-field" value={item.name} onChange={(e) => updateCoverageItem(idx, { name: e.target.value })} />
                  <select className="input-field" value={item.status} onChange={(e) => updateCoverageItem(idx, { status: e.target.value as CoverageStatus })}>
                    {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  <button className="btn-secondary !px-2" onClick={() => removeCoverageItem(idx)}>🗑️</button>
                </div>
                <input className="input-field" placeholder="Descripción" value={item.description || ''} onChange={(e) => updateCoverageItem(idx, { description: e.target.value })} />
              </div>
            ))}
          </div>

          <textarea className="input-field min-h-[80px]" placeholder="Notas" value={editData.notes || ''} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} />
        </div>

        <div className="p-4 border-t border-[var(--border)] flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            className="btn-primary"
            onClick={() => {
              onSave(editData);
              onClose();
            }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
