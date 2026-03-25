import { createClient } from '@/lib/supabase/server';
import { StrojeClientPage } from '@/components/stroje/StrojeClientPage';

export default async function StrojePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: memberships } = await supabase
    .from('farm_memberships').select('farm_id').eq('user_id', user!.id);

  const farmIds = memberships?.map((m) => m.farm_id) ?? [];

  const [farmsResult, machinesResult, serviceResult] = await Promise.all([
    farmIds.length
      ? supabase.from('farms').select('id, name, color, is_eco').in('id', farmIds)
      : { data: [] },
    farmIds.length
      ? supabase.from('machines')
          .select('id, farm_id, name, type, registration, inventory_number, year_of_manufacture, power_hp, motor_hours, fuel_consumption_lh, work_width_m, created_at')
          .in('farm_id', farmIds).order('name')
      : { data: [] },
    // Latest service record per machine (STK + next service)
    farmIds.length
      ? supabase.from('machine_service_records')
          .select('id, farm_id, machine_id, service_type, service_date, stk_result, stk_valid_until, description, cost_czk, technician, next_service_date')
          .in('farm_id', farmIds)
          .order('service_date', { ascending: false })
          .limit(500)
      : { data: [] },
  ]);

  return (
    <StrojeClientPage
      farms={farmsResult.data ?? []}
      machines={machinesResult.data ?? []}
      serviceRecords={serviceResult.data ?? []}
    />
  );
}
