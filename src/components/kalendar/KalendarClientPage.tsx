'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, AlertTriangle, CalendarDays } from 'lucide-react';

export interface Farm { id: string; name: string; color: string; }

type EventType = 'task' | 'payment' | 'deadline' | 'calving' | 'stk';

interface CalEvent {
  id: string;
  date: string;
  type: EventType;
  title: string;
  subtitle?: string;
  farm_id: string;
  daysUntil: number;
}

const TYPE_CONFIG: Record<EventType, { icon: string; label: string; color: string; dot: string }> = {
  task:     { icon: '📋', label: 'Úkol',              color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-400' },
  payment:  { icon: '💰', label: 'Platba pachtu',     color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400' },
  deadline: { icon: '📅', label: 'Dotační termín',    color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-400' },
  calving:  { icon: '🐄', label: 'Porod',             color: 'bg-green-100 text-green-700',   dot: 'bg-green-400' },
  stk:      { icon: '🔧', label: 'STK stroje',        color: 'bg-red-100 text-red-700',       dot: 'bg-red-400' },
};

interface Props {
  farms: Farm[];
  tasks: Array<{ id: string; farm_id: string; title: string; deadline: string; status: string }>;
  payments: Array<{ id: string; farm_id: string; landlord_name: string; description: string | null; amount_czk: number | null; due_date: string; period_label: string | null }>;
  deadlines: Array<{ id: string; farm_id: string; label: string; date: string; category: string }>;
  calvings: Array<{ id: string; farm_id: string; animal_id: string; expected_calving_date: string }>;
  stkRecords: Array<{ id: string; farm_id: string; machine_id: string; stk_valid_until: string | null; machine_name: string }>;
  today: string;
}

export function KalendarClientPage({ farms, tasks, payments, deadlines, calvings, stkRecords, today }: Props) {
  const [typeFilter, setTypeFilter] = useState<EventType | null>(null);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);

  const farmMap = useMemo(() => Object.fromEntries(farms.map(f => [f.id, f])), [farms]);

  const allEvents = useMemo<CalEvent[]>(() => {
    const events: CalEvent[] = [];

    for (const t of tasks) {
      events.push({ id: t.id, date: t.deadline, type: 'task', title: t.title, farm_id: t.farm_id, daysUntil: diffDays(t.deadline, today) });
    }
    for (const p of payments) {
      events.push({ id: p.id, date: p.due_date, type: 'payment', title: `Nájem — ${p.landlord_name}`, subtitle: p.description ?? p.period_label ?? undefined, farm_id: p.farm_id, daysUntil: diffDays(p.due_date, today) });
    }
    for (const d of deadlines) {
      events.push({ id: d.id, date: d.date, type: 'deadline', title: d.label, farm_id: d.farm_id, daysUntil: diffDays(d.date, today) });
    }
    for (const c of calvings) {
      events.push({ id: c.id, date: c.expected_calving_date, type: 'calving', title: `Očekávaný porod`, subtitle: c.animal_id, farm_id: c.farm_id, daysUntil: diffDays(c.expected_calving_date, today) });
    }
    for (const s of stkRecords) {
      if (s.stk_valid_until) events.push({ id: s.id, date: s.stk_valid_until, type: 'stk', title: `STK — ${s.machine_name}`, farm_id: s.farm_id, daysUntil: diffDays(s.stk_valid_until, today) });
    }

    return events.sort((a, b) => a.date.localeCompare(b.date));
  }, [tasks, payments, deadlines, calvings, stkRecords, today]);

  const filtered = useMemo(() => {
    let e = allEvents;
    if (typeFilter) e = e.filter(ev => ev.type === typeFilter);
    if (selectedFarmId) e = e.filter(ev => ev.farm_id === selectedFarmId);
    return e;
  }, [allEvents, typeFilter, selectedFarmId]);

  // Group by week
  const grouped = useMemo(() => {
    const groups: { label: string; events: CalEvent[] }[] = [];
    let currentWeek = '';
    for (const ev of filtered) {
      const weekLabel = getWeekLabel(ev.date, today);
      if (weekLabel !== currentWeek) {
        currentWeek = weekLabel;
        groups.push({ label: weekLabel, events: [] });
      }
      groups[groups.length - 1].events.push(ev);
    }
    return groups;
  }, [filtered, today]);

  const urgentCount = allEvents.filter(e => e.daysUntil <= 7 && e.daysUntil >= 0).length;
  const overdueCount = allEvents.filter(e => e.daysUntil < 0).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-0.5">Kalendář</h1>
          <p className="text-sm text-gray-500">
            {allEvents.length} událostí v následujících 90 dnech
            {overdueCount > 0 ? ` · ${overdueCount} po termínu` : ''}
            {urgentCount > 0 ? ` · ${urgentCount} tento týden` : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        {/* Type filter */}
        <button onClick={() => setTypeFilter(null)}
          className={cn('px-3 py-1 rounded-full text-xs font-medium border transition-colors', !typeFilter ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400')}>
          Vše
        </button>
        {(Object.entries(TYPE_CONFIG) as [EventType, typeof TYPE_CONFIG[EventType]][]).map(([type, cfg]) => (
          <button key={type} onClick={() => setTypeFilter(typeFilter === type ? null : type)}
            className={cn('flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors',
              typeFilter === type ? `${cfg.color} border-transparent` : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400')}>
            {cfg.icon} {cfg.label}
          </button>
        ))}

        {/* Farm filter */}
        {farms.length > 1 && (
          <>
            <div className="w-px h-6 bg-gray-200 self-center mx-1" />
            {farms.map(f => (
              <button key={f.id} onClick={() => setSelectedFarmId(f.id === selectedFarmId ? null : f.id)}
                className={cn('px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                  selectedFarmId === f.id ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400')}
                style={selectedFarmId === f.id ? { backgroundColor: f.color } : {}}>
                {f.name}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Event list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
          Žádné události v daném výběru.
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(group => (
            <div key={group.label}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <CalendarDays size={12} />
                {group.label}
              </h3>
              <div className="space-y-2">
                {group.events.map(ev => {
                  const cfg = TYPE_CONFIG[ev.type];
                  const farm = farmMap[ev.farm_id];
                  const isOverdue = ev.daysUntil < 0;
                  const isToday = ev.daysUntil === 0;
                  const isUrgent = ev.daysUntil > 0 && ev.daysUntil <= 3;

                  return (
                    <div key={ev.id}
                      className={cn('flex items-center gap-3 rounded-xl border bg-white shadow-sm px-4 py-3',
                        isOverdue ? 'border-red-200 bg-red-50/30' : isToday ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100')}>
                      {/* Color dot */}
                      <div className={cn('w-2 h-2 rounded-full flex-shrink-0', cfg.dot)} />

                      {/* Date */}
                      <div className="w-24 flex-shrink-0">
                        <p className="font-mono text-xs text-gray-500">{ev.date}</p>
                        <p className={cn('text-xs font-semibold', isOverdue ? 'text-red-600' : isToday ? 'text-amber-600' : isUrgent ? 'text-amber-500' : 'text-gray-400')}>
                          {isOverdue ? `${Math.abs(ev.daysUntil)}d po term.` : isToday ? 'Dnes' : `za ${ev.daysUntil} dní`}
                        </p>
                      </div>

                      {/* Type badge */}
                      <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0', cfg.color)}>
                        {cfg.icon} {cfg.label}
                      </span>

                      {/* Title */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{ev.title}</p>
                        {ev.subtitle && <p className="text-xs text-gray-400 truncate">{ev.subtitle}</p>}
                      </div>

                      {/* Urgency + Farm */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isOverdue && <AlertTriangle size={14} className="text-red-500" />}
                        {isToday && <Clock size={14} className="text-amber-500" />}
                        {!isOverdue && !isToday && ev.daysUntil > 14 && <CheckCircle2 size={14} className="text-gray-200" />}
                        {farm && <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: farm.color }}>{farm.name}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function diffDays(date: string, today: string): number {
  return Math.round((new Date(date).getTime() - new Date(today).getTime()) / 86400000);
}

function getWeekLabel(date: string, today: string): string {
  const days = diffDays(date, today);
  if (days < 0) return '⚠ Po termínu';
  if (days === 0) return 'Dnes';
  if (days <= 7) return 'Tento týden';
  if (days <= 14) return 'Příští týden';
  if (days <= 31) return 'Tento měsíc';
  if (days <= 60) return 'Za 1–2 měsíce';
  return 'Za 2–3 měsíce';
}
