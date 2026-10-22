import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import CreateShipment from './pages/CreateShipment';
import ShipmentView from './pages/ShipmentView';
import Verify from './pages/Verify';
import TamperLab from './pages/TamperLab';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create" element={<CreateShipment />} />
          <Route path="/shipment/:id" element={<ShipmentView />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/tamper-lab" element={<TamperLab />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
