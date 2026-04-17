# Katastr nemovitostí Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Czech cadastral map (ČÚZK) integration — WMS layer toggle on `/pole` map + new `/katastr` page with text search and map-click parcel lookup.

**Architecture:** Three API route handlers proxy ČÚZK/RÚIAN services (avoiding CORS). The `/pole` map gets one new WMS toggle. A new `/katastr` page has a MapLibre map, search bar, and info panel — all client-side components calling our API proxies.

**Tech Stack:** Next.js 16 (App Router), MapLibre GL 5 + react-map-gl 8, ČÚZK WMS/WFS, RÚIAN ArcGIS REST, Tailwind CSS, shadcn/ui, lucide-react

---

## File Structure

```
src/
  app/
    (app)/
      katastr/
        page.tsx                  # Server page (minimal — renders client component)
    api/
      katastr/
        ku-search/route.ts        # Proxy → RÚIAN ArcGIS /find (KÚ autocomplete)
        parcel-search/route.ts    # Proxy → ČÚZK WFS (parcela by KÚ + číslo)
        info/route.ts             # Proxy → ČÚZK WMS GetFeatureInfo (map click)
  components/
    katastr/
      KatastrClientPage.tsx       # Main client page: layout, state orchestration
      KatastrSearch.tsx           # Search bar: KÚ autocomplete + parcel number input
      KatastrMap.tsx              # MapLibre map with WMS katastr + click handler
      KatastrInfoPanel.tsx        # Side panel showing selected parcel info
  lib/
    katastr.ts                    # Shared types + Nahlížení URL builder
```

Modify:
- `src/components/parcels/ParcelsMap.tsx` — add katastr WMS entry
- `src/components/layout/AppSidebar.tsx` — add Katastr nav item

---

### Task 1: Add Katastr WMS layer to `/pole` map

**Files:**
- Modify: `src/components/parcels/ParcelsMap.tsx:19-32`

- [ ] **Step 1: Add katastr entry to WMS_LAYERS array**

In `src/components/parcels/ParcelsMap.tsx`, add a third entry to the `WMS_LAYERS` array:

```ts
const WMS_LAYERS = [
  {
    id: 'ortofoto',
    label: 'Ortofoto',
    url: 'https://ags.cuzk.cz/arcgis1/services/ORTOFOTO/MapServer/WMSServer',
    layers: '0',
  },
  {
    id: 'lpis',
    label: 'LPIS',
    url: 'https://mze.gov.cz/public/app/wms/public_DPB_PB_OPV.fcgi',
    layers: 'DPB_A2',
  },
  {
    id: 'katastr',
    label: 'Katastr',
    url: 'https://services.cuzk.cz/wms/wms.asp',
    layers: 'parcely_KN',
  },
] as const;
```

- [ ] **Step 2: Verify in browser**

Run: `cd /Users/matejsamec/farmasamec-web && npm run dev`

Open `/pole`, switch to map view, click the "Katastr" toggle. Zoom in past ~z14 — katastrální parcely should appear as an overlay.

- [ ] **Step 3: Commit**

```bash
git add src/components/parcels/ParcelsMap.tsx
git commit -m "feat: add katastr WMS layer toggle to /pole map"
```

---

### Task 2: Create shared katastr types and helpers

**Files:**
- Create: `src/lib/katastr.ts`

- [ ] **Step 1: Create the shared types file**

Create `src/lib/katastr.ts`:

```ts
/** Result from KÚ autocomplete search */
export interface KuResult {
  kuCode: string;
  kuName: string;
  obec: string;
}

/** Result from parcel search or map click */
export interface ParcelInfo {
  parcelNumber: string;
  kuCode: string;
  kuName: string;
  area: number | null; // m²
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon | null;
}

/** Build URL to Nahlížení do KN for a specific parcel */
export function buildNahlizenUrl(kuCode: string, parcelNumber: string, typ: 0 | 1 = 0): string {
  return `https://nahlizenidokn.cuzk.cz/VyberParcelu.aspx?ku=${encodeURIComponent(kuCode)}&parcela=${encodeURIComponent(parcelNumber)}&typ=${typ}`;
}

/** Format area in m² with thousands separator */
export function formatArea(m2: number): string {
  return m2.toLocaleString('cs-CZ') + ' m\u00B2';
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/katastr.ts
git commit -m "feat: add shared katastr types and helpers"
```

---

### Task 3: Create API route — KÚ search

**Files:**
- Create: `src/app/api/katastr/ku-search/route.ts`

- [ ] **Step 1: Create the route handler**

Create `src/app/api/katastr/ku-search/route.ts`:

```ts
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
```

- [ ] **Step 2: Test manually**

Run: `curl "http://localhost:3000/api/katastr/ku-search?q=Komar"`

Expected: JSON with `results` array containing KÚ entries matching "Komar" (e.g. Komárov).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/katastr/ku-search/route.ts
git commit -m "feat: add API route for katastrální území search"
```

---

### Task 4: Create API route — Parcel search by KÚ + number

**Files:**
- Create: `src/app/api/katastr/parcel-search/route.ts`

- [ ] **Step 1: Create the route handler**

Create `src/app/api/katastr/parcel-search/route.ts`:

```ts
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
    // WFS may return XML error — try to get text
    const text = await res.text();
    console.error('WFS error:', text.slice(0, 500));
    return NextResponse.json({ error: 'ČÚZK WFS error' }, { status: 502 });
  }

  const contentType = res.headers.get('content-type') ?? '';

  // WFS may return XML even on "success" if query is invalid
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
```

- [ ] **Step 2: Test manually**

Run: `curl "http://localhost:3000/api/katastr/parcel-search?ku=600016&parcela=123"`

Expected: JSON with parcel info or 404 if not found. Try with a known KÚ code.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/katastr/parcel-search/route.ts
git commit -m "feat: add API route for parcel search by KÚ + number"
```

---

### Task 5: Create API route — Map click info (GetFeatureInfo)

**Files:**
- Create: `src/app/api/katastr/info/route.ts`

- [ ] **Step 1: Create the route handler**

Create `src/app/api/katastr/info/route.ts`:

```ts
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

  // Parse XML response — ČÚZK returns fields in <FIELDS> or <gml:featureMember>
  // Typical response has attributes: KATUZE_KOD, KATUZE_NAZ, PARCELA, VYMERA
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
    geometry: null, // GetFeatureInfo doesn't return geometry
  };

  return NextResponse.json(result);
}

/** Extract value from XML attribute: ATTR_NAME="value" */
function extractXmlAttr(xml: string, name: string): string | null {
  const regex = new RegExp(`${name}="([^"]*)"`, 'i');
  const match = xml.match(regex);
  return match?.[1] ?? null;
}

/** Extract value from XML tag: <name>value</name> */
function extractXmlTag(xml: string, name: string): string | null {
  const regex = new RegExp(`<${name}[^>]*>([^<]*)</${name}>`, 'i');
  const match = xml.match(regex);
  return match?.[1]?.trim() ?? null;
}
```

- [ ] **Step 2: Test manually**

This is hard to test with curl (needs valid bbox + pixel coords). Will be tested via the map click flow in Task 8.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/katastr/info/route.ts
git commit -m "feat: add API route for WMS GetFeatureInfo (map click)"
```

---

### Task 6: Create KatastrInfoPanel component

**Files:**
- Create: `src/components/katastr/KatastrInfoPanel.tsx`

- [ ] **Step 1: Create the info panel component**

Create `src/components/katastr/KatastrInfoPanel.tsx`:

```tsx
'use client';

import { ExternalLink } from 'lucide-react';
import type { ParcelInfo } from '@/lib/katastr';
import { buildNahlizenUrl, formatArea } from '@/lib/katastr';

interface Props {
  parcel: ParcelInfo | null;
  loading: boolean;
}

export function KatastrInfoPanel({ parcel, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-2/3 rounded bg-gray-200" />
          <div className="h-3 w-1/2 rounded bg-gray-200" />
          <div className="h-3 w-1/3 rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  if (!parcel) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-400">
        Klikněte na parcelu v mapě nebo vyhledejte pomocí formuláře.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-800">
          Parcela {parcel.parcelNumber}
        </h3>
        <p className="text-sm text-gray-500">
          {parcel.kuName}{parcel.kuName && parcel.kuCode ? ' — ' : ''}{parcel.kuCode}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <dt className="text-gray-400">Číslo parcely</dt>
        <dd className="text-gray-800 font-medium">{parcel.parcelNumber}</dd>

        <dt className="text-gray-400">Katastrální území</dt>
        <dd className="text-gray-800">{parcel.kuName || parcel.kuCode}</dd>

        <dt className="text-gray-400">Kód KÚ</dt>
        <dd className="text-gray-800 font-mono text-xs">{parcel.kuCode}</dd>

        {parcel.area != null && (
          <>
            <dt className="text-gray-400">Výměra</dt>
            <dd className="text-gray-800 font-medium">{formatArea(parcel.area)}</dd>
          </>
        )}
      </dl>

      <a
        href={buildNahlizenUrl(parcel.kuCode, parcel.parcelNumber)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg bg-[#7c9a6e] px-4 py-2 text-sm font-medium text-white hover:bg-[#6b8a5e] transition-colors"
      >
        <ExternalLink size={14} />
        Zobrazit v Nahlížení do KN
      </a>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/katastr/KatastrInfoPanel.tsx
git commit -m "feat: add KatastrInfoPanel component"
```

---

### Task 7: Create KatastrSearch component

**Files:**
- Create: `src/components/katastr/KatastrSearch.tsx`

- [ ] **Step 1: Create the search component**

Create `src/components/katastr/KatastrSearch.tsx`:

```tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search } from 'lucide-react';
import type { KuResult, ParcelInfo } from '@/lib/katastr';

interface Props {
  onResult: (parcel: ParcelInfo) => void;
  onLoading: (loading: boolean) => void;
}

export function KatastrSearch({ onResult, onLoading }: Props) {
  const [kuQuery, setKuQuery] = useState('');
  const [kuResults, setKuResults] = useState<KuResult[]>([]);
  const [selectedKu, setSelectedKu] = useState<KuResult | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [parcelNumber, setParcelNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Debounced KÚ search
  useEffect(() => {
    if (selectedKu || kuQuery.length < 2) {
      setKuResults([]);
      setShowDropdown(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/katastr/ku-search?q=${encodeURIComponent(kuQuery)}`);
      if (!res.ok) return;
      const data = await res.json();
      setKuResults(data.results ?? []);
      setShowDropdown(true);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [kuQuery, selectedKu]);

  const selectKu = useCallback((ku: KuResult) => {
    setSelectedKu(ku);
    setKuQuery(`${ku.kuName} (${ku.obec})`);
    setShowDropdown(false);
    setError(null);
  }, []);

  const clearKu = useCallback(() => {
    setSelectedKu(null);
    setKuQuery('');
    setKuResults([]);
    setError(null);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!selectedKu) {
      setError('Vyberte katastrální území');
      return;
    }
    if (!parcelNumber.trim()) {
      setError('Zadejte číslo parcely');
      return;
    }

    setError(null);
    onLoading(true);

    const res = await fetch(
      `/api/katastr/parcel-search?ku=${encodeURIComponent(selectedKu.kuCode)}&parcela=${encodeURIComponent(parcelNumber.trim())}`,
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Chyba serveru' }));
      setError(data.error ?? 'Parcela nenalezena');
      onLoading(false);
      return;
    }

    const parcel: ParcelInfo = await res.json();
    // Enrich kuName from RÚIAN if WFS didn't provide it
    if (!parcel.kuName && selectedKu.kuName) {
      parcel.kuName = selectedKu.kuName;
    }
    onResult(parcel);
    onLoading(false);
  }, [selectedKu, parcelNumber, onResult, onLoading]);

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* KÚ autocomplete */}
      <div className="relative flex-1 min-w-[220px]" ref={dropdownRef}>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Katastrální území
        </label>
        <input
          type="text"
          value={kuQuery}
          onChange={(e) => {
            setKuQuery(e.target.value);
            if (selectedKu) clearKu();
          }}
          placeholder="Začněte psát název..."
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#7c9a6e] focus:ring-1 focus:ring-[#7c9a6e] outline-none"
        />
        {selectedKu && (
          <button
            onClick={clearKu}
            className="absolute right-2 top-[28px] text-gray-400 hover:text-gray-600 text-xs"
          >
            &times;
          </button>
        )}

        {showDropdown && kuResults.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-60 overflow-auto">
            {kuResults.map((ku) => (
              <button
                key={ku.kuCode}
                onClick={() => selectKu(ku)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0"
              >
                <span className="font-medium text-gray-800">{ku.kuName}</span>
                <span className="text-gray-400 ml-1.5">({ku.obec})</span>
                <span className="text-gray-300 text-xs ml-1.5">{ku.kuCode}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Parcel number */}
      <div className="w-[140px]">
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Číslo parcely
        </label>
        <input
          type="text"
          value={parcelNumber}
          onChange={(e) => setParcelNumber(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="např. 123/4"
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#7c9a6e] focus:ring-1 focus:ring-[#7c9a6e] outline-none"
        />
      </div>

      {/* Search button */}
      <button
        onClick={handleSearch}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[#7c9a6e] px-4 py-2 text-sm font-medium text-white hover:bg-[#6b8a5e] transition-colors"
      >
        <Search size={15} />
        Hledat
      </button>

      {/* Error */}
      {error && (
        <p className="w-full text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/katastr/KatastrSearch.tsx
git commit -m "feat: add KatastrSearch component with KÚ autocomplete"
```

---

### Task 8: Create KatastrMap component

**Files:**
- Create: `src/components/katastr/KatastrMap.tsx`

- [ ] **Step 1: Create the map component**

Create `src/components/katastr/KatastrMap.tsx`:

```tsx
'use client';

import { useCallback, useRef, useState } from 'react';
import MapGL, {
  Source,
  Layer,
  NavigationControl,
  type MapRef,
  type MapMouseEvent,
} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { ParcelInfo } from '@/lib/katastr';

const ORTOFOTO_URL = 'https://ags.cuzk.cz/arcgis1/services/ORTOFOTO/MapServer/WMSServer';
const KATASTR_WMS_URL = 'https://services.cuzk.cz/wms/wms.asp';

const DEFAULT_VIEW = { longitude: 15.8, latitude: 49.8, zoom: 7 };

interface Props {
  onParcelClick: (parcel: ParcelInfo) => void;
  onLoading: (loading: boolean) => void;
  highlightGeometry: GeoJSON.Polygon | GeoJSON.MultiPolygon | null;
}

export function KatastrMap({ onParcelClick, onLoading, highlightGeometry }: Props) {
  const mapRef = useRef<MapRef>(null);
  const [ortofoto, setOrtofoto] = useState(true);

  const handleClick = useCallback(
    async (e: MapMouseEvent) => {
      const map = mapRef.current;
      if (!map) return;

      // Get current map state for GetFeatureInfo params
      const canvas = map.getCanvas();
      const width = canvas.width;
      const height = canvas.height;
      const bounds = map.getBounds();

      // EPSG:3857 bbox from LngLat bounds
      const sw = lngLatToEpsg3857(bounds.getSouthWest().lng, bounds.getSouthWest().lat);
      const ne = lngLatToEpsg3857(bounds.getNorthEast().lng, bounds.getNorthEast().lat);
      const bbox = `${sw[0]},${sw[1]},${ne[0]},${ne[1]}`;

      const x = Math.round(e.point.x);
      const y = Math.round(e.point.y);

      onLoading(true);

      const res = await fetch(
        `/api/katastr/info?bbox=${bbox}&x=${x}&y=${y}&width=${width}&height=${height}`,
      );

      if (!res.ok) {
        onLoading(false);
        return;
      }

      const parcel: ParcelInfo = await res.json();
      onParcelClick(parcel);
      onLoading(false);
    },
    [onParcelClick, onLoading],
  );

  /** Fly to a bounding box (used by parent when search result arrives) */
  const flyToBounds = useCallback(
    (geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon) => {
      const map = mapRef.current;
      if (!map) return;
      const coords = getAllCoords(geometry);
      let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
      for (const [lng, lat] of coords) {
        if (lng < minLng) minLng = lng;
        if (lat < minLat) minLat = lat;
        if (lng > maxLng) maxLng = lng;
        if (lat > maxLat) maxLat = lat;
      }
      if (isFinite(minLng)) {
        map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 100, duration: 1000 });
      }
    },
    [],
  );

  // Expose flyToBounds via ref on the component — parent calls it imperatively
  // Instead, we use useEffect in parent to call it when geometry changes.

  const highlightGeoJson = highlightGeometry
    ? { type: 'Feature' as const, geometry: highlightGeometry, properties: {} }
    : null;

  return (
    <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm relative" style={{ height: 550 }}>
      {/* Layer toggles */}
      <div className="absolute top-3 left-3 z-10 flex gap-1.5">
        <button
          onClick={() => setOrtofoto((v) => !v)}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium shadow-sm border transition-colors ${
            ortofoto
              ? 'bg-[#7c9a6e] text-white border-[#7c9a6e]'
              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
          }`}
        >
          Ortofoto
        </button>
      </div>

      <MapGL
        ref={mapRef}
        initialViewState={DEFAULT_VIEW}
        mapStyle="https://tiles.openfreemap.org/styles/positron"
        onClick={handleClick}
        cursor="pointer"
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" />

        {/* Ortofoto WMS */}
        {ortofoto && (
          <Source
            id="wms-ortofoto"
            type="raster"
            tiles={[
              `${ORTOFOTO_URL}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&LAYERS=0&CRS=EPSG:3857&STYLES=&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}`,
            ]}
            tileSize={256}
          >
            <Layer id="wms-layer-ortofoto" type="raster" paint={{ 'raster-opacity': 1 }} />
          </Source>
        )}

        {/* Katastr WMS */}
        <Source
          id="wms-katastr"
          type="raster"
          tiles={[
            `${KATASTR_WMS_URL}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&LAYERS=parcely_KN&CRS=EPSG:3857&STYLES=&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}`,
          ]}
          tileSize={256}
        >
          <Layer id="wms-layer-katastr" type="raster" paint={{ 'raster-opacity': 0.7 }} />
        </Source>

        {/* Highlight selected parcel */}
        {highlightGeoJson && (
          <Source id="highlight" type="geojson" data={highlightGeoJson}>
            <Layer
              id="highlight-fill"
              type="fill"
              paint={{ 'fill-color': '#7c9a6e', 'fill-opacity': 0.3 }}
            />
            <Layer
              id="highlight-outline"
              type="line"
              paint={{ 'line-color': '#7c9a6e', 'line-width': 3 }}
            />
          </Source>
        )}
      </MapGL>
    </div>
  );
}

/** Convert lng/lat to EPSG:3857 (Web Mercator) */
function lngLatToEpsg3857(lng: number, lat: number): [number, number] {
  const x = (lng * 20037508.34) / 180;
  const y =
    Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180);
  return [x, (y * 20037508.34) / 180];
}

/** Extract all [lng, lat] from a Polygon or MultiPolygon */
function getAllCoords(
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
): [number, number][] {
  if (geometry.type === 'Polygon') {
    return geometry.coordinates[0] as [number, number][];
  }
  return geometry.coordinates.flatMap((poly) => poly[0]) as [number, number][];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/katastr/KatastrMap.tsx
git commit -m "feat: add KatastrMap component with WMS and click handler"
```

---

### Task 9: Create KatastrClientPage and wire everything together

**Files:**
- Create: `src/components/katastr/KatastrClientPage.tsx`

- [ ] **Step 1: Create the client page component**

Create `src/components/katastr/KatastrClientPage.tsx`:

```tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { KatastrSearch } from './KatastrSearch';
import { KatastrMap } from './KatastrMap';
import { KatastrInfoPanel } from './KatastrInfoPanel';
import type { ParcelInfo } from '@/lib/katastr';

export function KatastrClientPage() {
  const [selectedParcel, setSelectedParcel] = useState<ParcelInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef<{ flyToBounds: (geom: GeoJSON.Polygon | GeoJSON.MultiPolygon) => void }>(null);

  const handleSearchResult = useCallback((parcel: ParcelInfo) => {
    setSelectedParcel(parcel);
  }, []);

  const handleMapClick = useCallback((parcel: ParcelInfo) => {
    setSelectedParcel(parcel);
  }, []);

  // Fly to geometry when search result has it
  useEffect(() => {
    if (selectedParcel?.geometry && mapRef.current) {
      mapRef.current.flyToBounds(selectedParcel.geometry);
    }
  }, [selectedParcel]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-0.5">Katastr nemovitostí</h1>
        <p className="text-sm text-gray-500">
          Vyhledejte parcelu nebo klikněte na mapu
        </p>
      </div>

      {/* Search bar */}
      <div className="mb-4">
        <KatastrSearch onResult={handleSearchResult} onLoading={setLoading} />
      </div>

      {/* Map + Info panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <KatastrMap
            onParcelClick={handleMapClick}
            onLoading={setLoading}
            highlightGeometry={selectedParcel?.geometry ?? null}
          />
        </div>
        <div>
          <KatastrInfoPanel parcel={selectedParcel} loading={loading} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/katastr/KatastrClientPage.tsx
git commit -m "feat: add KatastrClientPage orchestrating search, map, and info panel"
```

---

### Task 10: Create `/katastr` page route and add sidebar link

**Files:**
- Create: `src/app/(app)/katastr/page.tsx`
- Modify: `src/components/layout/AppSidebar.tsx:41-52`

- [ ] **Step 1: Create the server page**

Create `src/app/(app)/katastr/page.tsx`:

```tsx
import { KatastrClientPage } from '@/components/katastr/KatastrClientPage';

export default function KatastrPage() {
  return <KatastrClientPage />;
}
```

- [ ] **Step 2: Add sidebar navigation item**

In `src/components/layout/AppSidebar.tsx`, add the import for `MapPinned` and a new entry in `NAV_ITEMS`:

Update the import line:

```ts
import {
  LayoutDashboard,
  Tractor,
  Wheat,
  Map,
  MapPinned,
  Settings,
  ChevronDown,
  LogOut,
  Leaf,
  CalendarDays,
  ClipboardList,
  Droplets,
  FileText,
} from 'lucide-react';
```

Update `NAV_ITEMS` — insert Katastr after "Pole & Parcely":

```ts
const NAV_ITEMS = [
  { label: 'Přehled', href: '/', icon: LayoutDashboard },
  { label: 'Zvířata', href: '/zvirata', icon: Leaf },
  { label: 'Pole & Parcely', href: '/pole', icon: Map },
  { label: 'Katastr', href: '/katastr', icon: MapPinned },
  { label: 'Operace na poli', href: '/operace', icon: Wheat },
  { label: 'Stroje', href: '/stroje', icon: Tractor },
  { label: 'Kalendář', href: '/kalendar', icon: CalendarDays },
  { label: 'Úkoly', href: '/ukoly', icon: ClipboardList },
  { label: 'PHM', href: '/phm', icon: Droplets },
  { label: 'Exporty', href: '/exporty', icon: FileText },
  { label: 'Nastavení', href: '/nastaveni', icon: Settings },
];
```

- [ ] **Step 3: Verify in browser**

Run dev server. Check:
1. Sidebar shows "Katastr" with MapPinned icon after "Pole & Parcely"
2. Click navigates to `/katastr`
3. Page shows search bar, map, and empty info panel
4. Type a KÚ name → autocomplete dropdown appears
5. Select KÚ, enter parcel number, click Hledat → info panel populates
6. Click on map (zoomed in) → info panel updates with clicked parcel
7. "Zobrazit v Nahlížení do KN" link opens correct ČÚZK page

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/katastr/page.tsx src/components/layout/AppSidebar.tsx
git commit -m "feat: add /katastr page route and sidebar navigation"
```

---

### Task 11: Final integration test and cleanup

- [ ] **Step 1: Test `/pole` katastr toggle**

Go to `/pole` → Map view → toggle "Katastr" → zoom past z14 → verify katastrální parcely render on top of farm parcels.

- [ ] **Step 2: Test `/katastr` full flow**

1. Search "Komárov" → select from dropdown → enter "123" → Hledat
2. If found: info panel shows data, map zooms to parcel, highlight polygon visible
3. If not found: error message "Parcela nenalezena"
4. Click somewhere on map (zoomed in ~z16) → info panel updates
5. Click "Zobrazit v Nahlížení do KN" → opens nahlizenidokn.cuzk.cz

- [ ] **Step 3: Fix any issues found during testing**

Address any bugs discovered. Common issues to watch for:
- CORS errors (should not happen since we proxy)
- WMS not rendering at certain zoom levels (ČÚZK has min/max scale)
- XML parsing returning null (adjust regex patterns in info route)

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address integration issues from katastr testing"
```
