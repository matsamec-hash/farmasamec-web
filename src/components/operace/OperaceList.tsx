'use client';

import { useState, useMemo } from 'react';
import type { Farm, FieldOperation, ParcelRef, OperationType } from './types';
import {
  OPERATION_LABELS,
  OPERATION_COLORS,
  OPERATION_ICONS,
} from './types';
import { cn } from '@/lib/utils';
import { AlertTriangle, FileCheck } from 'lucide-react';

const ALL_TYPES: OperationType[] = ['seti', 'hnojeni', 'postrik', 'sklizen', 'orba'];

interface Props {
  operations: FieldOperation[];
  parcels: ParcelRef[];
  farms: Farm[];
}

export function OperaceList({ operations, parcels, farms }: Props) {
  const [typeFilter, setTypeFilter] = useState<OperationType | null>(null);

  const parcelMap = useMemo(
    () => Object.fromEntries(parcels.map((p) => [p.id, p])),
    [parcels],
  );
  const farmMap = useMemo(
    () => Object.fromEntries(farms.map((f) => [f.id, f])),
    [farms],
  );

  const filtered = useMemo(
    () => (typeFilter ? operations.filter((o) => o.operation_type === typeFilter) : operations),
    [operations, typeFilter],
  );

  return (
    <div>
      {/* Type filter chips */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <button
          onClick={() => setTypeFilter(null)}
          className={cn(
            'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
            typeFilter === null
              ? 'bg-gray-800 text-white border-gray-800'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400',
          )}
        >
          Vše
        </button>
        {ALL_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(typeFilter === t ? null : t)}
            className={cn(
              'flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors',
              typeFilter === t ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400',
            )}
            style={typeFilter === t ? { backgroundColor: OPERATION_COLORS[t] } : {}}
          >
            {OPERATION_ICONS[t]} {OPERATION_LABELS[t]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
          Žádné operace tohoto typu.
        </div>
      ) : (
        <div className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Datum</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Typ</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Parcela</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Plodina / Přípravek</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Plocha (ha)</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">N (kg/ha)</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Farma</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((op) => {
                  const parcel = parcelMap[op.parcel_id];
                  const farm = farmMap[op.farm_id];
                  const hasWarnings =
                    op.compliance_warnings &&
                    (() => {
                      try {
                        return (JSON.parse(op.compliance_warnings!) as unknown[]).length > 0;
                      } catch {
                        return false;
                      }
                    })();

                  return (
                    <tr key={op.id} className="hover:bg-gray-50 transition-colors">
                      {/* Date */}
                      <td className="px-4 py-3 font-mono text-gray-600 whitespace-nowrap">
                        {op.operation_date}
                      </td>

                      {/* Type badge */}
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: OPERATION_COLORS[op.operation_type] }}
                        >
                          {OPERATION_ICONS[op.operation_type]} {OPERATION_LABELS[op.operation_type]}
                        </span>
                      </td>

                      {/* Parcel */}
                      <td className="px-4 py-3">
                        {parcel ? (
                          <div>
                            <p className="font-medium text-gray-800">{parcel.nazev ?? 'Bez názvu'}</p>
                            {parcel.lpis_code && (
                              <p className="text-xs text-gray-400 font-mono">{parcel.lpis_code}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs font-mono">{op.parcel_id.slice(0, 8)}…</span>
                        )}
                      </td>

                      {/* Crop / product */}
                      <td className="px-4 py-3 text-gray-700">
                        {op.crop ?? op.fertilizer_name ?? op.por_product_name ?? (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Area */}
                      <td className="px-4 py-3 text-right font-mono text-gray-600">
                        {op.area_ha != null ? op.area_ha.toFixed(2) : '—'}
                      </td>

                      {/* N kg/ha */}
                      <td className="px-4 py-3 text-right font-mono text-gray-600">
                        {op.n_kg_per_ha != null ? op.n_kg_per_ha.toFixed(1) : '—'}
                      </td>

                      {/* Farm */}
                      <td className="px-4 py-3">
                        {farm ? (
                          <span
                            className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: farm.color }}
                          >
                            {farm.name}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Flags */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {hasWarnings && (
                            <span title="Compliance upozornění">
                              <AlertTriangle size={14} className="text-amber-500" />
                            </span>
                          )}
                          {op.exported_at && (
                            <span title="Exportováno do EPH">
                              <FileCheck size={14} className="text-green-500" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
