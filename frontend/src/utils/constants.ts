export const FUEL_TYPES_COMMON = [
  'hfo', 'lfo', 'vlsfo', 'mdo', 'mgo',
  'lng_lpdf', 'lng_hpdf',
  'bio_methanol', 'e_methanol',
  'green_nh3',
] as const;

export const CII_RATINGS = ['A', 'B', 'C', 'D', 'E'] as const;

export const LEG_TYPE_COLORS: Record<string, string> = {
  intra_eu: '#3b82f6',
  extra_eu: '#f97316',
  non_eu: '#9ca3af',
  intra_eu_outermost: '#8b5cf6',
};
