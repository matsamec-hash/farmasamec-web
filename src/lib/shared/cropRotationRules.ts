// Crop rotation rules for Czech farming practice
// Sources: ÚKZÚZ agrotechnical guidelines, eco-farming EU Reg 2018/848 requirements

/** Crop option for picker components */
export interface CropOption {
  value: string;
  label: string;
}

/** Crop rotation rule definition */
export interface RotationRule {
  id: string;
  description: string;
  /** Returns true if the rule is violated (warning should be shown) */
  check: (cropHistory: string[], isEco: boolean) => boolean;
  warningText: string;
}

/**
 * Available crops for picker.
 * Values use lowercase Czech names without diacritics for DB storage.
 */
export const CROP_OPTIONS: CropOption[] = [
  { value: 'psenice', label: 'Pšenice' },
  { value: 'jecmen', label: 'Ječmen' },
  { value: 'zito', label: 'Žito' },
  { value: 'oves', label: 'Oves' },
  { value: 'tritikale', label: 'Tritikale' },
  { value: 'repka', label: 'Řepka olejná' },
  { value: 'kukurice', label: 'Kukuřice' },
  { value: 'soja', label: 'Sója' },
  { value: 'cukrovka', label: 'Cukrová řepa' },
  { value: 'brambory', label: 'Brambory' },
  { value: 'slunecnice', label: 'Slunečnice' },
  { value: 'hrach', label: 'Hrách' },
  { value: 'bob', label: 'Bob' },
  { value: 'jetel', label: 'Jetel' },
  { value: 'vojteska', label: 'Vojtěška' },
  { value: 'travni_smes', label: 'Travní směs' },
  { value: 'ttp', label: 'Trvalý travní porost' },
];

const CEREAL_CROPS = new Set(['psenice', 'jecmen', 'zito', 'oves', 'tritikale']);

/**
 * Crop rotation rules — checked when user assigns a crop to a parcel.
 * cropHistory[0] = current/upcoming crop, cropHistory[1] = last year, etc.
 */
export const ROTATION_RULES: RotationRule[] = [
  {
    id: 'repka-consecutive',
    description: 'Řepka nesmí následovat po řepce',
    check: (cropHistory) => {
      // Violation: repka this year AND repka last year
      return cropHistory[0] === 'repka' && cropHistory[1] === 'repka';
    },
    warningText:
      'Varování: Řepka byla pěstována i minulý rok na tomto poli. Doporučujeme přestávku minimálně 3 roky (riziko sclerotinie a nematodů).',
  },
  {
    id: 'cereal-3x',
    description: 'Obiloviny nesmí být pěstovány více než 3 roky po sobě',
    check: (cropHistory) => {
      // Violation: last 3 years are all cereals
      if (cropHistory.length < 3) return false;
      return (
        CEREAL_CROPS.has(cropHistory[0]) &&
        CEREAL_CROPS.has(cropHistory[1]) &&
        CEREAL_CROPS.has(cropHistory[2])
      );
    },
    warningText:
      'Varování: Obiloviny byly pěstovány 3 roky po sobě. Hrozí patogeny kořenů a pokles výnosu. Doporučujeme přerušit jiným druhem.',
  },
  {
    id: 'eco-repka-4y',
    description: 'Ekologické hospodaření: řepka max. jednou za 4 roky',
    check: (cropHistory, isEco) => {
      if (!isEco) return false;
      if (cropHistory[0] !== 'repka') return false;
      // Check if repka appeared in last 3 years
      return cropHistory.slice(1, 4).some((c) => c === 'repka');
    },
    warningText:
      'Varování (EKO): Na ekologické farmě se doporučuje pěstovat řepku maximálně jednou za 4 roky (EU Reg 2018/848 — ochrana přirozené úrodnosti půdy).',
  },
];
