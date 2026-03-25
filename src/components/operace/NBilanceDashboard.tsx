'use client';

import { useMemo } from 'react';
import type { Farm, FieldOperation, ParcelRef } from './types';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// NVZ limit — simplified: per parcel crop, use H2 (medium) as default if unknown
const NVZ_N_LIMITS: Record<string, number> = {
  psenice: 200,
  jecmen: 140,
  zito: 150,
  oves: 130,
  tritikale: 150,
  repka: 200,
  kukurice: 210,
  soja: 60,
  cukrovka: 190,
  brambory: 160,
  slunecnice: 100,
  hrach: 30,
  bob: 30,
  jetel: 40,
  vojteska: 40,
  ttp: 150,
  travni_smes: 150,
  default: 180,
};

interface ParcelNBalance {
  parcel: ParcelRef;
  totalN: number;
  limit: number | null;
  isNvz: boolean;
  overLimit: boolean;
  percentUsed: number | null;
}

interface Props {
  operations: FieldOperation[];
  parcels: ParcelRef[];
  farms: Farm[];
}

const CURRENT_YEAR = new Date().getFullYear();

export function NBilanceDashboard({ operations, parcels, farms }: Props) {
  const farmMap = useMemo(
    () => Object.fromEntries(farms.map((f) => [f.id, f])),
    [farms],
  );

  // N applied per parcel this calendar year (hnojeni only)
  const balances = useMemo<ParcelNBalance[]>(() => {
    const nByParcel: Record<string, number> = {};

    for (const op of operations) {
      if (op.operation_type !== 'hnojeni') continue;
      const year = parseInt(op.operation_date.slice(0, 4), 10);
      if (year !== CURRENT_YEAR) continue;
      if (!op.n_kg_per_ha || !op.area_ha) continue;
      nByParcel[op.parcel_id] = (nByParcel[op.parcel_id] ?? 0) + op.n_kg_per_ha;
    }

    return parcels
      .filter((p) => p.vymera && p.vymera > 0)
      .map((parcel) => {
        const totalN = nByParcel[parcel.id] ?? 0;
        const crop = parcel.kultura
          ? {
              R: 'psenice',
              TTP: 'ttp',
              T: 'ttp',
            }[parcel.kultura] ?? 'default'
          : 'default';

        const limit = parcel.is_in_nvz ? (NVZ_N_LIMITS[crop] ?? NVZ_N_LIMITS.default) : null;
        const overLimit = limit != null && totalN > limit;
        const percentUsed = limit != null && limit > 0 ? (totalN / limit) * 100 : null;

        return { parcel, totalN, limit, isNvz: parcel.is_in_nvz, overLimit, percentUsed };
      })
      .sort((a, b) => {
        // Over limit first, then by N desc
        if (a.overLimit !== b.overLimit) return a.overLimit ? -1 : 1;
        return b.totalN - a.totalN;
      });
  }, [operations, parcels]);

  const totalNApplied = useMemo(
    () => balances.reduce((sum, b) => sum + b.totalN * (b.parcel.vymera ?? 0), 0),
    [balances],
  );
  const overLimitCount = balances.filter((b) => b.overLimit).length;

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard icon="🌿" label="Parcely sledovány" value={`${balances.length}`} />
        <SummaryCard
          icon="💧"
          label={`N aplikováno ${CURRENT_YEAR} (kg)`}
          value={totalNApplied > 0 ? totalNApplied.toFixed(0) : '—'}
        />
        <SummaryCard
          icon="⚠️"
          label="Překročení NVZ limitu"
          value={`${overLimitCount}`}
          alert={overLimitCount > 0}
        />
        <SummaryCard
          icon="✅"
          label="V limitech"
          value={`${balances.filter((b) => b.isNvz && !b.overLimit && b.totalN > 0).length}`}
        />
      </div>

      {/* Per-parcel table */}
      {balances.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
          Žádné parcely. Data se zobrazí po synchronizaci.
        </div>
      ) : (
        <div className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              N bilance parcel — rok {CURRENT_YEAR}
            </p>
            <p className="text-xs text-gray-400">Pouze parcely v NVZ mají limit</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Parcela</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Farma</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">N aplikováno (kg/ha)</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Limit NVZ</th>
                  <th className="px-4 py-3 w-40 font-semibold text-gray-500 text-xs uppercase tracking-wide">Stav</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {balances.map(({ parcel, totalN, limit, isNvz, overLimit, percentUsed }) => {
                  const farm = farmMap[parcel.farm_id];
                  return (
                    <tr
                      key={parcel.id}
                      className={cn('transition-colors', overLimit ? 'bg-red-50' : 'hover:bg-gray-50')}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{parcel.nazev ?? 'Bez názvu'}</p>
                        {parcel.lpis_code && (
                          <p className="text-xs text-gray-400 font-mono">{parcel.lpis_code}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {farm ? (
                          <span
                            className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: farm.color }}
                          >
                            {farm.name}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-gray-800">
                        {totalN > 0 ? totalN.toFixed(1) : <span className="text-gray-300 font-normal">0</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-600">
                        {isNvz && limit != null ? (
                          limit
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!isNvz ? (
                          <span className="text-xs text-gray-400">Mimo NVZ</span>
                        ) : totalN === 0 ? (
                          <span className="text-xs text-gray-400">Bez hnojení</span>
                        ) : overLimit ? (
                          <div className="flex items-center gap-1 text-red-600">
                            <AlertTriangle size={13} />
                            <span className="text-xs font-semibold">
                              Překročeno +{(totalN - limit!).toFixed(0)} kg/ha
                            </span>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <CheckCircle2 size={13} className="text-green-500" />
                              <span className="text-xs text-green-700">
                                {(limit! - totalN).toFixed(0)} kg/ha volno
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all',
                                  percentUsed! > 80 ? 'bg-amber-400' : 'bg-green-400',
                                )}
                                style={{ width: `${Math.min(percentUsed!, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
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

function SummaryCard({
  icon,
  label,
  value,
  alert,
}: {
  icon: string;
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border shadow-sm p-4',
        alert ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100',
      )}
    >
      <p className="text-2xl mb-1">{icon}</p>
      <p className={cn('text-xl font-bold', alert ? 'text-red-700' : 'text-gray-800')}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
