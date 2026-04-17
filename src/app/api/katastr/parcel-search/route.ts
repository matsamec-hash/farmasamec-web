import { NextRequest, NextResponse } from 'next/server';
import type { ParcelInfo } from '@/lib/katastr';

const WFS_URL = 'https://services.cuzk.cz/wfs/inspire-cp-wfs.asp';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ku = searchParams.get('ku')?.trim();
  const parcela = searchParams.get('parcela')?.trim();

  if (!ku || !parcela) {
    return NextResponse.json({ error: 'Missing ku or parcela' }, { status: 400 });
  }

  // INSPIRE WFS — CadastralParcel by nationalCadastralReference
  const ref = `CZ.${ku}.${parcela}`;
  const wfsUrl = `${WFS_URL}?service=WFS&version=2.0.0&request=GetFeature&typeNames=CP:CadastralParcel&CQL_FILTER=nationalCadastralReference='${ref}'&outputFormat=application/json&srsName=EPSG:4326&count=1`;

  const res = await fetch(wfsUrl);
  if (!res.ok) {
    const text = await res.text();
    console.error('WFS error:', text.slice(0, 500));
    return NextResponse.json({ error: 'ČÚZK WFS error' }, { status: 502 });
  }

  const contentType = res.headers.get('content-type') ?? '';

  if (!contentType.includes('json')) {
    const text = await res.text();
    console.error('WFS non-JSON response:', text.slice(0, 500));
    return NextResponse.json({ error: 'Parcela nenalezena' }, { status: 404 });
  }

  const data = await res.json();
  const feature = data.features?.[0];

  if (!feature) {
    return NextResponse.json({ error: 'Parcela nenalezena' }, { status: 404 });
  }

  const props = feature.properties ?? {};

  const result: ParcelInfo = {
    parcelNumber: parcela,
    kuCode: ku,
    kuName: props.localId ?? props['cp:label'] ?? '',
    area: props.area != null ? Math.round(Number(props.area)) : null,
    geometry: feature.geometry ?? null,
  };

  return NextResponse.json(result);
}
