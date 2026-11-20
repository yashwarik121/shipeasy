import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ConnectWallet from '../wallet/ConnectWallet';
import { useTheme } from '../../context/ThemeContext';
import { API_BASE_URL } from '../../utils/api';

const Header = () => {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const [tamperAlert, setTamperAlert] = useState(false);

  const isActive = (path) => location.pathname === path;

  // Poll audit status for live navbar indicator
  useEffect(() => {
    const checkAudit = () => {
      fetch(`${API_BASE_URL}/api/tamper/audit`)
        .then(res => res.json())
        .then(data => {
          if (data && data.tamperDetected !== undefined) {
            setTamperAlert(data.tamperDetected);
          }
        })
        .catch(() => {});
    };
    checkAudit();
    const interval = setInterval(checkAudit, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      background: 'var(--paper)',
      borderBottom: '3px solid var(--ink)',
      padding: '16px 24px',
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center'
    }}>
      {/* LEFT: Navigation Links */}
      <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
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
        <Link 
          to="/tamper-lab" 
          style={{ 
            textDecoration: 'none', 
            color: tamperAlert ? 'var(--seal-red)' : 'var(--stamp-blue)',
            fontFamily: 'var(--font-mono)',
            fontWeight: 'bold',
            fontSize: '14px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            borderBottom: isActive('/tamper-lab') ? `3px solid ${tamperAlert ? 'var(--seal-red)' : 'var(--stamp-blue)'}` : '3px solid transparent',
            paddingBottom: '4px'
          }}
        >
          <span>{tamperAlert ? '🚨' : '🧪'} TAMPER LAB</span>
          {tamperAlert && (
            <span style={{
              background: 'var(--seal-red)',
              color: '#fff',
              fontSize: '10px',
              padding: '2px 6px',
              lineHeight: 1
            }}>
              ALERT
            </span>
          )}
        </Link>
      </nav>

      {/* MIDDLE: SHIP.EAZY Logo */}
      <div style={{ textAlign: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'var(--ink)' }}>
          <span className="display-md uppercase" style={{ margin: 0, letterSpacing: '-0.02em', fontSize: '1.4rem' }}>
            SHIP.EAZY
          </span>
        </Link>
      </div>

      {/* RIGHT: Theme Toggle & Connect Wallet */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', justifyContent: 'flex-end' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--ink)' }}>☀</span>
          <button 
            className={`theme-toggle ${isDark ? 'dark' : ''}`}
            onClick={toggleTheme}
            aria-label="Toggle theme"
          />
          <span style={{ fontSize: '12px', color: 'var(--ink)' }}>☽</span>
        </div>
        <ConnectWallet />
      </div>
    </header>
  );
};

export default Header;
