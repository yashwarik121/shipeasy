import React, { useState } from 'react';
import ShipmentDetail from '../components/shipment/ShipmentDetail';

const Verify = () => {
  const [searchId, setSearchId] = useState('');
  const [shipment, setShipment] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReadOnlyData = async (id) => {
    setLoading(true);
    setError('');
    setShipment(null);
    setHistory([]);
    
    try {
      const numId = parseInt(id, 10);
      if (isNaN(numId) || numId < 0) {
        throw new Error('Please enter a valid shipment ID.');
      }

      // Fetch from backend API — no MetaMask/RPC needed
      const shipRes = await fetch(`http://localhost:3001/api/shipments/${numId}`);
      if (!shipRes.ok) throw new Error('No custody record found for this ID.');
      const shipData = await shipRes.json();

      const histRes = await fetch(`http://localhost:3001/api/shipments/${numId}/history`);
      const histData = histRes.ok ? await histRes.json() : [];

      setShipment(shipData);
      setHistory(histData);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to look up record.');
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchReadOnlyData(searchId);
  };

  return (
    <div className="container" style={{ paddingTop: '48px', paddingBottom: '64px' }}>
      
      <div style={{ marginBottom: '48px' }}>
        <h1 className="display-lg" style={{ marginBottom: '12px' }}>VERIFY A CUSTODY RECORD</h1>
        <p style={{ color: 'var(--steel)', maxWidth: '600px', lineHeight: '1.6' }}>
          No wallet needed. Enter a shipment ID to view its complete, unalterable custody trail.
        </p>
      </div>

      <div style={{ border: '3px solid var(--ink)', padding: '32px', marginBottom: '48px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="section-label" style={{ borderBottom: 'none', marginBottom: '0', paddingBottom: '0' }}>SHIPMENT ID</label>
            <input 
              type="number"
              min="0"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="font-mono"
              placeholder="e.g. 0"
              style={{
                padding: '14px 16px',
                border: '2px solid var(--ink)',
                background: 'transparent',
                fontSize: '1.125rem',
                width: '100%',
                borderRadius: '0'
              }}
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ padding: '14px 32px', fontSize: '1rem', whiteSpace: 'nowrap' }}
            disabled={loading}
          >
            {loading ? 'SEARCHING...' : 'LOOK UP'}
          </button>
        </form>
      </div>

      {error && (
        <div className="font-mono" style={{ padding: '32px', color: 'var(--steel)', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {shipment && (
        <div>
          <ShipmentDetail shipment={shipment} history={history} readOnly={true} />
        </div>
      )}

      <div style={{ marginTop: '64px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
        <p className="font-mono text-xs" style={{ color: 'var(--steel)' }}>
          This data is read directly from the Polygon blockchain. It cannot be altered by any party, including Ship.Eazy.
        </p>
      </div>

    </div>
  );
};

export default Verify;
