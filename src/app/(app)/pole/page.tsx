import { createClient } from '@/lib/supabase/server';
import { ParcelsClientPage } from '@/components/parcels/ParcelsClientPage';

export default async function PolePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: memberships } = await supabase
    .from('farm_memberships')
    .select('farm_id, role')
    .eq('user_id', user!.id);

  const farmIds = memberships?.map((m) => m.farm_id) ?? [];

  const [farmsResult, parcelsResult] = await Promise.all([
    farmIds.length
      ? supabase.from('farms').select('id, name, color, is_eco').in('id', farmIds)
      : { data: [] },
    farmIds.length
      ? supabase
          .from('parcels')
          .select(
            'id, farm_id, field_id, lpis_code, nazev, kultura, vymera, bpej, is_in_nvz, current_crop, geometry_json, eko, erozohro, svazitost, vyska',
          )
          .in('farm_id', farmIds)
          .order('nazev')
      : { data: [] },
  ]);

  return (
    <ParcelsClientPage
      farms={farmsResult.data ?? []}
      parcels={parcelsResult.data ?? []}
    />
  );
}
