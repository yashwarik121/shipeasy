import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useContract } from '../hooks/useContract';
import ShipmentDetail from '../components/shipment/ShipmentDetail';

const ShipmentView = () => {
  const { id } = useParams();
  const { getShipment, getShipmentHistory } = useContract();
  
  const [shipment, setShipment] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let intervalId;

    const fetchData = async () => {
      try {
        const shipmentData = await getShipment(id);
        const historyData = await getShipmentHistory(id);
        
        setShipment(shipmentData);
        setHistory(historyData);
        setError('');
      } catch (err) {
        console.error('Error fetching shipment:', err);
        if (!shipment) {
          setError('Shipment not found or error loading data.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Auto-refresh every 10 seconds
    intervalId = setInterval(() => {
      fetchData();
    }, 10000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [id, getShipment, getShipmentHistory]);

  if (loading && !shipment) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center' }}>
        <p className="text-secondary">Loading shipment #{id}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--accent-red, #ff3333)' }}>{error}</p>
        <Link to="/" className="btn btn-secondary" style={{ marginTop: '16px', display: 'inline-block', textDecoration: 'none' }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!shipment) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', gap: '8px', fontSize: '0.875rem' }}>
        <Link to="/" style={{ color: 'var(--text-secondary, #a1a1aa)', textDecoration: 'none' }}>Dashboard</Link>
        <span className="text-muted">{'>'}</span>
        <span style={{ color: 'var(--text-primary, #fff)' }}>Shipment <span className="chain-data">#{id}</span></span>
      </div>
      
      <div style={{ marginTop: '8px' }}>
        <ShipmentDetail shipment={shipment} history={history} />
      </div>
    </div>
  );
};

export default ShipmentView;
