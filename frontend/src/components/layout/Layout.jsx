import React from 'react';
import Header from './Header';

const Layout = ({ children }) => {
  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--paper)',
      color: 'var(--ink)',
      fontFamily: '"Inter", sans-serif'
    }}>
      <Header />
      
      <main style={{ flex: 1, padding: '40px 24px' }}>
        {children}
      </main>
      
      <footer style={{
        borderTop: '1px solid var(--steel)',
        padding: '16px 24px',
        textAlign: 'center',
        marginTop: 'auto'
      }}>
        <p className="text-steel text-xs font-mono" style={{ margin: 0 }}>
          Custody records are immutable once confirmed on-chain. This system proves the record wasn't altered — not that the record is true.
        </p>
      </footer>
    </div>
  );
};

export default Layout;
