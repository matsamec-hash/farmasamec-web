import { NextRequest, NextResponse } from 'next/server';
import type { KuResult } from '@/lib/katastr';

const RUIAN_URL =
  'https://ags.cuzk.cz/arcgis/rest/services/RUIAN/Vyhledavaci_sluzba_nad_daty_RUIAN/MapServer';

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get('q')?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const url = `${RUIAN_URL}/find?searchText=${encodeURIComponent(q)}&contains=true&searchFields=NAZEV&layers=3&returnGeometry=false&f=json`;

  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json({ error: 'RÚIAN service error' }, { status: 502 });
  }

  const data = await res.json();

  const results: KuResult[] = (data.results ?? [])
    .slice(0, 20)
    .map((r: { attributes: Record<string, string> }) => ({
      kuCode: String(r.attributes.KOD ?? r.attributes.KOD_KU ?? ''),
      kuName: r.attributes.NAZEV ?? '',
      obec: r.attributes.NAZEV_OBCE ?? r.attributes.OBEC ?? '',
    }))
    .filter((r: KuResult) => r.kuCode && r.kuName);

  return NextResponse.json({ results });
}
