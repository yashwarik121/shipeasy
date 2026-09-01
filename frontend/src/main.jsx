import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { WalletProvider } from './context/WalletContext';
import { ThemeProvider } from './context/ThemeContext';
import SplashScreen from './components/layout/SplashScreen';
import './index.css';

const Root = () => {
  const [showSplash, setShowSplash] = useState(true);
  
  return (
    <React.StrictMode>
      <ThemeProvider>
        {showSplash ? (
          <SplashScreen onComplete={() => setShowSplash(false)} />
        ) : (
          <WalletProvider>
            <App />
          </WalletProvider>
        )}
      </ThemeProvider>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
