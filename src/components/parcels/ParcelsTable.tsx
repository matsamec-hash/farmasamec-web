'use client';

import { KULTURA_LABELS, KULTURA_COLORS } from '@/lib/shared/kulturaCodes';
import type { Parcel, Farm } from './ParcelsClientPage';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface Props {
  parcels: Parcel[];
  farms: Farm[];
  selectedParcelId: string | null;
  onSelectParcel: (id: string | null) => void;
}

export function ParcelsTable({ parcels, farms, selectedParcelId, onSelectParcel }: Props) {
  const farmMap = Object.fromEntries(farms.map((f) => [f.id, f]));

  return (
    <div className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                Název / DPB kód
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                Kultura
              </th>
              <th className="text-right px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                Výměra (ha)
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                Plodina
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                Farma
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                Příznaky
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {parcels.map((parcel) => {
              const farm = farmMap[parcel.farm_id];
              const kulturaLabel = parcel.kultura
                ? (KULTURA_LABELS[parcel.kultura] ?? parcel.kultura)
                : '—';
              const kulturaColor = parcel.kultura
                ? (KULTURA_COLORS[parcel.kultura] ?? '#ccc')
                : '#ccc';
              const isSelected = selectedParcelId === parcel.id;

              return (
                <tr
                  key={parcel.id}
                  onClick={() => onSelectParcel(isSelected ? null : parcel.id)}
                  className={cn(
                    'cursor-pointer transition-colors',
                    isSelected ? 'bg-green-50' : 'hover:bg-gray-50',
                  )}
                >
                  {/* Name / LPIS code */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">
                      {parcel.nazev ?? 'Bez názvu'}
                    </p>
                    {parcel.lpis_code && (
                      <p className="text-xs text-gray-400 font-mono">{parcel.lpis_code}</p>
                    )}
                  </td>

                  {/* Kultura */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: kulturaColor }}
                      />
                      <span className="text-gray-700">{kulturaLabel}</span>
                    </div>
                  </td>

                  {/* Vymera */}
                  <td className="px-4 py-3 text-right font-mono text-gray-700">
                    {parcel.vymera != null ? parcel.vymera.toFixed(4) : '—'}
                  </td>

                  {/* Current crop */}
                  <td className="px-4 py-3 text-gray-600">
                    {parcel.current_crop ?? <span className="text-gray-300">—</span>}
                  </td>

                  {/* Farm */}
                  <td className="px-4 py-3">
                    {farm ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: farm.color }}
                      >
                        {farm.name}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>

                  {/* Flags */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {parcel.is_in_nvz && (
                        <Badge className="text-[10px] bg-blue-100 text-blue-700 border-0 px-1.5 py-0">
                          NVZ
                        </Badge>
                      )}
                      {parcel.eko && (
                        <Badge className="text-[10px] bg-green-100 text-green-700 border-0 px-1.5 py-0">
                          EKO
                        </Badge>
                      )}
                      {parcel.erozohro && parcel.erozohro !== 'NEO' && (
                        <Badge className="text-[10px] bg-orange-100 text-orange-700 border-0 px-1.5 py-0 flex items-center gap-0.5">
                          <AlertTriangle size={9} />
                          {parcel.erozohro}
                        </Badge>
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
  );
}
