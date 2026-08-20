import React from 'react';
import { useWallet } from '../../context/WalletContext';

const ConnectWallet = () => {
  const { account, isConnected, isCorrectChain, connectWallet, disconnectWallet, switchToCorrectChain, networkName } = useWallet();

  const handleCopy = () => {
    if (account) {
      navigator.clipboard.writeText(account);
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  if (!window.ethereum) {
    return (
      <a 
        href="https://metamask.io" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-sm font-mono text-ink"
        style={{ textDecoration: 'underline' }}
      >
        INSTALL METAMASK
      </a>
    );
  }

  if (!isConnected) {
    return (
      <button onClick={connectWallet} className="btn-connect">
        CONNECT WALLET
      </button>
    );
  }

  if (!isCorrectChain) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span className="text-red font-mono font-bold seal-red">WRONG NETWORK</span>
        <button onClick={switchToCorrectChain} className="btn btn-danger" style={{ padding: '8px 16px', fontSize: '12px' }}>
          SWITCH NETWORK
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
      <span 
        className="chain-address copy-trigger" 
        onClick={handleCopy}
        title="Click to copy"
        style={{ cursor: 'pointer', borderBottom: '1px dashed var(--ink)' }}
      >
        {formatAddress(account)}
      </span>
      <span className="text-steel text-xs font-mono">
        {networkName || "POLYGON AMOY"}
      </span>
    </div>
  );
};

export default ConnectWallet;
