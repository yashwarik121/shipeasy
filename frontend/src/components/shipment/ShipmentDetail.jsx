import React, { useState } from 'react';
import { getExplorerAddressUrl, getStatusColor, getStatusText, formatTimestamp } from '../../utils/format';
import { useWallet } from '../../context/WalletContext';
import { useContract } from '../../hooks/useContract';
import CustodyEntry from './StatusTimeline';

const ShipmentDetail = ({ shipment, history }) => {
  const { account } = useWallet();
  const contract = useContract();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  if (!shipment) return null;

  const currentStatusText = getStatusText(shipment.status);
  const currentStatusColor = getStatusColor(shipment.status);
  const isDelivered = shipment.status === 3;

  const handleAdvanceStatus = async () => {
    if (!account) return;
    setLoading(true);
    setError('');
    try {
      let tx;
      if (shipment.status === 0) {
        tx = await contract.pickupShipment(shipment.id);
      } else if (shipment.status === 1) {
        tx = await contract.markInTransit(shipment.id);
      } else if (shipment.status === 2) {
        tx = await contract.deliverShipment(shipment.id);
      }
      
      const receipt = await tx.wait();
      setSuccess({
        blockNumber: receipt.blockNumber,
        txHash: receipt.transactionHash
      });
      // The page will auto-refresh to fetch new state based on requirements
    } catch (err) {
      setError(err.reason || err.message || 'Failed to update status');
    }
    setLoading(false);
  };

  const canAdvance = () => {
    if (!account) return false;
    const lowerAccount = account.toLowerCase();
    if (shipment.status === 0 && shipment.carrier.toLowerCase() === lowerAccount) return true;
    if (shipment.status === 1 && shipment.carrier.toLowerCase() === lowerAccount) return true;
    if (shipment.status === 2 && shipment.receiver.toLowerCase() === lowerAccount) return true;
    return false;
  };

  const getNextStatusText = () => {
    if (shipment.status === 0) return 'PICK UP';
    if (shipment.status === 1) return 'MARK IN TRANSIT';
    if (shipment.status === 2) return 'DELIVER';
    return '';
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', border: '3px solid var(--ink)', padding: '32px' }}>
      
      {/* Top Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 className="display-lg" style={{ margin: '0 0 8px 0' }}>SHIPMENT #{shipment.id.toString()}</h1>
          <p style={{ margin: 0, fontSize: '16px', lineHeight: '1.5' }}>{shipment.description}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className={`status-text ${currentStatusColor}`} style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {currentStatusText}
          </div>
          {isDelivered && (
            <div className="stamp mt-2" style={{ border: '2px solid var(--verified-green)', color: 'var(--verified-green)', padding: '8px' }}>
              CONFIRMED
            </div>
          )}
        </div>
      </div>

      <div style={{ borderBottom: '3px solid var(--ink)', margin: '0 -32px 32px -32px' }}></div>

      {/* Metadata Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="section-label">SENDER</span>
          <a href={getExplorerAddressUrl(shipment.sender)} target="_blank" rel="noopener noreferrer" className="chain-address copy-trigger">
            {shipment.sender}
          </a>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="section-label">CARRIER</span>
          <a href={getExplorerAddressUrl(shipment.carrier)} target="_blank" rel="noopener noreferrer" className="chain-address copy-trigger">
            {shipment.carrier}
          </a>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="section-label">RECEIVER</span>
          <a href={getExplorerAddressUrl(shipment.receiver)} target="_blank" rel="noopener noreferrer" className="chain-address copy-trigger">
            {shipment.receiver}
          </a>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="section-label">INITIATED</span>
          <span className="chain-timestamp">{formatTimestamp(shipment.lastUpdate)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="section-label">LAST RECORDED</span>
          <span className="chain-timestamp">{formatTimestamp(shipment.lastUpdate)}</span>
        </div>
      </div>

      <div style={{ borderBottom: '4px solid var(--ink)', margin: '0 -32px 32px -32px' }}></div>

      {/* CUSTODY TRAIL */}
      <h2 className="section-label mb-4">CUSTODY TRAIL</h2>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {history && history.map((entry, idx) => (
          <CustodyEntry 
            key={idx} 
            entry={entry} 
            index={idx + 1} 
            isLatest={idx === history.length - 1} 
          />
        ))}
      </div>

      {/* ACTION SECTION */}
      {canAdvance() && (
        <div style={{ marginTop: '32px', padding: '24px', border: '2px dashed var(--ink)' }}>
          {error && <div className="text-red font-mono mb-4">[ERROR] {error}</div>}
          <div className={success ? 'animate-stamp-flash' : ''}>
            {!success ? (
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '16px' }}
                onClick={handleAdvanceStatus}
                disabled={loading}
              >
                {loading ? 'SUBMITTING...' : `ADVANCE TO ${getNextStatusText()}`}
              </button>
            ) : (
              <div className="stamp animate-stamp" style={{ border: '2px solid var(--verified-green)', padding: '16px', textAlign: 'center' }}>
                <div className="text-green font-mono font-bold mb-2">STATUS UPDATED ON-CHAIN</div>
                <div className="text-green font-mono text-xs">BLOCK #{success.blockNumber}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ marginTop: '48px', paddingTop: '16px', borderTop: '1px solid var(--steel)' }}>
        <p className="text-steel font-mono text-xs" style={{ margin: 0, textAlign: 'center' }}>
          This trail proves records weren't altered after confirmation. It does not verify physical delivery.
        </p>
      </div>

    </div>
  );
};

export default ShipmentDetail;
