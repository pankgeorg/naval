import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import FleetDashboard from './pages/FleetDashboard';
import ShipDetail from './pages/ShipDetail';
import ShipEditor from './pages/ShipEditor';
import VoyageCreator from './pages/VoyageCreator';
import VoyageDetail from './pages/VoyageDetail';
import AnnualReport from './pages/AnnualReport';
import ScenarioModeler from './pages/ScenarioModeler';
import ProjectionView from './pages/ProjectionView';
import LoginRegister from './pages/LoginRegister';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-auto p-6">
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
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
