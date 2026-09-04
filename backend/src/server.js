const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const CacheService = require('./services/cache');
const BlockchainService = require('./services/blockchain');
const shipmentRoutes = require('./routes/shipments');
const documentRoutes = require('./routes/documents');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', shipmentRoutes);
app.use('/api', documentRoutes);

async function startServer() {
  try {
    const uploadsDir = path.join(__dirname, '../data/uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const cache = new CacheService();
    await cache.ready;
    app.locals.cache = cache;

    const blockchain = new BlockchainService(config.rpcUrl, config.contractAddress);
    app.locals.blockchain = blockchain;

    if (blockchain.contract) {
      blockchain.listenForEvents(async (event) => {
        try {
          cache.addEvent(event);
          const shipment = await blockchain.getShipment(event.shipmentId);
          const history = await blockchain.getHistory(event.shipmentId);
          cache.syncShipmentFromChain(event.shipmentId, shipment, history);
        } catch (err) {
          console.error("Error processing event", err);
        }
      });
      
      const count = await blockchain.getShipmentCount();
      for (let i = 0; i < count; i++) {
        const shipment = await blockchain.getShipment(i);
        const history = await blockchain.getHistory(i);
        cache.syncShipmentFromChain(i, shipment, history);
      }
    } else {
      console.warn("No contract address configured, skipping blockchain sync.");
    }

    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
