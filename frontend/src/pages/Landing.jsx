import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';

const CRYPTO_SYMBOLS = ['₿', '⛓', '◈', '⬡', '⬢', '△', '⏣', '◉'];
const FLOAT_COUNT = 20;

const Landing = () => {
  const [shipments, setShipments] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [trail, setTrail] = useState([]);
  const [heroVisible, setHeroVisible] = useState(false);
  const containerRef = useRef(null);

  // Fetch data
  useEffect(() => {
    fetch('http://localhost:3001/api/shipments')
      .then(r => r.json())
      .then(d => { setShipments(Array.isArray(d) ? d : []); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  // Hero entrance
  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Custom cursor trail
  useEffect(() => {
    const handleMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      setTrail(prev => [...prev.slice(-12), { x: e.clientX, y: e.clientY, id: Date.now() }]);
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  // Generate floating elements
  const floaters = useRef(
    Array.from({ length: FLOAT_COUNT }, (_, i) => ({
      id: i,
      symbol: CRYPTO_SYMBOLS[i % CRYPTO_SYMBOLS.length],
      left: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 12 + Math.random() * 16,
      size: 14 + Math.random() * 28,
      opacity: 0.04 + Math.random() * 0.08,
    }))
  ).current;

  return (
    <>
      <style>{`
        .landing-root {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          cursor: none;
        }

        /* Grid Background */
        .grid-bg {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(10,10,10,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(10,10,10,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
          z-index: 0;
          pointer-events: none;
        }
        [data-theme='dark'] .grid-bg {
          background-image:
            linear-gradient(rgba(232,230,225,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(232,230,225,0.04) 1px, transparent 1px);
        }

        /* Scan line overlay */
        .scan-overlay {
          position: fixed;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(10,10,10,0.015) 2px,
            rgba(10,10,10,0.015) 4px
          );
          z-index: 0;
          pointer-events: none;
        }

        /* Floating crypto symbols */
        .floater {
          position: fixed;
          font-family: var(--font-mono);
          color: var(--ink);
          z-index: 0;
          pointer-events: none;
          animation: floatUp linear infinite;
        }
        @keyframes floatUp {
          0% { transform: translateY(110vh) rotate(0deg); }
          100% { transform: translateY(-10vh) rotate(360deg); }
        }

        /* Custom cursor */
        .cursor-dot {
          position: fixed;
          width: 12px;
          height: 12px;
          border: 2px solid var(--ink);
          z-index: 9998;
          pointer-events: none;
          transition: transform 0.05s ease-out;
        }
        .cursor-ring {
          position: fixed;
          width: 40px;
          height: 40px;
          border: 1px solid var(--steel);
          border-radius: 0;
          z-index: 9997;
          pointer-events: none;
          transition: transform 0.15s ease-out, width 0.2s, height 0.2s;
        }
        .cursor-trail {
          position: fixed;
          width: 4px;
          height: 4px;
          background: var(--ink);
          opacity: 0.3;
          z-index: 9996;
          pointer-events: none;
          animation: trailFade 0.6s ease-out forwards;
        }
        @keyframes trailFade {
          to { opacity: 0; transform: scale(0); }
        }

        /* Hero animations */
        .hero-title {
          font-family: var(--font-display);
          font-size: clamp(3rem, 8vw, 7rem);
          color: var(--ink);
          line-height: 0.95;
          letter-spacing: -0.04em;
          text-transform: uppercase;
          transform: translateY(60px);
          opacity: 0;
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hero-title.visible {
          transform: translateY(0);
          opacity: 1;
        }

        .hero-sub {
          font-family: var(--font-body);
          font-size: clamp(1rem, 2vw, 1.3rem);
          color: var(--steel);
          line-height: 1.6;
          max-width: 550px;
          transform: translateY(40px);
          opacity: 0;
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s;
        }
        .hero-sub.visible {
          transform: translateY(0);
          opacity: 1;
        }

        /* Stat cards */
        .stat-card {
          border: 3px solid var(--ink);
          padding: 28px;
          position: relative;
          overflow: hidden;
          transform: translateY(30px);
          opacity: 0;
          transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .stat-card.visible { transform: translateY(0); opacity: 1; }
        .stat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 3px;
          background: var(--ink);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.6s ease-out 0.3s;
        }
        .stat-card.visible::before { transform: scaleX(1); }

        /* Step cards */
        .step-card {
          border: 2px solid var(--ink);
          padding: 24px;
          position: relative;
          transform: translateX(-30px);
          opacity: 0;
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .step-card.visible { transform: translateX(0); opacity: 1; }
        .step-card:hover {
          background: var(--ink);
          color: var(--paper);
        }
        .step-card:hover .step-num,
        .step-card:hover .step-title,
        .step-card:hover .step-desc {
          color: var(--paper) !important;
        }

        /* CTA buttons */
        .cta-btn {
          display: inline-block;
          padding: 18px 36px;
          border: 3px solid var(--ink);
          background: var(--ink);
          color: var(--paper);
          font-family: var(--font-mono);
          font-size: 1rem;
          font-weight: bold;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          position: relative;
          overflow: hidden;
          transition: all 0.2s ease-out;
        }
        .cta-btn:hover {
          background: transparent;
          color: var(--ink);
        }
        .cta-btn::after {
          content: '→';
          margin-left: 12px;
          transition: margin-left 0.2s;
        }
        .cta-btn:hover::after { margin-left: 20px; }

        .cta-outline {
          background: transparent;
          color: var(--ink);
        }
        .cta-outline:hover {
          background: var(--ink);
          color: var(--paper);
        }

        /* Glitch effect on hover */
        .glitch-hover:hover {
          animation: glitchShake 0.3s ease-out;
        }
        @keyframes glitchShake {
          0%, 100% { transform: translate(0); }
          25% { transform: translate(-2px, 1px); }
          50% { transform: translate(2px, -1px); }
          75% { transform: translate(-1px, 2px); }
        }

        /* Chain animation */
        .chain-line {
          height: 2px;
          background: var(--ink);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 1s cubic-bezier(0.16, 1, 0.3, 1) 0.5s;
        }
        .chain-line.visible { transform: scaleX(1); }

        /* Blockchain visual */
        .block-visual {
          display: flex;
          gap: 8px;
          align-items: center;
          opacity: 0;
          transition: opacity 0.8s ease 0.6s;
        }
        .block-visual.visible { opacity: 1; }
        .block-item {
          width: 48px;
          height: 48px;
          border: 2px solid var(--ink);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: bold;
          animation: blockPulse 3s ease-in-out infinite;
        }
        .block-item:nth-child(2) { animation-delay: 0.3s; }
        .block-item:nth-child(4) { animation-delay: 0.6s; }
        .block-item:nth-child(6) { animation-delay: 0.9s; }
        .block-link {
          width: 20px;
          height: 2px;
          background: var(--ink);
        }
        @keyframes blockPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 transparent; }
          50% { transform: scale(1.05); box-shadow: 4px 4px 0 var(--steel); }
        }
      `}</style>

      <div className="landing-root" ref={containerRef}>
        {/* Grid Background */}
        <div className="grid-bg" />
        <div className="scan-overlay" />

        {/* Floating Crypto Symbols */}
        {floaters.map(f => (
          <div key={f.id} className="floater" style={{
            left: `${f.left}%`,
            fontSize: `${f.size}px`,
            opacity: f.opacity,
            animationDuration: `${f.duration}s`,
            animationDelay: `${f.delay}s`,
          }}>
            {f.symbol}
          </div>
        ))}

        {/* Custom Cursor */}
        <div className="cursor-dot" style={{
          transform: `translate(${mousePos.x - 6}px, ${mousePos.y - 6}px)`
        }} />
        <div className="cursor-ring" style={{
          transform: `translate(${mousePos.x - 20}px, ${mousePos.y - 20}px)`
        }} />
        {trail.map((t, i) => (
          <div key={t.id} className="cursor-trail" style={{
            left: t.x - 2, top: t.y - 2,
          }} />
        ))}

        {/* CONTENT */}
        <div style={{ position: 'relative', zIndex: 1, padding: '0 24px', maxWidth: '1200px', margin: '0 auto' }}>

          {/* Hero Section */}
          <section style={{ minHeight: '85vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '24px', paddingTop: '80px' }}>
            <div className="block-visual visible">
              {[1,2,3,4].map((n, i) => (
                <React.Fragment key={n}>
                  <div className="block-item">BLK<br/>{n}</div>
                  {i < 3 && <div className="block-link" />}
                </React.Fragment>
              ))}
            </div>
            
            <h1 className={`hero-title ${heroVisible ? 'visible' : ''}`}>
              SHIPMENT<br/>RECORDS<br/>ON-CHAIN
            </h1>
            
            <div className="chain-line visible" style={{ width: '200px', marginTop: '8px' }} />
            
            <p className={`hero-sub ${heroVisible ? 'visible' : ''}`}>
              Every custody handoff — hashed, timestamped, and permanently recorded on the blockchain.
              No party can alter the record after the fact.
            </p>

            <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap',
              opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s'
            }}>
              <Link to="/dashboard" className="cta-btn">ENTER DASHBOARD</Link>
              <Link to="/create" className="cta-btn cta-outline">NEW TRANSFER</Link>
            </div>
          </section>

          {/* Stats */}
          <section style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '80px' }}>
            {[
              { label: 'ACTIVE SHIPMENTS', value: loaded ? shipments.length : '—', icon: '◈' },
              { label: 'CHAIN', value: 'HARDHAT LOCAL', icon: '⛓' },
              { label: 'PROTOCOL', value: 'CUSTODY v1', icon: '⬡' },
              { label: 'STATUS', value: '● OPERATIONAL', color: 'var(--verified-green)', icon: '◉' }
            ].map((s, i) => (
              <div key={i} className="stat-card visible" style={{ flex: '1 1 220px', transitionDelay: `${i * 0.1}s` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span className="font-mono text-xs text-steel">{s.label}</span>
                  <span style={{ fontSize: '20px', opacity: 0.2 }}>{s.icon}</span>
                </div>
                <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 'bold', color: s.color || 'var(--ink)' }}>
                  {s.value}
                </div>
              </div>
            ))}
          </section>

          {/* How It Works */}
          <section style={{ marginBottom: '80px' }}>
            <h2 className="display-lg" style={{ marginBottom: '32px' }}>HOW IT WORKS</h2>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {[
                { num: '01', title: 'CREATE', desc: 'Sender initiates a custody record on the blockchain', icon: '⊕' },
                { num: '02', title: 'PICK UP', desc: 'Carrier confirms physical possession on-chain', icon: '⊙' },
                { num: '03', title: 'IN TRANSIT', desc: 'Transit confirmation is permanently logged', icon: '⊘' },
                { num: '04', title: 'DELIVER', desc: 'Receiver confirms delivery — record sealed', icon: '⊛' },
              ].map((step, i) => (
                <div key={i} className="step-card visible glitch-hover" style={{ flex: '1 1 200px', transitionDelay: `${i * 0.1}s`, cursor: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span className="step-num font-mono" style={{ fontSize: '2rem', color: 'var(--steel)' }}>{step.num}</span>
                    <span style={{ fontSize: '24px', opacity: 0.15 }}>{step.icon}</span>
                  </div>
                  <div className="step-title font-display" style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--ink)', marginBottom: '8px' }}>{step.title}</div>
                  <div className="step-desc" style={{ fontSize: '0.85rem', color: 'var(--steel)', lineHeight: 1.4 }}>{step.desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Bottom CTA */}
          <section style={{ textAlign: 'center', padding: '80px 0 120px', borderTop: '3px solid var(--ink)' }}>
            <h2 className="display-lg" style={{ marginBottom: '16px' }}>READY TO TRACK?</h2>
            <p className="font-mono text-steel" style={{ marginBottom: '32px' }}>Immutable. Verifiable. Permanent.</p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/dashboard" className="cta-btn">VIEW DASHBOARD</Link>
              <Link to="/verify" className="cta-btn cta-outline">VERIFY RECORD</Link>
            </div>
          </section>

        </div>
      </div>
    </>
  );
};

export default Landing;
