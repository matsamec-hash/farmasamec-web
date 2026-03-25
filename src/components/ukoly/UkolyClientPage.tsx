'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, AlertTriangle, Clock, Plus, ChevronDown, ChevronRight } from 'lucide-react';

export interface Farm { id: string; name: string; color: string; is_eco: boolean; }
export interface Task {
  id: string; farm_id: string; title: string; description: string | null;
  deadline: string | null; status: 'pending' | 'done'; has_checklist: boolean;
  machine_id: string | null; animal_id: string | null; parcel_id: string | null;
  created_at: string; updated_at: string;
}
export interface TaskItem {
  id: string; task_id: string; text: string; is_done: boolean; sort_order: number;
}

type StatusFilter = 'all' | 'pending' | 'done';

interface Props {
  farms: Farm[]; tasks: Task[]; taskItems: TaskItem[]; currentUserId: string;
}

export function UkolyClientPage({ farms, tasks: initialTasks, taskItems }: Props) {
  const [tasks, setTasks] = useState(initialTasks);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const farmMap = useMemo(() => Object.fromEntries(farms.map(f => [f.id, f])), [farms]);
  const itemsByTask = useMemo(() => {
    const map: Record<string, TaskItem[]> = {};
    for (const item of taskItems) {
      if (!map[item.task_id]) map[item.task_id] = [];
      map[item.task_id].push(item);
    }
    return map;
  }, [taskItems]);

  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    let r = tasks;
    if (selectedFarmId) r = r.filter(t => t.farm_id === selectedFarmId);
    if (statusFilter !== 'all') r = r.filter(t => t.status === statusFilter);
    return r;
  }, [tasks, selectedFarmId, statusFilter]);

  const pendingCount = tasks.filter(t => t.status === 'pending' && (!selectedFarmId || t.farm_id === selectedFarmId)).length;
  const overdueCount = tasks.filter(t => t.status === 'pending' && t.deadline && t.deadline < today && (!selectedFarmId || t.farm_id === selectedFarmId)).length;

  async function toggleTask(task: Task) {
    setToggling(task.id);
    const newStatus = task.status === 'pending' ? 'done' : 'pending';
    const supabase = createClient();
    const { error } = await supabase.from('tasks').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', task.id);
    if (!error) setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    setToggling(null);
  }

  function deadlineUrgency(deadline: string | null, status: string): 'overdue' | 'today' | 'soon' | 'ok' | null {
    if (!deadline || status === 'done') return null;
    const days = Math.round((new Date(deadline).getTime() - new Date(today).getTime()) / 86400000);
    if (days < 0) return 'overdue';
    if (days === 0) return 'today';
    if (days <= 3) return 'soon';
    return 'ok';
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-0.5">Úkoly</h1>
          <p className="text-sm text-gray-500">
            {pendingCount} nevyřízených{overdueCount > 0 ? ` · ${overdueCount} po termínu` : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Status */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['pending', 'all', 'done'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                statusFilter === s ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
              {s === 'pending' ? 'Nevyřízené' : s === 'done' ? 'Dokončené' : 'Vše'}
            </button>
          ))}
        </div>

        {/* Farms */}
        {farms.length > 1 && (
          <>
            <button onClick={() => setSelectedFarmId(null)}
              className={cn('px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                !selectedFarmId ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400')}>
              Všechny farmy
            </button>
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

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
          {statusFilter === 'pending' ? 'Žádné nevyřízené úkoly. 🎉' : 'Žádné úkoly.'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => {
            const urgency = deadlineUrgency(task.deadline, task.status);
            const farm = farmMap[task.farm_id];
            const items = itemsByTask[task.id] ?? [];
            const doneItems = items.filter(i => i.is_done).length;
            const isExpanded = expandedId === task.id;

            return (
              <div key={task.id}
                className={cn('rounded-xl border bg-white shadow-sm overflow-hidden transition-colors',
                  urgency === 'overdue' ? 'border-red-200' : urgency === 'today' ? 'border-amber-200' : 'border-gray-100')}>
                <div className={cn('flex items-start gap-3 px-4 py-3',
                  urgency === 'overdue' ? 'bg-red-50/50' : urgency === 'today' ? 'bg-amber-50/50' : '')}>
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleTask(task)}
                    disabled={toggling === task.id}
                    className="mt-0.5 flex-shrink-0 text-gray-400 hover:text-[#7c9a6e] transition-colors disabled:opacity-50">
                    {task.status === 'done'
                      ? <CheckCircle2 size={20} className="text-green-500" />
                      : <Circle size={20} />}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('font-medium text-gray-800', task.status === 'done' && 'line-through text-gray-400')}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {urgency === 'overdue' && <span className="flex items-center gap-1 text-xs text-red-600 font-semibold"><AlertTriangle size={12} /> Po termínu</span>}
                        {urgency === 'today' && <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold"><Clock size={12} /> Dnes</span>}
                        {urgency === 'soon' && <span className="flex items-center gap-1 text-xs text-amber-500"><Clock size={12} /> Brzy</span>}
                        {farm && <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: farm.color }}>{farm.name}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-1">
                      {task.deadline && (
                        <span className={cn('text-xs font-mono', urgency === 'overdue' ? 'text-red-500' : 'text-gray-400')}>
                          📅 {task.deadline}
                        </span>
                      )}
                      {items.length > 0 && (
                        <button onClick={() => setExpandedId(isExpanded ? null : task.id)}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                          {doneItems}/{items.length} položek
                        </button>
                      )}
                    </div>

                    {task.description && !isExpanded && (
                      <p className="text-xs text-gray-500 mt-1 truncate">{task.description}</p>
                    )}
                  </div>
                </div>

                {/* Expanded checklist */}
                {isExpanded && items.length > 0 && (
                  <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50 space-y-1.5">
                    {task.description && (
                      <p className="text-xs text-gray-500 mb-2">{task.description}</p>
                    )}
                    {items.sort((a, b) => a.sort_order - b.sort_order).map(item => (
                      <div key={item.id} className="flex items-center gap-2">
                        {item.is_done
                          ? <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                          : <Circle size={14} className="text-gray-300 flex-shrink-0" />}
                        <span className={cn('text-xs', item.is_done ? 'line-through text-gray-400' : 'text-gray-700')}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
