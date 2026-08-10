import React from 'react';
import { useWallet } from '../../context/WalletContext';

const ConnectWallet = () => {
  const { account, chainId, connect, disconnect, isCorrectNetwork, switchNetwork } = useWallet();

  const handleCopy = () => {
    if (account) {
      navigator.clipboard.writeText(account);
    }
  };

  const formatAddress = (addr) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  if (!account) {
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

    return (
      <button onClick={connect} className="btn-connect">
        CONNECT WALLET
      </button>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span className="text-red font-mono font-bold">WRONG NETWORK</span>
        <button onClick={switchNetwork} className="btn btn-danger" style={{ padding: '8px 16px', fontSize: '12px' }}>
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
        POLYGON AMOY
      </span>
    </div>
  );
};

export default ConnectWallet;
