import type { CorrectionType } from '../types/ciiCorrection';

/**
 * Rough rules of thumb mapping a correction's raw `quantity` → CO₂ offset (t).
 * These are defaults to help users fill the field — they can always override.
 *
 * Electrical consumers (reefer / aux loads):
 *   kWh × aux SFOC (≈210 g/kWh for MGO) × CF (≈3.2 t CO₂ / t fuel) / 10⁶
 *   ≈ 0.00067 t CO₂ per kWh
 *
 * Cargo heating (tanker boilers burning MGO/VLSFO for heating):
 *   t fuel × CF (≈3.15, blend of VLSFO 3.114 and MGO 3.206)
 *   ≈ 3.15 t CO₂ per t fuel
 *
 * Ice-class correction is too ship-size dependent for a universal rule;
 * we leave it to the user.
 */
export interface Rule {
  factor: number;
  unit: string;
  note: string;
}

export const RULES_OF_THUMB: Record<CorrectionType, Rule | null> = {
  electrical_consumer: {
    factor: 0.00067,
    unit: 'kWh',
    note: 'aux engine 210 g/kWh × CF 3.2',
  },
  cargo_heating: {
    factor: 3.15,
    unit: 'tonnes',
    note: 'boiler fuel CF ≈ 3.15',
  },
  ice_class: null,
};

const EPSILON = 0.001;

export function ruleOfThumbOffset(
  correctionType: CorrectionType,
  quantity: number | null | undefined,
): number | null {
  if (quantity == null) return null;
  const rule = RULES_OF_THUMB[correctionType];
  if (!rule) return null;
  return quantity * rule.factor;
}

export function isOverridden(
  correctionType: CorrectionType,
  quantity: number | null | undefined,
  co2OffsetTonnes: number,
): boolean {
  const expected = ruleOfThumbOffset(correctionType, quantity);
  if (expected == null) return false;
  return Math.abs(co2OffsetTonnes - expected) > EPSILON;
}

/**
 * Given the previous row and a new quantity, return the offset the row
 * should carry: if the row's current offset matched the old rule, follow
 * the new rule; otherwise leave the manual override alone.
 */
export function nextOffsetOnQuantityChange(
  correctionType: CorrectionType,
  previousQuantity: number | null | undefined,
  currentOffset: number,
  newQuantity: number | null | undefined,
): number {
  const wasOverridden = isOverridden(correctionType, previousQuantity, currentOffset);
  if (wasOverridden) return currentOffset;
  const expected = ruleOfThumbOffset(correctionType, newQuantity);
  return expected ?? currentOffset;
}
