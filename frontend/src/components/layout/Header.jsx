import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import ConnectWallet from '../wallet/ConnectWallet';

const Header = () => {
  const location = useLocation();

  return (
    <header className="flex-between" style={{
      backgroundColor: 'var(--bg-surface, #0a0a0b)',
      borderBottom: '1px solid var(--border-subtle, #333)',
      height: '64px',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div className="logo">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <span style={{ color: 'var(--text-primary, #fff)', fontWeight: 700, fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)' }}>Ship</span>
          <span style={{ color: 'var(--accent-green, #00d474)', fontWeight: 700, fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)' }}>.Eazy</span>
        </Link>
      </div>
      <nav style={{ display: 'flex', gap: '24px' }}>
        <Link 
          to="/" 
          style={{ 
            color: location.pathname === '/' ? 'var(--accent-green, #00d474)' : 'var(--text-primary, #fff)', 
            textDecoration: 'none',
            fontWeight: 500
          }}
        >
          Dashboard
        </Link>
        <Link 
          to="/create" 
          style={{ 
            color: location.pathname === '/create' ? 'var(--accent-green, #00d474)' : 'var(--text-primary, #fff)', 
            textDecoration: 'none',
            fontWeight: 500
          }}
        >
          Create Shipment
        </Link>
      </nav>
      <div>
        <ConnectWallet />
      </div>
    </header>
  );
};

export default Header;
