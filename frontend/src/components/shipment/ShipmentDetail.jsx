import React, { useState } from 'react';
import { useContract } from '../../hooks/useContract';
import { useWallet } from '../../context/WalletContext';
import { formatTimestamp, getExplorerAddressUrl, getExplorerTxUrl } from '../../utils/format';
import { STATUS_LABELS } from '../../utils/contract';
import StatusTracker from './StatusTracker';
import StatusTimeline from './StatusTimeline';

const ShipmentDetail = ({ shipment, history }) => {
  const { id, sender, carrier, receiver, description, status, createdAt, lastUpdated } = shipment;
  const { address } = useWallet();
  const { advanceShipment } = useContract();
  
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  const isSender = address && sender.toLowerCase() === address.toLowerCase();
  const isCarrier = address && carrier.toLowerCase() === address.toLowerCase();
  const isReceiver = address && receiver.toLowerCase() === address.toLowerCase();

  const canAdvance = (
    (status === 0 && isSender) || 
    (status === 1 && isCarrier) || 
    (status === 2 && isReceiver)
  );

  const handleAdvance = async () => {
    try {
      setLoading(true);
      setError('');
      setTxHash('');
      const hash = await advanceShipment(id);
      setTxHash(hash);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to advance shipment');
    } finally {
      setLoading(false);
    }
  };

  const nextStatusLabel = status < 3 ? STATUS_LABELS[status + 1] : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <StatusTracker currentStatus={status} />

      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          <div>
            <span className="label" style={{ display: 'block', marginBottom: '8px' }}>Sender</span>
            <a href={getExplorerAddressUrl(sender)} target="_blank" rel="noopener noreferrer" className="chain-address">
              {sender}
            </a>
          </div>
          <div>
            <span className="label" style={{ display: 'block', marginBottom: '8px' }}>Carrier</span>
            <a href={getExplorerAddressUrl(carrier)} target="_blank" rel="noopener noreferrer" className="chain-address">
              {carrier}
            </a>
          </div>
          <div>
            <span className="label" style={{ display: 'block', marginBottom: '8px' }}>Receiver</span>
            <a href={getExplorerAddressUrl(receiver)} target="_blank" rel="noopener noreferrer" className="chain-address">
              {receiver}
            </a>
          </div>
          <div>
            <span className="label" style={{ display: 'block', marginBottom: '8px' }}>Description</span>
            <p style={{ margin: 0, color: 'var(--text-primary, #fff)' }}>{description}</p>
          </div>
          <div>
            <span className="label" style={{ display: 'block', marginBottom: '8px' }}>Created</span>
            <span className="chain-timestamp">{formatTimestamp(createdAt)}</span>
          </div>
          <div>
            <span className="label" style={{ display: 'block', marginBottom: '8px' }}>Last Updated</span>
            <span className="chain-timestamp">{formatTimestamp(lastUpdated)}</span>
          </div>
        </div>

        {canAdvance && (
          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border-subtle, #333)' }}>
            <button 
              className="btn btn-primary" 
              onClick={handleAdvance} 
              disabled={loading}
            >
              {loading ? 'Processing...' : `Advance to ${nextStatusLabel}`}
            </button>
            
            {error && <div style={{ color: 'var(--accent-red, #ff3333)', marginTop: '12px', fontSize: '0.875rem' }}>{error}</div>}
            
            {txHash && (
              <div style={{ marginTop: '12px', fontSize: '0.875rem' }}>
                <span className="text-muted">Transaction confirmed: </span>
                <a href={getExplorerTxUrl(txHash)} target="_blank" rel="noopener noreferrer" className="chain-hash">{txHash}</a>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px dotted var(--border-subtle, #333)' }}>
          <p className="text-muted" style={{ fontStyle: 'italic', fontSize: '0.75rem', margin: 0 }}>
            This timeline proves records weren't altered after the fact. It does not verify physical delivery — only that the assigned wallet confirmed the status on-chain.
          </p>
        </div>
      </div>

      <StatusTimeline history={history} />
    </div>
  );
};

export default ShipmentDetail;
