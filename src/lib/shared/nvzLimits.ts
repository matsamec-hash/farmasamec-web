// NVZ (Nitrátová zranitelná zóna) limity dusíku pro ČR
// Zdroj: NV 262/2012 Sb. ve znění NV 193/2024 Sb. (6. akční program 2024–2028)
// Reference: Směrnice 91/676/EHS (Nitrátová směrnice), SZIF metodika

/** Hladina výnosového potenciálu parcely (z LPIS / BPEJ) */
export type YieldLevel = 'H1' | 'H2' | 'H3';

/** Typ hnojiva pro výpočet koeficientu účinnosti N */
export type FertilizerType = 'mineral' | 'organic_fast' | 'organic_slow' | 'pig_slurry';

/**
 * Limity N (kg/ha/rok) dle plodiny a výnosové hladiny.
 * 18 plodin × 3 úrovně (H1=nízký, H2=střední, H3=vysoký výnosový potenciál).
 * Zdroj: Příloha NV 262/2012 Sb. ve znění NV 193/2024 Sb.
 */
export const NVZ_N_LIMITS: Record<string, { H1: number; H2: number; H3: number }> = {
  psenice_ozima:  { H1: 160, H2: 200, H3: 230 },
  psenice_jarni:  { H1: 130, H2: 160, H3: 190 },
  jecmen_ozimi:   { H1: 130, H2: 160, H3: 190 },
  jecmen_jarni:   { H1: 110, H2: 140, H3: 170 },
  zito:           { H1: 120, H2: 150, H3: 180 },
  oves:           { H1: 100, H2: 130, H3: 160 },
  tritikale:      { H1: 120, H2: 150, H3: 180 },
  repka:          { H1: 180, H2: 200, H3: 220 },
  kukurice_zrno:  { H1: 170, H2: 210, H3: 230 },
  kukurice_silaz: { H1: 160, H2: 200, H3: 220 },
  cukrovka:       { H1: 140, H2: 190, H3: 210 },
  brambory:       { H1: 130, H2: 160, H3: 180 },
  hrach:          { H1: 30,  H2: 30,  H3: 30  },
  soja:           { H1: 60,  H2: 60,  H3: 60  },
  slunecnice:     { H1: 80,  H2: 100, H3: 120 },
  ttp:            { H1: 120, H2: 150, H3: 160 },
  jetel:          { H1: 40,  H2: 40,  H3: 40  },
  vojteska:       { H1: 40,  H2: 40,  H3: 40  },
};

/**
 * Limit N ze statkových hnojiv — průměr za farmu (NE per-parcela).
 * EU Nitrátová směrnice čl. 5 — 170 kg N/ha/rok z chovu zvířat.
 */
export const NVZ_LIVESTOCK_MANURE_LIMIT = 170; // kg N/ha/rok

/**
 * Koeficienty účinnosti N dle typu hnojiva.
 * Zdroj: NV 262/2012 Sb. + VÚRV metodika.
 *
 * mineral = minerální hnojivo (100 % N se počítá)
 * organic_slow = tuhý hnůj, kompost (40 % N se počítá)
 * organic_fast = kejda hovězí/prasečí, digestát (60 % N)
 * pig_slurry = prasečí kejda, bioplynový digestát (70 % N)
 */
export const N_EFFECTIVENESS_COEFFICIENTS: Record<FertilizerType, number> = {
  mineral: 1.0,
  organic_slow: 0.4,  // tuhý hnůj, kompost
  organic_fast: 0.6,  // kejda, digestát
  pig_slurry: 0.7,    // prasečí kejda, bioplynový digestát
} as const;

/**
 * Parsuje výnosovou hladinu z JSON pole `hladina` parcely z LPIS.
 * Hladina JSON: {"HLADINA1": 0.5, "HLADINA3": 2.0} — vrátí dominantní H1/H2/H3.
 * Výchozí hodnota: H2 (střední), pokud chybí data.
 */
export function getYieldLevel(hladinaJson: string | null | undefined): YieldLevel {
  if (!hladinaJson) return 'H2';
  try {
    const obj = JSON.parse(hladinaJson) as Record<string, number>;
    const entries = Object.entries(obj);
    if (entries.length === 0) return 'H2';
    const dominant = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
    if (dominant[0] === 'HLADINA1') return 'H1';
    if (dominant[0] === 'HLADINA3') return 'H3';
    return 'H2';
  } catch {
    return 'H2';
  }
}

// ── Zpětná kompatibilita pro stávající kód ────────────────────────────────────
// parcel-detail.tsx a fieldOperation.service.ts používají NVZ_N_LIMITS_KG_PER_HA.
// Mapování starých klíčů na hodnoty H2 (střední výnos).

/** @deprecated Použijte NVZ_N_LIMITS s výnosovou hladinou. Zachováno pro zpětnou kompatibilitu. */
export const NVZ_N_LIMITS_KG_PER_HA = {
  /** Limit N ze statkových hnojiv v NVZ (EU Nitrátová směrnice čl. 5) */
  livestockManure: NVZ_LIVESTOCK_MANURE_LIMIT,
  /** Obiloviny — pšenice, ječmen, žito, oves (H2 střední výnos) */
  cereals: 180,        // ~ pšenice ozimá H2 = 200, průměr cereálií
  /** Řepka olejná */
  rapeseed: NVZ_N_LIMITS.repka.H2,
  /** Kukuřice */
  maize: NVZ_N_LIMITS.kukurice_silaz.H2,
  /** Cukrová řepa */
  sugarbeet: NVZ_N_LIMITS.cukrovka.H2,
  /** Louky a pastviny (TTP) */
  grassland: 230,      // TTP max = 160, ale pastevní TTP může dosahovat vyšších hodnot
  /** Výchozí limit při neznámé plodině */
  default: 170,
} as const;

/** @deprecated Zachováno pro zpětnou kompatibilitu */
export type NvzNLimitKey = keyof typeof NVZ_N_LIMITS_KG_PER_HA;

/** @deprecated Zachováno pro zpětnou kompatibilitu */
export type NvzZone = 'NVZ' | 'non-NVZ';
