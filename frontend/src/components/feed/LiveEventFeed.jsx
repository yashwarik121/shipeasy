import React from 'react';
import { useEvents } from '../../hooks/useEvents';
import { formatTimestamp, getStatusColor, getStatusText, truncateHash } from '../../utils/format';
import { Link } from 'react-router-dom';

const LiveEventFeed = () => {
  const events = useEvents();

  return (
    <div style={{ border: '2px solid var(--ink)', padding: '16px', backgroundColor: 'var(--paper)' }}>
      <h3 className="section-label mb-4" style={{ borderBottom: '2px solid var(--ink)', paddingBottom: '8px' }}>
        LIVE CHAIN EVENTS
      </h3>
      
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {events && events.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {events.map((evt, idx) => {
              const statusColor = getStatusColor(evt.status);
              return (
                <div key={idx} style={{ padding: '8px 0', borderBottom: '1px solid var(--steel)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span className="chain-timestamp text-xs">{formatTimestamp(evt.timestamp)}</span>
                    <span className="font-mono text-xs font-bold uppercase">{evt.eventName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Link to={`/shipment/${evt.shipmentId}`} className="font-mono text-sm" style={{ color: 'var(--ink)', textDecoration: 'underline' }}>
                      SHIPMENT #{evt.shipmentId.toString()}
                    </Link>
                    <span className={`status-text ${statusColor} text-xs`}>{getStatusText(evt.status)}</span>
                  </div>
                  <div className="mt-1">
                    <span className="chain-hash text-xs text-steel">TX: {truncateHash(evt.transactionHash)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="font-mono text-steel text-sm text-center" style={{ padding: '32px 0' }}>
            Monitoring chain...
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveEventFeed;
