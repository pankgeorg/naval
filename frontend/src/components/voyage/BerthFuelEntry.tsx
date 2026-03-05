import { Plus, Trash2 } from 'lucide-react';

interface FuelRecord {
  fuel_type_code: string;
  consumption_tonnes: number;
}

interface Props {
  portName: string;
  records: FuelRecord[];
  onChange: (records: FuelRecord[]) => void;
}

export default function BerthFuelEntry({ portName, records, onChange }: Props) {
  const addRecord = () => {
    onChange([...records, { fuel_type_code: 'mgo', consumption_tonnes: 0 }]);
  };

  const updateRecord = (i: number, field: string, value: string | number) => {
    const updated = [...records];
    updated[i] = { ...updated[i], [field]: value };
    onChange(updated);
  };

  const removeRecord = (i: number) => {
    onChange(records.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Berth Fuel — {portName}</h4>
        <button
          type="button"
          onClick={addRecord}
          className="text-xs text-maritime-600 hover:underline flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Add fuel
        </button>
      </div>
      {records.map((rec, i) => (
        <div key={i} className="flex items-center gap-2">
          <select
            value={rec.fuel_type_code}
            onChange={(e) => updateRecord(i, 'fuel_type_code', e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm flex-1"
          >
            <option value="mgo">MGO</option>
            <option value="mdo">MDO</option>
            <option value="electricity">Shore Power</option>
          </select>
          <input
            type="number"
            step="0.1"
            value={rec.consumption_tonnes}
            onChange={(e) => updateRecord(i, 'consumption_tonnes', parseFloat(e.target.value) || 0)}
            placeholder="Tonnes"
            className="border border-gray-300 rounded px-2 py-1 text-sm w-24"
          />
          <span className="text-xs text-gray-400">t</span>
          <button type="button" onClick={() => removeRecord(i)} className="text-gray-400 hover:text-red-500">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
