import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';

const CRYPTO_SYMBOLS = ['₿', '⛓', '◈', '⬡', '⬢', '△', '⏣', '◉'];
const FLOAT_COUNT = 18;

const Landing = () => {
  const [shipments, setShipments] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 }); // normalized 0-1
  const [particles, setParticles] = useState([]);
  const heroRef = useRef(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/shipments')
      .then(r => r.json())
      .then(d => { setShipments(Array.isArray(d) ? d : []); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 150);
    return () => clearTimeout(t);
  }, []);

  // Scroll tracking for parallax
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Mouse tracking for 3D tilt + particles
  useEffect(() => {
    let frameId;
    const onMove = (e) => {
      setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
      setParticles(prev => [
        ...prev.slice(-20),
        { x: e.clientX, y: e.clientY, id: Date.now() + Math.random() }
      ]);
    };
    const throttled = (e) => {
      if (frameId) return;
      frameId = requestAnimationFrame(() => { onMove(e); frameId = null; });
    };
    window.addEventListener('mousemove', throttled);
    return () => { window.removeEventListener('mousemove', throttled); cancelAnimationFrame(frameId); };
  }, []);

  // 3D tilt values
  const tiltX = (mousePos.y - 0.5) * -8;
  const tiltY = (mousePos.x - 0.5) * 8;

  const floaters = useRef(
    Array.from({ length: FLOAT_COUNT }, (_, i) => ({
      id: i, symbol: CRYPTO_SYMBOLS[i % CRYPTO_SYMBOLS.length],
      left: Math.random() * 100, delay: Math.random() * 10,
      duration: 14 + Math.random() * 18, size: 14 + Math.random() * 24,
      opacity: 0.03 + Math.random() * 0.06,
    }))
  ).current;

  return (
    <>
      <style>{`
        .landing-root { position: relative; min-height: 100vh; overflow: hidden; cursor: crosshair; }

        .grid-bg {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image: linear-gradient(rgba(10,10,10,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(10,10,10,0.035) 1px, transparent 1px);
          background-size: 60px 60px;
        }
        [data-theme='dark'] .grid-bg {
          background-image: linear-gradient(rgba(232,230,225,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(232,230,225,0.04) 1px, transparent 1px);
        }

        .floater {
          position: fixed; font-family: var(--font-mono); color: var(--ink);
          z-index: 0; pointer-events: none; animation: floatUp linear infinite;
        }
        @keyframes floatUp {
          0% { transform: translateY(110vh) rotate(0deg); }
          100% { transform: translateY(-10vh) rotate(360deg); }
        }

        /* Particle trail only */
        .particle {
          position: fixed; width: 3px; height: 3px; background: var(--ink);
          pointer-events: none; z-index: 9998;
          animation: particleDie 0.8s ease-out forwards;
        }
        @keyframes particleDie {
          0% { opacity: 0.5; transform: scale(1); }
          100% { opacity: 0; transform: scale(0); }
        }

        /* 3D Hero */
        .hero-3d {
          perspective: 1200px;
          min-height: 90vh;
          display: flex; align-items: center;
        }
        .hero-inner {
          transition: transform 0.3s ease-out;
          transform-style: preserve-3d;
          width: 100%;
        }
        .hero-title {
          font-family: var(--font-display);
          font-size: clamp(3.5rem, 9vw, 8rem);
          color: var(--ink); line-height: 0.92;
          letter-spacing: -0.05em; text-transform: uppercase;
          transform: translateZ(40px) translateY(60px); opacity: 0;
          transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hero-title.visible { transform: translateZ(40px) translateY(0); opacity: 1; }

        .hero-accent {
          color: var(--seal-red); display: inline-block;
          transition: transform 0.3s ease-out;
        }
        .hero-accent:hover { transform: scale(1.05) skewX(-3deg); }

        .hero-sub {
          font-family: var(--font-body); font-size: clamp(1rem, 2vw, 1.25rem);
          color: var(--steel); line-height: 1.6; max-width: 500px;
          transform: translateZ(20px) translateY(40px); opacity: 0;
          transition: all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.15s;
        }
        .hero-sub.visible { transform: translateZ(20px) translateY(0); opacity: 1; }

        /* Parallax images */
        .parallax-img {
          position: absolute; pointer-events: none; z-index: 0;
          transition: transform 0.1s linear;
        }
        .parallax-img img {
          display: block; width: 100%; height: 100%; object-fit: cover;
          filter: grayscale(30%); opacity: 0.12;
        }

        /* Stat cards */
        .stat-card {
          border: 3px solid var(--ink); padding: 28px; position: relative;
          overflow: hidden; backdrop-filter: blur(2px);
          transform: translateY(30px); opacity: 0;
          transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .stat-card.vis { transform: translateY(0); opacity: 1; }
        .stat-card::after {
          content: ''; position: absolute; bottom: 0; left: 0;
          width: 100%; height: 4px; background: var(--seal-red);
          transform: scaleX(0); transform-origin: left;
          transition: transform 0.8s ease-out 0.4s;
        }
        .stat-card.vis::after { transform: scaleX(1); }

        /* Step cards */
        .step-card {
          border: 2px solid var(--ink); padding: 28px; position: relative;
          overflow: hidden; cursor: crosshair;
          transition: all 0.3s ease-out;
        }
        .step-card::before {
          content: ''; position: absolute; inset: 0;
          background: var(--ink); transform: translateY(100%);
          transition: transform 0.3s ease-out; z-index: 0;
        }
        .step-card:hover::before { transform: translateY(0); }
        .step-card > * { position: relative; z-index: 1; }
        .step-card:hover * { color: var(--paper) !important; }

        /* CTA */
        .cta-btn {
          display: inline-block; padding: 18px 36px;
          border: 3px solid var(--ink); background: var(--ink); color: var(--paper);
          font-family: var(--font-mono); font-size: 1rem; font-weight: bold;
          text-decoration: none; text-transform: uppercase; letter-spacing: 0.05em;
          position: relative; overflow: hidden; transition: all 0.2s ease-out;
        }
        .cta-btn::after { content: ' →'; transition: letter-spacing 0.2s; }
        .cta-btn:hover { background: transparent; color: var(--ink); letter-spacing: 0.15em; }
        .cta-outline { background: transparent; color: var(--ink); }
        .cta-outline:hover { background: var(--ink); color: var(--paper); }

        /* Divider */
        .red-line {
          height: 4px; background: var(--seal-red);
          transform: scaleX(0); transform-origin: left;
          transition: transform 1.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .red-line.vis { transform: scaleX(1); }

        /* Image section */
        .deco-img-container {
          position: relative; overflow: hidden; border: 3px solid var(--ink);
        }
        .deco-img-container img {
          display: block; width: 100%; transition: transform 0.4s ease-out;
        }
        .deco-img-container:hover img { transform: scale(1.03); }
        .deco-img-overlay {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 16px; background: linear-gradient(transparent, rgba(10,10,10,0.8));
        }

        /* Block chain visual */
        .chain-row { display: flex; align-items: center; gap: 6px; }
        .chain-block {
          width: 44px; height: 44px; border: 2px solid var(--ink);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-mono); font-size: 9px; font-weight: bold;
          animation: chainPulse 4s ease-in-out infinite;
        }
        .chain-block:nth-child(2n) { animation-delay: 0.5s; }
        .chain-link { width: 16px; height: 2px; background: var(--ink); }
        @keyframes chainPulse {
          0%,100% { box-shadow: none; }
          50% { box-shadow: 3px 3px 0 var(--seal-red); }
        }

        /* Scroll reveal */
        .reveal {
          transform: translateY(40px); opacity: 0;
          transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal.vis { transform: translateY(0); opacity: 1; }
      `}</style>

      <div className="landing-root">
        <div className="grid-bg" />

        {/* Floating symbols */}
        {floaters.map(f => (
          <div key={f.id} className="floater" style={{
            left: `${f.left}%`, fontSize: `${f.size}px`, opacity: f.opacity,
            animationDuration: `${f.duration}s`, animationDelay: `${f.delay}s`,
          }}>{f.symbol}</div>
        ))}

        {/* Particle trail */}
        {particles.map(p => (
          <div key={p.id} className="particle" style={{ left: p.x - 1.5, top: p.y - 1.5 }} />
        ))}

        {/* Parallax images */}
        <div className="parallax-img" style={{
          right: '-5%', top: '10%', width: '400px', height: '400px',
          transform: `translateY(${scrollY * -0.15}px) rotate(${scrollY * 0.01}deg)`
        }}>
          <img src="/images/crypto-block.jpg" alt="" />
        </div>
        <div className="parallax-img" style={{
          left: '-8%', top: '55%', width: '500px', height: '340px',
          transform: `translateY(${scrollY * -0.08}px)`
        }}>
          <img src="/images/chain-network.jpg" alt="" />
        </div>

        {/* CONTENT */}
        <div style={{ position: 'relative', zIndex: 1, padding: '0 24px', maxWidth: '1200px', margin: '0 auto' }}>

          {/* ═══ HERO ═══ */}
          <section className="hero-3d" ref={heroRef}>
            <div className="hero-inner" style={{
              transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`
            }}>
              <div className="chain-row" style={{
                marginBottom: '24px', opacity: heroVisible ? 1 : 0,
                transition: 'opacity 0.6s ease 0.3s'
              }}>
                {[0,1,2,3,4].map((n, i) => (
                  <React.Fragment key={n}>
                    <div className="chain-block">BLK<br/>{n}</div>
                    {i < 4 && <div className="chain-link" />}
                  </React.Fragment>
                ))}
              </div>

              <h1 className={`hero-title ${heroVisible ? 'visible' : ''}`}>
                SHIPMENT<br/>
                <span className="hero-accent">RECORDS</span><br/>
                ON-CHAIN
              </h1>

              <div className="red-line vis" style={{ width: '180px', margin: '20px 0' }} />

              <p className={`hero-sub ${heroVisible ? 'visible' : ''}`}>
                Every custody handoff — hashed, timestamped, permanently recorded.
                No party can alter the record after confirmation.
              </p>

              <div style={{
                display: 'flex', gap: '16px', marginTop: '28px', flexWrap: 'wrap',
                opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.35s'
              }}>
                <Link to="/dashboard" className="cta-btn">ENTER DASHBOARD</Link>
                <Link to="/create" className="cta-btn cta-outline">NEW TRANSFER</Link>
              </div>
            </div>
          </section>

          {/* ═══ STATS ═══ */}
          <section style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '100px' }}>
            {[
              { label: 'SHIPMENTS', value: loaded ? shipments.length : '—', icon: '◈' },
              { label: 'CHAIN', value: 'HARDHAT', icon: '⛓' },
              { label: 'PROTOCOL', value: 'CUSTODY v1', icon: '⬡' },
              { label: 'STATUS', value: '● LIVE', color: 'var(--verified-green)', icon: '◉' }
            ].map((s, i) => (
              <div key={i} className="stat-card vis" style={{ flex: '1 1 200px', transitionDelay: `${i * 0.1}s` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span className="font-mono text-xs text-steel">{s.label}</span>
                  <span style={{ fontSize: '18px', opacity: 0.15 }}>{s.icon}</span>
                </div>
                <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: s.color || 'var(--ink)' }}>
                  {s.value}
                </div>
              </div>
            ))}
          </section>

          {/* ═══ IMAGE BREAK ═══ */}
          <section style={{ display: 'flex', gap: '20px', marginBottom: '100px', flexWrap: 'wrap' }}>
            <div className="deco-img-container" style={{ flex: '2 1 400px', maxHeight: '300px' }}>
              <img src="/images/chain-network.jpg" alt="Network visualization" style={{ height: '300px' }} />
              <div className="deco-img-overlay">
                <span className="font-mono text-xs" style={{ color: '#fff', letterSpacing: '0.1em' }}>
                  DISTRIBUTED CUSTODY NETWORK
                </span>
              </div>
            </div>
            <div className="deco-img-container" style={{ flex: '1 1 250px', maxHeight: '300px' }}>
              <img src="/images/crypto-block.jpg" alt="Block structure" style={{ height: '300px' }} />
              <div className="deco-img-overlay">
                <span className="font-mono text-xs" style={{ color: '#fff', letterSpacing: '0.1em' }}>
                  BLOCK STRUCTURE
                </span>
              </div>
            </div>
          </section>

          {/* ═══ HOW IT WORKS ═══ */}
          <section style={{ marginBottom: '100px' }}>
            <h2 className="display-lg" style={{ marginBottom: '12px' }}>HOW IT WORKS</h2>
            <div className="red-line vis" style={{ width: '120px', marginBottom: '32px' }} />
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {[
                { num: '01', title: 'CREATE', desc: 'Sender initiates a custody record on the blockchain' },
                { num: '02', title: 'PICK UP', desc: 'Carrier confirms physical possession on-chain' },
                { num: '03', title: 'TRANSIT', desc: 'Transit confirmation is permanently logged' },
                { num: '04', title: 'DELIVER', desc: 'Receiver confirms — record sealed forever' },
              ].map((step, i) => (
                <div key={i} className="step-card" style={{ flex: '1 1 200px' }}>
                  <div className="font-mono" style={{ fontSize: '2.2rem', color: 'var(--steel)', marginBottom: '8px' }}>{step.num}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--ink)', marginBottom: '8px' }}>{step.title}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--steel)', lineHeight: 1.5 }}>{step.desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ═══ BOTTOM CTA ═══ */}
          <section style={{ textAlign: 'center', padding: '80px 0 120px', borderTop: '3px solid var(--ink)' }}>
            <h2 className="display-lg" style={{ marginBottom: '16px' }}>READY TO TRACK?</h2>
            <p className="font-mono text-steel" style={{ marginBottom: '32px', letterSpacing: '0.1em' }}>
              IMMUTABLE · VERIFIABLE · PERMANENT
            </p>
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
