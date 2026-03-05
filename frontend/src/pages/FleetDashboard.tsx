import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { getShips } from '../api/ships';
import type { Ship } from '../types/ship';
import ShipCard from '../components/fleet/ShipCard';
import FleetSummaryBar from '../components/fleet/FleetSummaryBar';
import { SHIP_TYPES } from '../types/ship';

export default function FleetDashboard() {
  const { t } = useTranslation(['ship', 'common']);
  const [ships, setShips] = useState<Ship[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const params: Record<string, string> = {};
        if (filterType) params.ship_type = filterType;
        const data = await getShips(params);
        setShips(data);
      } catch (err) {
        console.error('Failed to load ships:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filterType]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('ship:fleet.title')}</h2>
        <Link
          to="/ships/new"
          className="bg-maritime-600 text-white px-4 py-2 rounded-lg hover:bg-maritime-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('ship:fleet.addShip')}
        </Link>
      </div>

      <FleetSummaryBar ships={ships} />

      <div className="mb-4">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Ship Types</option>
          {SHIP_TYPES.map((st) => (
            <option key={st.value} value={st.value}>{st.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">{t('common:status.loading')}</div>
      ) : ships.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">{t('ship:fleet.empty')}</p>
          <Link
            to="/ships/new"
            className="text-maritime-600 hover:underline"
          >
            {t('ship:fleet.addShip')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ships.map((ship) => (
            <ShipCard key={ship.id} ship={ship} />
          ))}
        </div>
      )}
    </div>
  );
}
