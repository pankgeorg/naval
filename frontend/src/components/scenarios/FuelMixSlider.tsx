import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  fuelMix: Record<string, number>;
  onChange: (mix: Record<string, number>) => void;
  availableFuels: { code: string; name: string }[];
}

export default function FuelMixSlider({ fuelMix, onChange, availableFuels }: Props) {
  // Collapsed by default on mobile; always open on md+.
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleChange = (code: string, value: number) => {
    const updated = { ...fuelMix, [code]: value };
    const total = Object.values(updated).reduce((s, v) => s + v, 0);
    if (total <= 100) {
      onChange(updated);
    }
  };

  const total = Object.values(fuelMix).reduce((s, v) => s + v, 0);
  const activeFuels = availableFuels.filter((f) => (fuelMix[f.code] || 0) > 0);
  const summary = activeFuels.length > 0
    ? activeFuels
        .map((f) => `${f.name} ${(fuelMix[f.code] || 0).toFixed(0)}%`)
        .join(' · ')
    : '—';

  return (
    <div>
      <button
        type="button"
        onClick={() => setMobileOpen((o) => !o)}
        className="w-full flex items-center gap-2 text-left md:cursor-default"
        aria-expanded={mobileOpen}
      >
        <span className="md:hidden shrink-0 text-gray-500">
          {mobileOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </span>
        <h4 className="text-sm font-medium text-gray-700 shrink-0">Fuel Mix (%)</h4>
        <span className="md:hidden ml-auto text-xs text-gray-500 truncate max-w-[55%]">
          {summary}
        </span>
      </button>

      <div className={`space-y-3 mt-3 ${mobileOpen ? 'block' : 'hidden'} md:block`}>
        {availableFuels.map((fuel) => (
          <div key={fuel.code} className="flex items-center gap-2 md:gap-3">
            <label className="w-20 md:w-32 text-xs md:text-sm text-gray-600 truncate">{fuel.name}</label>
            <input
              type="range"
              min={0}
              max={100}
              value={fuelMix[fuel.code] || 0}
              onChange={(e) => handleChange(fuel.code, Number(e.target.value))}
              className="flex-1 min-w-0 h-6 md:h-4"
            />
            <span className="w-10 md:w-12 text-right text-xs md:text-sm font-mono">
              {(fuelMix[fuel.code] || 0).toFixed(0)}%
            </span>
          </div>
        ))}
        <div className="text-xs text-gray-400">
          Total: {total.toFixed(0)}%
        </div>
      </div>
    </div>
  );
}
