import React from 'react';
import { formatTimestamp, truncateAddress } from '../../utils/format';

const WaybillRoute = ({ shipment, history = [], status, sender, carrier, receiver }) => {
  const currentStatus = Number(shipment?.status ?? status ?? 0);
  const senderAddr = shipment?.sender || sender || '';
  const carrierAddr = shipment?.carrier || carrier || '';
  const receiverAddr = shipment?.receiver || receiver || '';
  const shipmentId = shipment?.id ?? '000';

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
      actorAddress: senderAddr,
      description: 'Shipment registered & cryptographic access key anchored on-chain.',
    },
    {
      stage: 1,
      code: 'CARGO_IN',
      title: 'PHYSICAL CUSTODY ACQUIRED',
      actorRole: 'CARRIER',
      actorAddress: carrierAddr,
      description: 'Carrier confirmed package collection and physical possession at origin checkpoint.',
    },
    {
      stage: 2,
      code: 'TRANSIT',
      title: 'LINE-HAUL IN-TRANSIT DISPATCH',
      actorRole: 'CARRIER',
      actorAddress: carrierAddr,
      description: 'Cargo verified in freight movement pipeline towards destination hub.',
    },
    {
      stage: 3,
      code: 'FINAL_POD',
      title: 'PROOF OF DELIVERY SEALED',
      actorRole: 'RECEIVER',
      actorAddress: receiverAddr,
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
            MANIFEST REF: WB-{String(shipmentId).padStart(4, '0')}-EVM
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
                  width: '28px',
                  height: '28px',
                  border: '2px solid var(--ink)',
                  background: isCurrent 
                    ? 'var(--amber)' 
                    : isDone 
                      ? 'var(--verified-green)' 
                      : 'var(--paper)',
                  color: isDone ? 'white' : 'var(--ink)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  zIndex: 2,
                  boxShadow: isCurrent ? '2px 2px 0px var(--ink)' : 'none'
                }}>
                  {isDone && !isCurrent ? '✓' : `0${m.stage}`}
                </div>

                {/* Vertical Line connecting nodes */}
                {idx < milestones.length - 1 && (
                  <div style={{
                    width: '3px',
                    flex: 1,
                    minHeight: '44px',
                    background: isDone && currentStatus > m.stage 
                      ? 'var(--ink)' 
                      : 'var(--steel)',
                    opacity: isPending ? 0.35 : 1,
                    margin: '2px 0'
                  }} />
                )}
              </div>

              {/* Right Column: Stage Description & On-Chain Audit */}
              <div style={{
                flex: 1,
                paddingBottom: idx === milestones.length - 1 ? '0px' : '20px',
                opacity: isPending ? 0.45 : 1
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="font-mono text-xs font-bold" style={{
                    background: isCurrent ? 'var(--ink)' : isDone ? '#2563eb' : 'var(--steel)',
                    color: 'white',
                    padding: '1px 6px',
                    fontSize: '10px'
                  }}>
                    {m.code}
                  </span>
                  <span className="font-mono font-bold" style={{ fontSize: '13px' }}>
                    {m.title}
                  </span>
                  {isCurrent && (
                    <span style={{
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--amber)',
                      fontWeight: 'bold',
                      border: '1px solid var(--amber)',
                      padding: '1px 6px'
                    }}>
                      LIVE AT THIS CHECKPOINT
                    </span>
                  )}
                </div>

                <div className="font-mono text-xs text-steel" style={{ margin: '4px 0 6px 0', lineHeight: '1.4' }}>
                  {m.description}
                </div>

                {/* Signer & Proof Details */}
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--ink)',
                  background: 'rgba(0,0,0,0.03)',
                  padding: '6px 10px',
                  border: '1px dashed var(--steel)',
                  marginTop: '4px',
                  flexWrap: 'wrap'
                }}>
                  <div>
                    <span className="text-steel" style={{ fontSize: '10px' }}>PARTY: </span>
                    <strong>{m.actorRole}</strong> ({truncateAddress(m.actorAddress)})
                  </div>
                  {logEntry && (
                    <div>
                      <span className="text-steel" style={{ fontSize: '10px' }}>SEALED: </span>
                      <span>{formatTimestamp(logEntry.timestamp)}</span>
                    </div>
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
