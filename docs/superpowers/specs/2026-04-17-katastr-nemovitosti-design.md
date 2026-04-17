# Katastr nemovitostí — Design Spec

## Overview

Integrace českého katastru nemovitostí (ČÚZK) do farmasamec-web. Dva deliverables:

1. **WMS vrstva katastru na `/pole`** — toggle pro zobrazení katastrálních parcel na existující mapě
2. **Nová stránka `/katastr`** — vyhledávání parcel (textově + kliknutím na mapu) s info panelem

## Data Sources

| Služba | URL | Účel |
|--------|-----|------|
| ČÚZK WMS | `https://services.cuzk.cz/wms/wms.asp` | Katastrální mapa (vrstva `parcely_KN`) |
| ČÚZK WMS GetFeatureInfo | Stejný endpoint | Klik na parcelu → číslo, KÚ, výměra |
| RÚIAN ArcGIS REST | `https://ags.cuzk.cz/arcgis/rest/services/RUIAN/Vyhledavaci_sluzba_nad_daty_RUIAN/MapServer` | Vyhledání katastrálního území podle názvu |
| ČÚZK WFS INSPIRE | `https://services.cuzk.cz/wfs/inspire-cp-wfs.asp` | Vyhledání parcely podle KÚ + čísla |
| Nahlížení do KN | `https://nahlizenidokn.cuzk.cz/` | Odkaz na detail (vlastník, LV, BPEJ, omezení) |

Všechny služby jsou veřejné, bez autentizace, zdarma.

## 1. WMS vrstva na `/pole`

### Změny v `ParcelsMap.tsx`

Přidání nové položky do pole `WMS_LAYERS`:

```ts
{
  id: 'katastr',
  label: 'Katastr',
  url: 'https://services.cuzk.cz/wms/wms.asp',
  layers: 'parcely_KN',
}
```

Stávající toggle UI (checkboxy nad mapou) automaticky zobrazí nový přepínač. Vrstva se renderuje jako `raster` source v MapLibre přes WMS GetMap request.

## 2. Stránka `/katastr`

### Route

`src/app/(app)/katastr/page.tsx` — server component, chráněný layoutem.

### Sidebar

Nová položka v `AppSidebar.tsx`:
- Label: `Katastr`
- Ikona: `MapPinned` (lucide-react)
- Pozice: za "Pole"

### Layout stránky

```
+-----------------------------------------------+
| [Katastrální území: ___▼] [Parcela: ___] [🔍] |
+-----------------------------------------------+
|                                   | Info Panel |
|          MapLibre mapa            |            |
|    (WMS katastr + ortofoto)       | Č. parcely |
|                                   | KÚ         |
|    klik → GetFeatureInfo          | Výměra     |
|                                   | [Nahlížení]|
+-----------------------------------------------+
```

### Komponenty

#### `KatastrSearch.tsx`
- Autocomplete input pro katastrální území — volá `/api/katastr/ku-search?q=...`
- Input pro číslo parcely (text)
- Toggle pozemková (typ 0) / stavební (typ 1) parcela
- Submit → volá `/api/katastr/parcel-search` → vrátí geometrii + základní info → zoom na parcelu na mapě

#### `KatastrMap.tsx`
- MapLibre GL mapa
- Vrstvy: ČÚZK ortofoto (stávající) + WMS `parcely_KN`
- Klik na mapu → volá `/api/katastr/info` s bbox a pixel coords → zobrazí info panel
- Zvýraznění vybrané parcely (highlight polygon pokud je geometrie z WFS k dispozici)

#### `KatastrInfoPanel.tsx`
- Zobrazí data vybrané parcely:
  - Číslo parcely
  - Katastrální území (název + kód)
  - Výměra (m²), formátovaná s oddělovačem tisíců
- Tlačítko "Zobrazit v Nahlížení do KN" → otevře nový tab s URL:
  `https://nahlizenidokn.cuzk.cz/VyberParcelu.aspx?ku={kuCode}&parcela={parcelNumber}&typ={0|1}`
- Prázdný stav: "Klikněte na parcelu v mapě nebo vyhledejte"

### API Routes

#### `GET /api/katastr/ku-search?q={query}`
Proxy na RÚIAN ArcGIS REST:
```
/find?searchText={query}&contains=true&layers=3&f=json
```
Response: `{ results: [{ kuCode: string, kuName: string, obec: string }] }`

#### `GET /api/katastr/parcel-search?ku={kuCode}&parcela={number}&typ={0|1}`
Proxy na ČÚZK WFS INSPIRE:
```
?service=WFS&request=GetFeature&typeName=CP:CadastralParcel
&CQL_FILTER=nationalCadastralReference='{kuCode}/{number}'
&outputFormat=application/json
```
Response: `{ parcelNumber: string, kuCode: string, kuName: string, area: number, geometry: GeoJSON | null }`

Fallback: pokud WFS nevrátí data, zkusit GetFeatureInfo s centroidem KÚ.

#### `GET /api/katastr/info?bbox={bbox}&x={px}&y={py}&width={w}&height={h}`
Proxy na ČÚZK WMS GetFeatureInfo:
```
?service=WMS&request=GetFeatureInfo&layers=parcely_KN&query_layers=parcely_KN
&info_format=text/xml&x={px}&y={py}&width={w}&height={h}&bbox={bbox}&crs=EPSG:3857
```
Response: parsovaný XML → `{ parcelNumber: string, kuCode: string, kuName: string, area: number }`

### Proč API proxy (Route Handlers)?
- ČÚZK WMS/WFS nemají CORS headers → přímé volání z browseru selže
- Proxy umožňuje parsování XML/GML na serveru a vrácení čistého JSON klientovi
- Budoucí možnost cachování

## Sdílený kód

- Ortofoto WMS URL + MapLibre base config — extrahovat do `src/lib/map-config.ts` pokud se opakuje
- Jinak minimální sdílení — `/pole` a `/katastr` mají jiný účel

## Mimo scope

- Vlastní databázová tabulka pro katastrální data (není potřeba, vše z ČÚZK API)
- Placený Dálkový přístup ČÚZK (vlastníci detailně)
- Samostatná sekce v sidebaru s vlastní správou (Phase 3 — později)
- Offline cache katastrálních dat
