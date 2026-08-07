import React from 'react';
import { useWallet } from '../../context/WalletContext';

const ConnectWallet = () => {
  const { address, isConnected, connect, disconnect, isCorrectNetwork, isMetaMaskInstalled, networkName } = useWallet();

  if (!isMetaMaskInstalled) {
    return (
      <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ textDecoration: 'none' }}>
        Install MetaMask
      </a>
    );
  }

  if (isConnected && !isCorrectNetwork) {
    return (
      <div style={{ color: '#f59e0b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ width: '8px', height: '8px', backgroundColor: '#f59e0b', display: 'inline-block' }}></span>
        Wrong Network ({networkName || 'Polygon'})
      </div>
    );
  }

  if (isConnected) {
    return (
      <div 
        onClick={disconnect}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          cursor: 'pointer',
          padding: '8px 16px',
          border: '1px solid var(--border-subtle, #333)',
          backgroundColor: 'var(--bg-surface, #0a0a0b)'
        }}
      >
        <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--accent-green, #00d474)', borderRadius: '50%' }}></span>
        <span className="chain-address">{address.substring(0, 6)}...{address.substring(address.length - 4)}</span>
      </div>
    );
  }

  return (
    <button onClick={connect} className="btn btn-primary">
      Connect Wallet
    </button>
  );
};

export default ConnectWallet;
