import InfoTooltip from '../shared/InfoTooltip';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  tooltip?: string;
}

export default function MetricCard({ title, value, subtitle, trend, trendValue, tooltip }: Props) {
  const trendColors = {
    up: 'text-red-500',
    down: 'text-green-500',
    neutral: 'text-gray-500',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="text-sm text-gray-500 flex items-center gap-1">
        {title}
        {tooltip && <InfoTooltip content={tooltip} />}
      </div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
      {trend && trendValue && (
        <div className={`text-xs mt-2 ${trendColors[trend]}`}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
        </div>
      )}
    </div>
  );
}
