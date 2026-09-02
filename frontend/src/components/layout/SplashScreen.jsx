import React, { useState, useEffect } from 'react';

const SplashScreen = ({ onComplete }) => {
  const [phase, setPhase] = useState(0); // 0=logo, 1=line, 2=fade out

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600);   // line expands
    const t2 = setTimeout(() => setPhase(2), 1400);   // start fade out
    const t3 = setTimeout(() => {
      if (onComplete) onComplete();
    }, 1900); // done

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--paper, #F2F0EA)',
      opacity: phase === 2 ? 0 : 1,
      transition: 'opacity 0.5s ease-out',
    }}>
      {/* Logo */}
      <div style={{
        fontFamily: "'Archivo Black', sans-serif",
        fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
        color: 'var(--ink, #0A0A0A)',
        letterSpacing: '-0.03em',
        textTransform: 'uppercase',
        opacity: phase >= 0 ? 1 : 0,
        transform: phase >= 0 ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
      }}>
        SHIP.EAZY
      </div>

      {/* Expanding line */}
      <div style={{
        height: '3px',
        backgroundColor: 'var(--ink, #0A0A0A)',
        marginTop: '16px',
        width: phase >= 1 ? '200px' : '0px',
        transition: 'width 0.4s ease-out',
      }} />

      {/* Tagline */}
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '0.75rem',
        color: 'var(--steel, #4A4E52)',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        marginTop: '14px',
        opacity: phase >= 1 ? 1 : 0,
        transition: 'opacity 0.3s ease-out 0.1s',
      }}>
        CUSTODY PROTOCOL
      </div>
    </div>
  );
};

export default SplashScreen;
