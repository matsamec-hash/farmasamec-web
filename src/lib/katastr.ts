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
