import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { JsonRpcProvider } from 'ethers';

const WalletContext = createContext();

const RPC_URL = 'http://127.0.0.1:8545';

const TEST_ACCOUNTS = [
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

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const chainId = 31337n;
  const isCorrectChain = true;
  const networkName = 'Hardhat Local';
  const error = null;

  const connectAs = useCallback(async (accountObj) => {
    try {
      const rpcProvider = new JsonRpcProvider(RPC_URL);
      const rpcSigner = await rpcProvider.getSigner(accountObj.index);
      setProvider(rpcProvider);
      setSigner(rpcSigner);
      setAccount(accountObj.address);
      setIsConnected(true);
      setSelectedAccount(accountObj);
      if (accountObj.index !== undefined) {
        localStorage.setItem('connected_account_index', String(accountObj.index));
      }
    } catch (err) {
      console.error('Connection failed:', err);
    }
  }, []);

  const connectWallet = useCallback(async () => {
    await connectAs(TEST_ACCOUNTS[0]);
  }, [connectAs]);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setIsConnected(false);
    setSelectedAccount(null);
    localStorage.removeItem('connected_account_index');
  }, []);

  const switchToCorrectChain = useCallback(async () => {}, []);

  // Auto-connect previously selected account on mount
  useEffect(() => {
    const savedIdx = localStorage.getItem('connected_account_index');
    if (savedIdx !== null) {
      const idx = parseInt(savedIdx, 10);
      if (TEST_ACCOUNTS[idx]) {
        connectAs(TEST_ACCOUNTS[idx]);
      }
    }
  }, [connectAs]);

  const getAccountLabel = useCallback((addr) => {
    if (!addr) return '';
    const match = TEST_ACCOUNTS.find(a => a.address.toLowerCase() === addr.toLowerCase());
    return match ? match.shortLabel || match.label : addr.substring(0, 6) + '...' + addr.substring(addr.length - 4);
  }, []);

  return (
    <WalletContext.Provider value={{
      account, provider, signer, chainId, isConnected, isCorrectChain,
      networkName, connectWallet, connectAs, disconnectWallet,
      switchToCorrectChain, selectedAccount, testAccounts: TEST_ACCOUNTS,
      getAccountLabel, error
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
