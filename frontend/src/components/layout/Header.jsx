import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import ConnectWallet from '../wallet/ConnectWallet';

const Header = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header style={{
      background: 'var(--paper)',
      borderBottom: '3px solid var(--ink)',
      padding: '16px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'var(--ink)' }}>
          <span className="display-md uppercase" style={{ margin: 0, letterSpacing: '-0.02em' }}>
            SHIP.EAZY
          </span>
        </Link>
        
        <nav style={{ display: 'flex', gap: '24px' }}>
          <Link 
            to="/dashboard" 
            style={{ 
              textDecoration: 'none', 
              color: 'var(--ink)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 'bold',
              fontSize: '14px',
              borderBottom: isActive('/dashboard') ? '3px solid var(--ink)' : '3px solid transparent',
              paddingBottom: '4px'
            }}
          >
            DASHBOARD
          </Link>
          <Link 
            to="/create" 
            style={{ 
              textDecoration: 'none', 
              color: 'var(--ink)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 'bold',
              fontSize: '14px',
              borderBottom: isActive('/create') ? '3px solid var(--ink)' : '3px solid transparent',
              paddingBottom: '4px'
            }}
          >
            NEW TRANSFER
          </Link>
          <Link 
            to="/verify" 
            style={{ 
              textDecoration: 'none', 
              color: 'var(--ink)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 'bold',
              fontSize: '14px',
              borderBottom: isActive('/verify') ? '3px solid var(--ink)' : '3px solid transparent',
              paddingBottom: '4px'
            }}
          >
            VERIFY
          </Link>
        </nav>
      </div>

      <div>
        <ConnectWallet />
      </div>
    </header>
  );
};

export default Header;
