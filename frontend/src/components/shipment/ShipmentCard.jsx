import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatSequenceNumber, truncateAddress, getStatusColor, getStatusText, formatTimestamp } from '../../utils/format';
import { useWallet } from '../../context/WalletContext';

const ShipmentCard = ({ shipment }) => {
  const navigate = useNavigate();
  const { account } = useWallet();

  const handleClick = () => {
    navigate(`/shipment/${shipment.id}`);
  };

  const getRoleInfo = () => {
    if (!account) return null;
    const lowerAccount = account.toLowerCase();
    const status = Number(shipment.status);

    if (shipment.carrier.toLowerCase() === lowerAccount) {
      let action = 'DELIVERED';
      let color = 'var(--verified-green)';
      let bg = 'rgba(34, 197, 94, 0.1)';
      if (status === 0) { action = 'ACTION: PICK UP'; color = 'var(--amber)'; bg = 'rgba(217, 119, 6, 0.15)'; }
      if (status === 1) { action = 'ACTION: IN TRANSIT'; color = '#2563eb'; bg = 'rgba(37, 99, 235, 0.15)'; }
      if (status === 2) { action = '⚡ ENTER OTP'; color = 'var(--seal-red)'; bg = 'rgba(184, 51, 47, 0.15)'; }
      return { label: 'YOU: CARRIER', action, color, bg };
    }

    if (shipment.receiver.toLowerCase() === lowerAccount) {
      let action = status === 3 ? 'RECEIVED ✓' : '🔑 HOLDING OTP';
      let color = status === 3 ? 'var(--verified-green)' : 'var(--amber)';
      let bg = status === 3 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(217, 119, 6, 0.15)';
      return { label: 'YOU: RECEIVER', action, color, bg };
    }

    if (shipment.sender.toLowerCase() === lowerAccount) {
      return { label: 'YOU: SENDER', action: 'ORIGINATOR', color: 'var(--steel)', bg: 'rgba(0,0,0,0.05)' };
    }

    return null;
  };

  const roleInfo = getRoleInfo();
  const statusColor = getStatusColor(shipment.status);
  const statusText = getStatusText(shipment.status);

  return (
    <tr 
      onClick={handleClick}
      className="ledger-row"
      style={{ 
        cursor: 'pointer',
        borderBottom: '1px solid var(--steel)'
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.03)'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <td style={{ padding: '16px' }}>
        <span className="font-mono font-bold">{formatSequenceNumber(shipment.id)}</span>
      </td>
      <td style={{ padding: '16px', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        <div style={{ fontWeight: 'bold' }}>{shipment.description}</div>
        {roleInfo && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <span style={{ 
              fontSize: '10px', 
              fontFamily: 'var(--font-mono)', 
              fontWeight: 'bold', 
              color: roleInfo.color,
              background: roleInfo.bg,
              border: `1px solid ${roleInfo.color}`,
              padding: '1px 6px'
            }}>
              {roleInfo.label}
            </span>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>
              [{roleInfo.action}]
            </span>
          </div>
        )}
      </td>
      <td style={{ padding: '16px' }}>
        <span className={`status-text ${statusColor}`}>{statusText}</span>
      </td>
      <td style={{ padding: '16px' }}>
        <span className="chain-address">{truncateAddress(shipment.carrier)}</span>
      </td>
      <td style={{ padding: '16px' }}>
        <span className="chain-timestamp">{formatTimestamp(shipment.lastUpdated || shipment.updatedAt)}</span>
      </td>
    </tr>
  );
};

export default ShipmentCard;
