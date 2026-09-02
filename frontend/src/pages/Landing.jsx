import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  const [shipments, setShipments] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('http://localhost:3001/api/shipments')
      .then(res => res.json())
      .then(data => {
        setShipments(Array.isArray(data) ? data : []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  return (
    <div style={{ padding: '64px 24px', maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Hero */}
      <h1 style={{ 
        fontFamily: 'var(--font-display)', 
        fontSize: 'clamp(2rem, 5vw, 3.5rem)',
        color: 'var(--ink)',
        lineHeight: 1.1,
        marginBottom: '16px'
      }}>
        SHIPMENT RECORDS THAT CAN'T BE REWRITTEN
      </h1>
      <p style={{ color: 'var(--steel)', fontSize: '1.1rem', lineHeight: 1.6, maxWidth: '600px', marginBottom: '48px' }}>
        Every custody handoff is recorded on-chain. No party — sender, carrier, receiver — can alter the record after the fact.
      </p>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '48px' }}>
        <div style={{ flex: '1 1 200px', border: '3px solid var(--ink)', padding: '24px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--steel)', marginBottom: '8px' }}>TOTAL SHIPMENTS</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--ink)' }}>
            {loaded ? shipments.length : '...'}
          </div>
        </div>
        <div style={{ flex: '1 1 200px', border: '3px solid var(--ink)', padding: '24px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--steel)', marginBottom: '8px' }}>CHAIN</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--ink)' }}>
            HARDHAT LOCAL
          </div>
        </div>
        <div style={{ flex: '1 1 200px', border: '3px solid var(--ink)', padding: '24px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--steel)', marginBottom: '8px' }}>STATUS</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--verified-green)' }}>
            ● OPERATIONAL
          </div>
        </div>
      </div>

      {/* How It Works */}
      <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginBottom: '24px' }}>HOW IT WORKS</h2>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '48px' }}>
        {[
          { num: '01', title: 'CREATE', desc: 'Sender initiates a custody transfer on-chain' },
          { num: '02', title: 'PICK UP', desc: 'Carrier confirms physical possession' },
          { num: '03', title: 'IN TRANSIT', desc: 'Carrier logs transit confirmation' },
          { num: '04', title: 'DELIVER', desc: 'Receiver confirms final delivery' },
        ].map((step, i) => (
          <div key={i} style={{ 
            flex: '1 1 180px', 
            border: '2px solid var(--ink)', 
            padding: '20px',
            transition: 'border-color 0.15s'
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', color: 'var(--steel)', marginBottom: '8px' }}>{step.num}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--ink)', marginBottom: '8px' }}>{step.title}</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--steel)', lineHeight: 1.4 }}>{step.desc}</div>
          </div>
        ))}
      </div>

      {/* Action Links */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <Link to="/dashboard" className="btn" style={{ padding: '14px 24px', textDecoration: 'none' }}>
          VIEW DASHBOARD
        </Link>
        <Link to="/create" className="btn" style={{ padding: '14px 24px', textDecoration: 'none' }}>
          NEW TRANSFER
        </Link>
        <Link to="/verify" className="btn" style={{ padding: '14px 24px', textDecoration: 'none' }}>
          VERIFY RECORD
        </Link>
      </div>
    </div>
  );
};

export default Landing;
