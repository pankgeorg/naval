import InfoTooltip from '../shared/InfoTooltip';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  tooltip?: string;
  valueColor?: 'green' | 'red' | 'amber';
}

export default function MetricCard({ title, value, subtitle, trend, trendValue, tooltip, valueColor }: Props) {
  const trendColors = {
    up: 'text-red-600 bg-red-50 border-red-200',
    down: 'text-green-600 bg-green-50 border-green-200',
    neutral: 'text-gray-500 bg-gray-50 border-gray-200',
  };

  const valueColors = {
    green: 'text-green-600',
    red: 'text-red-600',
    amber: 'text-amber-600',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="text-sm text-gray-500 flex items-center gap-1">
        {title}
        {tooltip && <InfoTooltip content={tooltip} />}
      </div>
      <div className="flex items-baseline gap-2 mt-1">
        <span className={`text-2xl font-bold ${valueColor ? valueColors[valueColor] : ''}`}>{value}</span>
        {trend && trendValue && (
          <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded-full border ${trendColors[trend]}`}>
            {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '→'} {trendValue}
          </span>
        )}
      </div>
      {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
    </div>
  );
}
