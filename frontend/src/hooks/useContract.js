import { useCallback, useMemo, useState } from 'react';
import { Contract } from 'ethers';
import { useWallet } from '../context/WalletContext';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../utils/contract';

// Fast receipt waiter: races tx.wait(1) with direct RPC receipt polling every 500ms
// Never hangs in a loop when user approves in MetaMask
const waitForTxReceipt = async (tx, provider, timeoutMs = 12000) => {
  if (!tx) return null;
  
  const pollPromise = new Promise(async (resolve) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (provider && tx.hash) {
        try {
          const receipt = await provider.getTransactionReceipt(tx.hash);
          if (receipt && receipt.blockNumber != null) {
            resolve(receipt);
            return;
          }
        } catch (e) {}
      }
      await new Promise(r => setTimeout(r, 500));
    }
    resolve(null);
  });

  const waitPromise = tx.wait ? tx.wait(1) : Promise.resolve(null);

  try {
    const result = await Promise.race([waitPromise, pollPromise]);
    if (result) return result;
    if (provider && tx.hash) {
      const receipt = await provider.getTransactionReceipt(tx.hash);
      if (receipt) return receipt;
    }
    return await waitPromise;
  } catch (err) {
    if (provider && tx.hash) {
      try {
        const receipt = await provider.getTransactionReceipt(tx.hash);
        if (receipt && Number(receipt.status) === 1) {
          return receipt;
        }
      } catch (e) {}
    }
    throw err;
  }
};

export const useContract = () => {
  const { provider, signer, isConnected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const contract = useMemo(() => {
    if (signer && isConnected) {
      return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    } else if (provider) {
      return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    }
    return null;
  }, [provider, signer, isConnected]);

  const createShipment = useCallback(async (carrier, receiver, description) => {
    if (!contract || !signer) throw new Error("Contract or signer not available");
    setLoading(true);
    setError(null);
    try {
      const tx = await contract.createShipment(carrier, receiver, description, { gasLimit: 500000 });
      const receipt = await waitForTxReceipt(tx, provider);
      setLoading(false);
      return receipt;
    } catch (err) {
      setError(err.message || 'Failed to create shipment');
      setLoading(false);
      throw err;
    }
  }, [contract, signer, provider]);

  const createShipmentWithOtp = useCallback(async (carrier, receiver, description, otpHash, otp) => {
    if (!contract || !signer) throw new Error("Contract or signer not available");
    setLoading(true);
    setError(null);
    try {
      const tx = await contract.createShipmentWithOtp(carrier, receiver, description, otpHash, otp, { gasLimit: 500000 });
      const receipt = await waitForTxReceipt(tx, provider);
      setLoading(false);
      return receipt;
    } catch (err) {
      setError(err.message || 'Failed to create shipment with OTP');
      setLoading(false);
      throw err;
    }
  }, [contract, signer, provider]);

  const advanceStatus = useCallback(async (id, nextStatus) => {
    if (!contract || !signer) throw new Error("Contract or signer not available");
    setLoading(true);
    setError(null);
    try {
      const tx = await contract.advanceStatus(id, nextStatus, { gasLimit: 200000 });
      const receipt = await waitForTxReceipt(tx, provider);
      setLoading(false);
      return receipt;
    } catch (err) {
      setError(err.message || 'Failed to advance status');
      setLoading(false);
      throw err;
    }
  }, [contract, signer, provider]);

  const completeDeliveryWithOtp = useCallback(async (id, otp) => {
    if (!contract || !signer) throw new Error("Contract or signer not available");
    setLoading(true);
    setError(null);
    try {
      const tx = await contract.completeDeliveryWithOtp(id, otp, { gasLimit: 250000 });
      const receipt = await waitForTxReceipt(tx, provider);
      setLoading(false);
      return receipt;
    } catch (err) {
      setError(err.message || 'Failed to complete delivery with OTP');
      setLoading(false);
      throw err;
    }
  }, [contract, signer, provider]);

  const getDeliveryOtp = useCallback(async (id) => {
    if (!contract) throw new Error("Contract not available");
    try {
      return await contract.getDeliveryOtp(id);
    } catch (err) {
      return null;
    }
  }, [contract]);

  const getShipment = useCallback(async (id) => {
    if (!contract) throw new Error("Contract not available");
    try {
      const data = await contract.getShipment(id);
      return {
        id: data[0] ?? data.id,
        sender: data[1] ?? data.sender,
        carrier: data[2] ?? data.carrier,
        receiver: data[3] ?? data.receiver,
        description: data[4] ?? data.description,
        status: data[5] ?? data.status,
        accessKey: data[6] ?? data.accessKey,
        otpHash: data[7] ?? data.otpHash,
        createdAt: data[8] ?? data.createdAt,
        lastUpdated: data[9] ?? data.lastUpdated
      };
    } catch (err) {
      throw err;
    }
  }, [contract]);

  const getHistory = useCallback(async (id) => {
    if (!contract) throw new Error("Contract not available");
    try {
      const data = await contract.getHistory(id);
      return data.map(entry => ({
        status: entry[0] ?? entry.status,
        updater: entry[1] ?? entry.updater,
        timestamp: entry[2] ?? entry.timestamp
      }));
    } catch (err) {
      throw err;
    }
  }, [contract]);

  const getShipmentCount = useCallback(async () => {
    if (!contract) throw new Error("Contract not available");
    try {
      return await contract.getShipmentCount();
    } catch (err) {
      return 0n;
    }
  }, [contract]);

  const addDocument = useCallback(async (shipmentId, fileHash, fileName) => {
    if (!contract || !signer) throw new Error("Contract or signer not available");
    setLoading(true);
    setError(null);
    try {
      const tx = await contract.addDocument(shipmentId, fileHash, fileName, { gasLimit: 300000 });
      const receipt = await waitForTxReceipt(tx, provider);
      setLoading(false);
      return receipt;
    } catch (err) {
      setError(err.message || 'Failed to add document');
      setLoading(false);
      throw err;
    }
  }, [contract, signer, provider]);

  const getDocuments = useCallback(async (shipmentId) => {
    if (!contract) throw new Error('Contract not available');
    const data = await contract.getDocuments(shipmentId);
    return data.map(doc => ({
      fileHash: doc[0],
      fileName: doc[1],
      uploader: doc[2],
      timestamp: Number(doc[3])
    }));
  }, [contract]);

  const getAccessKey = useCallback(async (shipmentId) => {
    if (!contract) throw new Error('Contract not available');
    return await contract.getAccessKey(shipmentId);
  }, [contract]);

  return {
    contract,
    createShipment,
    createShipmentWithOtp,
    advanceStatus,
    completeDeliveryWithOtp,
    getDeliveryOtp,
    getShipment,
    getHistory,
    getShipmentCount,
    addDocument,
    getDocuments,
    getAccessKey,
    loading,
    error
  };
};
