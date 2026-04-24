interface Props {
  value: number;
  onChange: (value: number) => void;
}

export default function SpeedSlider({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700">Speed Adjustment</h4>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500 w-10">-20%</span>
        <input
          type="range"
          min={-20}
          max={10}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1"
        />
        <span className="text-xs text-gray-500 w-10">+10%</span>
      </div>
      <div className="text-center text-sm font-medium">
        {value > 0 ? '+' : ''}{value}%
        <span className="text-gray-400 text-xs ml-2">
          (fuel change: {value > 0 ? '+' : ''}{(((1 + value / 100) ** 2 - 1) * 100).toFixed(3)}%)
        </span>
      </div>
    </div>
  );
}
