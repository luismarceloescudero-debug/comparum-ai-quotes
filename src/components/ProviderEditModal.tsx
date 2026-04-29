'use client';

import React, { useState, useEffect } from 'react';
import { Provider, CoverageItem, CoverageStatus } from '@/types';
import { addLearning } from '@/services/learnings';
import { v4 as uuidv4 } from 'uuid';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-[var(--border)] bg-[var(--surface)] text-[var(--text)]">
        <DialogHeader>
          <DialogTitle>Editar cotización de {editData.vendor}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <Input value={editData.vendor} onChange={(e) => setEditData({ ...editData, vendor: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <Select value={editData.currency} onValueChange={(value) => setEditData({ ...editData, currency: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="ARS">ARS</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
              <Input type="number" value={editData.totalPrice} onChange={(e) => setEditData({ ...editData, totalPrice: Number(e.target.value) || 0 })} />
            </div>
          </div>

          <div className="space-y-2">
            {editData.coverage.map((item, idx) => (
              <div key={item.id} className="border border-[var(--border)] rounded-md p-2 space-y-2">
                <div className="grid md:grid-cols-[1fr_220px_44px] gap-2">
                  <Input value={item.name} onChange={(e) => updateCoverageItem(idx, { name: e.target.value })} />
                  <Select value={item.status} onValueChange={(value) => updateCoverageItem(idx, { status: value as CoverageStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => setEditData((prev) => ({ ...prev, coverage: prev.coverage.filter((_, i) => i !== idx) }))}>🗑️</Button>
                </div>
                <Input value={item.description || ''} placeholder="Descripción" onChange={(e) => updateCoverageItem(idx, { description: e.target.value })} />
              </div>
            ))}
            <Button variant="outline" onClick={() => setEditData((prev) => ({ ...prev, coverage: [...prev.coverage, { id: uuidv4(), name: 'Nueva cobertura', status: 'covered' }] }))}>+ Agregar cobertura</Button>
          </div>

          <Textarea value={editData.notes || ''} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} placeholder="Notas" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => { onSave(editData); onClose(); }}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
