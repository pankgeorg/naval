import type { Ship } from '../../types/ship';
import { Ship as ShipIcon, DollarSign, BarChart3, Fuel } from 'lucide-react';

interface Props {
  ships: Ship[];
}

export default function FleetSummaryBar({ ships }: Props) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
          <ShipIcon className="w-4 h-4" />
          Total Ships
        </div>
        <div className="text-2xl font-bold">{ships.length}</div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
          <BarChart3 className="w-4 h-4" />
          Fleet Avg DWT
        </div>
        <div className="text-2xl font-bold">
          {ships.length > 0
            ? Math.round(ships.reduce((s, sh) => s + sh.dwt, 0) / ships.length).toLocaleString()
            : '—'}
        </div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
          <Fuel className="w-4 h-4" />
          Ship Types
        </div>
        <div className="text-2xl font-bold">
          {new Set(ships.map((s) => s.ship_type)).size}
        </div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
          <DollarSign className="w-4 h-4" />
          Flag States
        </div>
        <div className="text-2xl font-bold">
          {new Set(ships.map((s) => s.flag_state)).size}
        </div>
      </div>
    </div>
  );
}
