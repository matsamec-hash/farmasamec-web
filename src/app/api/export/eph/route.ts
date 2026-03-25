import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildEphXml } from '@/lib/exports/ephXml';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const { searchParams } = new URL(req.url);
  const farmId = searchParams.get('farmId');
  const year = searchParams.get('year') ?? new Date().getFullYear().toString();

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

  const [farmResult, opsResult, parcelsResult] = await Promise.all([
    supabase.from('farms').select('id, name').in('id', targetFarmIds).limit(1).single(),
    supabase
      .from('field_operations')
      .select(
        'id, parcel_id, operation_type, operation_date, crop, fertilizer_name, n_kg_per_ha, p_kg_per_ha, k_kg_per_ha, dose_kg_per_ha, dose_l_per_ha, area_ha, por_product_name, notes',
      )
      .in('farm_id', targetFarmIds)
      .gte('operation_date', `${year}-01-01`)
      .lte('operation_date', `${year}-12-31`),
    supabase
      .from('parcels')
      .select('id, nazev, lpis_code')
      .in('farm_id', targetFarmIds),
  ]);

  const farm = farmResult.data;
  const ops = opsResult.data ?? [];
  const parcels = parcelsResult.data ?? [];

  const parcelMap = Object.fromEntries(parcels.map((p) => [p.id, p]));

  const records = ops.map((op) => ({
    ...op,
    por_registration_number: null,
    growth_stage: null,
    parcel_name: parcelMap[op.parcel_id]?.nazev ?? null,
    lpis_code: parcelMap[op.parcel_id]?.lpis_code ?? null,
  }));

  const xml = buildEphXml(records, {
    registrationNumber: farm?.id ?? '',
    name: farm?.name ?? '',
  });

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const safeName = (farm?.name ?? 'farma').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `EPH_${safeName}_${year}_${dateStr}.xml`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
