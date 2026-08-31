import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { JsonRpcProvider } from 'ethers';

const WalletContext = createContext();

const RPC_URL = 'http://127.0.0.1:8545';

// Hardhat's default test accounts
const TEST_ACCOUNTS = [
  {
    label: 'SENDER',
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    key: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    index: 0
  },
  {
    label: 'CARRIER',
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    key: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
    index: 1
  },
  {
    label: 'RECEIVER',
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    key: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
    index: 2
  }
];

export const WalletProvider = ({ children }) => {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  const account = selectedAccount?.address || null;
  const isConnected = !!selectedAccount;
  const isCorrectChain = true; // Always correct — direct connection
  const networkName = 'Hardhat Local';
  const error = null;

  const connectAs = useCallback(async (accountObj) => {
    try {
      const rpcProvider = new JsonRpcProvider(RPC_URL);
      const rpcSigner = await rpcProvider.getSigner(accountObj.index);
      setProvider(rpcProvider);
      setSigner(rpcSigner);
      setSelectedAccount(accountObj);
    } catch (err) {
      console.error('Failed to connect:', err);
    }
  }, []);

  const connectWallet = useCallback(async () => {
    // Default: connect as Sender
    await connectAs(TEST_ACCOUNTS[0]);
  }, [connectAs]);

  const disconnectWallet = useCallback(() => {
    setSelectedAccount(null);
    setProvider(null);
    setSigner(null);
  }, []);

  const switchToCorrectChain = useCallback(async () => {
    // No-op — always on correct chain
  }, []);

  const chainId = 31337n;

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
        connectAs,
        selectedAccount,
        testAccounts: TEST_ACCOUNTS,
        error
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
