/**
 * Ochranné vzdálenosti a nárazníkové zóny pro aplikaci hnojiv a POR.
 * Zdroj: NV 262/2012 Sb. (DZES 4), zákon 326/2004 Sb. (POR), SPe věty na etiketách.
 */

/**
 * Výchozí ochranné vzdálenosti POR (m), pokud produkt nemá specifické hodnoty.
 * Konzervativní odhad — vždy preferujte hodnoty z etikety produktu.
 */
export const DEFAULT_SAFETY_DISTANCES = {
  /** Minimální vzdálenost od povrchových vod (m) */
  water: 4,
  /** Minimální vzdálenost od obytných budov (m) */
  residential: 0,
} as const;

/**
 * DZES 4 — minimální šířka bezoborábkového pásu podél vodních toků.
 * Na tomto pásu je zakázáno hnojení i aplikace POR.
 * Zdroj: Vyhláška MZe č. 271/2023 Sb. (DZES 4), platná od 1.1.2023.
 */
export const DZES4_BUFFER_M = 3; // metrů od břehové linie vodního toku

/**
 * Nárazníkový pás pro kapalná rychle uvolnitelná hnojiva (kejda, digestát)
 * na svazích > 7 stupňů podél vodních toků.
 * Zdroj: NV 262/2012 Sb. Příloha č. 1.
 */
export const SLOPE_BUFFER_M = 25; // metrů od vodního toku na svazích > 7°

/**
 * Minimální vzdálenost skladiště statkových hnojiv od vodního toku.
 * Zdroj: NV 262/2012 Sb.
 */
export const MANURE_STORAGE_BUFFER_M = 50; // metrů od povrchových vod
