const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

class BlockchainService {
  constructor(rpcUrl, contractAddress) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    
    let abi;
    try {
      const artifactPath = path.join(__dirname, '../../../contracts/artifacts/contracts/ShipmentTracker.sol/ShipmentTracker.json');
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));
      abi = artifact.abi;
    } catch (error) {
      console.warn("Contract ABI not found, this will fail if calling contract methods:", error.message);
      abi = []; 
    }

    if (contractAddress) {
      this.contract = new ethers.Contract(contractAddress, abi, this.provider);
    }
  }

  formatShipment(raw) {
    return {
      id: Number(raw.id),
      sender: raw.sender,
      carrier: raw.carrier,
      receiver: raw.receiver,
      description: raw.description,
      status: Number(raw.status),
      createdAt: Number(raw.createdAt),
      lastUpdated: Number(raw.lastUpdated)
    };
  }

  formatHistoryEntry(raw) {
    return {
      status: Number(raw.status),
      updater: raw.updater,
      timestamp: Number(raw.timestamp)
    };
  }

  async getShipment(id) {
    const raw = await this.contract.getShipment(id);
    return this.formatShipment(raw);
  }

  async getHistory(id) {
    const rawHistory = await this.contract.getHistory(id);
    return rawHistory.map(entry => this.formatHistoryEntry(entry));
  }

  async getShipmentCount() {
    const count = await this.contract.getShipmentCount();
    return Number(count);
  }

  async listenForEvents(callback) {
    if (!this.contract) return;
    
    this.contract.on("ShipmentCreated", async (id, sender, receiver, carrier, description, event) => {
      const block = await event.log.getBlock();
      callback({
        eventType: "ShipmentCreated",
        shipmentId: Number(id),
        status: 0, 
        actor: sender,
        timestamp: block.timestamp,
        txHash: event.log.transactionHash,
        blockNumber: event.log.blockNumber
      });
    });

    this.contract.on("StatusUpdated", async (id, status, updater, event) => {
      const block = await event.log.getBlock();
      callback({
        eventType: "StatusUpdated",
        shipmentId: Number(id),
        status: Number(status),
        actor: updater,
        timestamp: block.timestamp,
        txHash: event.log.transactionHash,
        blockNumber: event.log.blockNumber
      });
    });
  }
}

module.exports = BlockchainService;
