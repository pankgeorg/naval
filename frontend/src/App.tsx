import { lazy, Suspense, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import FleetDashboard from './pages/FleetDashboard';
import ShipDetail from './pages/ShipDetail';
import LoginRegister from './pages/LoginRegister';

// Heavy routes are code-split — map tiles, charts, form-heavy pages don't
// need to ship in the initial bundle.
const ShipEditor = lazy(() => import('./pages/ShipEditor'));
const VoyageCreator = lazy(() => import('./pages/VoyageCreator'));
const VoyageDetail = lazy(() => import('./pages/VoyageDetail'));
const AnnualReport = lazy(() => import('./pages/AnnualReport'));
const ScenarioModeler = lazy(() => import('./pages/ScenarioModeler'));
const ProjectionView = lazy(() => import('./pages/ProjectionView'));

function RouteFallback() {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-gray-400 text-sm">
      <Loader2 className="w-4 h-4 animate-spin" /> loading…
    </div>
  );
}

function Shell() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Backdrop — only visible on mobile when drawer is open */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          className="md:hidden fixed inset-0 bg-black/40 z-30"
          aria-hidden="true"
        />
      )}
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar onHamburger={() => setDrawerOpen((o) => !o)} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<FleetDashboard />} />
              <Route path="/ships/new" element={<ShipEditor />} />
              <Route path="/ships/:id" element={<ShipDetail />} />
              <Route path="/ships/:id/edit" element={<ShipEditor />} />
              <Route path="/ships/:id/voyages/new" element={<VoyageCreator />} />
              <Route path="/voyages/:id" element={<VoyageDetail />} />
              <Route path="/ships/:id/report" element={<AnnualReport />} />
              <Route path="/ships/:id/scenario" element={<ScenarioModeler />} />
              <Route path="/ships/:id/projection" element={<ProjectionView />} />
              <Route path="/login" element={<LoginRegister />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
