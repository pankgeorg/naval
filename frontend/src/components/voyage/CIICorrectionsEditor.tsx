import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import {
  listCIICorrections,
  createCIICorrection,
  updateCIICorrection,
  deleteCIICorrection,
} from '../../api/ciiCorrections';
import type {
  CIICorrection,
  CIICorrectionInput,
  CorrectionType,
} from '../../types/ciiCorrection';
import { CORRECTION_UNIT_SUGGESTIONS } from '../../types/ciiCorrection';

interface Props {
  voyageId: string;
}

const TYPES: CorrectionType[] = ['ice_class', 'electrical_consumer', 'cargo_heating'];

function emptyDraft(): CIICorrectionInput {
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

function toLocalDatetime(value: string | null | undefined): string {
  if (!value) return '';
  return value.slice(0, 16);
}

function toIsoOrNull(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}

export default function CIICorrectionsEditor({ voyageId }: Props) {
  const { t } = useTranslation('compliance');
  const [items, setItems] = useState<CIICorrection[]>([]);
  const [draft, setDraft] = useState<CIICorrectionInput | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    listCIICorrections(voyageId).then(setItems);
  }, [voyageId]);

  const startAdd = () => setDraft(emptyDraft());
  const cancelDraft = () => setDraft(null);

  const saveDraft = async () => {
    if (!draft) return;
    const payload: CIICorrectionInput = {
      ...draft,
      start_time: toIsoOrNull(draft.start_time || ''),
      end_time: toIsoOrNull(draft.end_time || ''),
      quantity: draft.quantity ?? null,
      co2_offset_tonnes: Number(draft.co2_offset_tonnes) || 0,
    };
    const created = await createCIICorrection(voyageId, payload);
    setItems([...items, created]);
    setDraft(null);
  };

  const updateField = <K extends keyof CIICorrection>(
    id: string,
    field: K,
    value: CIICorrection[K],
  ) => {
    setItems(items.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };

  const commitUpdate = async (id: string) => {
    const item = items.find((it) => it.id === id);
    if (!item) return;
    setSavingId(id);
    const updated = await updateCIICorrection(id, {
      correction_type: item.correction_type,
      start_time: item.start_time,
      end_time: item.end_time,
      quantity: item.quantity,
      unit: item.unit,
      co2_offset_tonnes: Number(item.co2_offset_tonnes) || 0,
      notes: item.notes,
    });
    setItems((prev) => prev.map((it) => (it.id === id ? updated : it)));
    setSavingId(null);
  };

  const remove = async (id: string) => {
    await deleteCIICorrection(id);
    setItems(items.filter((it) => it.id !== id));
  };

  const typeLabel = (type: CorrectionType) => {
    if (type === 'ice_class') return t('corrections.typeIceClass');
    if (type === 'electrical_consumer') return t('corrections.typeElectricalConsumer');
    return t('corrections.typeCargoHeating');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{t('corrections.title')}</h3>
        <button
          type="button"
          onClick={startAdd}
          disabled={draft !== null}
          className="text-sm text-maritime-600 hover:underline flex items-center gap-1 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> {t('corrections.add')}
        </button>
      </div>
      <p className="text-xs text-gray-500 mb-4">{t('corrections.description')}</p>

      {items.length === 0 && !draft && (
        <p className="text-sm text-gray-400 italic">{t('corrections.empty')}</p>
      )}

      {(items.length > 0 || draft) && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-xs text-gray-500">
              <th className="text-left py-2 px-2">{t('corrections.type')}</th>
              <th className="text-left py-2 px-2">{t('corrections.startTime')}</th>
              <th className="text-left py-2 px-2">{t('corrections.endTime')}</th>
              <th className="text-right py-2 px-2">{t('corrections.quantity')}</th>
              <th className="text-left py-2 px-2">{t('corrections.unit')}</th>
              <th className="text-right py-2 px-2">{t('corrections.co2Offset')}</th>
              <th className="text-left py-2 px-2">{t('corrections.notes')}</th>
              <th className="py-2 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-b border-gray-50">
                <td className="py-2 px-2">
                  <select
                    value={it.correction_type}
                    onChange={(e) => {
                      const v = e.target.value as CorrectionType;
                      updateField(it.id, 'correction_type', v);
                    }}
                    onBlur={() => commitUpdate(it.id)}
                    className="border border-gray-200 rounded px-1 py-1 text-xs w-full"
                  >
                    {TYPES.map((ty) => (
                      <option key={ty} value={ty}>{typeLabel(ty)}</option>
                    ))}
                  </select>
                </td>
                <td className="py-2 px-2">
                  <input
                    type="datetime-local"
                    value={toLocalDatetime(it.start_time)}
                    onChange={(e) => updateField(it.id, 'start_time', e.target.value ? new Date(e.target.value).toISOString() : null)}
                    onBlur={() => commitUpdate(it.id)}
                    className="border border-gray-200 rounded px-1 py-1 text-xs"
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="datetime-local"
                    value={toLocalDatetime(it.end_time)}
                    onChange={(e) => updateField(it.id, 'end_time', e.target.value ? new Date(e.target.value).toISOString() : null)}
                    onBlur={() => commitUpdate(it.id)}
                    className="border border-gray-200 rounded px-1 py-1 text-xs"
                  />
                </td>
                <td className="py-2 px-2 text-right">
                  <input
                    type="number"
                    step="0.1"
                    value={it.quantity ?? ''}
                    onChange={(e) => updateField(it.id, 'quantity', e.target.value === '' ? null : parseFloat(e.target.value))}
                    onBlur={() => commitUpdate(it.id)}
                    className="border border-gray-200 rounded px-1 py-1 text-xs w-20 text-right"
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="text"
                    value={it.unit ?? ''}
                    onChange={(e) => updateField(it.id, 'unit', e.target.value || null)}
                    onBlur={() => commitUpdate(it.id)}
                    placeholder={CORRECTION_UNIT_SUGGESTIONS[it.correction_type]}
                    className="border border-gray-200 rounded px-1 py-1 text-xs w-16"
                  />
                </td>
                <td className="py-2 px-2 text-right">
                  <input
                    type="number"
                    step="0.01"
                    value={it.co2_offset_tonnes}
                    onChange={(e) => updateField(it.id, 'co2_offset_tonnes', parseFloat(e.target.value) || 0)}
                    onBlur={() => commitUpdate(it.id)}
                    className="border border-gray-200 rounded px-1 py-1 text-xs w-20 text-right"
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="text"
                    value={it.notes ?? ''}
                    onChange={(e) => updateField(it.id, 'notes', e.target.value || null)}
                    onBlur={() => commitUpdate(it.id)}
                    className="border border-gray-200 rounded px-1 py-1 text-xs w-full"
                  />
                </td>
                <td className="py-2 px-2 text-right">
                  {savingId === it.id ? (
                    <span className="text-xs text-gray-400">…</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => remove(it.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {draft && (
              <tr className="border-b border-maritime-100 bg-maritime-50/30">
                <td className="py-2 px-2">
                  <select
                    value={draft.correction_type}
                    onChange={(e) => {
                      const v = e.target.value as CorrectionType;
                      setDraft({
                        ...draft,
                        correction_type: v,
                        unit: CORRECTION_UNIT_SUGGESTIONS[v],
                      });
                    }}
                    className="border border-gray-200 rounded px-1 py-1 text-xs w-full"
                  >
                    {TYPES.map((ty) => (
                      <option key={ty} value={ty}>{typeLabel(ty)}</option>
                    ))}
                  </select>
                </td>
                <td className="py-2 px-2">
                  <input
                    type="datetime-local"
                    value={draft.start_time ?? ''}
                    onChange={(e) => setDraft({ ...draft, start_time: e.target.value })}
                    className="border border-gray-200 rounded px-1 py-1 text-xs"
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="datetime-local"
                    value={draft.end_time ?? ''}
                    onChange={(e) => setDraft({ ...draft, end_time: e.target.value })}
                    className="border border-gray-200 rounded px-1 py-1 text-xs"
                  />
                </td>
                <td className="py-2 px-2 text-right">
                  <input
                    type="number"
                    step="0.1"
                    value={draft.quantity ?? ''}
                    onChange={(e) => setDraft({
                      ...draft,
                      quantity: e.target.value === '' ? null : parseFloat(e.target.value),
                    })}
                    className="border border-gray-200 rounded px-1 py-1 text-xs w-20 text-right"
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="text"
                    value={draft.unit ?? ''}
                    onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                    className="border border-gray-200 rounded px-1 py-1 text-xs w-16"
                  />
                </td>
                <td className="py-2 px-2 text-right">
                  <input
                    type="number"
                    step="0.01"
                    value={draft.co2_offset_tonnes}
                    onChange={(e) => setDraft({ ...draft, co2_offset_tonnes: parseFloat(e.target.value) || 0 })}
                    className="border border-gray-200 rounded px-1 py-1 text-xs w-20 text-right"
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="text"
                    value={draft.notes ?? ''}
                    onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                    className="border border-gray-200 rounded px-1 py-1 text-xs w-full"
                  />
                </td>
                <td className="py-2 px-2 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={saveDraft}
                    className="text-xs text-maritime-600 hover:underline mr-2"
                  >
                    {t('corrections.save')}
                  </button>
                  <button
                    type="button"
                    onClick={cancelDraft}
                    className="text-xs text-gray-400 hover:underline"
                  >
                    {t('corrections.cancel')}
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
