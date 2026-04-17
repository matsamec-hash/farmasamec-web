import { NextRequest, NextResponse } from 'next/server';
import type { ParcelInfo } from '@/lib/katastr';

const WMS_URL = 'https://services.cuzk.cz/wms/wms.asp';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bbox = searchParams.get('bbox');
  const x = searchParams.get('x');
  const y = searchParams.get('y');
  const width = searchParams.get('width');
  const height = searchParams.get('height');

  if (!bbox || !x || !y || !width || !height) {
    return NextResponse.json({ error: 'Missing bbox/x/y/width/height' }, { status: 400 });
  }

  const gfiUrl =
    `${WMS_URL}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo` +
    `&LAYERS=parcely_KN&QUERY_LAYERS=parcely_KN` +
    `&INFO_FORMAT=text/xml` +
    `&I=${x}&J=${y}` +
    `&WIDTH=${width}&HEIGHT=${height}` +
    `&BBOX=${bbox}&CRS=EPSG:3857`;

  const res = await fetch(gfiUrl);
  if (!res.ok) {
    return NextResponse.json({ error: 'ČÚZK WMS error' }, { status: 502 });
  }

  const xml = await res.text();

  const parcelNumber = extractXmlAttr(xml, 'PARCELA') ?? extractXmlTag(xml, 'PARCELA');
  const kuCode = extractXmlAttr(xml, 'KATUZE_KOD') ?? extractXmlTag(xml, 'KATUZE_KOD');
  const kuName = extractXmlAttr(xml, 'KATUZE_NAZ') ?? extractXmlTag(xml, 'KATUZE_NAZ');
  const areaStr = extractXmlAttr(xml, 'VYMERA') ?? extractXmlTag(xml, 'VYMERA');

  if (!parcelNumber || !kuCode) {
    return NextResponse.json({ error: 'Žádná parcela na tomto místě' }, { status: 404 });
  }

  const result: ParcelInfo = {
    parcelNumber,
    kuCode,
    kuName: kuName ?? '',
    area: areaStr ? Math.round(Number(areaStr)) : null,
    geometry: null,
  };

  return NextResponse.json(result);
}

function extractXmlAttr(xml: string, name: string): string | null {
  const regex = new RegExp(`${name}="([^"]*)"`, 'i');
  const match = xml.match(regex);
  return match?.[1] ?? null;
}

function extractXmlTag(xml: string, name: string): string | null {
  const regex = new RegExp(`<${name}[^>]*>([^<]*)</${name}>`, 'i');
  const match = xml.match(regex);
  return match?.[1]?.trim() ?? null;
}
