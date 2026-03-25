'use client';

import { useMemo } from 'react';
import type { Animal, Farm, ReproEvent } from './types';
import { SPECIES_ICONS } from './types';
import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalvingRow {
  event: ReproEvent;
  animal: Animal | undefined;
  farm: Farm | undefined;
  daysUntil: number;
  urgency: 'overdue' | 'urgent' | 'soon' | 'later';
}

interface Props {
  upcomingCalvings: ReproEvent[];
  animals: Animal[];
  farms: Farm[];
}

export function CalvingCalendar({ upcomingCalvings, animals, farms }: Props) {
  const animalMap = useMemo(() => Object.fromEntries(animals.map((a) => [a.id, a])), [animals]);
  const farmMap = useMemo(() => Object.fromEntries(farms.map((f) => [f.id, f])), [farms]);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const rows = useMemo<CalvingRow[]>(() => {
    return upcomingCalvings
      .filter((e) => e.expected_calving_date)
      .map((event) => {
        const daysUntil = Math.round(
          (new Date(event.expected_calving_date!).getTime() - new Date(today).getTime()) / 86400000,
        );
        const urgency: CalvingRow['urgency'] =
          daysUntil < 0 ? 'overdue' : daysUntil <= 7 ? 'urgent' : daysUntil <= 30 ? 'soon' : 'later';
        return {
          event,
          animal: animalMap[event.animal_id],
          farm: farmMap[event.farm_id],
          daysUntil,
          urgency,
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [upcomingCalvings, animalMap, farmMap, today]);

  const overdue = rows.filter((r) => r.urgency === 'overdue');
  const urgent = rows.filter((r) => r.urgency === 'urgent');
  const soon = rows.filter((r) => r.urgency === 'soon');
  const later = rows.filter((r) => r.urgency === 'later');

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
        Žádné plánované porody. Záznamy o březosti přidejte v mobilní appce.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={<AlertTriangle size={18} className="text-red-500" />}
          label="Po termínu"
          value={overdue.length}
          color={overdue.length > 0 ? 'red' : 'gray'}
        />
        <SummaryCard
          icon={<Clock size={18} className="text-amber-500" />}
          label="Do 7 dní"
          value={urgent.length}
          color={urgent.length > 0 ? 'amber' : 'gray'}
        />
        <SummaryCard
          icon={<Clock size={18} className="text-blue-400" />}
          label="Do 30 dní"
          value={soon.length}
          color="blue"
        />
        <SummaryCard
          icon={<CheckCircle2 size={18} className="text-green-400" />}
          label="Celkem březích"
          value={rows.length}
          color="green"
        />
      </div>

      {/* Groups */}
      {overdue.length > 0 && (
        <CalvingGroup title="Po termínu" rows={overdue} badgeClass="bg-red-100 text-red-700" />
      )}
      {urgent.length > 0 && (
        <CalvingGroup title="Tento týden" rows={urgent} badgeClass="bg-amber-100 text-amber-700" />
      )}
      {soon.length > 0 && (
        <CalvingGroup title="Do 30 dní" rows={soon} badgeClass="bg-blue-100 text-blue-700" />
      )}
      {later.length > 0 && (
        <CalvingGroup title="Později" rows={later} badgeClass="bg-gray-100 text-gray-600" />
      )}
    </div>
  );
}

function CalvingGroup({
  title,
  rows,
  badgeClass,
}: {
  title: string;
  rows: CalvingRow[];
  badgeClass: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-600 mb-2">{title}</h3>
      <div className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Zvíře</th>
              <th className="text-left px-4 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Farma</th>
              <th className="text-left px-4 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Termín porodu</th>
              <th className="text-left px-4 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Zbývá</th>
              <th className="text-left px-4 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Poznámka</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map(({ event, animal, farm, daysUntil, urgency }) => (
              <tr
                key={event.id}
                className={cn(
                  'transition-colors',
                  urgency === 'overdue' ? 'bg-red-50' : 'hover:bg-gray-50',
                )}
              >
                <td className="px-4 py-3">
                  {animal ? (
                    <div className="flex items-center gap-1.5">
                      <span>{SPECIES_ICONS[animal.species]}</span>
                      <div>
                        <p className="font-mono font-semibold text-gray-800 text-sm">{animal.ear_tag}</p>
                        {animal.breed && (
                          <p className="text-xs text-gray-400">{animal.breed}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400 font-mono text-xs">{event.animal_id.slice(0, 8)}…</span>
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
                <td className="px-4 py-3 font-mono text-gray-700">
                  {event.expected_calving_date}
                </td>
                <td className="px-4 py-3">
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', badgeClass)}>
                    {daysUntil < 0
                      ? `${Math.abs(daysUntil)} dní po term.`
                      : daysUntil === 0
                        ? 'Dnes!'
                        : `za ${daysUntil} dní`}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {event.notes ?? <span className="text-gray-300">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'red' | 'amber' | 'blue' | 'green' | 'gray';
}) {
  const bg = {
    red: 'bg-red-50 border-red-100',
    amber: 'bg-amber-50 border-amber-100',
    blue: 'bg-blue-50 border-blue-100',
    green: 'bg-white border-gray-100',
    gray: 'bg-white border-gray-100',
  }[color];

  const textColor = {
    red: 'text-red-700',
    amber: 'text-amber-700',
    blue: 'text-blue-700',
    green: 'text-gray-800',
    gray: 'text-gray-400',
  }[color];

  return (
    <div className={cn('rounded-xl border shadow-sm p-4', bg)}>
      <div className="mb-1">{icon}</div>
      <p className={cn('text-2xl font-bold', textColor)}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
