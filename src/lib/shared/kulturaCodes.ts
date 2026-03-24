// Kultura (land use type) codes used in LPIS (Land Parcel Identification System)
// Source: SZIF/eAGRI kultura codes for Czech Republic
//
// LPIS exports use single-letter codes (T, R, G, V, C, J, O)
// while some contexts use longer codes (TTP, S, CH, ZS, OP).
// Both variants are mapped here.

/** Hex color for each kultura code — used for Mapbox polygon fill layers */
export const KULTURA_COLORS: Record<string, string> = {
  // Long codes
  R: '#8B4513',   // Orná půda — saddle brown
  TTP: '#228B22', // Trvalý travní porost — forest green
  S: '#90EE90',   // Sady (ovocné sady) — light green
  V: '#800080',   // Vinice — purple
  CH: '#DAA520',  // Chmelnice — goldenrod
  ZS: '#87CEEB',  // Zahrada/zeleninová zahrada — sky blue
  OP: '#999999',  // Ostatní plochy — gray
  // LPIS single-letter codes
  T: '#228B22',   // = TTP
  G: '#90EE90',   // = Sady (trvalá kultura)
  C: '#DAA520',   // = Chmelnice
  J: '#87CEEB',   // = Jiná kultura
  O: '#999999',   // = Ostatní
};

/** Czech labels for each kultura code */
export const KULTURA_LABELS: Record<string, string> = {
  R: 'Orná půda',
  TTP: 'Trvalý travní porost',
  T: 'Trvalý travní porost',
  S: 'Sady',
  G: 'Sady',
  V: 'Vinice',
  CH: 'Chmelnice',
  C: 'Chmelnice',
  ZS: 'Zahrada',
  J: 'Jiná kultura',
  OP: 'Ostatní plochy',
  O: 'Ostatní plochy',
};

/** All supported kultura codes */
export const KULTURA_CODES = Object.keys(KULTURA_COLORS) as Array<keyof typeof KULTURA_COLORS>;
