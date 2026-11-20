import React, { useState, useRef, useEffect } from 'react';
import { useWallet } from '../../context/WalletContext';
import { truncateAddress } from '../../utils/format';

const ConnectWallet = () => {
  const { account, isConnected, connectAs, disconnectWallet, selectedAccount, testAccounts, networkName } = useWallet();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isConnected) {
    return (
      <div style={{ position: 'relative' }} ref={dropdownRef}>
        <button 
          onClick={() => setDropdownOpen(!dropdownOpen)} 
          className="btn btn-primary"
          style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 'bold' }}
        >
          CONNECT IDENTITY ▾
        </button>

        {dropdownOpen && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            background: 'var(--paper)',
            border: '2px solid var(--ink)',
            boxShadow: '4px 4px 0px var(--ink)',
            zIndex: 1000,
            width: '280px',
            maxHeight: '380px',
            overflowY: 'auto'
          }}>
            <div style={{ padding: '8px 12px', background: 'var(--ink)', color: 'white', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', letterSpacing: '1px' }}>
              SELECT TEST ACCOUNT
            </div>
            {testAccounts.map((acc) => (
              <div 
                key={acc.address}
                onClick={() => { connectAs(acc); setDropdownOpen(false); }}
                style={{
                  padding: '10px 12px',
                  borderBottom: '1px solid #ddd',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  transition: 'background 0.1s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{acc.label}</span>
                  <span style={{ fontSize: '10px', color: 'var(--steel)' }}>#{acc.index}</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--steel)' }}>{truncateAddress(acc.address)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }} ref={dropdownRef}>
      {/* Account Info Pill with Dropdown Trigger */}
      <button 
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="btn"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '6px 12px',
          border: '2px solid var(--ink)',
          background: 'var(--paper)',
          cursor: 'pointer'
        }}
      >
        <span style={{
          display: 'inline-block',
          width: '8px',
          height: '8px',
          background: 'var(--verified-green)',
          borderRadius: '50%'
        }}></span>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
          <span className="font-mono text-xs font-bold" style={{ color: 'var(--ink)', lineHeight: '1.1' }}>
            {selectedAccount?.label || `ACC #${selectedAccount?.index}`}
          </span>
          <span className="chain-address font-mono" style={{ fontSize: '11px', color: 'var(--steel)' }}>
            {truncateAddress(account)}
          </span>
        </div>

        <span style={{ fontSize: '10px', marginLeft: '4px' }}>▾</span>
      </button>

      {/* Disconnect Button */}
      <button 
        onClick={disconnectWallet}
        title="Disconnect identity"
        style={{
          background: 'none',
          border: '2px solid var(--seal-red)',
          color: 'var(--seal-red)',
          padding: '6px 10px',
          fontSize: '12px',
          fontFamily: 'var(--font-mono)',
          cursor: 'pointer',
          fontWeight: 'bold',
          lineHeight: '1'
        }}
      >
        ✕
      </button>

      {/* Account Switcher Dropdown Menu */}
      {dropdownOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          background: 'var(--paper)',
          border: '2px solid var(--ink)',
          boxShadow: '4px 4px 0px var(--ink)',
          zIndex: 1000,
          width: '300px',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          <div style={{
            padding: '8px 12px',
            background: 'var(--ink)',
            color: 'white',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 'bold',
            letterSpacing: '1px',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span>SWITCH IDENTITY</span>
            <span style={{ color: '#aaa' }}>{networkName}</span>
          </div>

          {testAccounts.map((acc) => {
            const isCurrent = acc.address.toLowerCase() === account?.toLowerCase();
            return (
              <div 
                key={acc.address}
                onClick={() => { connectAs(acc); setDropdownOpen(false); }}
                style={{
                  padding: '10px 12px',
                  borderBottom: '1px solid #e5e5e5',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  background: isCurrent ? 'rgba(0,0,0,0.08)' : 'transparent',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  transition: 'background 0.1s'
                }}
                onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; }}
                onMouseLeave={(e) => { if (!isCurrent) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: isCurrent ? 'var(--verified-green)' : 'var(--ink)' }}>
                    {isCurrent ? '● ' : ''}{acc.label}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--steel)' }}>INDEX #{acc.index}</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--steel)' }}>{acc.address}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ConnectWallet;
