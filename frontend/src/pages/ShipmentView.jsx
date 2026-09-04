import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ShipmentDetail from '../components/shipment/ShipmentDetail';

const ShipmentView = () => {
  const { id } = useParams();
  const [shipment, setShipment] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const shipRes = await fetch(`http://localhost:3001/api/shipments/${id}`);
        if (!shipRes.ok) throw new Error('NOT FOUND');
        const shipData = await shipRes.json();
        setShipment(shipData);

        const histRes = await fetch(`http://localhost:3001/api/shipments/${id}/history`);
        if (histRes.ok) {
          const histData = await histRes.json();
          setHistory(histData);
        }
        setError('');
      } catch (err) {
        console.error(err);
        setError('RECORD NOT FOUND');
      }
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
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

      {loading ? (
        <div className="font-mono text-ink text-center mt-4">RETRIEVING CUSTODY RECORD...</div>
      ) : error ? (
        <div className="font-mono text-red text-center mt-4" style={{ padding: '32px', border: '3px solid var(--seal-red)' }}>
          {error}
        </div>
      ) : (
        <ShipmentDetail shipment={shipment} history={history} />
      )}
    </div>
  );
};

export default ShipmentView;
