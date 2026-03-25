import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildIzrTxt } from '@/lib/exports/izrTxt';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const { searchParams } = new URL(req.url);
  const farmId = searchParams.get('farmId');

  const { data: memberships } = await supabase
    .from('farm_memberships')
    .select('farm_id')
    .eq('user_id', user.id);

  const allowedFarmIds = memberships?.map((m) => m.farm_id) ?? [];
  if (farmId && !allowedFarmIds.includes(farmId)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const targetFarmIds = farmId ? [farmId] : allowedFarmIds;
  if (!targetFarmIds.length) return new NextResponse('No farms', { status: 400 });

  const [farmResult, eventsResult, animalsResult] = await Promise.all([
    supabase.from('farms').select('id, name').in('id', targetFarmIds).limit(1).single(),
    supabase
      .from('animal_events')
      .select('id, animal_id, farm_id, event_type, event_date, izr_kod_pohybu')
      .in('farm_id', targetFarmIds)
      .not('izr_kod_pohybu', 'is', null)
      .is('exported_at', null)
      .order('event_date'),
    supabase
      .from('animals')
      .select('id, ear_tag, species')
      .in('farm_id', targetFarmIds),
  ]);

  const farm = farmResult.data;
  const events = eventsResult.data ?? [];
  const animals = animalsResult.data ?? [];
  const animalMap = Object.fromEntries(animals.map((a) => [a.id, a]));

  const records = events
    .map((ev) => {
      const animal = animalMap[ev.animal_id];
      if (!animal) return null;
      return {
        ...ev,
        ear_tag: animal.ear_tag,
        species: animal.species as 'cattle' | 'sheep',
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const txt = buildIzrTxt(records, farm?.id ?? '');

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const safeName = (farm?.name ?? 'farma').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `IZR_${safeName}_${dateStr}.txt`;

  return new NextResponse(txt || '# Žádné nové pohyby k exportu', {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
