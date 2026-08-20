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

  const getRole = () => {
    if (!account) return null;
    const lowerAccount = account.toLowerCase();
    if (shipment.sender.toLowerCase() === lowerAccount) return 'YOU: SENDER';
    if (shipment.carrier.toLowerCase() === lowerAccount) return 'YOU: CARRIER';
    if (shipment.receiver.toLowerCase() === lowerAccount) return 'YOU: RECEIVER';
    return null;
  };

  const role = getRole();
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
        {role && (
          <div className="text-xs text-steel font-mono mt-1">{role}</div>
        )}
      </td>
      <td style={{ padding: '16px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {shipment.description}
      </td>
      <td style={{ padding: '16px' }}>
        <span className={`status-text ${statusColor}`}>{statusText}</span>
      </td>
      <td style={{ padding: '16px' }}>
        <span className="chain-address">{truncateAddress(shipment.carrier)}</span>
      </td>
      <td style={{ padding: '16px' }}>
        <span className="chain-timestamp">{formatTimestamp(shipment.updatedAt)}</span>
      </td>
    </tr>
  );
};

export default ShipmentCard;
