import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import CustodyEntry from '../components/shipment/StatusTimeline';
import { getStatusText } from '../utils/format';

const Landing = () => {
  // Hero Typewriter State
  const fullHeadline = "SHIPMENT RECORDS THAT CAN'T BE REWRITTEN";
  const words = fullHeadline.split(' ');
  const [typedWords, setTypedWords] = useState([]);
  const [typingComplete, setTypingComplete] = useState(false);

  useEffect(() => {
    let currentWordIndex = 0;
    const interval = setInterval(() => {
      if (currentWordIndex < words.length) {
        setTypedWords(prev => [...prev, words[currentWordIndex]]);
        currentWordIndex++;
      } else {
        setTypingComplete(true);
        clearInterval(interval);
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // API Data State
  const [totalShipments, setTotalShipments] = useState(0);
  const [blockHeight, setBlockHeight] = useState('9+');
  const [demoShipment, setDemoShipment] = useState(null);
  const [demoHistory, setDemoHistory] = useState([]);

  // Counter animation for totalShipments
  const [displayTotal, setDisplayTotal] = useState(0);

  useEffect(() => {
    // Fetch total shipments
    fetch('http://localhost:3001/api/shipments')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data)) {
          setTotalShipments(data.length);
        }
      })
      .catch(err => console.error('Failed to fetch shipments:', err));

    // Fetch demo shipment #0
    fetch('http://localhost:3001/api/shipments/0')
      .then(res => res.json())
      .then(data => setDemoShipment(data))
      .catch(err => console.error('Failed to fetch shipment #0:', err));

    // Fetch demo shipment #0 history
    fetch('http://localhost:3001/api/shipments/0/history')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data)) {
          setDemoHistory(data);
        }
      })
      .catch(err => console.error('Failed to fetch shipment #0 history:', err));
  }, []);

  useEffect(() => {
    if (totalShipments > 0) {
      let current = 0;
      const step = Math.max(1, Math.ceil(totalShipments / 20)); // Animate in up to 20 steps
      const interval = setInterval(() => {
        current += step;
        if (current >= totalShipments) {
          setDisplayTotal(totalShipments);
          clearInterval(interval);
        } else {
          setDisplayTotal(current);
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, [totalShipments]);

  return (
    <div style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '4rem' }}>
      
      {/* SECTION 1: Hero */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem' }}>
        <h1 className="display-xl" style={{ 
          margin: 0, 
          fontFamily: 'var(--font-display)',
          color: 'var(--ink)',
          textTransform: 'uppercase',
          lineHeight: '1.1',
          minHeight: '2.2em'
        }}>
          {typedWords.join(' ')}
          {typingComplete ? (
            <span style={{ animation: 'blink 1s step-end infinite' }}>_</span>
          ) : (
            <span style={{ opacity: 0 }}>_</span>
          )}
        </h1>
        {typingComplete && (
          <p className="animate-fade-in-up delay-2" style={{ 
            margin: 0, 
            fontSize: '1.25rem', 
            fontFamily: 'var(--font-body)',
            color: 'var(--steel)',
            maxWidth: '600px',
            lineHeight: '1.5'
          }}>
            Every custody handoff is recorded on-chain. No party can alter the record after the fact.
          </p>
        )}
      </section>

      {/* SECTION 2: Live Chain Stats */}
      <section style={{ 
        display: 'flex', 
        gap: '2rem',
        flexWrap: 'wrap'
      }}>
        {[
          { label: 'TOTAL SHIPMENTS', value: displayTotal, delay: 'delay-2' },
          { label: 'CHAIN', value: 'HARDHAT LOCAL', delay: 'delay-3' },
          { label: 'BLOCK HEIGHT', value: blockHeight, delay: 'delay-4' }
        ].map((stat, idx) => (
          <div key={idx} className={`animate-fade-in-up ${stat.delay}`} style={{
            flex: '1 1 250px',
            border: '3px solid var(--ink)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            backgroundColor: 'var(--paper)'
          }}>
            <div className="section-label" style={{ 
              fontSize: '0.875rem', 
              textTransform: 'uppercase', 
              fontFamily: 'var(--font-body)',
              fontWeight: '600',
              color: 'var(--steel)' 
            }}>
              {stat.label}
            </div>
            <div style={{ 
              fontFamily: 'var(--font-mono)', 
              fontSize: '2.5rem',
              color: 'var(--ink)',
              lineHeight: '1'
            }}>
              {stat.value}
            </div>
          </div>
        ))}
      </section>

      {/* SECTION 3: How It Works */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        <h2 className="display-md animate-fade-in-up" style={{ margin: 0, fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>HOW IT WORKS</h2>
        <div style={{ 
          display: 'flex', 
          gap: '2rem',
          flexWrap: 'wrap',
          position: 'relative'
        }}>
          {[
            { num: '01', title: 'CREATE', desc: 'Sender initiates a custody transfer on-chain' },
            { num: '02', title: 'PICK UP', desc: 'Carrier confirms physical possession' },
            { num: '03', title: 'IN TRANSIT', desc: 'Carrier logs transit confirmation' },
            { num: '04', title: 'DELIVER', desc: 'Receiver confirms final delivery' }
          ].map((step, idx) => (
            <div key={idx} className={`animate-slide-in-left delay-${idx + 2}`} style={{
              flex: '1 1 200px',
              border: '2px solid transparent',
              borderTop: '2px dashed var(--steel)',
              padding: '1.5rem 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              transition: 'border-color 0.15s ease-out',
              cursor: 'default'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ink)'; e.currentTarget.style.borderTopColor = 'var(--ink)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.borderTopColor = 'var(--steel)'; }}
            >
              <div style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: '1.5rem', 
                color: 'var(--steel)' 
              }}>{step.num}</div>
              <h3 className="display-md" style={{ 
                margin: 0, 
                fontFamily: 'var(--font-display)',
                fontSize: '1.25rem',
                color: 'var(--ink)'
              }}>{step.title}</h3>
              <p style={{ 
                margin: 0, 
                fontFamily: 'var(--font-body)', 
                color: 'var(--steel)',
                fontSize: '0.875rem',
                lineHeight: '1.5'
              }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4: Live Demo Trail */}
      <section className="animate-fade-in-up delay-6" style={{
        border: '3px solid var(--ink)',
        backgroundColor: 'var(--paper)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          borderBottom: '3px solid var(--ink)',
          padding: '1rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h2 style={{ 
            margin: 0, 
            fontFamily: 'var(--font-mono)', 
            fontSize: '1.125rem',
            color: 'var(--ink)'
          }}>LIVE CUSTODY TRAIL — SHIPMENT #000</h2>
          <div style={{ 
            fontFamily: 'var(--font-mono)', 
            color: 'var(--verified-green)',
            fontSize: '0.875rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--verified-green)', borderRadius: '50%', display: 'inline-block' }}></span>
            STATUS: DELIVERED
          </div>
        </div>
        <div style={{ padding: '2rem' }}>
          {demoHistory.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {demoHistory.map((entry, idx) => (
                <CustodyEntry key={idx} entry={entry} />
              ))}
            </div>
          ) : (
            <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--steel)' }}>{demoShipment ? 'Loading trail data...' : 'Waiting for shipment data...'}</div>
          )}
        </div>
      </section>

      {/* SECTION 5: Action Links */}
      <section style={{ 
        display: 'flex', 
        gap: '1rem',
        flexWrap: 'wrap',
        marginTop: '1rem'
      }}>
        {[
          { label: 'VIEW DASHBOARD', path: '/dashboard', delay: 'delay-6' },
          { label: 'NEW TRANSFER', path: '/create', delay: 'delay-7' },
          { label: 'VERIFY RECORD', path: '/verify', delay: 'delay-8' }
        ].map((link, idx) => (
          <Link key={idx} to={link.path} className={`btn animate-fade-in-up ${link.delay}`} style={{
            padding: '1rem 2rem',
            backgroundColor: 'var(--ink)',
            color: 'var(--paper)',
            fontFamily: 'var(--font-mono)',
            textDecoration: 'none',
            textTransform: 'uppercase',
            fontWeight: 'bold',
            border: '2px solid var(--ink)',
            transition: 'all 0.15s ease-out'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--paper)'; e.currentTarget.style.color = 'var(--ink)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ink)'; e.currentTarget.style.color = 'var(--paper)'; }}
          >
            {link.label}
          </Link>
        ))}
      </section>
    </div>
  );
};

export default Landing;
