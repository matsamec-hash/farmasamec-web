'use client';

import Link from 'next/link';
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UrgencyItem {
  id: string;
  type: 'stk' | 'task' | 'calving' | 'payment' | 'deadline' | 'lease';
  title: string;
  subtitle?: string;
  daysUntil: number;
  href: string;
}

const TYPE_ICONS: Record<UrgencyItem['type'], string> = {
  stk: '🔧', task: '📋', calving: '🐄', payment: '💰', deadline: '📅', lease: '📄',
};

interface Props { items: UrgencyItem[]; }

export function UrgencyWidget({ items }: Props) {
  if (items.length === 0) return null;

  const overdue = items.filter(i => i.daysUntil < 0);
  const urgent = items.filter(i => i.daysUntil >= 0 && i.daysUntil <= 7);
  const soon = items.filter(i => i.daysUntil > 7 && i.daysUntil <= 30);

  return (
    <section className="mb-8">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Upozornění
      </h2>
      <div className="space-y-2">
        {overdue.length > 0 && (
          <AlertGroup
            icon={<AlertTriangle size={14} className="text-red-500" />}
            label="Po termínu"
            items={overdue}
            className="border-red-200 bg-red-50"
            labelClass="text-red-700"
          />
        )}
        {urgent.length > 0 && (
          <AlertGroup
            icon={<Clock size={14} className="text-amber-500" />}
            label="Tento týden"
            items={urgent}
            className="border-amber-200 bg-amber-50"
            labelClass="text-amber-700"
          />
        )}
        {soon.length > 0 && (
          <AlertGroup
            icon={<Clock size={14} className="text-blue-400" />}
            label="Do 30 dní"
            items={soon}
            className="border-blue-100 bg-blue-50/50"
            labelClass="text-blue-700"
          />
        )}
      </div>
    </section>
  );
}

function AlertGroup({ icon, label, items, className, labelClass }: {
  icon: React.ReactNode; label: string; items: UrgencyItem[];
  className: string; labelClass: string;
}) {
  return (
    <div className={cn('rounded-xl border px-4 py-3', className)}>
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <span className={cn('text-xs font-semibold uppercase tracking-wide', labelClass)}>{label}</span>
        <span className={cn('ml-1 text-xs font-bold rounded-full bg-white/60 px-1.5', labelClass)}>{items.length}</span>
      </div>
      <div className="space-y-1.5">
        {items.slice(0, 5).map(item => (
          <Link key={item.id} href={item.href}
            className="flex items-center gap-2 group">
            <span className="text-sm">{TYPE_ICONS[item.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 truncate group-hover:text-[#7c9a6e] transition-colors">{item.title}</p>
              {item.subtitle && <p className="text-xs text-gray-400 truncate">{item.subtitle}</p>}
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0 tabular-nums">
              {item.daysUntil < 0 ? `${Math.abs(item.daysUntil)}d` : item.daysUntil === 0 ? 'dnes' : `za ${item.daysUntil}d`}
            </span>
            <ArrowRight size={12} className="text-gray-300 group-hover:text-[#7c9a6e] flex-shrink-0 transition-colors" />
          </Link>
        ))}
        {items.length > 5 && (
          <p className="text-xs text-gray-400 pl-6">+ {items.length - 5} dalších</p>
        )}
      </div>
    </div>
  );
}
