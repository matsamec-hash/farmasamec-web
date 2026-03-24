/**
 * Zakázaná období aplikace hnojiv dle klimatické oblasti.
 * Zdroj: NV 262/2012 Sb. ve znění NV 193/2024 Sb. (6. akční program, účinnost od 1.7.2024)
 *
 * Klimatické oblasti jsou odvozeny z prvního čísla BPEJ kódu (0–9):
 *   0–5 → teplá oblast (warm)
 *   6–7 → střední oblast (mid)
 *   8–9 → chladná oblast (cool)
 *
 * Parcely bez BPEJ: výchozí střední oblast (mid).
 *
 * Formát rozsahu: { from: 'MM-DD', to: 'MM-DD' } — obě strany včetně.
 * Přelomové roky: from > to znamená "od data v tomto roce do data v dalším roce".
 * Např. { from: '11-01', to: '01-31' } = 1. listopadu → 31. ledna (přelom roku).
 *
 * POZOR: Přesné termíny jsou STŘEDNÍ SPOLEHLIVOSTI — zkontrolujte oproti
 * aktuálnímu vydání NV 193/2024 Sb. (Příloha č. 3) před nasazením do produkce.
 */

export type FertilizerCategory = 'mineral' | 'organic_fast' | 'organic_slow';
export type CropPresence = 'with_crop' | 'without_crop';
export type ClimateGroup = 'warm' | 'mid' | 'cool';

export interface ForbiddenPeriod {
  /** Začátek zakázaného období (MM-DD, včetně) */
  from: string;
  /** Konec zakázaného období (MM-DD, včetně) */
  to: string;
}

/**
 * Zakázaná období dle kategorie hnojiva, klimatické skupiny a přítomnosti porostu.
 *
 * mineral      = minerální dusíkatá hnojiva (LAV, DAM, močovina, …)
 * organic_fast = kapalná statková hnojiva — kejda, digestát (rychle uvolnitelný N)
 * organic_slow = tuhá statková hnojiva — hnůj, kompost (pomalu uvolnitelný N)
 */
export const FORBIDDEN_PERIODS: Record<
  FertilizerCategory,
  Record<ClimateGroup, Record<CropPresence, ForbiddenPeriod>>
> = {
  mineral: {
    warm: {
      with_crop:    { from: '11-01', to: '01-31' },
      without_crop: { from: '11-01', to: '02-15' },
    },
    mid: {
      with_crop:    { from: '11-01', to: '02-15' },
      without_crop: { from: '11-01', to: '02-28' },
    },
    cool: {
      with_crop:    { from: '10-15', to: '02-15' },
      without_crop: { from: '10-15', to: '02-28' },
    },
  },
  organic_fast: {
    warm: {
      with_crop:    { from: '11-30', to: '01-31' },
      without_crop: { from: '11-30', to: '02-15' },
    },
    mid: {
      with_crop:    { from: '11-30', to: '02-15' },
      without_crop: { from: '11-30', to: '02-28' },
    },
    cool: {
      with_crop:    { from: '11-15', to: '02-15' },
      without_crop: { from: '11-15', to: '02-28' },
    },
  },
  organic_slow: {
    warm: {
      with_crop:    { from: '12-15', to: '02-15' },
      without_crop: { from: '06-01', to: '02-15' },
    },
    mid: {
      with_crop:    { from: '12-15', to: '02-15' },
      without_crop: { from: '06-01', to: '02-15' },
    },
    cool: {
      with_crop:    { from: '12-15', to: '02-28' },
      without_crop: { from: '06-01', to: '02-28' },
    },
  },
};

/**
 * Určí klimatickou skupinu parcely z prvního čísla kódu BPEJ.
 * Výchozí hodnota 'mid' (střední) při chybějícím BPEJ.
 */
export function bpejToClimateGroup(bpej: string | null | undefined): ClimateGroup {
  if (!bpej || bpej.length < 1) return 'mid';
  const digit = parseInt(bpej[0], 10);
  if (isNaN(digit)) return 'mid';
  if (digit <= 5) return 'warm';
  if (digit <= 7) return 'mid';
  return 'cool';
}

/**
 * Zkontroluje, zda dané datum padá do zakázaného období.
 *
 * @param date - ISO datum (YYYY-MM-DD)
 * @param climateGroup - klimatická skupina parcely (z bpejToClimateGroup)
 * @param fertilizerCategory - kategorie hnojiva
 * @param cropPresence - přítomnost porostu na parcele
 * @returns true pokud je datum v zakázaném období
 */
export function isInForbiddenPeriod(
  date: string,
  climateGroup: ClimateGroup,
  fertilizerCategory: FertilizerCategory,
  cropPresence: CropPresence,
): boolean {
  const period = FORBIDDEN_PERIODS[fertilizerCategory]?.[climateGroup]?.[cropPresence];
  if (!period) return false;

  // Extrahuj MM-DD z ISO data
  const mmdd = date.slice(5); // 'YYYY-MM-DD' → 'MM-DD'

  const { from, to } = period;

  if (from <= to) {
    // Normální rozsah v rámci roku (např. '06-01' to '09-30')
    return mmdd >= from && mmdd <= to;
  } else {
    // Přelomový rok (např. '11-01' to '02-15') — from > to
    // Datum je v zakázaném období pokud: mmdd >= from NEBO mmdd <= to
    return mmdd >= from || mmdd <= to;
  }
}
