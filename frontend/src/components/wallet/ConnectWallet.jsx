import React from 'react';
import { useWallet } from '../../context/WalletContext';
import { truncateAddress } from '../../utils/format';

const ConnectWallet = () => {
  const { 
    account, isConnected, isCorrectChain, networkName, authMode,
    hasMetaMask, connectMetaMask, connectAs, disconnectWallet, 
    switchToCorrectChain, selectedAccount, testAccounts, error 
  } = useWallet();

  if (!isConnected) {
    return (
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {hasMetaMask && (
          <button onClick={connectMetaMask} className="btn" 
            style={{ padding: '8px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            🦊 METAMASK
          </button>
        )}
        <div style={{ display: 'flex', gap: '4px' }}>
          {testAccounts.map((acc) => (
            <button key={acc.label} onClick={() => connectAs(acc)} className="btn"
              style={{ padding: '8px 12px', fontSize: '11px' }}>
              {acc.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!isCorrectChain) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="font-mono text-xs" style={{ color: 'var(--seal-red)' }}>WRONG CHAIN</span>
        <button onClick={switchToCorrectChain} className="btn" style={{ padding: '6px 12px', fontSize: '11px' }}>
          SWITCH NETWORK
        </button>
        <button onClick={disconnectWallet} className="btn" style={{ padding: '6px 8px', fontSize: '11px', color: 'var(--seal-red)', borderColor: 'var(--seal-red)' }}>✕</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="font-mono text-xs" style={{ 
            color: 'var(--verified-green)', fontWeight: 'bold',
            border: '1px solid var(--verified-green)', padding: '2px 6px'
          }}>
            {authMode === 'metamask' ? '🦊' : selectedAccount?.label}
          </span>
          <span className="chain-address" style={{ fontSize: '13px' }}>
            {truncateAddress(account)}
          </span>
        </div>
        <span className="text-steel text-xs font-mono">{networkName}</span>
      </div>

      <div style={{ display: 'flex', gap: '4px' }}>
        {authMode === 'test' && testAccounts
          .filter(a => a.label !== selectedAccount?.label)
          .map(acc => (
            <button key={acc.label} onClick={() => connectAs(acc)} className="btn"
              style={{ padding: '4px 8px', fontSize: '10px' }}>
              {acc.label}
            </button>
          ))}
        <button onClick={disconnectWallet}
          style={{ background: 'none', border: '1px solid var(--seal-red)', color: 'var(--seal-red)',
            padding: '4px 8px', fontSize: '10px', fontFamily: 'var(--font-mono)', cursor: 'pointer', fontWeight: 'bold' }}>
          ✕
        </button>
      </div>
    </div>
  );
};

export default ConnectWallet;
