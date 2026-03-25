export type OperationType = 'seti' | 'hnojeni' | 'postrik' | 'sklizen' | 'orba';

export interface Farm {
  id: string;
  name: string;
  color: string;
  is_eco: boolean;
}

export interface FieldOperation {
  id: string;
  parcel_id: string;
  farm_id: string;
  operation_type: OperationType;
  operation_date: string;
  crop: string | null;
  fertilizer_name: string | null;
  n_kg_per_ha: number | null;
  p_kg_per_ha: number | null;
  k_kg_per_ha: number | null;
  dose_kg_per_ha: number | null;
  dose_l_per_ha: number | null;
  area_ha: number | null;
  por_product_name: string | null;
  yield_t_per_ha: number | null;
  notes: string | null;
  compliance_warnings: string | null;
  exported_at: string | null;
  created_at: string;
}

export interface ParcelRef {
  id: string;
  farm_id: string;
  nazev: string | null;
  lpis_code: string | null;
  kultura: string | null;
  vymera: number | null;
  is_in_nvz: boolean;
}

export const OPERATION_LABELS: Record<OperationType, string> = {
  seti: 'Setí',
  hnojeni: 'Hnojení',
  postrik: 'Postřik',
  sklizen: 'Sklizeň',
  orba: 'Orba',
};

export const OPERATION_COLORS: Record<OperationType, string> = {
  seti: '#7c9a6e',
  hnojeni: '#3b82f6',
  postrik: '#f59e0b',
  sklizen: '#f97316',
  orba: '#8b5cf6',
};

export const OPERATION_ICONS: Record<OperationType, string> = {
  seti: '🌱',
  hnojeni: '💧',
  postrik: '🌿',
  sklizen: '🌾',
  orba: '🚜',
};

export const CROP_OPTIONS = [
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
