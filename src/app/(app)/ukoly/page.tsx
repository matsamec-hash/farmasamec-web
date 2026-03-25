import { createClient } from '@/lib/supabase/server';
import { UkolyClientPage } from '@/components/ukoly/UkolyClientPage';

export default async function UkolyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: memberships } = await supabase
    .from('farm_memberships').select('farm_id').eq('user_id', user!.id);
  const farmIds = memberships?.map(m => m.farm_id) ?? [];

  const [farmsResult, tasksResult, itemsResult] = await Promise.all([
    farmIds.length ? supabase.from('farms').select('id, name, color, is_eco').in('id', farmIds) : { data: [] },
    farmIds.length
      ? supabase.from('tasks')
          .select('id, farm_id, title, description, deadline, status, has_checklist, machine_id, animal_id, parcel_id, created_at, updated_at')
          .in('farm_id', farmIds).order('deadline', { ascending: true, nullsFirst: false })
      : { data: [] },
    farmIds.length
      ? supabase.from('task_items').select('id, task_id, text, is_done, sort_order').in('farm_id', farmIds).order('sort_order')
      : { data: [] },
  ]);

  return (
    <UkolyClientPage
      farms={farmsResult.data ?? []}
      tasks={tasksResult.data ?? []}
      taskItems={itemsResult.data ?? []}
      currentUserId={user!.id}
    />
  );
}
