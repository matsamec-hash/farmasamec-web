import { createClient } from '@/lib/supabase/server';
import { KalendarClientPage } from '@/components/kalendar/KalendarClientPage';

export default async function KalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: memberships } = await supabase
    .from('farm_memberships').select('farm_id').eq('user_id', user!.id);
  const farmIds = memberships?.map(m => m.farm_id) ?? [];

  const today = new Date().toISOString().slice(0, 10);
  const in90 = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);

  const [farmsResult, tasksResult, paymentsResult, deadlinesResult, calvingsResult, stkResult] = await Promise.all([
    farmIds.length ? supabase.from('farms').select('id, name, color').in('id', farmIds) : { data: [] },
    // Pending tasks with deadline in next 90 days
    farmIds.length
      ? supabase.from('tasks').select('id, farm_id, title, deadline, status')
          .in('farm_id', farmIds).eq('status', 'pending').not('deadline', 'is', null)
          .lte('deadline', in90).order('deadline')
      : { data: [] },
    // Pacht payments due in next 90 days
    farmIds.length
      ? supabase.from('pacht_payments').select('id, farm_id, landlord_name, description, amount_czk, due_date, period_label')
          .in('farm_id', farmIds).gte('due_date', today).lte('due_date', in90).order('due_date')
      : { data: [] },
    // Subsidy deadlines in next 90 days
    farmIds.length
      ? supabase.from('subsidy_deadlines').select('id, farm_id, label, date, category')
          .in('farm_id', farmIds).gte('date', today).lte('date', in90).order('date')
      : { data: [] },
    // Upcoming calvings in next 90 days
    farmIds.length
      ? supabase.from('reproduction_events')
          .select('id, farm_id, animal_id, expected_calving_date')
          .in('farm_id', farmIds).eq('event_type', 'pregnancy_check').eq('pregnancy_result', 'positive')
          .not('expected_calving_date', 'is', null).gte('expected_calving_date', today).lte('expected_calving_date', in90).order('expected_calving_date')
      : { data: [] },
    // STK expiring in next 90 days
    farmIds.length
      ? supabase.from('machine_service_records')
          .select('id, farm_id, machine_id, stk_valid_until')
          .in('farm_id', farmIds).eq('service_type', 'stk')
          .not('stk_valid_until', 'is', null).gte('stk_valid_until', today).lte('stk_valid_until', in90).order('stk_valid_until')
      : { data: [] },
  ]);

  // Enrich STK with machine names
  const machineIds = [...new Set((stkResult.data ?? []).map(s => s.machine_id))];
  const { data: machinesData } = machineIds.length
    ? await supabase.from('machines').select('id, name').in('id', machineIds)
    : { data: [] };
  const machineMap = Object.fromEntries((machinesData ?? []).map(m => [m.id, m.name]));

  return (
    <KalendarClientPage
      farms={farmsResult.data ?? []}
      tasks={(tasksResult.data ?? []) as Array<{ id: string; farm_id: string; title: string; deadline: string; status: string }>}
      payments={paymentsResult.data ?? []}
      deadlines={deadlinesResult.data ?? []}
      calvings={(calvingsResult.data ?? []) as Array<{ id: string; farm_id: string; animal_id: string; expected_calving_date: string }>}
      stkRecords={(stkResult.data ?? []).map(s => ({ ...s, machine_name: machineMap[s.machine_id] ?? s.machine_id }))}
      today={today}
    />
  );
}
