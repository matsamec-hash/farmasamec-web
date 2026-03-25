'use client';

import { useMemo } from 'react';
import type { ComplianceAudit, AuditItem, Farm } from './NastaveniClientPage';
import { CheckCircle2, XCircle, Minus, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const DZES_LABELS: Record<string, string> = {
  DZES1: 'DZES 1 — Ochrana vodních toků a nádrží',
  DZES2: 'DZES 2 — Ochrana před větrem',
  DZES3: 'DZES 3 — Minimální pokryv půdy',
  DZES4: 'DZES 4 — Minimální obhospodařování půdy',
  DZES5: 'DZES 5 — Střídání plodin',
  DZES6: 'DZES 6 — Ochrana a péče o úhor',
  DZES7: 'DZES 7 — Ochrana mokřin a rašelinišť',
  DZES8: 'DZES 8 — Ochrana krajinných prvků',
  DZES9: 'DZES 9 — Zákaz přeměny nebo orby TTP',
};

const ANSWER_CONFIG = {
  yes: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100', label: 'Splněno' },
  no: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Nesplněno' },
  na: { icon: Minus, color: 'text-gray-400', bg: 'bg-gray-100', label: 'N/A' },
  unanswered: { icon: HelpCircle, color: 'text-gray-300', bg: 'bg-gray-50', label: 'Nezodpovězeno' },
};

interface Props { audits: ComplianceAudit[]; auditItems: AuditItem[]; farms: Farm[]; }

export function DzesPrehled({ audits, auditItems, farms }: Props) {
  const farmMap = useMemo(() => Object.fromEntries(farms.map(f => [f.id, f])), [farms]);

  // Group items by auditId
  const itemsByAudit = useMemo(() => {
    const map: Record<string, AuditItem[]> = {};
    for (const item of auditItems) {
      if (!map[item.audit_id]) map[item.audit_id] = [];
      map[item.audit_id].push(item);
    }
    return map;
  }, [auditItems]);

  if (audits.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
        Žádné DZES audity. Spusťte audit v mobilní appce a data se zde synchronizují.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {audits.map(audit => {
        const items = itemsByAudit[audit.id] ?? [];
        const farm = farmMap[audit.farm_id];
        const yesCount = items.filter(i => i.answer === 'yes').length;
        const noCount = items.filter(i => i.answer === 'no').length;
        const unanswered = items.filter(i => i.answer === 'unanswered').length;
        const score = items.length > 0 ? Math.round((yesCount / (items.length - items.filter(i => i.answer === 'na').length || 1)) * 100) : null;

        return (
          <div key={audit.id} className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            {/* Audit header */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Audit {audit.audit_date}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full', audit.status === 'complete' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')}>
                      {audit.status === 'complete' ? 'Dokončen' : 'Probíhá'}
                    </span>
                    {farm && <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: farm.color }}>{farm.name}</span>}
                  </div>
                </div>
              </div>
              {score !== null && (
                <div className="text-right">
                  <p className={cn('text-2xl font-bold', score >= 80 ? 'text-green-700' : score >= 50 ? 'text-amber-600' : 'text-red-600')}>{score} %</p>
                  <p className="text-xs text-gray-400">{yesCount} / {items.filter(i => i.answer !== 'na').length} splněno</p>
                </div>
              )}
            </div>

            {/* DZES items grid */}
            <div className="divide-y divide-gray-50">
              {Object.entries(DZES_LABELS).map(([standard, label]) => {
                const item = items.find(i => i.dzes_standard === standard);
                const answer = item?.answer ?? 'unanswered';
                const cfg = ANSWER_CONFIG[answer as keyof typeof ANSWER_CONFIG] ?? ANSWER_CONFIG.unanswered;
                const Icon = cfg.icon;

                return (
                  <div key={standard} className={cn('flex items-center gap-3 px-4 py-3', answer === 'no' ? 'bg-red-50/50' : '')}>
                    <div className={cn('flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center', cfg.bg)}>
                      <Icon size={14} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700">{label}</p>
                      {item?.note && <p className="text-xs text-gray-400 mt-0.5 truncate">{item.note}</p>}
                    </div>
                    <span className={cn('text-xs font-medium flex-shrink-0', cfg.color)}>{cfg.label}</span>
                  </div>
                );
              })}
            </div>

            {noCount > 0 && (
              <div className="px-4 py-3 bg-red-50 border-t border-red-100 text-xs text-red-700">
                ⚠ {noCount} standard{noCount > 1 ? 'y' : ''} nesplněn{noCount > 1 ? 'y' : ''}. Proveďte nápravná opatření před inspekcí SZIF.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
