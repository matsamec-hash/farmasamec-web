export type Species = 'cattle' | 'sheep';
export type AnimalStatus = 'active' | 'sold' | 'dead' | 'transferred_out';
export type AnimalSex = 'male' | 'female';

export interface Farm {
  id: string;
  name: string;
  color: string;
  is_eco: boolean;
}

export interface Herd {
  id: string;
  farm_id: string;
  name: string;
  species: Species;
}

export interface Animal {
  id: string;
  farm_id: string;
  ear_tag: string;
  species: Species;
  breed: string | null;
  sex: AnimalSex;
  birth_date: string | null;
  herd_id: string | null;
  status: AnimalStatus;
  category: string | null;
  farming_system: string | null;
  stall: string | null;
  arrival_date: string | null;
  eco_since: string | null;
}

export interface ReproEvent {
  id: string;
  animal_id: string;
  farm_id: string;
  event_type: string;
  event_date: string;
  pregnancy_result: string | null;
  expected_calving_date: string | null;
  notes: string | null;
}

export const SPECIES_LABELS: Record<Species, string> = {
  cattle: 'Skot',
  sheep: 'Ovce',
};

export const SPECIES_ICONS: Record<Species, string> = {
  cattle: '🐄',
  sheep: '🐑',
};

export const SEX_LABELS: Record<AnimalSex, string> = {
  male: 'Samec',
  female: 'Samice',
};

export const CATEGORY_LABELS: Record<string, string> = {
  Jnad2R: 'Jalovice nad 2 roky',
  Tdo6M: 'Tele do 6 měsíců',
  KRA: 'Kráva',
  BER: 'Brejloun',
  BAH: 'Bahnice',
  JEH: 'Jehně',
};
