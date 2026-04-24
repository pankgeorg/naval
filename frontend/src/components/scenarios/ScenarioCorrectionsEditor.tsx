import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import NumberField from '../shared/NumberField';
import type { CorrectionType, CIICorrectionInput } from '../../types/ciiCorrection';
import { CORRECTION_UNIT_SUGGESTIONS } from '../../types/ciiCorrection';
import {
  RULES_OF_THUMB,
  ruleOfThumbOffset,
  isOverridden,
  nextOffsetOnQuantityChange,
} from '../../utils/ciiCorrectionRules';

interface Props {
  corrections: CIICorrectionInput[];
  onChange: (next: CIICorrectionInput[]) => void;
}

const TYPES: CorrectionType[] = ['ice_class', 'electrical_consumer', 'cargo_heating'];

function emptyRow(): CIICorrectionInput {
  return {
    correction_type: 'ice_class',
    start_time: null,
    end_time: null,
    quantity: null,
    unit: CORRECTION_UNIT_SUGGESTIONS.ice_class,
    co2_offset_tonnes: 0,
    notes: '',
  };
}

export default function ScenarioCorrectionsEditor({ corrections, onChange }: Props) {
  const { t } = useTranslation('compliance');

  const add = () => onChange([...corrections, emptyRow()]);
  const update = (i: number, patch: Partial<CIICorrectionInput>) => {
    const next = corrections.slice();
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const remove = (i: number) => onChange(corrections.filter((_, idx) => idx !== i));

  const typeLabel = (type: CorrectionType) => {
    if (type === 'ice_class') return t('corrections.typeIceClass');
    if (type === 'electrical_consumer') return t('corrections.typeElectricalConsumer');
    return t('corrections.typeCargoHeating');
  };

  return (
    <div>
      <p className="text-xs text-gray-500 mb-3">
        Scenario-only CII corrections — not saved to the voyage. Each correction subtracts its CO₂ offset from the scenario's attained CII.
      </p>

      {corrections.length === 0 && (
        <p className="text-sm text-gray-400 italic mb-3">No extra corrections applied.</p>
      )}

      {corrections.length > 0 && (
        <table className="w-full text-sm mb-3">
          <thead>
            <tr className="border-b text-xs text-gray-500">
              <th className="text-left py-2 px-2">{t('corrections.type')}</th>
              <th className="text-right py-2 px-2">{t('corrections.quantity')}</th>
              <th className="text-left py-2 px-2">{t('corrections.unit')}</th>
              <th className="text-right py-2 px-2">{t('corrections.co2Offset')}</th>
              <th className="text-left py-2 px-2">{t('corrections.notes')}</th>
              <th className="py-2 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {corrections.map((c, i) => (
              <tr key={i} className="border-b border-gray-50">
                <td className="py-2 px-2">
                  <select
                    value={c.correction_type}
                    onChange={(e) => {
                      const v = e.target.value as CorrectionType;
                      update(i, {
                        correction_type: v,
                        unit: c.unit === CORRECTION_UNIT_SUGGESTIONS[c.correction_type]
                          ? CORRECTION_UNIT_SUGGESTIONS[v]
                          : c.unit,
                      });
                    }}
                    className="border border-gray-200 rounded px-1 py-1 text-xs w-full"
                  >
                    {TYPES.map((ty) => (
                      <option key={ty} value={ty}>{typeLabel(ty)}</option>
                    ))}
                  </select>
                </td>
                <td className="py-2 px-2 text-right">
                  <NumberField
                    value={c.quantity ?? null}
                    onChange={(v) => update(i, {
                      quantity: v,
                      co2_offset_tonnes: nextOffsetOnQuantityChange(
                        c.correction_type, c.quantity, c.co2_offset_tonnes, v,
                      ),
                    })}
                    step="0.1"
                    className="border border-gray-200 rounded px-1 py-1 text-xs w-20 text-right"
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="text"
                    value={c.unit ?? ''}
                    onChange={(e) => update(i, { unit: e.target.value || null })}
                    placeholder={CORRECTION_UNIT_SUGGESTIONS[c.correction_type]}
                    className="border border-gray-200 rounded px-1 py-1 text-xs w-16"
                  />
                </td>
                <td className="py-2 px-2 text-right">
                  <NumberField
                    value={c.co2_offset_tonnes}
                    onChange={(v) => update(i, { co2_offset_tonnes: v ?? 0 })}
                    step="0.01"
                    className="border border-gray-200 rounded px-1 py-1 text-xs w-20 text-right"
                  />
                  {(() => {
                    const rule = RULES_OF_THUMB[c.correction_type];
                    const expected = ruleOfThumbOffset(c.correction_type, c.quantity);
                    if (!rule || expected == null) return null;
                    if (!isOverridden(c.correction_type, c.quantity, c.co2_offset_tonnes)) {
                      return (
                        <div className="text-[10px] text-gray-400 mt-0.5" title={rule.note}>
                          auto ({rule.note})
                        </div>
                      );
                    }
                    const delta = c.co2_offset_tonnes - expected;
                    const sign = delta >= 0 ? '+' : '−';
                    return (
                      <div
                        className={`text-[10px] mt-0.5 ${delta >= 0 ? 'text-amber-600' : 'text-blue-600'}`}
                        title={`Rule of thumb: ${expected.toFixed(2)} t (${rule.note})`}
                      >
                        {sign}{Math.abs(delta).toFixed(2)} t vs rule
                      </div>
                    );
                  })()}
                </td>
                <td className="py-2 px-2">
                  <input
                    type="text"
                    value={c.notes ?? ''}
                    onChange={(e) => update(i, { notes: e.target.value || null })}
                    className="border border-gray-200 rounded px-1 py-1 text-xs w-full"
                  />
                </td>
                <td className="py-2 px-2 text-right">
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button
        type="button"
        onClick={add}
        className="text-sm text-maritime-600 hover:underline flex items-center gap-1"
      >
        <Plus className="w-4 h-4" /> {t('corrections.add')}
      </button>
    </div>
  );
}
