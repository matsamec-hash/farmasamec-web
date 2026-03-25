/**
 * IZR fixed-width TXT builder — web port of farm-app's izrExport.service.ts
 * Generates cattle/sheep movement hlášení for Portal farmáře / ČMSCH upload.
 * MEDIUM CONFIDENCE: field positions from domain knowledge — verify before production use.
 */

export interface IzrEventRecord {
  id: string;
  animal_id: string;
  event_type: string;
  event_date: string;
  izr_kod_pohybu: number | null;
  // enriched
  ear_tag: string;
  species: 'cattle' | 'sheep';
}

/** Build single IZR line (cattle: 33 chars fixed-width) */
export function buildIzrLine(event: IzrEventRecord, farmRegNumber: string): string {
  const animalType = event.species === 'cattle' ? '1' : '2';
  const regPadded = farmRegNumber.substring(0, 8).padEnd(10, ' ');
  const izrCode = (event.izr_kod_pohybu ?? 0).toString().padStart(2, '0');

  const earTagRaw = event.ear_tag ?? '';
  const earTagDigits = earTagRaw.startsWith('CZ') ? earTagRaw.substring(2) : earTagRaw;
  const earTagPadded = earTagDigits.padStart(12, '0').substring(0, 12);

  const countryCode = 'CZ';
  const dateFmt = formatDateIzr(event.event_date);

  return `${animalType}${regPadded}${izrCode}${countryCode}${earTagPadded}${dateFmt}`;
}

function formatDateIzr(iso: string): string {
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return '000000';
  return `${d}${m}${y.substring(2)}`;
}

export function buildIzrTxt(events: IzrEventRecord[], farmRegNumber: string): string {
  return events
    .filter((e) => e.izr_kod_pohybu != null)
    .map((e) => buildIzrLine(e, farmRegNumber))
    .join('\r\n');
}
