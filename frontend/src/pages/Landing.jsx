import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useContract } from '../hooks/useContract';
import CustodyEntry from '../components/shipment/StatusTimeline';
import { formatSequenceNumber, getStatusText } from '../utils/format';

const Landing = () => {
  const { getShipment, getHistory, contract } = useContract();
  const [demoShipment, setDemoShipment] = useState(null);
  const [demoHistory, setDemoHistory] = useState([]);

  useEffect(() => {
    const fetchDemoData = async () => {
      try {
        if (!contract) return;
        const shipment = await getShipment(0);
        const history = await getHistory(0);
        setDemoShipment(shipment);
        setDemoHistory(history);
      } catch (err) {
        console.error("Failed to fetch demo shipment:", err);
      }
    };
    fetchDemoData();
  }, [contract, getShipment, getHistory]);

  return (
    <div className="container" style={{ paddingTop: '64px', paddingBottom: '64px' }}>
      
      {/* Hero Section */}
      <div style={{ marginBottom: '64px' }}>
        <h1 className="display-xl" style={{ marginBottom: '24px' }}>
          SHIPMENT RECORDS THAT CAN'T BE REWRITTEN
        </h1>
        <p style={{ fontSize: '1.125rem', lineHeight: '1.7', maxWidth: '720px', color: 'var(--steel)' }}>
          Every custody handoff is recorded on-chain. No party — sender, carrier, receiver — can alter the record after the fact. This doesn't verify physical delivery happened. It proves the paper trail wasn't tampered with.
        </p>
      </div>

      {/* Live Demo Section */}
      {demoHistory && demoHistory.length > 0 && (
        <div style={{ marginBottom: '64px', border: '3px solid var(--ink)', padding: '32px' }}>
          <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <span>LIVE CHAIN DEMO — SHIPMENT #000</span>
            <span className="text-green">STATUS: {demoShipment ? getStatusText(demoShipment.status) : 'DELIVERED'}</span>
          </div>
          <div style={{ borderBottom: '3px solid var(--ink)', margin: '0 -32px 24px -32px' }}></div>
          <div>
            {demoHistory.map((entry, idx) => (
              <CustodyEntry 
                key={idx}
                entry={{
                  status: Number(entry.status),
                  updater: entry.updatedBy || entry.updater,
                  timestamp: Number(entry.timestamp)
                }}
                index={idx + 1}
                isLatest={idx === demoHistory.length - 1}
              />
            ))}
          </div>
        </div>
      )}

      {/* Action Links */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <Link to="/dashboard" className="btn" style={{ textDecoration: 'none' }}>
          CONNECT WALLET & VIEW YOUR SHIPMENTS
        </Link>
        <Link to="/create" className="btn" style={{ textDecoration: 'none' }}>
          INITIATE A CUSTODY TRANSFER
        </Link>
        <Link to="/verify" className="btn" style={{ textDecoration: 'none' }}>
          VERIFY A RECORD (NO WALLET NEEDED)
        </Link>
      </div>
    </div>
  );
};

export default Landing;
