import React from 'react';
import { Link } from 'react-router-dom';
import { truncateAddress, formatTimestamp } from '../../utils/format';
import { STATUS_LABELS } from '../../utils/contract';
import { useWallet } from '../../context/WalletContext';

const ShipmentCard = ({ shipment }) => {
  const { id, sender, carrier, receiver, description, status, createdAt } = shipment;
  const { address } = useWallet();

  const isSender = address && sender.toLowerCase() === address.toLowerCase();
  const isCarrier = address && carrier.toLowerCase() === address.toLowerCase();
  const isReceiver = address && receiver.toLowerCase() === address.toLowerCase();

  let roleTag = null;
  if (isSender) roleTag = 'You: Sender';
  else if (isCarrier) roleTag = 'You: Carrier';
  else if (isReceiver) roleTag = 'You: Receiver';

  const statusLabel = STATUS_LABELS[status] || 'Unknown';
  
  const statusClassMap = ['status-created', 'status-pickedup', 'status-intransit', 'status-delivered'];
  const statusClass = statusClassMap[status] || 'status-created';

  return (
    <Link to={`/shipment/${id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', marginBottom: '16px' }}>
      <div className="card" style={{ transition: 'border-color 0.2s', cursor: 'pointer', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="flex-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="chain-data" style={{ fontSize: '1.125rem' }}>Shipment #{id}</span>
            {roleTag && (
              <span style={{ fontSize: '0.75rem', padding: '2px 8px', backgroundColor: 'var(--bg-surface, #0a0a0b)', border: '1px solid var(--border-subtle, #333)', color: 'var(--text-secondary, #a1a1aa)' }}>
                {roleTag}
              </span>
            )}
          </div>
          <span className={`status-badge ${statusClass}`}>{statusLabel}</span>
        </div>
        
        <p style={{ color: 'var(--text-secondary, #a1a1aa)', margin: 0 }}>{description}</p>
        
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '4px' }}>
          <div>
            <span className="label" style={{ display: 'block', marginBottom: '4px' }}>Sender</span>
            <span className="chain-address">{truncateAddress(sender)}</span>
          </div>
          <div>
            <span className="label" style={{ display: 'block', marginBottom: '4px' }}>Carrier</span>
            <span className="chain-address">{truncateAddress(carrier)}</span>
          </div>
          <div>
            <span className="label" style={{ display: 'block', marginBottom: '4px' }}>Receiver</span>
            <span className="chain-address">{truncateAddress(receiver)}</span>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <span className="label" style={{ display: 'block', marginBottom: '4px' }}>Created</span>
            <span className="chain-timestamp">{formatTimestamp(createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ShipmentCard;
