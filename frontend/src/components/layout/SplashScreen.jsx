import React, { useState, useEffect } from 'react';

const SplashScreen = ({ onComplete }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onComplete) onComplete();
    }, 3000); // 3 seconds total for animations

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div className="splash-container">
      <style>{`
        .splash-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: #0A0A0A;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeOut 0.5s ease-out 2.5s forwards;
        }

        .splash-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 600px;
          padding: 0 24px;
        }

        .typewriter {
          font-family: 'JetBrains Mono', monospace;
          color: #00FF41;
          font-size: clamp(2rem, 5vw, 4rem);
          font-weight: 700;
          letter-spacing: 0.1em;
          margin: 0;
          overflow: hidden;
          white-space: nowrap;
          border-right: 4px solid #00FF41;
          animation: typing 1s steps(9, end) forwards, cursorBlink 0.75s step-end infinite;
          width: 0;
          text-shadow: 0 0 10px rgba(0, 255, 65, 0.5);
        }

        .scan-line {
          height: 2px;
          background: #00FF41;
          margin: 24px 0;
          box-shadow: 0 0 8px #00FF41;
          animation: expandScan 0.5s ease-out 1s forwards;
          width: 0;
          opacity: 0;
        }

        .init-text {
          font-family: 'JetBrains Mono', monospace;
          color: #00FF41;
          font-size: 0.875rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          opacity: 0;
          animation: appearAndBlink 1s step-end 1.5s forwards;
        }

        @keyframes typing {
          from { width: 0; }
          to { width: 100%; }
        }

        @keyframes cursorBlink {
          from, to { border-color: transparent; }
          50% { border-color: #00FF41; }
        }

        @keyframes expandScan {
          from { width: 0; opacity: 1; }
          to { width: 100%; opacity: 1; }
        }

        @keyframes appearAndBlink {
          0% { opacity: 0; }
          10%, 30%, 50%, 70%, 90% { opacity: 1; }
          20%, 40%, 60%, 80%, 100% { opacity: 0.3; }
        }

        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; visibility: hidden; }
        }
      `}</style>

      <div className="splash-content">
        <h1 className="typewriter">SHIP.EAZY</h1>
        <div className="scan-line"></div>
        <div className="init-text">INITIALIZING CUSTODY PROTOCOL...</div>
      </div>
    </div>
  );
};

export default SplashScreen;
