'use client';

import React, { useState, useEffect } from 'react';
import { Provider, CoverageItem, CoverageStatus, LearnedRule } from '@/types';
import { addLearning } from '@/services/learnings';
import { v4 as uuidv4 } from 'uuid';

interface ProviderEditModalProps {
  provider: Provider;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Provider) => void;
}

const STATUS_OPTIONS: { value: CoverageStatus; label: string; icon: string }[] = [
  { value: 'covered', label: 'Cubierto', icon: '✅' },
  { value: 'supplemented', label: 'Suplemento', icon: '⚠️' },
  { value: 'missing', label: 'No incluido', icon: '❌' },
  { value: 'unknown', label: 'Sin datos', icon: '❓' },
];

export default function ProviderEditModal({ provider, isOpen, onClose, onSave }: ProviderEditModalProps) {
  const [editData, setEditData] = useState<Provider>(provider);
  const [newItemName, setNewItemName] = useState('');

  useEffect(() => {
    setEditData(provider);
  }, [provider]);

  if (!isOpen) return null;

  const updateCoverageItem = (idx: number, patch: Partial<CoverageItem>) => {
    const prev = editData.coverage[idx];
    const updated = [...editData.coverage];
    updated[idx] = { ...prev, ...patch };

    // If status changed, create a learned rule
    if (patch.status && patch.status !== prev.status) {
      addLearning({
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
    if (!newItemName.trim()) return;
    const item: CoverageItem = {
      id: uuidv4(),
      name: newItemName.trim(),
      description: '',
      status: 'covered',
    };
    setEditData({ ...editData, coverage: [...editData.coverage, item] });
    setNewItemName('');

    // Learn: this item was missing and should be added
    addLearning({
      id: uuidv4(),
      field: `coverage.${item.name}.presence`,
      expectedValue: 'absent',
      correctedValue: 'present',
      vendor: editData.vendor,
      hitCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  const removeCoverageItem = (idx: number) => {
    const item = editData.coverage[idx];
    const updated = editData.coverage.filter((_, i) => i !== idx);
    setEditData({ ...editData, coverage: updated });

    addLearning({
      id: uuidv4(),
      field: `coverage.${item.name}.presence`,
      expectedValue: 'present',
      correctedValue: 'absent',
      vendor: editData.vendor,
      hitCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-100">✏️ Editar Proveedor</h2>
            <p className="text-sm text-gray-500">{editData.vendor} — Las correcciones generan reglas de aprendizaje</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-700 text-gray-400">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Proveedor</label>
              <input
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:ring-2 focus:ring-blue-500"
                value={editData.vendor}
                onChange={e => setEditData({ ...editData, vendor: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Precio Total</label>
              <div className="flex gap-2">
                <select
                  className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-2 text-sm text-gray-200"
                  value={editData.currency}
                  onChange={e => setEditData({ ...editData, currency: e.target.value })}
                >
                  <option value="ARS">ARS</option>
                  <option value="USD">USD</option>
                </select>
                <input
                  type="number"
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:ring-2 focus:ring-blue-500"
                  value={editData.totalPrice}
                  onChange={e => setEditData({ ...editData, totalPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          {/* Coverage items */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Coberturas</h3>
            <div className="space-y-2">
              {editData.coverage.map((item, idx) => (
                <div key={item.id} className="bg-gray-900 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      className="flex-1 bg-transparent border-b border-gray-700 text-sm text-gray-200 pb-0.5 focus:border-blue-500 outline-none"
                      value={item.name}
                      onChange={e => updateCoverageItem(idx, { name: e.target.value })}
                    />
                    <select
                      className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300"
                      value={item.status}
                      onChange={e => updateCoverageItem(idx, { status: e.target.value as CoverageStatus })}
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeCoverageItem(idx)}
                      className="p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 text-sm"
                    >
                      🗑️
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      placeholder="Límite"
                      className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 placeholder-gray-600"
                      value={item.limit || ''}
                      onChange={e => updateCoverageItem(idx, { limit: e.target.value })}
                    />
                    <input
                      placeholder="Deducible"
                      className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 placeholder-gray-600"
                      value={item.deductible || ''}
                      onChange={e => updateCoverageItem(idx, { deductible: e.target.value })}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Add new item */}
            <div className="flex gap-2 mt-3">
              <input
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600"
                placeholder="Agregar cobertura…"
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCoverageItem()}
              />
              <button
                onClick={addCoverageItem}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
              >
                + Agregar
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Notas</label>
            <textarea
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 resize-y min-h-[60px]"
              value={editData.notes || ''}
              onChange={e => setEditData({ ...editData, notes: e.target.value })}
              placeholder="Notas adicionales…"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors">
            Cancelar
          </button>
          <button
            onClick={() => { onSave(editData); onClose(); }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            💾 Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}
