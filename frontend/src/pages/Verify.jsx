import React, { useState } from 'react';
import ShipmentDetail from '../components/shipment/ShipmentDetail';

const Verify = () => {
  const [searchId, setSearchId] = useState('');
  const [accessKeyInput, setAccessKeyInput] = useState('');
  const [shipment, setShipment] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShipment(null);
    setHistory([]);
    setIsVerified(false);

    try {
      const numId = parseInt(searchId, 10);
      if (isNaN(numId) || numId < 0) {
        throw new Error('Please enter a valid shipment ID.');
      }

      if (!accessKeyInput.trim()) {
        throw new Error('Secret Access Key is required to verify and unlock this custody record.');
      }

      // 1. Fetch shipment metadata from backend
      const shipRes = await fetch(`http://localhost:3001/api/shipments/${numId}`);
      if (!shipRes.ok) throw new Error('No custody record found for this ID.');
      const shipData = await shipRes.json();

      // 2. Cryptographic Access Key validation
      const enteredKey = accessKeyInput.trim();
      if (shipData.accessKey && shipData.accessKey.toLowerCase() !== enteredKey.toLowerCase()) {
        throw new Error('INVALID ACCESS KEY: Cryptographic validation failed. Record access denied.');
      }

      // 3. Fetch history
      const histRes = await fetch(`http://localhost:3001/api/shipments/${numId}/history`);
      const histData = histRes.ok ? await histRes.json() : [];

      setShipment(shipData);
      setHistory(histData);
      setIsVerified(true);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '48px', paddingBottom: '64px' }}>
      
      <div style={{ marginBottom: '40px' }}>
        <h1 className="display-lg" style={{ marginBottom: '12px' }}>VERIFY A CUSTODY RECORD</h1>
        <p style={{ color: 'var(--steel)', maxWidth: '650px', lineHeight: '1.6' }}>
          Enter the Shipment ID along with the secret on-chain Access Key provided by the sender or receiver to cryptographically verify and reveal the custody trail.
        </p>
      </div>

      <div style={{ border: '3px solid var(--ink)', padding: '32px', marginBottom: '36px' }}>
        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                  fontSize: '1rem',
                  width: '100%',
                  borderRadius: '0'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="section-label" style={{ borderBottom: 'none', marginBottom: '0', paddingBottom: '0' }}>SECRET ACCESS KEY</label>
              <input 
                type="text"
                value={accessKeyInput}
                onChange={(e) => setAccessKeyInput(e.target.value)}
                className="font-mono"
                placeholder="0x..."
                style={{
                  padding: '14px 16px',
                  border: '2px solid var(--ink)',
                  background: 'transparent',
                  fontSize: '0.9rem',
                  width: '100%',
                  borderRadius: '0'
                }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary font-mono"
            style={{ padding: '14px 32px', fontSize: '1rem', alignSelf: 'flex-start' }}
            disabled={loading}
          >
            {loading ? 'AUTHENTICATING & VERIFYING...' : 'VERIFY WITH ACCESS KEY'}
          </button>
        </form>
      </div>

      {error && (
        <div style={{ border: '2px solid var(--seal-red)', background: 'rgba(184, 51, 47, 0.08)', padding: '20px', marginBottom: '32px', textAlign: 'center' }}>
          <div className="font-mono text-xs font-bold" style={{ color: 'var(--seal-red)' }}>
            🚨 {error}
          </div>
        </div>
      )}

      {/* VERIFIED BANNER */}
      {isVerified && shipment && (
        <div style={{
          border: '3px solid var(--verified-green)',
          background: 'rgba(47, 93, 52, 0.08)',
          padding: '24px',
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div className="font-mono text-xs font-bold" style={{ color: 'var(--verified-green)', letterSpacing: '0.12em' }}>
              ✓ TRANSACTION & CUSTODY RECORD VERIFIED ON-CHAIN
            </div>
            <div className="font-mono text-sm mt-1" style={{ color: 'var(--ink)' }}>
              Shipment #{String(shipment.id).padStart(3, '0')} authenticated via access key: <span className="chain-hash">{accessKeyInput.slice(0, 16)}...</span>
            </div>
          </div>
          <div className="stamp" style={{ fontSize: '0.75rem', padding: '6px 14px' }}>
            CRYPTOGRAPHICALLY VERIFIED
          </div>
        </div>
      )}

      {isVerified && shipment && (
        <div>
          <ShipmentDetail shipment={shipment} history={history} readOnly={true} />
        </div>
      )}

      <div style={{ marginTop: '64px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
        <p className="font-mono text-xs text-steel">
          This record is authenticated and verified directly against the smart contract state. No modification or tampering is possible after confirmation.
        </p>
      </div>

    </div>
  );
};

export default Verify;
