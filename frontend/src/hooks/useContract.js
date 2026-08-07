import { useCallback, useMemo, useState } from 'react';
import { Contract } from 'ethers';
import { useWallet } from '../context/WalletContext';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../utils/contract';

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
      const tx = await contract.createShipment(carrier, receiver, description);
      const receipt = await tx.wait();
      setLoading(false);
      return receipt;
    } catch (err) {
      setError(err.message || 'Failed to create shipment');
      setLoading(false);
      throw err;
    }
  }, [contract, signer]);

  const advanceStatus = useCallback(async (id, nextStatus) => {
    if (!contract || !signer) throw new Error("Contract or signer not available");
    setLoading(true);
    setError(null);
    try {
      const tx = await contract.advanceStatus(id, nextStatus);
      const receipt = await tx.wait();
      setLoading(false);
      return receipt;
    } catch (err) {
      setError(err.message || 'Failed to advance status');
      setLoading(false);
      throw err;
    }
  }, [contract, signer]);

  const getShipment = useCallback(async (id) => {
    if (!contract) throw new Error("Contract not available");
    try {
      const data = await contract.getShipment(id);
      return {
        id: data[0],
        sender: data[1],
        carrier: data[2],
        receiver: data[3],
        description: data[4],
        status: data[5],
        createdAt: data[6],
        updatedAt: data[7]
      };
    } catch (err) {
      throw err;
    }
  }, [contract]);

  const getHistory = useCallback(async (id) => {
    if (!contract) throw new Error("Contract not available");
    try {
      const data = await contract.getHistory(id);
      return data.map(item => ({
        status: item[0],
        updatedBy: item[1],
        timestamp: item[2]
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
      throw err;
    }
  }, [contract]);

  return {
    contract,
    createShipment,
    advanceStatus,
    getShipment,
    getHistory,
    getShipmentCount,
    loading,
    error
  };
};
