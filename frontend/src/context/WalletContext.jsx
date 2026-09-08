import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { BrowserProvider, JsonRpcProvider } from 'ethers';

const WalletContext = createContext();

const RPC_URL = 'http://127.0.0.1:8545';
const HARDHAT_CHAIN_ID = 31337;

// Hardhat test accounts (fallback when no MetaMask)
const TEST_ACCOUNTS = [
  { label: 'SENDER', address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', index: 0 },
  { label: 'CARRIER', address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', index: 1 },
  { label: 'RECEIVER', address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', index: 2 }
];

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [authMode, setAuthMode] = useState(null); // 'metamask' | 'test'
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [error, setError] = useState(null);

  const hasMetaMask = typeof window !== 'undefined' && !!window.ethereum;

  const networkName = chainId === BigInt(HARDHAT_CHAIN_ID) ? 'Hardhat Local' : 
                      chainId === 80002n ? 'Polygon Amoy' : 
                      chainId ? `Chain ${chainId}` : '';

  const isCorrectChain = chainId === BigInt(HARDHAT_CHAIN_ID) || chainId === 80002n;

  // MetaMask connection
  const connectMetaMask = useCallback(async () => {
    if (!window.ethereum) {
      setError('MetaMask not detected. Install MetaMask or use test accounts.');
      return;
    }
    try {
      setError(null);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const browserProvider = new BrowserProvider(window.ethereum);
      browserProvider.pollingInterval = 30000; // 30s — minimal polling
      const currentSigner = await browserProvider.getSigner();
      const network = await browserProvider.getNetwork();

      setAccount(accounts[0]);
      setProvider(browserProvider);
      setSigner(currentSigner);
      setChainId(network.chainId);
      setIsConnected(true);
      setAuthMode('metamask');
      setSelectedAccount({ label: 'METAMASK', address: accounts[0] });
    } catch (err) {
      console.error('MetaMask connection failed:', err);
      setError(err.message || 'Failed to connect MetaMask');
    }
  }, []);

  // Test account connection (direct Hardhat RPC)
  const connectAs = useCallback(async (accountObj) => {
    try {
      setError(null);
      const rpcProvider = new JsonRpcProvider(RPC_URL);
      const rpcSigner = await rpcProvider.getSigner(accountObj.index);
      setProvider(rpcProvider);
      setSigner(rpcSigner);
      setAccount(accountObj.address);
      setChainId(BigInt(HARDHAT_CHAIN_ID));
      setIsConnected(true);
      setAuthMode('test');
      setSelectedAccount(accountObj);
    } catch (err) {
      console.error('Failed to connect:', err);
      setError(err.message || 'Failed to connect');
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (hasMetaMask) {
      await connectMetaMask();
    } else {
      await connectAs(TEST_ACCOUNTS[0]);
    }
  }, [hasMetaMask, connectMetaMask, connectAs]);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setIsConnected(false);
    setAuthMode(null);
    setSelectedAccount(null);
    setError(null);
  }, []);

  const switchToCorrectChain = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x' + HARDHAT_CHAIN_ID.toString(16) }]
      });
    } catch (err) {
      if (err.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x' + HARDHAT_CHAIN_ID.toString(16),
            chainName: 'Hardhat Local',
            rpcUrls: [RPC_URL],
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
          }]
        });
      }
    }
  }, []);

  // Listen for MetaMask account/chain changes
  useEffect(() => {
    if (!window.ethereum || authMode !== 'metamask') return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setAccount(accounts[0]);
        setSelectedAccount({ label: 'METAMASK', address: accounts[0] });
      }
    };

    const handleChainChanged = () => window.location.reload();

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [authMode, disconnectWallet]);

  return (
    <WalletContext.Provider value={{
      account,
      provider,
      signer,
      chainId,
      isConnected,
      isCorrectChain,
      networkName,
      authMode,
      hasMetaMask,
      connectWallet,
      connectMetaMask,
      connectAs,
      disconnectWallet,
      switchToCorrectChain,
      selectedAccount,
      testAccounts: TEST_ACCOUNTS,
      error
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
