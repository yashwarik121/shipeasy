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
    
    this.contract.on("ShipmentCreated", async (...args) => {
      try {
        const event = args[args.length - 1]; // ContractEventPayload is always last
        const log = event.log;
        const block = await log.getBlock();
        callback({
          eventType: "ShipmentCreated",
          shipmentId: Number(args[0]),
          status: 0,
          actor: String(args[1]),
          timestamp: Number(block.timestamp),
          txHash: log.transactionHash,
          blockNumber: log.blockNumber
        });
      } catch (err) {
        console.error("Error handling ShipmentCreated event:", err.message);
      }
    });

    this.contract.on("StatusUpdated", async (...args) => {
      try {
        const event = args[args.length - 1]; // ContractEventPayload is always last
        const log = event.log;
        const block = await log.getBlock();
        callback({
          eventType: "StatusUpdated",
          shipmentId: Number(args[0]),
          status: Number(args[1]),
          actor: String(args[2]),
          timestamp: Number(block.timestamp),
          txHash: log.transactionHash,
          blockNumber: log.blockNumber
        });
      } catch (err) {
        console.error("Error handling StatusUpdated event:", err.message);
      }
    });
  }
}

module.exports = BlockchainService;
