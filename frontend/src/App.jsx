import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import CreateShipment from './pages/CreateShipment';
import ShipmentView from './pages/ShipmentView';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create" element={<CreateShipment />} />
          <Route path="/shipment/:id" element={<ShipmentView />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
