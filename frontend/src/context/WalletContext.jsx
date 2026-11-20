import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { JsonRpcProvider, BrowserProvider } from 'ethers';

const WalletContext = createContext();

const RPC_URL = 'http://127.0.0.1:8545';

export const TEST_ACCOUNTS = [
  { label: 'ACC #0 (SENDER)', shortLabel: 'ACC #0', roleName: 'Sender', address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', index: 0 },
  { label: 'ACC #1 (CARRIER)', shortLabel: 'ACC #1', roleName: 'Carrier', address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', index: 1 },
  { label: 'ACC #2 (RECEIVER)', shortLabel: 'ACC #2', roleName: 'Receiver', address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', index: 2 },
  { label: 'ACC #3', shortLabel: 'ACC #3', roleName: 'Account 3', address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', index: 3 },
  { label: 'ACC #4', shortLabel: 'ACC #4', roleName: 'Account 4', address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', index: 4 },
  { label: 'ACC #5', shortLabel: 'ACC #5', roleName: 'Account 5', address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc', index: 5 },
  { label: 'ACC #6', shortLabel: 'ACC #6', roleName: 'Account 6', address: '0x976EA74026E726554dB657fA54763abd0C3a0aa9', index: 6 },
  { label: 'ACC #7', shortLabel: 'ACC #7', roleName: 'Account 7', address: '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955', index: 7 },
  { label: 'ACC #8', shortLabel: 'ACC #8', roleName: 'Account 8', address: '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f', index: 8 },
  { label: 'ACC #9', shortLabel: 'ACC #9', roleName: 'Account 9', address: '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720', index: 9 }
];

export const NETWORKS = {
  31337: {
    chainIdHex: '0x7a69',
    name: 'Hardhat / Ganache Local',
    rpcUrls: ['http://127.0.0.1:8545'],
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
  },
  1337: {
    chainIdHex: '0x539',
    name: 'Ganache Local',
    rpcUrls: ['http://127.0.0.1:8545'],
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
  },
  80002: {
    chainIdHex: '0x13882',
    name: 'Polygon Amoy Testnet',
    rpcUrls: ['https://rpc-amoy.polygon.technology/'],
    nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
    blockExplorerUrls: ['https://amoy.polygonscan.com/']
  }
};

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [walletType, setWalletType] = useState(null); // 'metamask' | 'dev' | null
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState(31337n);
  const [error, setError] = useState(null);

  const isMetaMaskAvailable = typeof window !== 'undefined' && Boolean(window.ethereum);

  // Connect via Direct RPC with pre-funded local accounts
  const connectAs = useCallback(async (accountObj) => {
    try {
      setError(null);
      const rpcProvider = new JsonRpcProvider(RPC_URL);
      const rpcSigner = await rpcProvider.getSigner(accountObj.index);
      setProvider(rpcProvider);
      setSigner(rpcSigner);
      setAccount(accountObj.address);
      setChainId(31337n);
      setIsConnected(true);
      setWalletType('dev');
      setSelectedAccount(accountObj);
      if (accountObj.index !== undefined) {
        localStorage.setItem('connected_account_index', String(accountObj.index));
      }
      localStorage.setItem('connected_wallet_type', 'dev');
    } catch (err) {
      console.error('Connection failed:', err);
      setError(err.message || 'Failed to connect test identity');
    }
  }, []);

  // Connect via real MetaMask browser extension
  const connectMetaMask = useCallback(async () => {
    try {
      setError(null);
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install the extension at metamask.io or select a test identity.');
      }

      const browserProvider = new BrowserProvider(window.ethereum);
      browserProvider.pollingInterval = 800;
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts selected in MetaMask.');
      }

      const browserSigner = await browserProvider.getSigner();
      const activeAddress = await browserSigner.getAddress();
      const network = await browserProvider.getNetwork();

      setProvider(browserProvider);
      setSigner(browserSigner);
      setAccount(activeAddress);
      setChainId(network.chainId);
      setIsConnected(true);
      setWalletType('metamask');
      setSelectedAccount(null);

      localStorage.setItem('connected_wallet_type', 'metamask');
      localStorage.removeItem('connected_account_index');
      return activeAddress;
    } catch (err) {
      console.error('MetaMask connection failed:', err);
      setError(err.message || 'Failed to connect MetaMask');
      throw err;
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (isMetaMaskAvailable) {
      try {
        await connectMetaMask();
      } catch (err) {
        // Fallback to dev account if user rejected or failed
        console.warn('MetaMask connect skipped or rejected, falling back to Dev Acc #0', err);
        await connectAs(TEST_ACCOUNTS[0]);
      }
    } else {
      await connectAs(TEST_ACCOUNTS[0]);
    }
  }, [isMetaMaskAvailable, connectMetaMask, connectAs]);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setIsConnected(false);
    setSelectedAccount(null);
    setWalletType(null);
    setError(null);
    localStorage.removeItem('connected_account_index');
    localStorage.removeItem('connected_wallet_type');
  }, []);

  // Switch chain in MetaMask
  const switchToCorrectChain = useCallback(async () => {
    if (!window.ethereum) return;
    const targetId = import.meta.env.VITE_CHAIN_ID ? Number(import.meta.env.VITE_CHAIN_ID) : 31337;
    const net = NETWORKS[targetId] || NETWORKS[31337];

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: net.chainIdHex }],
      });
    } catch (switchError) {
      if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902 || switchError.message?.includes('4902')) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: net.chainIdHex,
              chainName: net.name,
              rpcUrls: net.rpcUrls,
              nativeCurrency: net.nativeCurrency,
              blockExplorerUrls: net.blockExplorerUrls
            }],
          });
        } catch (addError) {
          console.error('Failed to add chain to MetaMask:', addError);
          setError(addError.message || 'Could not add network to MetaMask');
        }
      } else {
        console.error('Failed to switch chain:', switchError);
        setError(switchError.message || 'Could not switch network in MetaMask');
      }
    }
  }, []);

  // Listen to MetaMask account & network events
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      const activeType = localStorage.getItem('connected_wallet_type');
      if (activeType !== 'metamask') return;

      if (!accounts || accounts.length === 0) {
        disconnectWallet();
      } else {
        setAccount(accounts[0]);
        try {
          const browserProvider = new BrowserProvider(window.ethereum);
          browserProvider.pollingInterval = 800;
          const newSigner = await browserProvider.getSigner();
          setProvider(browserProvider);
          setSigner(newSigner);
        } catch (e) {
          console.warn('Could not re-instantiate signer after account change:', e);
        }
      }
    };

    const handleChainChanged = (newChainId) => {
      const activeType = localStorage.getItem('connected_wallet_type');
      if (activeType !== 'metamask') return;
      setChainId(BigInt(newChainId));
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [disconnectWallet]);

  // Auto-connect on mount based on saved preference
  useEffect(() => {
    const savedType = localStorage.getItem('connected_wallet_type');
    const savedIdx = localStorage.getItem('connected_account_index');

    if (savedType === 'metamask' && typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts) => {
          if (accounts && accounts.length > 0) {
            connectMetaMask().catch(() => {});
          } else if (savedIdx !== null && TEST_ACCOUNTS[parseInt(savedIdx, 10)]) {
            connectAs(TEST_ACCOUNTS[parseInt(savedIdx, 10)]);
          }
        })
        .catch(() => {
          if (savedIdx !== null && TEST_ACCOUNTS[parseInt(savedIdx, 10)]) {
            connectAs(TEST_ACCOUNTS[parseInt(savedIdx, 10)]);
          }
        });
    } else if (savedIdx !== null) {
      const idx = parseInt(savedIdx, 10);
      if (TEST_ACCOUNTS[idx]) {
        connectAs(TEST_ACCOUNTS[idx]);
      }
    }
  }, [connectMetaMask, connectAs]);

  const networkName = useMemo(() => {
    if (walletType === 'metamask' && chainId) {
      const id = Number(chainId);
      if (NETWORKS[id]) return NETWORKS[id].name;
      return `Chain ID ${id}`;
    }
    return 'Hardhat Local (31337)';
  }, [walletType, chainId]);

  const isCorrectChain = useMemo(() => {
    if (walletType !== 'metamask') return true;
    const targetId = import.meta.env.VITE_CHAIN_ID ? BigInt(import.meta.env.VITE_CHAIN_ID) : 31337n;
    if (targetId === 31337n) {
      return chainId === 31337n || chainId === 1337n;
    }
    return chainId === targetId;
  }, [walletType, chainId]);

  const getAccountLabel = useCallback((addr) => {
    if (!addr) return '';
    const match = TEST_ACCOUNTS.find(a => a.address.toLowerCase() === addr.toLowerCase());
    return match ? match.shortLabel || match.label : addr.substring(0, 6) + '...' + addr.substring(addr.length - 4);
  }, []);

  return (
    <WalletContext.Provider value={{
      account, provider, signer, chainId, isConnected, isCorrectChain,
      networkName, walletType, isMetaMaskAvailable,
      connectWallet, connectMetaMask, connectAs, disconnectWallet,
      switchToCorrectChain, selectedAccount, testAccounts: TEST_ACCOUNTS,
      getAccountLabel, error
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
