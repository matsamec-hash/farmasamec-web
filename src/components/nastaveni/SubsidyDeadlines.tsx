'use client';

import { useMemo } from 'react';
import type { SubsidyDeadline, Farm } from './NastaveniClientPage';
import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_LABELS: Record<string, string> = {
  jz: 'Jednotná žádost', aeko: 'AEKO', ez: 'Ekologické zemědělství',
  national: 'Národní dotace', other: 'Ostatní',
};
const CATEGORY_COLORS: Record<string, string> = {
  jz: 'bg-blue-100 text-blue-700', aeko: 'bg-green-100 text-green-700',
  ez: 'bg-emerald-100 text-emerald-700', national: 'bg-purple-100 text-purple-700',
  other: 'bg-gray-100 text-gray-600',
};

interface Props { deadlines: SubsidyDeadline[]; farms: Farm[]; }

export function SubsidyDeadlines({ deadlines, farms }: Props) {
  const farmMap = useMemo(() => Object.fromEntries(farms.map(f => [f.id, f])), [farms]);
  const today = new Date().toISOString().slice(0, 10);

  const deadlinesWithDays = useMemo(() => deadlines.map(d => ({
    ...d,
    daysUntil: Math.round((new Date(d.date).getTime() - new Date(today).getTime()) / 86400000),
  })), [deadlines, today]);

  const urgent = deadlinesWithDays.filter(d => d.daysUntil <= 14);
  const rest = deadlinesWithDays.filter(d => d.daysUntil > 14);

  if (deadlines.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
        Žádné nadcházející dotační termíny. Přidejte je v mobilní appce.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {urgent.length > 0 && (
        <Section title="Urgentní — do 14 dní" items={urgent} farmMap={farmMap} />
      )}
      {rest.length > 0 && (
        <Section title="Nadcházející termíny" items={rest} farmMap={farmMap} />
      )}
    </div>
  );
}

function Section({ title, items, farmMap }: {
  title: string;
  items: (SubsidyDeadline & { daysUntil: number })[];
  farmMap: Record<string, Farm>;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-600 mb-2">{title}</h3>
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Termín', 'Název', 'Kategorie', 'Zbývá', 'Farma'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map(d => {
              const farm = farmMap[d.farm_id];
              const isUrgent = d.daysUntil <= 14;
              const isVeryUrgent = d.daysUntil <= 3;
              return (
                <tr key={d.id} className={cn('transition-colors', isVeryUrgent ? 'bg-red-50' : isUrgent ? 'bg-amber-50/50' : 'hover:bg-gray-50')}>
                  <td className="px-4 py-3 font-mono text-gray-700">{d.date}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{d.label}</p>
                    {d.description && <p className="text-xs text-gray-400 mt-0.5">{d.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', CATEGORY_COLORS[d.category] ?? 'bg-gray-100 text-gray-600')}>
                      {CATEGORY_LABELS[d.category] ?? d.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className={cn('flex items-center gap-1', isVeryUrgent ? 'text-red-600' : isUrgent ? 'text-amber-600' : 'text-gray-600')}>
                      {isVeryUrgent ? <AlertTriangle size={13} /> : isUrgent ? <Clock size={13} /> : <CheckCircle2 size={13} />}
                      <span className="text-xs font-semibold">
                        {d.daysUntil === 0 ? 'Dnes!' : d.daysUntil === 1 ? 'Zítra' : `za ${d.daysUntil} dní`}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {farm && <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: farm.color }}>{farm.name}</span>}
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
