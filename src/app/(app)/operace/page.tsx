import { createClient } from '@/lib/supabase/server';
import { OperaceClientPage } from '@/components/operace/OperaceClientPage';

export default async function OperacePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: memberships } = await supabase
    .from('farm_memberships')
    .select('farm_id, role')
    .eq('user_id', user!.id);

  const farmIds = memberships?.map((m) => m.farm_id) ?? [];

  const [farmsResult, operationsResult, parcelsResult] = await Promise.all([
    farmIds.length
      ? supabase.from('farms').select('id, name, color, is_eco').in('id', farmIds)
      : { data: [] },
    farmIds.length
      ? supabase
          .from('field_operations')
          .select(
            'id, parcel_id, farm_id, operation_type, operation_date, crop, fertilizer_name, n_kg_per_ha, p_kg_per_ha, k_kg_per_ha, dose_kg_per_ha, dose_l_per_ha, area_ha, por_product_name, yield_t_per_ha, notes, compliance_warnings, exported_at, created_at',
          )
          .in('farm_id', farmIds)
          .order('operation_date', { ascending: false })
          .limit(500)
      : { data: [] },
    farmIds.length
      ? supabase
          .from('parcels')
          .select('id, farm_id, nazev, lpis_code, kultura, vymera, is_in_nvz')
          .in('farm_id', farmIds)
          .order('nazev')
      : { data: [] },
  ]);

  return (
    <OperaceClientPage
      farms={farmsResult.data ?? []}
      operations={operationsResult.data ?? []}
      parcels={parcelsResult.data ?? []}
    />
  );
}
