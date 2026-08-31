import React from 'react';
import { useWallet } from '../../context/WalletContext';
import { truncateAddress } from '../../utils/format';

const ConnectWallet = () => {
  const { account, isConnected, connectAs, disconnectWallet, selectedAccount, testAccounts, networkName } = useWallet();

  if (!isConnected) {
    return (
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {testAccounts.map((acc) => (
          <button
            key={acc.label}
            onClick={() => connectAs(acc)}
            className="btn"
            style={{ padding: '8px 16px', fontSize: '12px' }}
          >
            {acc.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="font-mono text-xs" style={{ 
            color: 'var(--verified-green)', 
            fontWeight: 'bold',
            border: '1px solid var(--verified-green)',
            padding: '2px 6px'
          }}>
            {selectedAccount?.label}
          </span>
          <span className="chain-address" style={{ fontSize: '13px' }}>
            {truncateAddress(account)}
          </span>
        </div>
        <span className="text-steel text-xs font-mono">{networkName}</span>
      </div>

      {/* Switch account */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {testAccounts
          .filter(a => a.label !== selectedAccount?.label)
          .map(acc => (
            <button
              key={acc.label}
              onClick={() => connectAs(acc)}
              className="btn"
              style={{ padding: '4px 8px', fontSize: '10px', letterSpacing: '0.05em' }}
            >
              {acc.label}
            </button>
          ))}
        <button
          onClick={disconnectWallet}
          style={{ 
            background: 'none', 
            border: '1px solid var(--seal-red)', 
            color: 'var(--seal-red)',
            padding: '4px 8px', 
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default ConnectWallet;
