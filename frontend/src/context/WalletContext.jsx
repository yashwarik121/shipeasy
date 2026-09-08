import { createContext, useContext, useState, useCallback } from 'react';
import { JsonRpcProvider } from 'ethers';

const WalletContext = createContext();

const RPC_URL = 'http://127.0.0.1:8545';

const TEST_ACCOUNTS = [
  { label: 'SENDER', address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', index: 0 },
  { label: 'CARRIER', address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', index: 1 },
  { label: 'RECEIVER', address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', index: 2 }
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
  }, []);

  const switchToCorrectChain = useCallback(async () => {}, []);

  return (
    <WalletContext.Provider value={{
      account, provider, signer, chainId, isConnected, isCorrectChain,
      networkName, connectWallet, connectAs, disconnectWallet,
      switchToCorrectChain, selectedAccount, testAccounts: TEST_ACCOUNTS, error
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
