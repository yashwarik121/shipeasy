import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ShipmentDetail from '../components/shipment/ShipmentDetail';
import { API_BASE_URL } from '../utils/api';

const ShipmentView = () => {
  const { id } = useParams();
  const [shipment, setShipment] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async (silent = false) => {
    if (!silent && !shipment) setLoading(true);
    try {
      const shipRes = await fetch(`${API_BASE_URL}/api/shipments/${id}`);
      if (!shipRes.ok) throw new Error('NOT FOUND');
      const shipData = await shipRes.json();
      setShipment(shipData);

      const histRes = await fetch(`${API_BASE_URL}/api/shipments/${id}/history`);
      if (histRes.ok) {
        const histData = await histRes.json();
        setHistory(histData);
      }
      setError('');
    } catch (err) {
      console.error(err);
      if (!silent) setError('RECORD NOT FOUND');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 8000);
    return () => clearInterval(interval);
  }, [id]);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div className="font-mono text-sm mb-4" style={{ color: 'var(--steel)' }}>
        <Link to="/dashboard" style={{ color: 'var(--ink)', textDecoration: 'none' }}>DASHBOARD</Link>
        {' > '}
        <span>SHIPMENT #{String(id).padStart(3, '0')}</span>
      </div>

      {loading && !shipment ? (
        <div className="font-mono text-ink text-center mt-4">RETRIEVING CUSTODY RECORD...</div>
      ) : error && !shipment ? (
        <div className="font-mono text-red text-center mt-4" style={{ padding: '32px', border: '3px solid var(--seal-red)' }}>
          {error}
        </div>
      ) : (
        <ShipmentDetail shipment={shipment} history={history} onUpdate={() => fetchData(true)} />
      )}
    </div>
  );
};

export default ShipmentView;
