'use client';

import { useMemo } from 'react';
import type { Lease, PachtPayment, Farm } from './NastaveniClientPage';
import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props { leases: Lease[]; upcomingPayments: PachtPayment[]; farms: Farm[]; }

export function PachtyPrehled({ leases, upcomingPayments, farms }: Props) {
  const farmMap = useMemo(() => Object.fromEntries(farms.map(f => [f.id, f])), [farms]);
  const today = new Date().toISOString().slice(0, 10);

  const leasesWithStatus = useMemo(() => leases.map(l => {
    const daysUntilEnd = Math.round((new Date(l.end_date).getTime() - new Date(today).getTime()) / 86400000);
    const daysUntilNotice = l.renewal_notice_days ? daysUntilEnd - l.renewal_notice_days : null;
    const status = l.terminated_at ? 'terminated' : daysUntilEnd < 0 ? 'expired' : daysUntilEnd <= 90 ? 'expiring' : 'active';
    return { ...l, daysUntilEnd, daysUntilNotice, status };
  }), [leases, today]);

  const totalHa = leases.filter(l => !l.terminated_at).reduce((s, l) => s + (l.total_area_ha ?? 0), 0);
  const totalRent = leases.filter(l => !l.terminated_at).reduce((s, l) => s + (l.annual_rent_czk ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: '📋', label: 'Aktivních smluv', value: leases.filter(l => !l.terminated_at).length.toString() },
          { icon: '🗺️', label: 'Celkem ha v pachtu', value: totalHa > 0 ? `${totalHa.toFixed(1)} ha` : '—' },
          { icon: '💰', label: 'Roční nájem celkem', value: totalRent > 0 ? `${totalRent.toLocaleString('cs-CZ')} Kč` : '—' },
          { icon: '⏰', label: 'Splatnosti do 30 dní', value: upcomingPayments.filter(p => Math.round((new Date(p.due_date).getTime() - new Date(today).getTime()) / 86400000) <= 30).length.toString() },
        ].map(({ icon, label, value }) => (
          <div key={label} className="rounded-xl border border-gray-100 bg-white shadow-sm p-4">
            <p className="text-2xl mb-1">{icon}</p>
            <p className="text-xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Upcoming payments */}
      {upcomingPayments.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nadcházející platby</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Pronajímatel', 'Popis', 'Splatnost', 'Zbývá', 'Částka', 'Farma'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {upcomingPayments.map(p => {
                const days = Math.round((new Date(p.due_date).getTime() - new Date(today).getTime()) / 86400000);
                const farm = farmMap[p.farm_id];
                return (
                  <tr key={p.id} className={cn('transition-colors', days <= 7 ? 'bg-amber-50' : 'hover:bg-gray-50')}>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{p.landlord_name}</td>
                    <td className="px-4 py-2.5 text-gray-600 text-xs">{p.description ?? p.period_label ?? '—'}</td>
                    <td className="px-4 py-2.5 font-mono text-gray-700">{p.due_date}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn('text-xs font-semibold', days <= 7 ? 'text-amber-700' : days <= 30 ? 'text-blue-700' : 'text-gray-600')}>
                        {days === 0 ? 'Dnes' : `za ${days} dní`}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-gray-800">
                      {p.amount_czk != null ? `${p.amount_czk.toLocaleString('cs-CZ')} Kč` : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      {farm && <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: farm.color }}>{farm.name}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Lease list */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pachtovní smlouvy</p>
        </div>
        {leases.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Žádné smlouvy. Data synchronizujte přes mobilní appku.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Pronajímatel', 'Smlouva č.', 'Platnost', 'Ha', 'Roční nájem', 'Status', 'Farma'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leasesWithStatus.map(l => {
                const farm = farmMap[l.farm_id];
                return (
                  <tr key={l.id} className={cn('transition-colors', l.status === 'expired' ? 'bg-red-50' : l.status === 'expiring' ? 'bg-amber-50/50' : 'hover:bg-gray-50')}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{l.landlord_name}</p>
                      {l.landlord_ico && <p className="text-xs text-gray-400">IČO: {l.landlord_ico}</p>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{l.contract_number}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <p>{l.start_date}</p>
                      <p className="text-gray-400">→ {l.end_date}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-700">{l.total_area_ha ? l.total_area_ha.toFixed(2) : '—'}</td>
                    <td className="px-4 py-3 font-mono text-gray-700">{l.annual_rent_czk ? `${l.annual_rent_czk.toLocaleString('cs-CZ')} Kč` : '—'}</td>
                    <td className="px-4 py-3">
                      {l.status === 'active' && <span className="flex items-center gap-1 text-green-700 text-xs"><CheckCircle2 size={12} /> Aktivní</span>}
                      {l.status === 'expiring' && <span className="flex items-center gap-1 text-amber-700 text-xs"><Clock size={12} /> Vyprší za {l.daysUntilEnd} dní</span>}
                      {l.status === 'expired' && <span className="flex items-center gap-1 text-red-700 text-xs"><AlertTriangle size={12} /> Vypršela</span>}
                      {l.status === 'terminated' && <span className="text-gray-400 text-xs">Ukončena</span>}
                    </td>
                    <td className="px-4 py-3">
                      {farm && <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: farm.color }}>{farm.name}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
