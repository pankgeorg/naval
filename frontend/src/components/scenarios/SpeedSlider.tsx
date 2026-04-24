interface Props {
  value: number;
  onChange: (value: number) => void;
}

export default function SpeedSlider({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700">Speed Adjustment</h4>
      <div className="flex items-center gap-2 md:gap-3">
        <span className="text-xs text-gray-500 w-10 shrink-0">-20%</span>
        <input
          type="range"
          min={-20}
          max={10}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 min-w-0 h-6 md:h-4"
        />
        <span className="text-xs text-gray-500 w-10 shrink-0 text-right">+10%</span>
      </div>
      <div className="text-center text-sm font-medium flex flex-wrap items-center justify-center gap-x-2">
        <span>{value > 0 ? '+' : ''}{value}%</span>
        <span className="text-gray-400 text-xs">
          (fuel change: {value > 0 ? '+' : ''}{(((1 + value / 100) ** 2 - 1) * 100).toFixed(1)}%)
        </span>
      </div>
    </div>
  );
}
