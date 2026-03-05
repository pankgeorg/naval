import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createVoyage, addLegFuel } from '../api/voyages';
import { getShip } from '../api/ships';
import PortCallSequencer from '../components/voyage/PortCallSequencer';
import LegFuelEntry from '../components/voyage/LegFuelEntry';
import MapView from '../components/maps/MapView';
import CSVTrackImport from '../components/maps/CSVTrackImport';
import Breadcrumbs from '../components/shared/Breadcrumbs';

interface PortCallEntry {
  port_id: string;
  port_name: string;
  call_order: number;
  fuel_records: { fuel_type_code: string; consumption_tonnes: number }[];
}

export default function VoyageCreator() {
  const { id: shipId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['voyage', 'common']);
  const [step, setStep] = useState(0);
  const [portCalls, setPortCalls] = useState<PortCallEntry[]>([]);
  const [legFuels, setLegFuels] = useState<Record<number, { fuel_type_code: string; consumption_tonnes: number }[]>>({});
  const [saving, setSaving] = useState(false);
  const [shipName, setShipName] = useState('');

  useEffect(() => {
    if (shipId) getShip(shipId).then((s) => setShipName(s.name));
  }, [shipId]);

  const handleSave = async () => {
    if (!shipId) return;
    setSaving(true);
    try {
      const payload = {
        status: 'completed',
        departure_date: new Date().toISOString(),
        port_calls: portCalls.map((pc, i) => ({
          port_id: pc.port_id,
          call_order: i,
          fuel_records: pc.fuel_records || [],
        })),
      };
      const voyage = await createVoyage(shipId, payload);

      // Save leg fuel records (created after voyage legs are auto-generated)
      for (const [legIdx, records] of Object.entries(legFuels)) {
        const leg = voyage.legs[Number(legIdx)];
        if (leg && records.length > 0) {
          for (const rec of records) {
            await addLegFuel(leg.id, rec);
          }
        }
      }

      navigate(`/voyages/${voyage.id}`);
    } catch (err) {
      console.error('Failed to save voyage:', err);
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    t('voyage:steps.portCalls'),
    t('voyage:steps.mapRoutes'),
    t('voyage:steps.fuelEntry'),
    t('voyage:steps.review'),
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <Breadcrumbs items={[
        { label: t('common:nav.fleet'), to: '/' },
        { label: shipName || '…', to: `/ships/${shipId}` },
        { label: t('common:actions.newVoyage') },
      ]} />
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('voyage:createTitle')}</h2>

      <div className="flex gap-2 mb-8">
        {steps.map((s, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
              step === i
                ? 'bg-maritime-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>

      {step === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <PortCallSequencer
            portCalls={portCalls}
            onChange={(calls) => setPortCalls(calls.map((c) => ({ ...c, fuel_records: [] })))}
          />
        </div>
      )}

      {step === 1 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <MapView className="h-[500px]" />
          <CSVTrackImport onImport={(points) => console.log('Imported', points.length, 'points')} />
        </div>
      )}

      {step === 2 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          {portCalls.length > 1 ? (
            Array.from({ length: portCalls.length - 1 }, (_, i) => (
              <LegFuelEntry
                key={i}
                legIndex={i}
                records={legFuels[i] || []}
                onChange={(recs) => setLegFuels({ ...legFuels, [i]: recs })}
              />
            ))
          ) : (
            <p className="text-gray-400 text-center">{t('voyage:addPortCallsFirst')}</p>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold mb-4">{t('voyage:summary')}</h3>
          <p className="text-sm text-gray-600">{t('voyage:portCalls')}: {portCalls.length}</p>
          <p className="text-sm text-gray-600">{t('voyage:legs')}: {Math.max(0, portCalls.length - 1)}</p>
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving || portCalls.length < 2}
              className="bg-maritime-600 text-white px-6 py-2 rounded-lg hover:bg-maritime-700 disabled:opacity-50"
            >
              {saving ? t('common:status.saving') : t('voyage:saveVoyage')}
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between mt-6">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {t('common:actions.previous')}
        </button>
        <button
          onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
          disabled={step === steps.length - 1}
          className="bg-maritime-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {t('common:actions.next')}
        </button>
      </div>
    </div>
  );
}
