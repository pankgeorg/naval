import PortSearchCombobox from '../shared/PortSearchCombobox';
import { X } from 'lucide-react';

interface PortCallEntry {
  port_id: string;
  port_name: string;
  call_order: number;
}

interface Props {
  portCalls: PortCallEntry[];
  onChange: (calls: PortCallEntry[]) => void;
}

export default function PortCallSequencer({ portCalls, onChange }: Props) {
  const addPort = (port: { id: string; name: string }) => {
    onChange([
      ...portCalls,
      { port_id: port.id, port_name: port.name, call_order: portCalls.length },
    ]);
  };

  const removePort = (index: number) => {
    onChange(portCalls.filter((_, i) => i !== index).map((pc, i) => ({ ...pc, call_order: i })));
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">Port Call Sequence</h4>
      <div className="space-y-2">
        {portCalls.map((pc, i) => (
          <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
            <span className="w-6 h-6 bg-maritime-100 text-maritime-700 rounded-full flex items-center justify-center text-xs font-bold">
              {i + 1}
            </span>
            <span className="flex-1 text-sm">{pc.port_name}</span>
            <button
              type="button"
              onClick={() => removePort(i)}
              className="text-gray-400 hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <PortSearchCombobox onSelect={addPort} placeholder="Add port..." />
    </div>
  );
}
