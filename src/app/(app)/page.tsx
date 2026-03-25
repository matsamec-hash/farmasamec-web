import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { UrgencyWidget } from '@/components/dashboard/UrgencyWidget';
import type { UrgencyItem } from '@/components/dashboard/UrgencyWidget';
import { NBarChart, PhmBarChart } from '@/components/dashboard/MiniCharts';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: memberships } = await supabase
    .from('farm_memberships').select('farm_id, role').eq('user_id', user!.id);
  const farmIds = memberships?.map(m => m.farm_id) ?? [];

  const today = new Date().toISOString().slice(0, 10);
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const sixMonthsAgo = new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10);

  const [
    farmsResult, parcelsResult, animalsCountResult, machinesCountResult, tasksCountResult,
    overdueTasksResult, urgentStkResult, urgentCalvingsResult, urgentPaymentsResult, urgentDeadlinesResult, expiringLeasesResult,
    nOpsResult, phmResult,
  ] = await Promise.all([
    farmIds.length ? supabase.from('farms').select('*').in('id', farmIds) : { data: [] },
    farmIds.length ? supabase.from('parcels').select('id, vymera', { count: 'exact' }).in('farm_id', farmIds) : { data: [], count: 0 },
    farmIds.length ? supabase.from('animals').select('id', { count: 'exact' }).in('farm_id', farmIds).eq('status', 'active') : { data: [], count: 0 },
    farmIds.length ? supabase.from('machines').select('id', { count: 'exact' }).in('farm_id', farmIds) : { data: [], count: 0 },
    farmIds.length ? supabase.from('tasks').select('id', { count: 'exact' }).in('farm_id', farmIds).eq('status', 'pending') : { data: [], count: 0 },
    // Overdue + urgent tasks
    farmIds.length ? supabase.from('tasks').select('id, title, deadline').in('farm_id', farmIds).eq('status', 'pending').not('deadline', 'is', null).lte('deadline', in30).order('deadline').limit(10) : { data: [] },
    // STK expiring / expired
    farmIds.length ? supabase.from('machine_service_records').select('id, machine_id, stk_valid_until').in('farm_id', farmIds).eq('service_type', 'stk').not('stk_valid_until', 'is', null).lte('stk_valid_until', in30).order('stk_valid_until').limit(5) : { data: [] },
    // Upcoming calvings
    farmIds.length ? supabase.from('reproduction_events').select('id, animal_id, expected_calving_date').in('farm_id', farmIds).eq('event_type', 'pregnancy_check').eq('pregnancy_result', 'positive').not('expected_calving_date', 'is', null).gte('expected_calving_date', today).lte('expected_calving_date', in30).order('expected_calving_date').limit(5) : { data: [] },
    // Pacht payments
    farmIds.length ? supabase.from('pacht_payments').select('id, landlord_name, due_date').in('farm_id', farmIds).gte('due_date', today).lte('due_date', in30).order('due_date').limit(5) : { data: [] },
    // Subsidy deadlines
    farmIds.length ? supabase.from('subsidy_deadlines').select('id, label, date').in('farm_id', farmIds).gte('date', today).lte('date', in30).order('date').limit(5) : { data: [] },
    // Expiring leases
    farmIds.length ? supabase.from('lease_agreements').select('id, landlord_name, end_date').in('farm_id', farmIds).is('terminated_at', null).gte('end_date', today).lte('end_date', in30).order('end_date').limit(5) : { data: [] },
    // N applied last 6 months (for chart)
    farmIds.length ? supabase.from('field_operations').select('operation_date, n_kg_per_ha, area_ha').in('farm_id', farmIds).eq('operation_type', 'hnojeni').gte('operation_date', sixMonthsAgo) : { data: [] },
    // PHM dispensed last 6 months
    farmIds.length ? supabase.from('fuel_dispensings').select('date, liters').in('farm_id', farmIds).gte('date', sixMonthsAgo) : { data: [] },
  ]);

  // Enrich STK with machine names
  const stkMachineIds = [...new Set((urgentStkResult.data ?? []).map((s: { machine_id: string }) => s.machine_id))];
  const { data: stkMachines } = stkMachineIds.length ? await supabase.from('machines').select('id, name').in('id', stkMachineIds) : { data: [] };
  const machineNameMap = Object.fromEntries((stkMachines ?? []).map(m => [m.id, m.name]));

  const farms = farmsResult.data ?? [];
  const parcelCount = parcelsResult.count ?? 0;
  const totalHa = (parcelsResult.data ?? []).reduce((s: number, p: { vymera: number | null }) => s + (p.vymera ?? 0), 0);
  const animalCount = animalsCountResult.count ?? 0;
  const machineCount = machinesCountResult.count ?? 0;
  const taskCount = tasksCountResult.count ?? 0;

  // Build urgency items
  const urgencyItems: UrgencyItem[] = [];
  const diffDays = (d: string) => Math.round((new Date(d).getTime() - new Date(today).getTime()) / 86400000);

  for (const t of (overdueTasksResult.data ?? [])) {
    urgencyItems.push({ id: t.id, type: 'task', title: t.title, daysUntil: diffDays(t.deadline!), href: '/ukoly' });
  }
  for (const s of (urgentStkResult.data ?? [])) {
    urgencyItems.push({ id: s.id, type: 'stk', title: `STK — ${machineNameMap[s.machine_id] ?? 'Stroj'}`, subtitle: s.stk_valid_until ?? undefined, daysUntil: diffDays(s.stk_valid_until!), href: '/stroje' });
  }
  for (const c of (urgentCalvingsResult.data ?? [])) {
    urgencyItems.push({ id: c.id, type: 'calving', title: 'Očekávaný porod', subtitle: c.animal_id, daysUntil: diffDays(c.expected_calving_date!), href: '/zvirata' });
  }
  for (const p of (urgentPaymentsResult.data ?? [])) {
    urgencyItems.push({ id: p.id, type: 'payment', title: `Platba — ${p.landlord_name}`, daysUntil: diffDays(p.due_date), href: '/nastaveni' });
  }
  for (const d of (urgentDeadlinesResult.data ?? [])) {
    urgencyItems.push({ id: d.id, type: 'deadline', title: d.label, daysUntil: diffDays(d.date), href: '/nastaveni' });
  }
  for (const l of (expiringLeasesResult.data ?? [])) {
    urgencyItems.push({ id: l.id, type: 'lease', title: `Smlouva — ${l.landlord_name}`, subtitle: `Vyprší ${l.end_date}`, daysUntil: diffDays(l.end_date), href: '/nastaveni' });
  }
  urgencyItems.sort((a, b) => a.daysUntil - b.daysUntil);

  // Build monthly N chart data
  const nByMonth: Record<string, number> = {};
  for (const op of (nOpsResult.data ?? [])) {
    const month = op.operation_date.slice(0, 7);
    nByMonth[month] = (nByMonth[month] ?? 0) + (op.n_kg_per_ha ?? 0) * (op.area_ha ?? 0);
  }
  const nChartData = last6Months().map(m => ({ month: m.short, value: nByMonth[m.key] ?? 0 }));

  // Build monthly PHM chart
  const phmByMonth: Record<string, number> = {};
  for (const d of (phmResult.data ?? [])) {
    const month = d.date.slice(0, 7);
    phmByMonth[month] = (phmByMonth[month] ?? 0) + d.liters;
  }
  const phmChartData = last6Months().map(m => ({ month: m.short, value: phmByMonth[m.key] ?? 0 }));

  const hasNData = nChartData.some(d => d.value > 0);
  const hasPhmData = phmChartData.some(d => d.value > 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Přehled</h1>
      <p className="text-sm text-gray-500 mb-6">Vítejte zpět, {user?.email}</p>

      {/* Urgency widget */}
      <UrgencyWidget items={urgencyItems} />

      {/* Farms */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Vaše farmy</h2>
        {!farms?.length ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-400">
            Žádné farmy nenalezeny. Data synchronizujte přes mobilní appku.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {farms.map((farm: Record<string, unknown>) => (
              <div key={farm.id as string} className="rounded-xl bg-white border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: `${farm.color as string}22` }}>
                  🌾
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{farm.name as string}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {farm.is_eco ? (
                      <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200 px-1.5 py-0">EKO</Badge>
                    ) : (
                      <Badge className="text-[10px] bg-gray-100 text-gray-600 border-gray-200 px-1.5 py-0">Konvenční</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick stats */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Rychlý přehled</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Parcely', value: parcelCount > 0 ? `${parcelCount}` : '—', icon: '🗺️', sub: parcelCount > 0 ? `${totalHa.toFixed(1)} ha` : undefined },
            { label: 'Zvířata', value: animalCount > 0 ? `${animalCount}` : '—', icon: '🐄', sub: undefined },
            { label: 'Stroje', value: machineCount > 0 ? `${machineCount}` : '—', icon: '🚜', sub: undefined },
            { label: 'Úkoly', value: taskCount > 0 ? `${taskCount}` : '—', icon: '📋', sub: taskCount > 0 ? 'nevyřízených' : undefined },
          ].map(({ label, value, icon, sub }) => (
            <div key={label} className="rounded-xl bg-white border border-gray-100 shadow-sm p-4">
              <p className="text-2xl mb-1">{icon}</p>
              <p className="text-xl font-bold text-gray-800">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
              {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Mini charts */}
      {(hasNData || hasPhmData) && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Grafy</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {hasNData && <NBarChart data={nChartData} />}
            {hasPhmData && <PhmBarChart data={phmChartData} />}
          </div>
        </section>
      )}
    </div>
  );
}

function last6Months(): { key: string; short: string }[] {
  const result = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const key = d.toISOString().slice(0, 7);
    const short = d.toLocaleString('cs-CZ', { month: 'short' });
    result.push({ key, short });
  }
  return result;
}
