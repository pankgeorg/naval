import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

interface ProjectionYear {
  year: number;
  cii: { attained_aer: number; required_cii: number; rating: string };
  fueleu: { weighted_intensity: number; target_intensity: number };
  eu_ets: { cost_eur: number };
}

interface Props {
  data: ProjectionYear[];
}

export default function ProjectionChart({ data }: Props) {
  if (!data.length) return <div className="text-gray-400 text-center py-8">No projection data</div>;

  const chartData = data.map((d) => ({
    year: d.year,
    'CII Attained': d.cii.attained_aer,
    'CII Required': d.cii.required_cii,
    'FuelEU Actual': d.fueleu.weighted_intensity,
    'FuelEU Target': d.fueleu.target_intensity,
    'ETS Cost (k EUR)': d.eu_ets.cost_eur / 1000,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">CII Projection</h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="CII Attained" stroke="#ef4444" strokeWidth={2} />
            <Line type="monotone" dataKey="CII Required" stroke="#22c55e" strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">FuelEU GHG Intensity</h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="FuelEU Actual" stroke="#f97316" strokeWidth={2} />
            <Line type="monotone" dataKey="FuelEU Target" stroke="#22c55e" strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
