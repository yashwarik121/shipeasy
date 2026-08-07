import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BrowserProvider } from 'ethers';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  const isCorrectChain = chainId === 80002n || chainId === 31337n;

  const updateWalletState = useCallback(async (accounts) => {
    if (accounts.length > 0) {
      const currentAccount = accounts[0];
      setAccount(currentAccount);
      setIsConnected(true);
      setError(null);
      
      if (window.ethereum) {
        const browserProvider = new BrowserProvider(window.ethereum);
        setProvider(browserProvider);
        const currentSigner = await browserProvider.getSigner();
        setSigner(currentSigner);
        
        const network = await browserProvider.getNetwork();
        setChainId(network.chainId);
      }
    } else {
      setAccount(null);
      setProvider(null);
      setSigner(null);
      setChainId(null);
      setIsConnected(false);
    }
  }, []);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed.');
      }
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      await updateWalletState(accounts);
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setIsConnected(false);
    setError(null);
  };

  useEffect(() => {
    const checkIfConnected = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await updateWalletState(accounts);
          }
        } catch (err) {
          console.error('Error checking wallet connection:', err);
        }
      }
    };
    
    checkIfConnected();

    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        updateWalletState(accounts);
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [updateWalletState]);

  return (
    <WalletContext.Provider
      value={{
        account,
        provider,
        signer,
        chainId,
        isConnected,
        isCorrectChain,
        connectWallet,
        disconnectWallet,
        error
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
