import React, { useState, useRef, useEffect } from 'react';
import { useWallet } from '../../context/WalletContext';
import { truncateAddress } from '../../utils/format';

const ConnectWallet = () => {
  const { 
    account, 
    isConnected, 
    walletType, 
    isCorrectChain, 
    networkName, 
    connectMetaMask, 
    connectAs, 
    disconnectWallet, 
    switchToCorrectChain, 
    selectedAccount, 
    testAccounts, 
    error,
    isMetaMaskAvailable 
  } = useWallet();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [connectingMetaMask, setConnectingMetaMask] = useState(false);
  const [localError, setLocalError] = useState('');
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

  const handleMetaMaskConnect = async () => {
    setLocalError('');
    setConnectingMetaMask(true);
    try {
      await connectMetaMask();
      setDropdownOpen(false);
    } catch (err) {
      setLocalError(err.message || 'MetaMask connection rejected');
    } finally {
      setConnectingMetaMask(false);
    }
  };

  const handleCopyAddress = (addr) => {
    navigator.clipboard?.writeText(addr);
    alert(`Copied address: ${addr}`);
  };

  // DISCONNECTED STATE
  if (!isConnected) {
    return (
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }} ref={dropdownRef}>
        {/* Direct MetaMask Connect Button */}
        <button
          onClick={handleMetaMaskConnect}
          disabled={connectingMetaMask}
          className="btn"
          style={{
            background: '#ff6f00',
            color: '#ffffff',
            border: '2px solid var(--ink)',
            boxShadow: '2px 2px 0px var(--ink)',
            padding: '8px 14px',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 'bold',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            cursor: connectingMetaMask ? 'wait' : 'pointer'
          }}
          title={isMetaMaskAvailable ? "Connect with MetaMask browser extension" : "MetaMask extension not detected"}
        >
          <span style={{ fontSize: '14px' }}>🦊</span>
          <span>{connectingMetaMask ? 'CONNECTING...' : 'METAMASK'}</span>
        </button>

        {/* Dev Account Selector Dropdown Toggle */}
        <button 
          onClick={() => setDropdownOpen(!dropdownOpen)} 
          className="btn btn-primary"
          style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <span>TEST ACCOUNTS</span>
          <span style={{ fontSize: '10px' }}>▾</span>
        </button>

        {/* Dropdown Menu for Connecting */}
        {dropdownOpen && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            background: 'var(--paper)',
            border: '2px solid var(--ink)',
            boxShadow: '4px 4px 0px var(--ink)',
            zIndex: 1000,
            width: '320px',
            maxHeight: '440px',
            overflowY: 'auto'
          }}>
            {/* Header */}
            <div style={{ padding: '10px 12px', background: 'var(--ink)', color: 'white', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', letterSpacing: '1px' }}>
              CONNECT WALLET OR IDENTITY
            </div>

            {/* MetaMask Option Inside Dropdown */}
            <div style={{ padding: '10px 12px', borderBottom: '2px solid var(--ink)', background: 'rgba(255, 111, 0, 0.08)' }}>
              <button
                onClick={handleMetaMaskConnect}
                disabled={connectingMetaMask}
                style={{
                  width: '100%',
                  background: '#ff6f00',
                  color: 'white',
                  border: '2px solid var(--ink)',
                  padding: '10px',
                  fontWeight: 'bold',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>🦊</span>
                <span>{connectingMetaMask ? 'REQUESTING METAMASK...' : 'CONNECT METAMASK EXTENSION'}</span>
              </button>
              {!isMetaMaskAvailable && (
                <div style={{ fontSize: '10px', color: 'var(--seal-red)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                  ⚠ Extension not detected. Install from metamask.io or use test accounts below.
                </div>
              )}
            </div>

            {/* Separator */}
            <div style={{ padding: '6px 12px', background: '#eaeaea', color: 'var(--steel)', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
              LOCAL TEST IDENTITIES (PRE-FUNDED)
            </div>

            {/* Test Accounts */}
            {testAccounts.map((acc) => (
              <div 
                key={acc.address}
                onClick={() => { connectAs(acc); setDropdownOpen(false); }}
                style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid #ddd',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
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
                <div style={{ fontSize: '10px', color: 'var(--steel)' }}>{truncateAddress(acc.address)}</div>
              </div>
            ))}
          </div>
        )}

        {(localError || error) && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            background: 'var(--paper)',
            border: '2px solid var(--seal-red)',
            color: 'var(--seal-red)',
            padding: '8px 12px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            zIndex: 1001,
            boxShadow: '3px 3px 0px var(--seal-red)',
            maxWidth: '300px'
          }}>
            {localError || error}
            <div style={{ marginTop: '4px', textAlign: 'right' }}>
              <button 
                onClick={() => setLocalError('')} 
                style={{ background: 'none', border: 'none', color: 'var(--seal-red)', cursor: 'pointer', fontWeight: 'bold', fontSize: '10px' }}
              >
                DISMISS
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // CONNECTED STATE
  const isMetaMask = walletType === 'metamask';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }} ref={dropdownRef}>
      {/* Wrong Network Warning Pill */}
      {isMetaMask && !isCorrectChain && (
        <button
          onClick={switchToCorrectChain}
          title="Click to switch to correct network"
          style={{
            background: 'var(--seal-red)',
            color: 'white',
            border: '2px solid var(--ink)',
            boxShadow: '2px 2px 0px var(--ink)',
            padding: '6px 10px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <span>⚠️</span>
          <span>SWITCH NET</span>
        </button>
      )}

      {/* Account Info Pill with Dropdown Trigger */}
      <button 
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="btn"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          border: '2px solid var(--ink)',
          background: 'var(--paper)',
          cursor: 'pointer'
        }}
      >
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isMetaMask ? '13px' : '10px'
        }}>
          {isMetaMask ? '🦊' : '⚡'}
        </span>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="font-mono text-xs font-bold" style={{ color: 'var(--ink)', lineHeight: '1.1' }}>
              {isMetaMask 
                ? 'METAMASK' 
                : (selectedAccount?.label || `ACC #${selectedAccount?.index}`)}
            </span>
            <span style={{
              display: 'inline-block',
              width: '6px',
              height: '6px',
              background: !isCorrectChain ? 'var(--seal-red)' : 'var(--verified-green)',
              borderRadius: '50%'
            }} />
          </div>
          <span className="chain-address font-mono" style={{ fontSize: '11px', color: 'var(--steel)' }}>
            {truncateAddress(account)}
          </span>
        </div>

        <span style={{ fontSize: '10px', marginLeft: '2px' }}>▾</span>
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

      {/* Dropdown Menu for Connected State */}
      {dropdownOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          background: 'var(--paper)',
          border: '2px solid var(--ink)',
          boxShadow: '4px 4px 0px var(--ink)',
          zIndex: 1000,
          width: '320px',
          maxHeight: '440px',
          overflowY: 'auto'
        }}>
          {/* Header */}
          <div style={{
            padding: '8px 12px',
            background: 'var(--ink)',
            color: 'white',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 'bold',
            letterSpacing: '1px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>ACTIVE IDENTITY</span>
            <span style={{ color: '#aaa', fontSize: '10px' }}>{networkName}</span>
          </div>

          {/* Active Account Details */}
          <div style={{ padding: '12px', background: 'rgba(0,0,0,0.03)', borderBottom: '2px solid var(--ink)' }}>
            <div style={{ fontSize: '10px', color: 'var(--steel)', fontFamily: 'var(--font-mono)' }}>CURRENT WALLET:</div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', wordBreak: 'break-all', marginTop: '2px' }}>
              {account}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                onClick={() => handleCopyAddress(account)}
                style={{
                  background: 'none',
                  border: '1px solid var(--ink)',
                  padding: '3px 8px',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                COPY ADDRESS
              </button>
              {isMetaMask && !isCorrectChain && (
                <button
                  onClick={switchToCorrectChain}
                  style={{
                    background: 'var(--seal-red)',
                    color: 'white',
                    border: '1px solid var(--ink)',
                    padding: '3px 8px',
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  SWITCH NETWORK
                </button>
              )}
            </div>
          </div>

          {/* Switch to MetaMask if currently on dev */}
          {!isMetaMask && (
            <div style={{ padding: '8px 12px', borderBottom: '1px solid #ddd', background: 'rgba(255, 111, 0, 0.06)' }}>
              <button
                onClick={handleMetaMaskConnect}
                disabled={connectingMetaMask}
                style={{
                  width: '100%',
                  background: '#ff6f00',
                  color: 'white',
                  border: '1px solid var(--ink)',
                  padding: '6px',
                  fontWeight: 'bold',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>🦊</span>
                <span>SWITCH TO METAMASK</span>
              </button>
            </div>
          )}

          {/* Switch to Dev Account Option */}
          <div style={{ padding: '6px 12px', background: '#f0f0f0', color: 'var(--steel)', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
            SWITCH TO LOCAL TEST IDENTITY:
          </div>

          {testAccounts.map((acc) => {
            const isCurrent = acc.address.toLowerCase() === account?.toLowerCase();
            return (
              <div 
                key={acc.address}
                onClick={() => { connectAs(acc); setDropdownOpen(false); }}
                style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
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
                  <span style={{ fontSize: '10px', color: 'var(--steel)' }}>#{acc.index}</span>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--steel)' }}>{truncateAddress(acc.address)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ConnectWallet;
