import { createClient } from '@/lib/supabase/server';
import { PhmClientPage } from '@/components/phm/PhmClientPage';

export default async function PhmPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: memberships } = await supabase
    .from('farm_memberships').select('farm_id').eq('user_id', user!.id);
  const farmIds = memberships?.map(m => m.farm_id) ?? [];

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 6);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const [farmsResult, tanksResult, receiptsResult, dispensingsResult, machinesResult] = await Promise.all([
    farmIds.length ? supabase.from('farms').select('id, name, color').in('id', farmIds) : { data: [] },
    farmIds.length
      ? supabase.from('tanks').select('id, farm_id, name, capacity_liters, current_liters, location, low_limit_liters, is_shared').in('farm_id', farmIds)
      : { data: [] },
    farmIds.length
      ? supabase.from('fuel_receipts')
          .select('id, tank_id, farm_id, date, liters, supplier, price_per_liter, notes')
          .in('farm_id', farmIds).gte('date', cutoffStr).order('date', { ascending: false }).limit(200)
      : { data: [] },
    farmIds.length
      ? supabase.from('fuel_dispensings')
          .select('id, tank_id, farm_id, machine_id, date, liters, activity_type, notes')
          .in('farm_id', farmIds).gte('date', cutoffStr).order('date', { ascending: false }).limit(200)
      : { data: [] },
    farmIds.length
      ? supabase.from('machines').select('id, farm_id, name, type').in('farm_id', farmIds)
      : { data: [] },
  ]);

  return (
    <PhmClientPage
      farms={farmsResult.data ?? []}
      tanks={tanksResult.data ?? []}
      receipts={receiptsResult.data ?? []}
      dispensings={dispensingsResult.data ?? []}
      machines={machinesResult.data ?? []}
    />
  );
}
