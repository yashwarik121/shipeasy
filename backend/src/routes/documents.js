const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const shipmentId = String(req.params.id);
    const dir = path.join(__dirname, '../../data/uploads', shipmentId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Sanitize filename to avoid filesystem issues
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._\- ()]/g, '_');
    cb(null, uniqueSuffix + '-' + safeName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

function computeFileHash(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    return '0x' + hash;
  } catch (err) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      stream.on('error', reject);
      stream.on('data', chunk => hash.update(chunk));
      stream.on('end', () => resolve('0x' + hash.digest('hex')));
    });
  }
}

// POST /api/shipments/:id/documents
router.post('/shipments/:id/documents', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ error: 'File size exceeds maximum 50MB limit.' });
        }
        return res.status(400).json({ error: `File upload error: ${err.message}` });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    }
    next();
  });
}, async (req, res) => {
  try {
    const shipmentId = Number(req.params.id);
    if (isNaN(shipmentId)) {
      if (req.file && fs.existsSync(req.file.path)) try { fs.unlinkSync(req.file.path); } catch (e) {}
      return res.status(400).json({ error: 'Invalid shipment ID' });
    }

    const { address, accessKey } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const cache = req.app.locals.cache;
    const blockchain = req.app.locals.blockchain;
    let shipment = cache.getShipment(shipmentId);

    // If cache hasn't synced the new shipment yet, pull directly from chain
    if (!shipment && blockchain && blockchain.contract) {
      try {
        const chainShipment = await blockchain.getShipment(shipmentId);
        const chainHistory = await blockchain.getHistory(shipmentId);
        cache.syncShipmentFromChain(shipmentId, chainShipment, chainHistory);
        shipment = cache.getShipment(shipmentId);
      } catch (err) {
        console.warn('Could not sync shipment directly from chain:', err.message);
      }
    }

    if (!shipment) {
      if (fs.existsSync(file.path)) try { fs.unlinkSync(file.path); } catch (e) {}
      return res.status(404).json({ error: `Shipment #${shipmentId} not found` });
    }

    const addressLower = (address || '').trim().toLowerCase();
    const isSender = shipment.sender && shipment.sender.toLowerCase() === addressLower;
    const isReceiver = shipment.receiver && shipment.receiver.toLowerCase() === addressLower;
    const hasValidKey = accessKey && shipment.accessKey === accessKey;

    if (!isSender && !isReceiver && !hasValidKey) {
      if (fs.existsSync(file.path)) try { fs.unlinkSync(file.path); } catch (e) {}
      return res.status(403).json({ error: 'Only authorized sender or receiver can upload documents' });
    }

    const fileHash = await computeFileHash(file.path);

    const doc = {
      shipmentId,
      fileHash,
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype || 'application/octet-stream',
      uploader: address || shipment.sender,
      uploadedAt: Math.floor(Date.now() / 1000)
    };

    const docId = cache.addDocument(doc);

    res.status(201).json({
      id: docId,
      fileHash: doc.fileHash,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    res.status(500).json({ error: error.message || 'Internal server error during document processing' });
  }
});

// GET /api/shipments/:id/documents
router.get('/shipments/:id/documents', (req, res) => {
  try {
    const shipmentId = Number(req.params.id);
    const cache = req.app.locals.cache;
    
    const shipment = cache.getShipment(shipmentId);
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    const docs = cache.getDocuments(shipmentId);
    
    const result = docs.map(d => ({
      id: d.id,
      fileHash: d.fileHash,
      fileName: d.fileName,
      fileSize: d.fileSize,
      mimeType: d.mimeType,
      uploader: d.uploader,
      uploadedAt: d.uploadedAt
    }));

    res.json(result);
  } catch (error) {
    console.error('Error getting documents:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/shipments/:id/documents/:docId/download
router.get('/shipments/:id/documents/:docId/download', (req, res) => {
  try {
    const shipmentId = Number(req.params.id);
    const docId = Number(req.params.docId);
    const { address, accessKey } = req.query;

    if (!address && !accessKey) {
      return res.status(400).json({ error: 'address or accessKey is required' });
    }

    const cache = req.app.locals.cache;
    const shipment = cache.getShipment(shipmentId);

    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    const addressLower = (address || '').toLowerCase();
    const isParty = addressLower && (shipment.sender.toLowerCase() === addressLower || shipment.receiver.toLowerCase() === addressLower);
    const hasKey = accessKey && shipment.accessKey === accessKey;

    if (!isParty && !hasKey) {
      return res.status(403).json({ error: 'Access denied: must be sender, receiver, or provide valid accessKey' });
    }

    const doc = cache.getDocument(docId);
    if (!doc || doc.shipmentId !== shipmentId) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (!fs.existsSync(doc.filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${doc.fileName}"`);
    const fileStream = fs.createReadStream(doc.filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/shipments/:id/documents/:docId/verify
router.get('/shipments/:id/documents/:docId/verify', async (req, res) => {
  try {
    const shipmentId = Number(req.params.id);
    const docId = Number(req.params.docId);
    const cache = req.app.locals.cache;

    const doc = cache.getDocument(docId);
    if (!doc || doc.shipmentId !== shipmentId) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (!fs.existsSync(doc.filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    const currentHash = await computeFileHash(doc.filePath);
    const onChainMatch = currentHash === doc.fileHash;

    res.json({
      stored: true,
      fileHash: currentHash,
      onChainMatch
    });
  } catch (error) {
    console.error('Error verifying document:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

module.exports = router;
