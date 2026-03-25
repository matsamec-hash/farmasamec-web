'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Farm, FieldOperation, ParcelRef, OperationType } from './types';
import { OPERATION_LABELS, OPERATION_ICONS, CROP_OPTIONS } from './types';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const OP_TYPES: OperationType[] = ['seti', 'hnojeni', 'postrik', 'sklizen', 'orba'];

interface Props {
  farms: Farm[];
  parcels: ParcelRef[];
  onClose: () => void;
  onSaved: (op: FieldOperation) => void;
}

export function OperaceNewForm({ farms, parcels, onClose, onSaved }: Props) {
  const [farmId, setFarmId] = useState(farms[0]?.id ?? '');
  const [parcelId, setParcelId] = useState('');
  const [opType, setOpType] = useState<OperationType>('seti');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [crop, setCrop] = useState('');
  const [fertilizerName, setFertilizerName] = useState('');
  const [nKgPerHa, setNKgPerHa] = useState('');
  const [pKgPerHa, setPKgPerHa] = useState('');
  const [kKgPerHa, setKKgPerHa] = useState('');
  const [doseKgPerHa, setDoseKgPerHa] = useState('');
  const [doseLPerHa, setDoseLPerHa] = useState('');
  const [porProductName, setPorProductName] = useState('');
  const [yieldTPerHa, setYieldTPerHa] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const farmParcels = parcels.filter((p) => p.farm_id === farmId);
  const selectedParcel = farmParcels.find((p) => p.id === parcelId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!parcelId) { setError('Vyberte parcelu.'); return; }

    setSaving(true);
    setError(null);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const payload = {
      id,
      farm_id: farmId,
      parcel_id: parcelId,
      operation_type: opType,
      operation_date: date,
      crop: crop || null,
      fertilizer_name: fertilizerName || null,
      n_kg_per_ha: nKgPerHa ? parseFloat(nKgPerHa) : null,
      p_kg_per_ha: pKgPerHa ? parseFloat(pKgPerHa) : null,
      k_kg_per_ha: kKgPerHa ? parseFloat(kKgPerHa) : null,
      dose_kg_per_ha: doseKgPerHa ? parseFloat(doseKgPerHa) : null,
      dose_l_per_ha: doseLPerHa ? parseFloat(doseLPerHa) : null,
      area_ha: selectedParcel?.vymera ?? null,
      por_product_name: porProductName || null,
      yield_t_per_ha: yieldTPerHa ? parseFloat(yieldTPerHa) : null,
      notes: notes || null,
      compliance_warnings: null,
      exported_at: null,
      created_at: now,
    };

    const supabase = createClient();
    const { error: dbError } = await supabase.from('field_operations').insert(payload);

    if (dbError) {
      setError(dbError.message);
      setSaving(false);
      return;
    }

    onSaved(payload as FieldOperation);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Nová operace</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Operation type */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Typ operace
            </label>
            <div className="flex flex-wrap gap-2">
              {OP_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setOpType(t)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                    opType === t
                      ? 'bg-[#7c9a6e] text-white border-[#7c9a6e]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400',
                  )}
                >
                  {OPERATION_ICONS[t]} {OPERATION_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <Field label="Datum">
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c9a6e]/30 focus:border-[#7c9a6e]"
            />
          </Field>

          {/* Farm */}
          {farms.length > 1 && (
            <Field label="Farma">
              <select
                value={farmId}
                onChange={(e) => { setFarmId(e.target.value); setParcelId(''); }}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c9a6e]/30 focus:border-[#7c9a6e] bg-white"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </Field>
          )}

          {/* Parcel */}
          <Field label="Parcela *">
            <select
              value={parcelId}
              onChange={(e) => setParcelId(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c9a6e]/30 focus:border-[#7c9a6e] bg-white"
            >
              <option value="">— Vyberte parcelu —</option>
              {farmParcels.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nazev ?? 'Bez názvu'}{p.lpis_code ? ` (${p.lpis_code})` : ''}{p.vymera ? ` — ${p.vymera.toFixed(2)} ha` : ''}
                </option>
              ))}
            </select>
            {selectedParcel?.is_in_nvz && (
              <p className="text-xs text-blue-600 mt-1">⚠ Parcela leží v nitrátové zranitelné zóně</p>
            )}
          </Field>

          {/* Crop (seti, sklizen) */}
          {(opType === 'seti' || opType === 'sklizen') && (
            <Field label="Plodina">
              <select
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c9a6e]/30 focus:border-[#7c9a6e] bg-white"
              >
                <option value="">— Vyberte plodinu —</option>
                {CROP_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>
          )}

          {/* Fertilizer fields (hnojeni) */}
          {opType === 'hnojeni' && (
            <>
              <Field label="Název hnojiva">
                <input
                  type="text"
                  value={fertilizerName}
                  onChange={(e) => setFertilizerName(e.target.value)}
                  placeholder="např. DAM 390, Ledek amonný"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c9a6e]/30 focus:border-[#7c9a6e]"
                />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="N (kg/ha)">
                  <input type="number" step="0.1" min="0" value={nKgPerHa} onChange={(e) => setNKgPerHa(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c9a6e]/30 focus:border-[#7c9a6e]" />
                </Field>
                <Field label="P (kg/ha)">
                  <input type="number" step="0.1" min="0" value={pKgPerHa} onChange={(e) => setPKgPerHa(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c9a6e]/30 focus:border-[#7c9a6e]" />
                </Field>
                <Field label="K (kg/ha)">
                  <input type="number" step="0.1" min="0" value={kKgPerHa} onChange={(e) => setKKgPerHa(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c9a6e]/30 focus:border-[#7c9a6e]" />
                </Field>
              </div>
              <Field label="Dávka (kg/ha)">
                <input type="number" step="0.1" min="0" value={doseKgPerHa} onChange={(e) => setDoseKgPerHa(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c9a6e]/30 focus:border-[#7c9a6e]" />
              </Field>
            </>
          )}

          {/* POR fields (postrik) */}
          {opType === 'postrik' && (
            <>
              <Field label="Název přípravku">
                <input
                  type="text"
                  value={porProductName}
                  onChange={(e) => setPorProductName(e.target.value)}
                  placeholder="Registrovaný název POR"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c9a6e]/30 focus:border-[#7c9a6e]"
                />
              </Field>
              <Field label="Dávka (l/ha)">
                <input type="number" step="0.01" min="0" value={doseLPerHa} onChange={(e) => setDoseLPerHa(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c9a6e]/30 focus:border-[#7c9a6e]" />
              </Field>
            </>
          )}

          {/* Yield (sklizen) */}
          {opType === 'sklizen' && (
            <Field label="Výnos (t/ha)">
              <input type="number" step="0.01" min="0" value={yieldTPerHa} onChange={(e) => setYieldTPerHa(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c9a6e]/30 focus:border-[#7c9a6e]" />
            </Field>
          )}

          {/* Notes */}
          <Field label="Poznámka">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c9a6e]/30 focus:border-[#7c9a6e] resize-none"
            />
          </Field>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Zrušit
          </button>
          <button
            form="operace-form"
            type="submit"
            disabled={saving}
            onClick={(e) => {
              e.preventDefault();
              const form = document.querySelector('form');
              form?.requestSubmit();
            }}
            className="px-5 py-2 bg-[#7c9a6e] hover:bg-[#6a8860] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Ukládám…' : 'Uložit operaci'}
          </button>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
