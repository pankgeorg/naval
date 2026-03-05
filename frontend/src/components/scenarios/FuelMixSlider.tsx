interface Props {
  fuelMix: Record<string, number>;
  onChange: (mix: Record<string, number>) => void;
  availableFuels: { code: string; name: string }[];
}

export default function FuelMixSlider({ fuelMix, onChange, availableFuels }: Props) {
  const handleChange = (code: string, value: number) => {
    const updated = { ...fuelMix, [code]: value };
    const total = Object.values(updated).reduce((s, v) => s + v, 0);
    if (total <= 100) {
      onChange(updated);
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">Fuel Mix (%)</h4>
      {availableFuels.map((fuel) => (
        <div key={fuel.code} className="flex items-center gap-3">
          <label className="w-32 text-sm text-gray-600 truncate">{fuel.name}</label>
          <input
            type="range"
            min={0}
            max={100}
            value={fuelMix[fuel.code] || 0}
            onChange={(e) => handleChange(fuel.code, Number(e.target.value))}
            className="flex-1"
          />
          <span className="w-12 text-right text-sm font-mono">
            {(fuelMix[fuel.code] || 0).toFixed(0)}%
          </span>
        </div>
      ))}
      <div className="text-xs text-gray-400">
        Total: {Object.values(fuelMix).reduce((s, v) => s + v, 0).toFixed(0)}%
      </div>
    </div>
  );
}
