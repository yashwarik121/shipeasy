import React from 'react';
import { Link } from 'react-router-dom';
import { useEvents } from '../../hooks/useEvents';
import { truncateAddress, truncateHash, timeAgo, getExplorerTxUrl } from '../../utils/format';
import { STATUS_LABELS } from '../../utils/contract';

const LiveEventFeed = () => {
  const { events } = useEvents();

  const statusClassMap = ['status-created', 'status-pickedup', 'status-intransit', 'status-delivered'];

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '800px', overflow: 'hidden' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle, #333)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Live Feed</h3>
        <div className="animate-confirm" style={{ width: '8px', height: '8px', backgroundColor: 'var(--accent-green, #00d474)', borderRadius: '50%' }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {events && events.length > 0 ? (
          events.map((event, index) => {
            const isCreation = event.type === 'ShipmentCreated';
            const statusLabel = STATUS_LABELS[event.status] || 'Unknown';
            const statusClass = statusClassMap[event.status] || 'status-created';

            return (
              <div key={event.txHash + index} className="card animate-slide-in" style={{ padding: '12px', border: '1px solid var(--border-subtle, #333)', backgroundColor: 'transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary, #fff)' }}>
                    {isCreation ? 'Shipment Created' : 'Status Updated'}
                  </div>
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>{timeAgo(event.timestamp)}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Link to={`/shipment/${event.shipmentId}`} className="chain-data" style={{ textDecoration: 'none', color: 'inherit' }}>
                    #{event.shipmentId}
                  </Link>
                  <span className={`status-badge ${statusClass}`} style={{ fontSize: '0.7rem', padding: '2px 6px' }}>{statusLabel}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                  <span className="chain-address" title={event.triggerAddress}>{truncateAddress(event.triggerAddress)}</span>
                  <a href={getExplorerTxUrl(event.txHash)} target="_blank" rel="noopener noreferrer" className="chain-hash">
                    {truncateHash(event.txHash)}
                  </a>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-muted" style={{ textAlign: 'center', marginTop: '32px' }}>Waiting for on-chain events...</p>
        )}
      </div>
    </div>
  );
};

export default LiveEventFeed;
