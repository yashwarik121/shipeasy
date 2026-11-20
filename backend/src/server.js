const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const CacheService = require('./services/cache');
const BlockchainService = require('./services/blockchain');
const shipmentRoutes = require('./routes/shipments');
const documentRoutes = require('./routes/documents');
const tamperRoutes = require('./routes/tamper');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', shipmentRoutes);
app.use('/api', documentRoutes);
app.use('/api', tamperRoutes);

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
      
      try {
        const count = await blockchain.getShipmentCount();
        for (let i = 0; i < count; i++) {
          try {
            const shipment = await blockchain.getShipment(i);
            const history = await blockchain.getHistory(i);
            cache.syncShipmentFromChain(i, shipment, history);
          } catch (syncErr) {
            console.warn(`Could not sync shipment ${i} from chain:`, syncErr.message);
          }
        }
        console.log(`Successfully synced ${count} shipments from blockchain.`);
      } catch (countErr) {
        console.warn("Could not query blockchain on startup:", countErr.message);
      }
    } else {
      console.warn("No contract address configured, skipping blockchain sync.");
    }

    // Global Express error handler
    app.use((err, req, res, next) => {
      console.error("Unhandled API error:", err);
      res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
    });

    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
