import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContract } from '../../hooks/useContract';
import { useWallet } from '../../context/WalletContext';
import { getExplorerTxUrl } from '../../utils/format';

const CreateShipmentForm = () => {
  const [carrier, setCarrier] = useState('');
  const [receiver, setReceiver] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');

  const { createShipment } = useContract();
  const { isConnected } = useWallet();
  const navigate = useNavigate();

  const isValidAddress = (addr) => /^0x[a-fA-F0-9]{40}$/.test(addr);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setTxHash('');

    if (!isConnected) {
      setError('Please connect your wallet first.');
      return;
    }

    if (!isValidAddress(carrier)) {
      setError('Invalid carrier address format.');
      return;
    }

    if (!isValidAddress(receiver)) {
      setError('Invalid receiver address format.');
      return;
    }

    if (!description.trim()) {
      setError('Description is required.');
      return;
    }

    try {
      setLoading(true);
      const hash = await createShipment(carrier, receiver, description);
      setTxHash(hash);
      
      // Wait a moment before redirecting
      setTimeout(() => {
        navigate('/'); 
      }, 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
      <h2 style={{ marginBottom: '8px' }}>New Shipment</h2>
      <p className="text-secondary" style={{ marginBottom: '24px' }}>Your connected wallet will be the sender</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label className="label" style={{ display: 'block', marginBottom: '8px' }}>Carrier Address</label>
          <input 
            type="text" 
            value={carrier} 
            onChange={(e) => setCarrier(e.target.value)} 
            placeholder="0x..." 
            className="chain-address"
            style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', border: '1px solid var(--border-subtle, #333)', color: 'var(--text-primary, #fff)' }}
            disabled={loading}
          />
        </div>

        <div>
          <label className="label" style={{ display: 'block', marginBottom: '8px' }}>Receiver Address</label>
          <input 
            type="text" 
            value={receiver} 
            onChange={(e) => setReceiver(e.target.value)} 
            placeholder="0x..." 
            className="chain-address"
            style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', border: '1px solid var(--border-subtle, #333)', color: 'var(--text-primary, #fff)' }}
            disabled={loading}
          />
        </div>

        <div>
          <label className="label" style={{ display: 'block', marginBottom: '8px' }}>Description</label>
          <textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            placeholder="e.g., Electronics from Warehouse A to B" 
            style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', border: '1px solid var(--border-subtle, #333)', color: 'var(--text-primary, #fff)', minHeight: '100px', resize: 'vertical' }}
            disabled={loading}
          />
        </div>

        {error && <div style={{ color: 'var(--accent-red, #ff3333)', marginTop: '8px', fontSize: '0.875rem' }}>{error}</div>}
        
        {txHash && (
          <div style={{ marginTop: '8px', fontSize: '0.875rem' }}>
            <span className="text-muted">Transaction sent: </span>
            <a href={getExplorerTxUrl(txHash)} target="_blank" rel="noopener noreferrer" className="chain-hash">{txHash}</a>
          </div>
        )}

        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading}
          style={{ marginTop: '16px' }}
        >
          {loading ? 'Creating...' : 'Create Shipment'}
        </button>
      </form>
    </div>
  );
};

export default CreateShipmentForm;
