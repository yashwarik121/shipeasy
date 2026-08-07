const express = require('express');
const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    const { blockchain } = req.app.locals;
    const blockNumber = await blockchain.provider.getBlockNumber();
    res.json({
      status: 'ok',
      contractAddress: blockchain.contract ? blockchain.contract.target : null,
      blockNumber
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/shipments', async (req, res) => {
  try {
    const { cache, blockchain } = req.app.locals;
    let shipments = cache.getAllShipments();
    
    if (shipments.length === 0 && blockchain.contract) {
      const count = await blockchain.getShipmentCount();
      for (let i = 1; i <= count; i++) {
        const shipment = await blockchain.getShipment(i);
        const history = await blockchain.getHistory(i);
        cache.syncShipmentFromChain(i, shipment, history);
      }
      shipments = cache.getAllShipments();
    }
    
    res.json(shipments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/shipments/:id', async (req, res) => {
  try {
    const { cache, blockchain } = req.app.locals;
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid shipment ID" });
    
    let shipment = cache.getShipment(id);
    if (!shipment && blockchain.contract) {
      try {
        shipment = await blockchain.getShipment(id);
        const history = await blockchain.getHistory(id);
        cache.syncShipmentFromChain(id, shipment, history);
      } catch (e) {
        return res.status(404).json({ error: "Shipment not found" });
      }
    }
    
    if (!shipment) {
      return res.status(404).json({ error: "Shipment not found" });
    }
    
    res.json(shipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/shipments/:id/history', async (req, res) => {
  try {
    const { cache, blockchain } = req.app.locals;
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid shipment ID" });
    
    let history = cache.getHistory(id);
    if (history.length === 0 && blockchain.contract) {
      try {
        const shipment = await blockchain.getShipment(id);
        const chainHistory = await blockchain.getHistory(id);
        cache.syncShipmentFromChain(id, shipment, chainHistory);
        history = cache.getHistory(id);
      } catch (e) {
        return res.status(404).json({ error: "History not found" });
      }
    }
    
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/events', (req, res) => {
  try {
    const { cache } = req.app.locals;
    const limit = parseInt(req.query.limit, 10) || 50;
    const events = cache.getEvents(limit);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
