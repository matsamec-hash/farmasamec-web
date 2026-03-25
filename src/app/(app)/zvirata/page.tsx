import { createClient } from '@/lib/supabase/server';
import { ZvirataClientPage } from '@/components/zvirata/ZvirataClientPage';

export default async function ZvirataPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: memberships } = await supabase
    .from('farm_memberships')
    .select('farm_id, role')
    .eq('user_id', user!.id);

  const farmIds = memberships?.map((m) => m.farm_id) ?? [];

  const [farmsResult, herdsResult, animalsResult, reproResult] = await Promise.all([
    farmIds.length
      ? supabase.from('farms').select('id, name, color, is_eco').in('id', farmIds)
      : { data: [] },
    farmIds.length
      ? supabase.from('herds').select('id, farm_id, name, species').in('farm_id', farmIds)
      : { data: [] },
    farmIds.length
      ? supabase
          .from('animals')
          .select(
            'id, farm_id, ear_tag, species, breed, sex, birth_date, herd_id, status, category, farming_system, stall, arrival_date, eco_since',
          )
          .in('farm_id', farmIds)
          .eq('status', 'active')
          .order('ear_tag')
      : { data: [] },
    // Upcoming calvings (pregnancy_check positive + expected_calving_date in next 60 days)
    farmIds.length
      ? supabase
          .from('reproduction_events')
          .select('id, animal_id, farm_id, event_type, event_date, pregnancy_result, expected_calving_date, notes')
          .in('farm_id', farmIds)
          .eq('event_type', 'pregnancy_check')
          .eq('pregnancy_result', 'positive')
          .not('expected_calving_date', 'is', null)
          .order('expected_calving_date')
          .limit(100)
      : { data: [] },
  ]);

  return (
    <ZvirataClientPage
      farms={farmsResult.data ?? []}
      herds={herdsResult.data ?? []}
      animals={animalsResult.data ?? []}
      upcomingCalvings={reproResult.data ?? []}
    />
  );
}
