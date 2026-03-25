import { createClient } from '@/lib/supabase/server';
import { ExportyClientPage } from '@/components/exporty/ExportyClientPage';

export default async function ExportyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: memberships } = await supabase
    .from('farm_memberships')
    .select('farm_id, role')
    .eq('user_id', user!.id);

  const farmIds = memberships?.map((m) => m.farm_id) ?? [];

  const currentYear = new Date().getFullYear();

  const [farmsResult, financeResult, opsCountResult, eventsCountResult] = await Promise.all([
    farmIds.length
      ? supabase.from('farms').select('id, name, color, is_eco').in('id', farmIds)
      : { data: [] },
    // Finance entries current year
    farmIds.length
      ? supabase
          .from('finance_entries')
          .select('id, farm_id, entry_type, category, amount, date, business_unit, description')
          .in('farm_id', farmIds)
          .gte('date', `${currentYear}-01-01`)
          .lte('date', `${currentYear}-12-31`)
          .order('date', { ascending: false })
      : { data: [] },
    // Field operations not yet exported
    farmIds.length
      ? supabase
          .from('field_operations')
          .select('id', { count: 'exact' })
          .in('farm_id', farmIds)
          .is('exported_at', null)
      : { data: [], count: 0 },
    // Animal events not yet exported
    farmIds.length
      ? supabase
          .from('animal_events')
          .select('id', { count: 'exact' })
          .in('farm_id', farmIds)
          .is('exported_at', null)
          .not('izr_kod_pohybu', 'is', null)
      : { data: [], count: 0 },
  ]);

  return (
    <ExportyClientPage
      farms={farmsResult.data ?? []}
      financeEntries={financeResult.data ?? []}
      pendingEphCount={opsCountResult.count ?? 0}
      pendingIzrCount={eventsCountResult.count ?? 0}
      currentYear={currentYear}
    />
  );
}
