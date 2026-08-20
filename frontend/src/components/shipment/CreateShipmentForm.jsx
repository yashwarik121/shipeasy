import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import { useContract } from '../../hooks/useContract';

const CreateShipmentForm = () => {
  const [carrier, setCarrier] = useState('');
  const [receiver, setReceiver] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  
  const { account } = useWallet();
  const { createShipment } = useContract();
  const navigate = useNavigate();

  const validateAddress = (addr) => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateAddress(carrier)) {
      setError('Invalid carrier address. Must be 0x followed by 40 hex characters.');
      return;
    }
    
    if (!validateAddress(receiver)) {
      setError('Invalid receiver address. Must be 0x followed by 40 hex characters.');
      return;
    }

    if (!description.trim()) {
      setError('Description is required.');
      return;
    }

    setLoading(true);

    try {
      const receipt = await createShipment(carrier, receiver, description);

      setSuccess({
        blockNumber: receipt.blockNumber,
        txHash: receipt.hash
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (err) {
      console.error(err);
      setError(err.reason || err.message || 'Transaction failed');
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', border: '3px solid var(--ink)', padding: '32px' }}>
      <h2 className="display-md uppercase mb-4" style={{ margin: '0 0 24px 0' }}>INITIATE CUSTODY TRANSFER</h2>
      
      {error && (
        <div className="text-red font-mono mb-4" style={{ padding: '16px', border: '2px solid var(--seal-red)', background: 'rgba(184, 51, 47, 0.1)' }}>
          [ERROR] {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="section-label" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>CARRIER ADDRESS</label>
          <input 
            type="text" 
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            className="font-mono"
            placeholder="0x..."
            style={{ 
              padding: '12px', 
              border: '2px solid var(--ink)', 
              background: 'transparent', 
              color: 'var(--ink)',
              width: '100%',
              boxSizing: 'border-box',
              borderRadius: '0'
            }}
            disabled={loading || success}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="section-label" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>RECEIVER ADDRESS</label>
          <input 
            type="text" 
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            className="font-mono"
            placeholder="0x..."
            style={{ 
              padding: '12px', 
              border: '2px solid var(--ink)', 
              background: 'transparent', 
              color: 'var(--ink)',
              width: '100%',
              boxSizing: 'border-box',
              borderRadius: '0'
            }}
            disabled={loading || success}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="section-label" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>SHIPMENT DESCRIPTION</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{ 
              padding: '12px', 
              border: '2px solid var(--ink)', 
              background: 'transparent', 
              color: 'var(--ink)',
              fontFamily: '"Inter", sans-serif',
              resize: 'vertical',
              width: '100%',
              boxSizing: 'border-box',
              borderRadius: '0'
            }}
            disabled={loading || success}
          />
        </div>

        <div style={{ marginTop: '16px', border: success ? '2px solid var(--verified-green)' : 'none', position: 'relative' }} className={success ? 'animate-stamp-flash' : ''}>
          {!success ? (
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ width: '100%', padding: '16px', fontSize: '16px' }}
              disabled={loading || !account}
            >
              {loading ? 'AWAITING CONFIRMATION...' : 'SUBMIT TO CHAIN'}
            </button>
          ) : (
            <div className="stamp animate-stamp" style={{ border: '2px solid var(--verified-green)', padding: '16px', textAlign: 'center' }}>
              <div className="text-green font-mono font-bold mb-2">CONFIRMED ON-CHAIN</div>
              <div className="text-green font-mono text-xs">BLOCK #{success.blockNumber}</div>
              <div className="text-green font-mono text-xs">TX: {success.txHash ? success.txHash.substring(0, 16) + '...' : ''}</div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default CreateShipmentForm;
