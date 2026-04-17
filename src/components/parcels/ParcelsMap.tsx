'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import Map, {
  Source,
  Layer,
  Popup,
  NavigationControl,
  type MapRef,
  type MapMouseEvent,
} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { FeatureCollection, Feature, Polygon, MultiPolygon } from 'geojson';
import { KULTURA_LABELS, KULTURA_COLORS } from '@/lib/shared/kulturaCodes';
import type { Parcel, Farm } from './ParcelsClientPage';
import { cn } from '@/lib/utils';

// ČÚZK / LPIS WMS layers
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

type WmsLayerId = typeof WMS_LAYERS[number]['id'];

// Czech Republic center
const DEFAULT_VIEW = { longitude: 15.8, latitude: 49.8, zoom: 7 };

interface PopupInfo {
  longitude: number;
  latitude: number;
  parcel: Parcel;
}

interface Props {
  parcels: Parcel[];
  farms: Farm[];
  selectedParcelId: string | null;
  onSelectParcel: (id: string | null) => void;
}

export function ParcelsMap({ parcels, farms, selectedParcelId, onSelectParcel }: Props) {
  const mapRef = useRef<MapRef>(null);
  const [popup, setPopup] = useState<PopupInfo | null>(null);
  const [activeWms, setActiveWms] = useState<Set<WmsLayerId>>(new Set());

  const farmMap = useMemo(
    () => Object.fromEntries(farms.map((f) => [f.id, f])),
    [farms],
  );

  // Build GeoJSON from parcels
  const geojson = useMemo<FeatureCollection>(() => {
    const features: Feature[] = [];
    for (const parcel of parcels) {
      try {
        const geometry = JSON.parse(parcel.geometry_json) as Polygon | MultiPolygon;
        features.push({
          type: 'Feature',
          id: parcel.id,
          geometry,
          properties: {
            id: parcel.id,
            nazev: parcel.nazev ?? 'Bez názvu',
            kultura: parcel.kultura ?? '',
            kulturaColor: parcel.kultura ? (KULTURA_COLORS[parcel.kultura] ?? '#8B4513') : '#8B4513',
            vymera: parcel.vymera,
            farmId: parcel.farm_id,
            farmColor: farmMap[parcel.farm_id]?.color ?? '#7c9a6e',
            isInNvz: parcel.is_in_nvz,
            currentCrop: parcel.current_crop,
          },
        });
      } catch {
        // skip invalid geometry
      }
    }
    return { type: 'FeatureCollection', features };
  }, [parcels, farmMap]);

  // Fit to bounds on load / when parcels change
  const handleMapLoad = useCallback(() => {
    if (!mapRef.current || geojson.features.length === 0) return;
    // Import bbox from turf lazily would be ideal; instead compute naively
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
    for (const feature of geojson.features) {
      const coords = getAllCoords(feature.geometry as Polygon | MultiPolygon);
      for (const [lng, lat] of coords) {
        if (lng < minLng) minLng = lng;
        if (lat < minLat) minLat = lat;
        if (lng > maxLng) maxLng = lng;
        if (lat > maxLat) maxLat = lat;
      }
    }
    if (isFinite(minLng)) {
      mapRef.current.fitBounds(
        [[minLng, minLat], [maxLng, maxLat]],
        { padding: 60, duration: 0 },
      );
    }
  }, [geojson]);

  const handleClick = useCallback(
    (e: MapMouseEvent) => {
      const features = mapRef.current?.queryRenderedFeatures(e.point, {
        layers: ['parcels-fill'],
      });
      if (!features?.length) {
        onSelectParcel(null);
        setPopup(null);
        return;
      }
      const feature = features[0];
      const parcelId = feature.properties?.id as string;
      const parcel = parcels.find((p) => p.id === parcelId);
      if (!parcel) return;
      onSelectParcel(parcelId);
      setPopup({
        longitude: e.lngLat.lng,
        latitude: e.lngLat.lat,
        parcel,
      });
    },
    [parcels, onSelectParcel],
  );

  function toggleWms(id: WmsLayerId) {
    setActiveWms(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm relative" style={{ height: 600 }}>
      {/* WMS layer toggles */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        {WMS_LAYERS.map(layer => (
          <button
            key={layer.id}
            onClick={() => toggleWms(layer.id)}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-medium shadow-sm border transition-colors',
              activeWms.has(layer.id)
                ? 'bg-[#7c9a6e] text-white border-[#7c9a6e]'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400',
            )}
          >
            {layer.label}
          </button>
        ))}
      </div>

      <Map
        ref={mapRef}
        initialViewState={DEFAULT_VIEW}
        mapStyle="https://tiles.openfreemap.org/styles/positron"
        onLoad={handleMapLoad}
        onClick={handleClick}
        cursor="pointer"
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" />

        {/* WMS layers */}
        {WMS_LAYERS.filter(l => activeWms.has(l.id)).map(layer => (
          <Source
            key={layer.id}
            id={`wms-${layer.id}`}
            type="raster"
            tiles={[
              `${layer.url}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&LAYERS=${layer.layers}&CRS=EPSG:3857&STYLES=&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}`,
            ]}
            tileSize={256}
          >
            <Layer
              id={`wms-layer-${layer.id}`}
              type="raster"
              paint={{ 'raster-opacity': layer.id === 'ortofoto' ? 1 : 0.6 }}
              beforeId={layer.id === 'ortofoto' ? 'parcels-fill' : undefined}
            />
          </Source>
        ))}

        {geojson.features.length > 0 && (
          <Source id="parcels" type="geojson" data={geojson}>
            {/* Fill */}
            <Layer
              id="parcels-fill"
              type="fill"
              paint={{
                'fill-color': ['get', 'kulturaColor'],
                'fill-opacity': [
                  'case',
                  ['==', ['get', 'id'], selectedParcelId ?? ''],
                  0.7,
                  0.4,
                ],
              }}
            />
            {/* Outline */}
            <Layer
              id="parcels-outline"
              type="line"
              paint={{
                'line-color': [
                  'case',
                  ['==', ['get', 'id'], selectedParcelId ?? ''],
                  '#1a1a1a',
                  '#555555',
                ],
                'line-width': [
                  'case',
                  ['==', ['get', 'id'], selectedParcelId ?? ''],
                  2,
                  1,
                ],
              }}
            />
          </Source>
        )}

        {popup && (
          <Popup
            longitude={popup.longitude}
            latitude={popup.latitude}
            anchor="bottom"
            onClose={() => {
              setPopup(null);
              onSelectParcel(null);
            }}
            closeButton
            maxWidth="260px"
          >
            <ParcelPopupContent parcel={popup.parcel} farm={farmMap[popup.parcel.farm_id]} />
          </Popup>
        )}
      </Map>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg border border-gray-200 shadow-sm p-3 text-xs">
        <p className="font-semibold text-gray-600 mb-1.5">Kultura</p>
        {Object.entries(KULTURA_COLORS)
          .filter(([k]) => ['R', 'TTP', 'S', 'V', 'CH', 'OP'].includes(k))
          .map(([code, color]) => (
            <div key={code} className="flex items-center gap-1.5 mb-1 last:mb-0">
              <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: color, opacity: 0.6 }} />
              <span className="text-gray-600">{KULTURA_LABELS[code]}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

function ParcelPopupContent({ parcel, farm }: { parcel: Parcel; farm: Farm | undefined }) {
  return (
    <div className="p-1 min-w-[180px]">
      <p className="font-semibold text-gray-800 mb-1">{parcel.nazev ?? 'Bez názvu'}</p>
      {parcel.lpis_code && (
        <p className="text-xs text-gray-400 font-mono mb-1">{parcel.lpis_code}</p>
      )}
      <div className="text-xs text-gray-600 space-y-0.5">
        {parcel.kultura && (
          <p>
            <span className="text-gray-400">Kultura:</span>{' '}
            {KULTURA_LABELS[parcel.kultura] ?? parcel.kultura}
          </p>
        )}
        {parcel.vymera != null && (
          <p>
            <span className="text-gray-400">Výměra:</span> {parcel.vymera.toFixed(4)} ha
          </p>
        )}
        {parcel.current_crop && (
          <p>
            <span className="text-gray-400">Plodina:</span> {parcel.current_crop}
          </p>
        )}
        {farm && (
          <p>
            <span className="text-gray-400">Farma:</span>{' '}
            <span className="font-medium" style={{ color: farm.color }}>
              {farm.name}
            </span>
          </p>
        )}
        {parcel.is_in_nvz && (
          <p className="text-blue-600 font-medium">⚠ Nitrátová zranitelná zóna</p>
        )}
      </div>
    </div>
  );
}

// Helper: extract all [lng, lat] from a Polygon or MultiPolygon
function getAllCoords(geometry: Polygon | MultiPolygon): [number, number][] {
  if (geometry.type === 'Polygon') {
    return geometry.coordinates[0] as [number, number][];
  }
  return geometry.coordinates.flatMap((poly) => poly[0]) as [number, number][];
}
