import React from 'react';
import { formatTimestamp, truncateAddress } from '../../utils/format';

const WaybillRoute = ({ shipment, history = [] }) => {
  const currentStatus = Number(shipment.status);

  // Map history logs by status index
  const historyByStatus = {};
  if (Array.isArray(history)) {
    history.forEach(entry => {
      historyByStatus[Number(entry.status)] = entry;
    });
  }

  const milestones = [
    {
      stage: 0,
      code: 'ORIGIN',
      title: 'BOOKING & DISPATCH INITIATED',
      actorRole: 'SENDER',
      actorAddress: shipment.sender,
      description: 'Shipment registered & cryptographic access key anchored on-chain.',
    },
    {
      stage: 1,
      code: 'CARGO_IN',
      title: 'PHYSICAL CUSTODY ACQUIRED',
      actorRole: 'CARRIER',
      actorAddress: shipment.carrier,
      description: 'Carrier confirmed package collection and physical possession at origin checkpoint.',
    },
    {
      stage: 2,
      code: 'TRANSIT',
      title: 'LINE-HAUL IN-TRANSIT DISPATCH',
      actorRole: 'CARRIER',
      actorAddress: shipment.carrier,
      description: 'Cargo verified in freight movement pipeline towards destination hub.',
    },
    {
      stage: 3,
      code: 'FINAL_POD',
      title: 'PROOF OF DELIVERY SEALED',
      actorRole: 'RECEIVER',
      actorAddress: shipment.receiver,
      description: 'Recipient verified cargo receipt. Smart contract locked; record permanently sealed.',
    }
  ];

  return (
    <div style={{
      border: '2px solid var(--ink)',
      background: 'var(--paper-dark)',
      padding: '24px',
      marginBottom: '32px'
    }}>
      {/* Waybill Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid var(--ink)',
        paddingBottom: '12px',
        marginBottom: '20px'
      }}>
        <div>
          <div className="font-mono text-xs text-steel" style={{ letterSpacing: '0.12em' }}>
            WAYBILL ROUTE & CARRIER DISPATCH LOG
          </div>
          <div className="font-mono" style={{ fontSize: '13px', fontWeight: 'bold' }}>
            MANIFEST REF: WB-{String(shipment.id).padStart(4, '0')}-EVM
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className="stamp" style={{ fontSize: '10px', padding: '4px 8px' }}>
            {currentStatus === 3 ? 'ROUTE COMPLETED' : `STAGE ${currentStatus + 1}/4 ACTIVE`}
          </span>
        </div>
      </div>

      {/* Vertical Route Milestones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
        {milestones.map((m, idx) => {
          const isDone = m.stage <= currentStatus;
          const isCurrent = m.stage === currentStatus;
          const isPending = m.stage > currentStatus;
          const logEntry = historyByStatus[m.stage];

          return (
            <div key={m.stage} style={{ display: 'flex', position: 'relative' }}>
              {/* Left Column: Track Indicator & Connecting Line */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '36px',
                marginRight: '16px'
              }}>
                {/* Node Box */}
                <div style={{
                  width: '24px',
                  height: '24px',
                  border: '2px solid var(--ink)',
                  background: isDone ? 'var(--ink)' : 'var(--paper)',
                  color: isDone ? 'var(--paper)' : 'var(--steel)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  zIndex: 2,
                  boxShadow: isCurrent ? '0 0 0 3px var(--verified-green)' : 'none'
                }}>
                  {isDone ? '✓' : `0${m.stage + 1}`}
                </div>

                {/* Vertical Segment Line */}
                {idx < milestones.length - 1 && (
                  <div style={{
                    width: '2px',
                    flex: 1,
                    minHeight: '44px',
                    background: isDone && currentStatus > m.stage ? 'var(--ink)' : 'var(--border-light)',
                    margin: '4px 0'
                  }} />
                )}
              </div>

              {/* Right Column: Milestone Content */}
              <div style={{
                flex: 1,
                paddingBottom: idx === milestones.length - 1 ? '0' : '20px',
                opacity: isPending ? 0.45 : 1
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <span className="font-mono text-xs" style={{
                      fontWeight: 'bold',
                      color: isDone ? 'var(--ink)' : 'var(--steel)',
                      letterSpacing: '0.05em'
                    }}>
                      [{m.code}] {m.title}
                    </span>
                    <span className="font-mono text-xs text-steel" style={{ marginLeft: '8px' }}>
                      ({m.actorRole})
                    </span>
                  </div>

                  {logEntry && logEntry.timestamp && (
                    <div className="font-mono text-xs text-steel">
                      {formatTimestamp(Number(logEntry.timestamp))}
                    </div>
                  )}
                </div>

                <div className="font-mono text-xs text-steel" style={{ marginTop: '4px', lineHeight: '1.4' }}>
                  {m.description}
                </div>

                <div className="font-mono text-xs text-steel" style={{ marginTop: '4px' }}>
                  KEY ACTOR: <span style={{ color: 'var(--ink)' }}>{truncateAddress(m.actorAddress)}</span>
                  {isCurrent && (
                    <span style={{
                      marginLeft: '10px',
                      color: 'var(--verified-green)',
                      fontWeight: 'bold'
                    }}>
                      ◀ CURRENT CHECKPOINT
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WaybillRoute;
