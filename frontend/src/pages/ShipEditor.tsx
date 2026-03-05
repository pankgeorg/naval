import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Save, Plus, Trash2 } from 'lucide-react';
import { createShip, getShip, updateShip } from '../api/ships';
import { SHIP_TYPES } from '../types/ship';
import Breadcrumbs from '../components/shared/Breadcrumbs';

interface EngineForm {
  role: string;
  designation: string;
  manufacturer: string;
  model: string;
  mcr_kw: number;
  engine_type: string;
  primary_fuel_type: string;
  sfc_g_kwh: number;
  is_dual_fuel: boolean;
}

export default function ShipEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['ship', 'common']);
  const isEdit = Boolean(id);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    imo_number: '',
    name: '',
    flag_state: '',
    ship_type: 'bulk_carrier',
    dwt: 0,
    gt: 0,
    build_date: '2020-01-01',
    reference_speed_kn: 14.0,
    design_draught_m: 12.0,
    fw: 1.0,
  });
  const [engines, setEngines] = useState<EngineForm[]>([]);

  useEffect(() => {
    if (id) {
      getShip(id).then((ship) => {
        setForm({
          imo_number: ship.imo_number,
          name: ship.name,
          flag_state: ship.flag_state,
          ship_type: ship.ship_type,
          dwt: ship.dwt,
          gt: ship.gt,
          build_date: ship.build_date,
          reference_speed_kn: ship.reference_speed_kn,
          design_draught_m: ship.design_draught_m,
          fw: ship.fw,
        });
        setEngines(ship.engines.map((e) => ({
          role: e.role,
          designation: e.designation,
          manufacturer: e.manufacturer || '',
          model: e.model || '',
          mcr_kw: e.mcr_kw,
          engine_type: e.engine_type || '2stroke_diesel',
          primary_fuel_type: e.primary_fuel_type,
          sfc_g_kwh: e.sfc_g_kwh,
          is_dual_fuel: e.is_dual_fuel,
        })));
      });
    }
  }, [id]);

  const addEngine = () => {
    setEngines([...engines, {
      role: 'main',
      designation: `ME${engines.filter((e) => e.role === 'main').length + 1}`,
      manufacturer: '',
      model: '',
      mcr_kw: 10000,
      engine_type: '2stroke_diesel',
      primary_fuel_type: 'vlsfo',
      sfc_g_kwh: 170,
      is_dual_fuel: false,
    }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, engines };
      if (isEdit && id) {
        await updateShip(id, payload);
        navigate(`/ships/${id}`);
      } else {
        const ship = await createShip(payload);
        navigate(`/ships/${ship.id}`);
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Breadcrumbs items={
        isEdit
          ? [{ label: t('common:nav.fleet'), to: '/' }, { label: form.name || '…', to: `/ships/${id}` }, { label: t('common:actions.edit') }]
          : [{ label: t('common:nav.fleet'), to: '/' }, { label: t('ship:addTitle') }]
      } />
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? t('ship:editTitle') : t('ship:addTitle')}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-lg mb-4">{t('ship:identification')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('ship:fields.imoNumber')}</label>
              <input type="text" maxLength={7} value={form.imo_number} onChange={(e) => setForm({ ...form, imo_number: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" required disabled={isEdit} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('ship:fields.shipName')}</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('ship:fields.flagState')}</label>
              <input type="text" maxLength={2} value={form.flag_state} onChange={(e) => setForm({ ...form, flag_state: e.target.value.toUpperCase() })} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('ship:fields.shipType')}</label>
              <select value={form.ship_type} onChange={(e) => setForm({ ...form, ship_type: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                {SHIP_TYPES.map((st) => <option key={st.value} value={st.value}>{st.label}</option>)}
              </select>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-lg mb-4">{t('ship:dimensionsDesign')}</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('ship:fields.dwt')}</label>
              <input type="number" value={form.dwt} onChange={(e) => setForm({ ...form, dwt: parseFloat(e.target.value) || 0 })} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('ship:fields.gt')}</label>
              <input type="number" value={form.gt} onChange={(e) => setForm({ ...form, gt: parseFloat(e.target.value) || 0 })} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('ship:fields.buildDate')}</label>
              <input type="date" value={form.build_date} onChange={(e) => setForm({ ...form, build_date: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('ship:fields.referenceSpeed')}</label>
              <input type="number" step="0.1" value={form.reference_speed_kn} onChange={(e) => setForm({ ...form, reference_speed_kn: parseFloat(e.target.value) || 0 })} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('ship:fields.designDraught')}</label>
              <input type="number" step="0.1" value={form.design_draught_m} onChange={(e) => setForm({ ...form, design_draught_m: parseFloat(e.target.value) || 0 })} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('ship:fields.weatherFactor')}</label>
              <input type="number" step="0.01" value={form.fw} onChange={(e) => setForm({ ...form, fw: parseFloat(e.target.value) || 1.0 })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">{t('ship:engines')}</h3>
            <button type="button" onClick={addEngine} className="text-sm text-maritime-600 hover:underline flex items-center gap-1">
              <Plus className="w-4 h-4" /> {t('common:actions.addEngine')}
            </button>
          </div>
          {engines.map((eng, i) => (
            <div key={i} className="border border-gray-100 rounded-lg p-4 mb-3">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-sm">{eng.designation}</span>
                <button type="button" onClick={() => setEngines(engines.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t('ship:engine.role')}</label>
                  <select value={eng.role} onChange={(e) => { const u = [...engines]; u[i] = { ...u[i], role: e.target.value }; setEngines(u); }} className="w-full border border-gray-300 rounded px-2 py-1 text-sm">
                    <option value="main">{t('ship:engine.main')}</option>
                    <option value="auxiliary">{t('ship:engine.auxiliary')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t('ship:engine.designation')}</label>
                  <input type="text" value={eng.designation} onChange={(e) => { const u = [...engines]; u[i] = { ...u[i], designation: e.target.value }; setEngines(u); }} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t('ship:engine.mcr')}</label>
                  <input type="number" value={eng.mcr_kw} onChange={(e) => { const u = [...engines]; u[i] = { ...u[i], mcr_kw: parseFloat(e.target.value) || 0 }; setEngines(u); }} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t('ship:engine.sfc')}</label>
                  <input type="number" step="0.1" value={eng.sfc_g_kwh} onChange={(e) => { const u = [...engines]; u[i] = { ...u[i], sfc_g_kwh: parseFloat(e.target.value) || 0 }; setEngines(u); }} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t('ship:engine.primaryFuelType')}</label>
                  <select value={eng.primary_fuel_type} onChange={(e) => { const u = [...engines]; u[i] = { ...u[i], primary_fuel_type: e.target.value }; setEngines(u); }} className="w-full border border-gray-300 rounded px-2 py-1 text-sm">
                    <option value="hfo">HFO</option>
                    <option value="vlsfo">VLSFO</option>
                    <option value="mdo">MDO</option>
                    <option value="mgo">MGO</option>
                    <option value="lng_lpdf">LNG (LPDF)</option>
                    <option value="lng_hpdf">LNG (HPDF)</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </section>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50">
            {t('common:actions.cancel')}
          </button>
          <button type="submit" disabled={saving} className="bg-maritime-600 text-white px-6 py-2 rounded-lg hover:bg-maritime-700 flex items-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4" />
            {saving ? t('common:status.saving') : t('ship:saveShip')}
          </button>
        </div>
      </form>
    </div>
  );
}
