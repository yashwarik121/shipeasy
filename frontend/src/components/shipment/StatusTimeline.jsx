import React from 'react';
import { getStatusText, getStatusColor, formatTimestamp, truncateAddress } from '../../utils/format';

const CustodyEntry = ({ entry = {}, index = 0, isLatest = false, isCurrent = false }) => {
  const idx = typeof index === 'number' ? index : 0;
  const sequenceNumber = idx.toString().padStart(3, '0');
  const status = entry?.status != null ? entry.status : 0;
  const statusColor = getStatusColor(status);
  const updater = entry?.updater || entry?.updatedBy || '0x---';
  const latestFlag = isLatest || isCurrent;
  
  // Random rotation for the stamp (-3 to +3 degrees roughly)
  const rotation = (idx % 3 === 0) ? '-2deg' : (idx % 2 === 0 ? '-1deg' : '-3deg');

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      borderBottom: '1px solid var(--steel)',
      padding: '24px 0',
      width: '100%'
    }}>
      {/* Sequence Number */}
      <div style={{ width: '80px' }}>
        <span className="font-mono display-md" style={{ margin: 0 }}>{sequenceNumber}</span>
      </div>

      {/* Entry Details */}
      <div style={{ flex: 1, padding: '0 24px' }}>
        <div className="font-mono text-sm mb-1" style={{ wordBreak: 'break-all' }}>
          <span className="text-steel">UPDATER:</span> {updater}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span className={`status-text ${statusColor} font-bold`}>{getStatusText(status)}</span>
          <span className="chain-timestamp text-steel">{formatTimestamp(entry?.timestamp)}</span>
        </div>
      </div>

      {/* Stamp */}
      <div style={{ width: '200px', display: 'flex', justifyContent: 'flex-end' }}>
        <div 
          className={`stamp ${latestFlag ? 'animate-stamp' : ''}`}
          style={{ 
            border: '2px solid var(--ink)', 
            padding: '12px',
            transform: `rotate(${rotation})`,
            color: 'var(--ink)'
          }}
        >
          <div className="font-mono text-xs font-bold border-bottom" style={{ borderBottom: '1px solid var(--ink)', paddingBottom: '4px', marginBottom: '4px' }}>
            BLOCK #{entry?.blockNumber || '---'}
          </div>
          <div className="font-mono text-xs text-steel mb-1">
            {formatTimestamp(entry?.timestamp)}
          </div>
          <div className="font-mono text-xs" style={{ fontSize: '10px' }}>
            SIG: {truncateAddress(updater)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustodyEntry;
