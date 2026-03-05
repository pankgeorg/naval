interface Props {
  label: string;
  value: number;
  target: number;
  unit: string;
  higherIsBetter?: boolean;
}

export default function ComplianceGauge({ label, value, target, unit, higherIsBetter = false }: Props) {
  const compliant = higherIsBetter ? value >= target : value <= target;
  const pct = target > 0 ? (value / target) * 100 : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="flex items-end gap-2">
        <span className={`text-2xl font-bold ${compliant ? 'text-green-600' : 'text-red-600'}`}>
          {value.toFixed(2)}
        </span>
        <span className="text-sm text-gray-400 mb-0.5">/ {target.toFixed(2)} {unit}</span>
      </div>
      <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${compliant ? 'bg-green-500' : 'bg-red-500'}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="mt-1 text-xs text-right">
        {compliant ? (
          <span className="text-green-600">Compliant</span>
        ) : (
          <span className="text-red-600">Non-compliant ({(pct - 100).toFixed(1)}% over)</span>
        )}
      </div>
    </div>
  );
}
