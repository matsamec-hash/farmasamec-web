'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, Clock, CheckCircle2, Wrench } from 'lucide-react';

export interface Farm { id: string; name: string; color: string; is_eco: boolean; }
export interface Machine {
  id: string; farm_id: string; name: string; type: string | null;
  registration: string | null; inventory_number: string | null;
  year_of_manufacture: number | null; power_hp: number | null;
  motor_hours: number; fuel_consumption_lh: number | null;
  work_width_m: number | null; created_at: string;
}
export interface ServiceRecord {
  id: string; farm_id: string; machine_id: string; service_type: string;
  service_date: string; stk_result: string | null; stk_valid_until: string | null;
  description: string | null; cost_czk: number | null; technician: string | null;
  next_service_date: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  tractor: 'Traktor', combine: 'Kombajn', sprayer: 'Postřikovač',
  loader: 'Nakladač', implement: 'Nářadí', spreader: 'Rozmetadlo',
  trailer: 'Vlek / Návěs', other: 'Ostatní',
};
const TYPE_ICONS: Record<string, string> = {
  tractor: '🚜', combine: '🌾', sprayer: '💧', loader: '🏗️',
  implement: '⚙️', spreader: '🌱', trailer: '🚛', other: '🔧',
};

interface MachineWithStatus extends Machine {
  latestStk: ServiceRecord | null;
  latestService: ServiceRecord | null;
  stkStatus: 'ok' | 'expiring' | 'expired' | 'none';
  daysUntilStk: number | null;
  nextServiceDate: string | null;
}

export function StrojeClientPage({ farms, machines, serviceRecords }: {
  farms: Farm[]; machines: Machine[]; serviceRecords: ServiceRecord[];
}) {
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const farmMap = useMemo(() => Object.fromEntries(farms.map(f => [f.id, f])), [farms]);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Group service records by machine
  const serviceByMachine = useMemo(() => {
    const map: Record<string, ServiceRecord[]> = {};
    for (const s of serviceRecords) {
      if (!map[s.machine_id]) map[s.machine_id] = [];
      map[s.machine_id].push(s);
    }
    return map;
  }, [serviceRecords]);

  const machinesWithStatus = useMemo<MachineWithStatus[]>(() => {
    return machines.map(m => {
      const records = serviceByMachine[m.id] ?? [];
      const stkRecords = records.filter(r => r.service_type === 'stk').sort((a, b) => b.service_date.localeCompare(a.service_date));
      const latestStk = stkRecords[0] ?? null;
      const latestService = records.sort((a, b) => b.service_date.localeCompare(a.service_date))[0] ?? null;
      const nextServiceDates = records.map(r => r.next_service_date).filter((d): d is string => !!d).sort();
      const nextServiceDate = nextServiceDates[0] ?? null;

      let stkStatus: MachineWithStatus['stkStatus'] = 'none';
      let daysUntilStk: number | null = null;

      if (latestStk?.stk_valid_until) {
        const days = Math.round((new Date(latestStk.stk_valid_until).getTime() - new Date(today).getTime()) / 86400000);
        daysUntilStk = days;
        stkStatus = days < 0 ? 'expired' : days <= 30 ? 'expiring' : 'ok';
      }

      return { ...m, latestStk, latestService, stkStatus, daysUntilStk, nextServiceDate };
    });
  }, [machines, serviceByMachine, today]);

  const filtered = useMemo(() => {
    let r = machinesWithStatus;
    if (selectedFarmId) r = r.filter(m => m.farm_id === selectedFarmId);
    if (typeFilter) r = r.filter(m => m.type === typeFilter);
    return r;
  }, [machinesWithStatus, selectedFarmId, typeFilter]);

  const availableTypes = useMemo(() => [...new Set(machines.map(m => m.type).filter(Boolean))] as string[], [machines]);
  const expiredStk = filtered.filter(m => m.stkStatus === 'expired').length;
  const expiringStk = filtered.filter(m => m.stkStatus === 'expiring').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-0.5">Stroje</h1>
          <p className="text-sm text-gray-500">{filtered.length} strojů</p>
        </div>
      </div>

      {/* Summary */}
      {(expiredStk > 0 || expiringStk > 0) && (
        <div className="grid grid-cols-2 gap-4 mb-5">
          {expiredStk > 0 && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl p-3">
              <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-700">{expiredStk} stroj{expiredStk > 1 ? 'e' : ''} — prošlá STK</p>
                <p className="text-xs text-red-500">Nutné okamžité přistavení</p>
              </div>
            </div>
          )}
          {expiringStk > 0 && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl p-3">
              <Clock size={18} className="text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-700">{expiringStk} stroj{expiringStk > 1 ? 'e' : ''} — STK do 30 dní</p>
                <p className="text-xs text-amber-500">Naplánujte přistavení</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {farms.length > 1 && (
          <>
            <button onClick={() => setSelectedFarmId(null)} className={cn('px-3 py-1 rounded-full text-xs font-medium border transition-colors', selectedFarmId === null ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400')}>Všechny farmy</button>
            {farms.map(f => (
              <button key={f.id} onClick={() => setSelectedFarmId(f.id === selectedFarmId ? null : f.id)}
                className={cn('px-3 py-1 rounded-full text-xs font-medium border transition-colors', selectedFarmId === f.id ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400')}
                style={selectedFarmId === f.id ? { backgroundColor: f.color } : {}}>{f.name}</button>
            ))}
          </>
        )}
        {availableTypes.map(t => (
          <button key={t} onClick={() => setTypeFilter(typeFilter === t ? null : t)}
            className={cn('flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors', typeFilter === t ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400')}>
            {TYPE_ICONS[t] ?? '🔧'} {TYPE_LABELS[t] ?? t}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-400">Žádné stroje. Data synchronizujte přes mobilní appku.</div>
      ) : (
        <div className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Stroj', 'Typ', 'SPZ / Inventář', 'Mth', 'STK', 'Příští servis', 'Farma'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(m => {
                  const farm = farmMap[m.farm_id];
                  return (
                    <tr key={m.id} className={cn('transition-colors', m.stkStatus === 'expired' ? 'bg-red-50' : 'hover:bg-gray-50')}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800">{m.name}</p>
                        {m.year_of_manufacture && <p className="text-xs text-gray-400">{m.year_of_manufacture}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {m.type ? <span>{TYPE_ICONS[m.type] ?? '🔧'} {TYPE_LABELS[m.type] ?? m.type}</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {m.registration && <p className="font-mono text-xs text-gray-700">{m.registration}</p>}
                        {m.inventory_number && <p className="font-mono text-xs text-gray-400">{m.inventory_number}</p>}
                        {!m.registration && !m.inventory_number && <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-700">
                        {m.motor_hours > 0 ? m.motor_hours.toFixed(0) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StkBadge status={m.stkStatus} validUntil={m.latestStk?.stk_valid_until ?? null} daysUntil={m.daysUntilStk} />
                      </td>
                      <td className="px-4 py-3">
                        {m.nextServiceDate ? (
                          <ServiceDateBadge date={m.nextServiceDate} today={today} />
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {farm ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: farm.color }}>{farm.name}</span>
                        ) : null}
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

function StkBadge({ status, validUntil, daysUntil }: { status: string; validUntil: string | null; daysUntil: number | null }) {
  if (status === 'none') return <span className="text-xs text-gray-300">Nezadáno</span>;
  if (status === 'expired') return (
    <div className="flex items-center gap-1 text-red-600">
      <AlertTriangle size={13} />
      <span className="text-xs font-semibold">Prošlá{validUntil ? ` (${validUntil})` : ''}</span>
    </div>
  );
  if (status === 'expiring') return (
    <div className="flex items-center gap-1 text-amber-600">
      <Clock size={13} />
      <span className="text-xs font-semibold">za {daysUntil} dní</span>
    </div>
  );
  return (
    <div className="flex items-center gap-1 text-green-600">
      <CheckCircle2 size={13} />
      <span className="text-xs">{validUntil}</span>
    </div>
  );
}

function ServiceDateBadge({ date, today }: { date: string; today: string }) {
  const days = Math.round((new Date(date).getTime() - new Date(today).getTime()) / 86400000);
  const color = days < 0 ? 'text-red-600' : days <= 14 ? 'text-amber-600' : 'text-gray-600';
  return (
    <div className={cn('flex items-center gap-1', color)}>
      <Wrench size={12} />
      <span className="text-xs font-mono">{date}</span>
    </div>
  );
}
