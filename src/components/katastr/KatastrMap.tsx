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

      const canvas = map.getCanvas();
      const width = canvas.width;
      const height = canvas.height;
      const bounds = map.getBounds();

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

function lngLatToEpsg3857(lng: number, lat: number): [number, number] {
  const x = (lng * 20037508.34) / 180;
  const y =
    Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180);
  return [x, (y * 20037508.34) / 180];
}
