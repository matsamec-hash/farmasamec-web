'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Fuel, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';

export interface Farm { id: string; name: string; color: string; }
export interface Tank {
  id: string; farm_id: string; name: string; capacity_liters: number;
  current_liters: number; location: string | null; low_limit_liters: number; is_shared: boolean;
}
export interface FuelReceipt {
  id: string; tank_id: string; farm_id: string; date: string; liters: number;
  supplier: string | null; price_per_liter: number | null; notes: string | null;
}
export interface FuelDispensing {
  id: string; tank_id: string; farm_id: string; machine_id: string; date: string;
  liters: number; activity_type: string | null; notes: string | null;
}
export interface MachineRef { id: string; farm_id: string; name: string; type: string | null; }

type Tab = 'tanky' | 'prijmy' | 'vydeje';

interface Props {
  farms: Farm[]; tanks: Tank[]; receipts: FuelReceipt[];
  dispensings: FuelDispensing[]; machines: MachineRef[];
}

export function PhmClientPage({ farms, tanks, receipts, dispensings, machines }: Props) {
  const [tab, setTab] = useState<Tab>('tanky');
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);

  const farmMap = useMemo(() => Object.fromEntries(farms.map(f => [f.id, f])), [farms]);
  const machineMap = useMemo(() => Object.fromEntries(machines.map(m => [m.id, m])), [machines]);
  const tankMap = useMemo(() => Object.fromEntries(tanks.map(t => [t.id, t])), [tanks]);

  const filteredTanks = useMemo(() => selectedFarmId ? tanks.filter(t => t.farm_id === selectedFarmId) : tanks, [tanks, selectedFarmId]);
  const filteredReceipts = useMemo(() => selectedFarmId ? receipts.filter(r => r.farm_id === selectedFarmId) : receipts, [receipts, selectedFarmId]);
  const filteredDispensings = useMemo(() => selectedFarmId ? dispensings.filter(d => d.farm_id === selectedFarmId) : dispensings, [dispensings, selectedFarmId]);

  const totalStored = filteredTanks.reduce((s, t) => s + t.current_liters, 0);
  const totalReceived = filteredReceipts.reduce((s, r) => s + r.liters, 0);
  const totalDispensed = filteredDispensings.reduce((s, d) => s + d.liters, 0);
  const lowTanks = filteredTanks.filter(t => t.current_liters <= t.low_limit_liters && t.low_limit_liters > 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-0.5">PHM</h1>
          <p className="text-sm text-gray-500">Pohonné hmoty — zásoby a spotřeba</p>
        </div>
      </div>

      {/* Farm filter + tab */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {farms.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setSelectedFarmId(null)}
              className={cn('px-3 py-1 rounded-full text-xs font-medium border transition-colors', !selectedFarmId ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400')}>
              Všechny farmy
            </button>
            {farms.map(f => (
              <button key={f.id} onClick={() => setSelectedFarmId(f.id === selectedFarmId ? null : f.id)}
                className={cn('px-3 py-1 rounded-full text-xs font-medium border transition-colors', selectedFarmId === f.id ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400')}
                style={selectedFarmId === f.id ? { backgroundColor: f.color } : {}}>
                {f.name}
              </button>
            ))}
          </div>
        )}
        <div className="ml-auto flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['tanky', 'prijmy', 'vydeje'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-colors', tab === t ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
              {t === 'tanky' ? 'Nádrže' : t === 'prijmy' ? 'Příjmy' : 'Výdeje'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <SummaryCard icon={<Fuel size={18} className="text-blue-500" />} label="Zásoby celkem" value={`${totalStored.toFixed(0)} l`} alert={lowTanks.length > 0} />
        <SummaryCard icon={<TrendingUp size={18} className="text-green-500" />} label="Přijato (6 měs.)" value={`${totalReceived.toFixed(0)} l`} />
        <SummaryCard icon={<TrendingDown size={18} className="text-red-500" />} label="Vydáno (6 měs.)" value={`${totalDispensed.toFixed(0)} l`} />
        <SummaryCard icon={<AlertTriangle size={18} className={lowTanks.length > 0 ? 'text-amber-500' : 'text-gray-300'} />} label="Nádrže pod limitem" value={`${lowTanks.length}`} alert={lowTanks.length > 0} />
      </div>

      {tab === 'tanky' && <TankyTab tanks={filteredTanks} farmMap={farmMap} />}
      {tab === 'prijmy' && <PrijmyTab receipts={filteredReceipts} tankMap={tankMap} farmMap={farmMap} />}
      {tab === 'vydeje' && <VydejTab dispensings={filteredDispensings} tankMap={tankMap} machineMap={machineMap} farmMap={farmMap} />}
    </div>
  );
}

function SummaryCard({ icon, label, value, alert }: { icon: React.ReactNode; label: string; value: string; alert?: boolean; }) {
  return (
    <div className={cn('rounded-xl border shadow-sm p-4', alert ? 'bg-amber-50 border-amber-100' : 'bg-white border-gray-100')}>
      <div className="mb-1">{icon}</div>
      <p className={cn('text-xl font-bold font-mono', alert ? 'text-amber-700' : 'text-gray-800')}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function TankyTab({ tanks, farmMap }: { tanks: Tank[]; farmMap: Record<string, Farm>; }) {
  if (tanks.length === 0) return <EmptyState text="Žádné nádrže. Data synchronizujte přes mobilní appku." />;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {tanks.map(tank => {
        const pct = tank.capacity_liters > 0 ? (tank.current_liters / tank.capacity_liters) * 100 : 0;
        const isLow = tank.current_liters <= tank.low_limit_liters && tank.low_limit_liters > 0;
        const farm = farmMap[tank.farm_id];
        return (
          <div key={tank.id} className={cn('rounded-xl border shadow-sm p-4 bg-white', isLow ? 'border-amber-200' : 'border-gray-100')}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-800">{tank.name}</p>
                {tank.location && <p className="text-xs text-gray-400">{tank.location}</p>}
              </div>
              {farm && <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium text-white flex-shrink-0" style={{ backgroundColor: farm.color }}>{farm.name}</span>}
            </div>
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-2xl font-bold font-mono text-gray-800">{tank.current_liters.toFixed(0)} l</span>
                <span className="text-xs text-gray-400">/ {tank.capacity_liters.toFixed(0)} l</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full transition-all', isLow ? 'bg-amber-400' : pct > 60 ? 'bg-green-400' : 'bg-blue-400')}
                  style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{pct.toFixed(0)} % plná</span>
              {isLow && <span className="flex items-center gap-1 text-amber-600 font-semibold"><AlertTriangle size={11} /> Pod limitem</span>}
              {tank.is_shared && <span className="text-gray-400">Sdílená</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PrijmyTab({ receipts, tankMap, farmMap }: { receipts: FuelReceipt[]; tankMap: Record<string, Tank>; farmMap: Record<string, Farm>; }) {
  if (receipts.length === 0) return <EmptyState text="Žádné příjmy PHM za posledních 6 měsíců." />;
  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Datum', 'Nádrž', 'Množství', 'Cena/l', 'Celkem', 'Dodavatel', 'Farma'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {receipts.map(r => {
              const tank = tankMap[r.tank_id];
              const farm = farmMap[r.farm_id];
              const total = r.price_per_liter ? r.liters * r.price_per_liter : null;
              return (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-700">{r.date}</td>
                  <td className="px-4 py-3 text-gray-700">{tank?.name ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 font-mono font-semibold text-green-700">+{r.liters.toFixed(0)} l</td>
                  <td className="px-4 py-3 font-mono text-gray-600">{r.price_per_liter ? `${r.price_per_liter.toFixed(2)} Kč` : '—'}</td>
                  <td className="px-4 py-3 font-mono text-gray-700">{total ? `${total.toFixed(0)} Kč` : '—'}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{r.supplier ?? '—'}</td>
                  <td className="px-4 py-3">{farm && <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: farm.color }}>{farm.name}</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VydejTab({ dispensings, tankMap, machineMap, farmMap }: { dispensings: FuelDispensing[]; tankMap: Record<string, Tank>; machineMap: Record<string, MachineRef>; farmMap: Record<string, Farm>; }) {
  if (dispensings.length === 0) return <EmptyState text="Žádné výdeje PHM za posledních 6 měsíců." />;
  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Datum', 'Stroj', 'Nádrž', 'Množství', 'Aktivita', 'Farma'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {dispensings.map(d => {
              const machine = machineMap[d.machine_id];
              const tank = tankMap[d.tank_id];
              const farm = farmMap[d.farm_id];
              return (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-700">{d.date}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{machine?.name ?? <span className="text-gray-400 font-mono text-xs">{d.machine_id.slice(0, 8)}</span>}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{tank?.name ?? '—'}</td>
                  <td className="px-4 py-3 font-mono font-semibold text-red-600">−{d.liters.toFixed(0)} l</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{d.activity_type ?? '—'}</td>
                  <td className="px-4 py-3">{farm && <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: farm.color }}>{farm.name}</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-400">{text}</div>;
}
