import { Link } from 'react-router-dom';
import { Ship as ShipIcon } from 'lucide-react';
import type { Ship } from '../../types/ship';
import { shipTypeLabel } from '../../utils/formatters';

interface Props {
  ship: Ship;
}

export default function ShipCard({ ship }: Props) {
  return (
    <Link
      to={`/ships/${ship.id}`}
      className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-maritime-100 rounded-lg flex items-center justify-center">
            <ShipIcon className="w-5 h-5 text-maritime-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{ship.name}</h3>
            <p className="text-sm text-gray-500">IMO {ship.imo_number}</p>
          </div>
        </div>
        <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded">
          {ship.flag_state}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-500">Type:</span>{' '}
          <span className="font-medium">{shipTypeLabel(ship.ship_type)}</span>
        </div>
        <div>
          <span className="text-gray-500">DWT:</span>{' '}
          <span className="font-medium">{ship.dwt.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-gray-500">GT:</span>{' '}
          <span className="font-medium">{ship.gt.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-gray-500">Built:</span>{' '}
          <span className="font-medium">{ship.build_date}</span>
        </div>
      </div>
    </Link>
  );
}
