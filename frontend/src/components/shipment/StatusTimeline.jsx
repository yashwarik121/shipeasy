import React from 'react';
import { formatTimestamp, getExplorerAddressUrl } from '../../utils/format';
import { STATUS_LABELS } from '../../utils/contract';

const StatusTimeline = ({ history = [] }) => {
  // Sort history newest first
  const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);

  const statusClassMap = ['status-created', 'status-pickedup', 'status-intransit', 'status-delivered'];

  return (
    <div className="card" style={{ padding: '24px' }}>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '1.25rem' }}>On-Chain History</h3>
      
      {sortedHistory.length === 0 ? (
        <p className="text-muted">No history found.</p>
      ) : (
        <div style={{ position: 'relative', paddingLeft: '16px' }}>
          <div style={{ 
            position: 'absolute', 
            left: '0', 
            top: '8px', 
            bottom: '0', 
            width: '1px', 
            backgroundColor: 'var(--accent-green, #00d474)' 
          }} />
          
          {sortedHistory.map((entry, index) => {
            const statusLabel = STATUS_LABELS[entry.status] || 'Unknown';
            const statusClass = statusClassMap[entry.status] || 'status-created';
            
            return (
              <div key={index} className="animate-slide-in" style={{ position: 'relative', marginBottom: index === sortedHistory.length - 1 ? '0' : '24px' }}>
                <div style={{
                  position: 'absolute',
                  left: '-20px',
                  top: '6px',
                  width: '9px',
                  height: '9px',
                  backgroundColor: 'var(--bg-surface, #0a0a0b)',
                  border: '1px solid var(--accent-green, #00d474)',
                  transform: 'rotate(45deg)'
                }} />
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className={`status-badge ${statusClass}`}>{statusLabel}</span>
                    <span className="chain-timestamp">{formatTimestamp(entry.timestamp)}</span>
                  </div>
                  <div>
                    <span className="text-secondary" style={{ fontSize: '0.875rem' }}>Updated by </span>
                    <a href={getExplorerAddressUrl(entry.updater)} target="_blank" rel="noopener noreferrer" className="chain-address">
                      {entry.updater}
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StatusTimeline;
