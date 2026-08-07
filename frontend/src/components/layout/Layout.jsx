import React from 'react';
import Header from './Header';

const Layout = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main className="container" style={{ flex: 1, paddingTop: '32px' }}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
