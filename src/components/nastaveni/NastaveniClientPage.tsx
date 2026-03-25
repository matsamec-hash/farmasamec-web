'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { DzesPrehled } from './DzesPrehled';
import { PachtyPrehled } from './PachtyPrehled';
import { SubsidyDeadlines } from './SubsidyDeadlines';
import { FileText, Shield, CalendarDays } from 'lucide-react';

export interface Farm { id: string; name: string; color: string; is_eco: boolean; }
export interface Lease {
  id: string; farm_id: string; contract_number: string; landlord_name: string;
  landlord_ico: string | null; total_area_ha: number | null; start_date: string;
  end_date: string; annual_rent_czk: number | null; payment_due_month: number | null;
  payment_due_day: number | null; renewal_notice_days: number | null;
  terminated_at: string | null; notes: string | null;
}
export interface PachtPayment {
  id: string; farm_id: string; lease_id: string | null; landlord_name: string;
  description: string | null; amount_czk: number | null; due_date: string;
  period_label: string | null; notes: string | null;
}
export interface ComplianceAudit {
  id: string; farm_id: string; audit_date: string; status: string; notes: string | null;
}
export interface AuditItem {
  id: string; audit_id: string; farm_id: string; dzes_standard: string;
  answer: string; note: string | null;
}
export interface SubsidyDeadline {
  id: string; farm_id: string; label: string; date: string;
  category: string; description: string | null;
}

type Tab = 'pachty' | 'dzes' | 'dotace';

interface Props {
  farms: Farm[];
  leases: Lease[];
  upcomingPayments: PachtPayment[];
  audits: ComplianceAudit[];
  auditItems: AuditItem[];
  subsidyDeadlines: SubsidyDeadline[];
}

export function NastaveniClientPage({ farms, leases, upcomingPayments, audits, auditItems, subsidyDeadlines }: Props) {
  const [tab, setTab] = useState<Tab>('pachty');

  const today = new Date().toISOString().slice(0, 10);
  const urgentPayments = upcomingPayments.filter(p => {
    const days = Math.round((new Date(p.due_date).getTime() - new Date(today).getTime()) / 86400000);
    return days <= 30;
  }).length;
  const urgentDeadlines = subsidyDeadlines.filter(d => {
    const days = Math.round((new Date(d.date).getTime() - new Date(today).getTime()) / 86400000);
    return days <= 14;
  }).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-0.5">Správa & Compliance</h1>
          <p className="text-sm text-gray-500">Pachty, DZES audit, dotační termíny</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-6">
        {([
          { key: 'pachty', label: 'Pachty', icon: FileText, badge: urgentPayments },
          { key: 'dzes', label: 'DZES', icon: Shield, badge: 0 },
          { key: 'dotace', label: 'Dotační termíny', icon: CalendarDays, badge: urgentDeadlines },
        ] as const).map(({ key, label, icon: Icon, badge }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              tab === key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
            <Icon size={14} />
            {label}
            {badge > 0 && (
              <span className="bg-amber-500 text-white text-xs font-bold rounded-full px-1.5 py-0 min-w-[18px] text-center">{badge}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'pachty' && <PachtyPrehled leases={leases} upcomingPayments={upcomingPayments} farms={farms} />}
      {tab === 'dzes' && <DzesPrehled audits={audits} auditItems={auditItems} farms={farms} />}
      {tab === 'dotace' && <SubsidyDeadlines deadlines={subsidyDeadlines} farms={farms} />}
    </div>
  );
}
