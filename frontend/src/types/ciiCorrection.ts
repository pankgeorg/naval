export type CorrectionType = 'ice_class' | 'electrical_consumer' | 'cargo_heating';

export interface CIICorrection {
  id: string;
  voyage_id: string;
  correction_type: CorrectionType;
  start_time: string | null;
  end_time: string | null;
  quantity: number | null;
  unit: string | null;
  co2_offset_tonnes: number;
  notes: string | null;
  created_at: string;
}

export interface CIICorrectionInput {
  correction_type: CorrectionType;
  start_time?: string | null;
  end_time?: string | null;
  quantity?: number | null;
  unit?: string | null;
  co2_offset_tonnes: number;
  notes?: string | null;
}

export const CORRECTION_TYPE_LABELS: Record<CorrectionType, string> = {
  ice_class: 'Ice-class operation',
  electrical_consumer: 'Electrical consumers (reefer / auxiliary)',
  cargo_heating: 'Cargo heating',
};

export const CORRECTION_UNIT_SUGGESTIONS: Record<CorrectionType, string> = {
  ice_class: 'hours',
  electrical_consumer: 'kWh',
  cargo_heating: 'tonnes',
};
