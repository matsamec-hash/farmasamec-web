import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Dataset = 'parcely' | 'operace' | 'zvirata';

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [
    headers.join(','),
    ...rows.map(row => headers.map(h => escape(row[h])).join(',')),
  ];
  return lines.join('\r\n');
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const { searchParams } = new URL(req.url);
  const dataset = searchParams.get('dataset') as Dataset | null;
  const farmId = searchParams.get('farmId');
  const year = searchParams.get('year');

  if (!dataset) return new NextResponse('Missing dataset param', { status: 400 });

  const { data: memberships } = await supabase.from('farm_memberships').select('farm_id').eq('user_id', user.id);
  const allowedFarmIds = memberships?.map(m => m.farm_id) ?? [];
  if (farmId && !allowedFarmIds.includes(farmId)) return new NextResponse('Forbidden', { status: 403 });
  const targetIds = farmId ? [farmId] : allowedFarmIds;
  if (!targetIds.length) return new NextResponse('No farms', { status: 400 });

  let csv = '';
  let filename = 'export';

  if (dataset === 'parcely') {
    const { data } = await supabase.from('parcels')
      .select('nazev, lpis_code, kultura, vymera, bpej, is_in_nvz, current_crop, eko, erozohro, svazitost, vyska')
      .in('farm_id', targetIds).order('nazev');
    csv = toCsv((data ?? []).map(p => ({
      'Název': p.nazev ?? '',
      'DPB kód': p.lpis_code ?? '',
      'Kultura': p.kultura ?? '',
      'Výměra (ha)': p.vymera ?? '',
      'BPEJ': p.bpej ?? '',
      'NVZ': p.is_in_nvz ? 'ANO' : 'NE',
      'Plodina': p.current_crop ?? '',
      'EKO': p.eko ? 'ANO' : '',
      'Eroze': p.erozohro ?? '',
      'Svažitost (°)': p.svazitost ?? '',
      'Výška (m)': p.vyska ?? '',
    })));
    filename = `parcely_${new Date().toISOString().slice(0, 10)}`;
  }

  else if (dataset === 'operace') {
    let query = supabase.from('field_operations')
      .select('operation_date, operation_type, crop, fertilizer_name, n_kg_per_ha, p_kg_per_ha, k_kg_per_ha, dose_kg_per_ha, dose_l_per_ha, area_ha, por_product_name, yield_t_per_ha, notes, parcel_id')
      .in('farm_id', targetIds)
      .order('operation_date', { ascending: false });
    if (year) {
      query = query.gte('operation_date', `${year}-01-01`).lte('operation_date', `${year}-12-31`);
    }
    const { data: ops } = await query;

    // Enrich with parcel names
    const parcelIds = [...new Set((ops ?? []).map(o => o.parcel_id))];
    const { data: parcels } = parcelIds.length
      ? await supabase.from('parcels').select('id, nazev, lpis_code').in('id', parcelIds)
      : { data: [] };
    const parcelMap = Object.fromEntries((parcels ?? []).map(p => [p.id, p]));

    const OP_LABELS: Record<string, string> = { seti: 'Setí', hnojeni: 'Hnojení', postrik: 'Postřik', sklizen: 'Sklizeň', orba: 'Orba' };
    csv = toCsv((ops ?? []).map(o => ({
      'Datum': o.operation_date,
      'Typ': OP_LABELS[o.operation_type] ?? o.operation_type,
      'Parcela': parcelMap[o.parcel_id]?.nazev ?? '',
      'DPB kód': parcelMap[o.parcel_id]?.lpis_code ?? '',
      'Plocha (ha)': o.area_ha ?? '',
      'Plodina': o.crop ?? '',
      'Hnojivo': o.fertilizer_name ?? '',
      'N (kg/ha)': o.n_kg_per_ha ?? '',
      'P (kg/ha)': o.p_kg_per_ha ?? '',
      'K (kg/ha)': o.k_kg_per_ha ?? '',
      'Dávka kg/ha': o.dose_kg_per_ha ?? '',
      'Dávka l/ha': o.dose_l_per_ha ?? '',
      'Přípravek POR': o.por_product_name ?? '',
      'Výnos (t/ha)': o.yield_t_per_ha ?? '',
      'Poznámka': o.notes ?? '',
    })));
    filename = `operace_${year ?? 'vse'}_${new Date().toISOString().slice(0, 10)}`;
  }

  else if (dataset === 'zvirata') {
    const { data } = await supabase.from('animals')
      .select('ear_tag, species, breed, sex, birth_date, status, category, stall, arrival_date, eco_since')
      .in('farm_id', targetIds).order('ear_tag');
    const SPECIES: Record<string, string> = { cattle: 'Skot', sheep: 'Ovce' };
    const SEX: Record<string, string> = { male: 'Samec', female: 'Samice' };
    const STATUS: Record<string, string> = { active: 'Aktivní', sold: 'Prodáno', dead: 'Uhynulo', transferred_out: 'Převedeno' };
    csv = toCsv((data ?? []).map(a => ({
      'Ušní číslo': a.ear_tag,
      'Druh': SPECIES[a.species] ?? a.species,
      'Pohlaví': SEX[a.sex] ?? a.sex,
      'Plemeno': a.breed ?? '',
      'Datum narození': a.birth_date ?? '',
      'Status': STATUS[a.status] ?? a.status,
      'Kategorie IZR': a.category ?? '',
      'Stáj': a.stall ?? '',
      'Datum příchodu': a.arrival_date ?? '',
      'EKO od': a.eco_since ?? '',
    })));
    filename = `zvirata_${new Date().toISOString().slice(0, 10)}`;
  }

  return new NextResponse('\ufeff' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.csv"`,
    },
  });
}
