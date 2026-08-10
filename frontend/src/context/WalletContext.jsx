import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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

  const networkName = useMemo(() => {
    if (chainId === 80002n) return 'Polygon Amoy';
    if (chainId === 31337n) return 'Hardhat Local';
    if (chainId) return `Unknown (${chainId})`;
    return 'Unknown';
  }, [chainId]);

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

  const switchToCorrectChain = async () => {
    if (!window.ethereum) return;
    try {
      // Try to switch to Polygon Amoy
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x13882' }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x13882',
                chainName: 'Polygon Amoy',
                rpcUrls: ['https://rpc-amoy.polygon.technology'],
                nativeCurrency: {
                  name: 'MATIC',
                  symbol: 'MATIC',
                  decimals: 18,
                },
                blockExplorerUrls: ['https://amoy.polygonscan.com/'],
              },
            ],
          });
        } catch (addError) {
          setError(addError.message);
        }
      } else {
        setError(switchError.message);
      }
    }
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
        networkName,
        connectWallet,
        disconnectWallet,
        switchToCorrectChain,
        error
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
