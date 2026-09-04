const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const shipmentId = req.params.id;
    const dir = path.join(__dirname, '../../data/uploads', shipmentId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

function computeFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', err => reject(err));
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve('0x' + hash.digest('hex')));
  });
}

// POST /api/shipments/:id/documents
router.post('/shipments/:id/documents', upload.single('file'), async (req, res) => {
  try {
    const shipmentId = Number(req.params.id);
    const { address } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    if (!address) {
      // Remove uploaded file since we reject
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'Uploader address is required' });
    }

    const cache = req.app.locals.cache;
    const shipment = cache.getShipment(shipmentId);

    if (!shipment) {
      fs.unlinkSync(file.path);
      return res.status(404).json({ error: 'Shipment not found' });
    }

    const addressLower = address.toLowerCase();
    if (shipment.sender.toLowerCase() !== addressLower && shipment.receiver.toLowerCase() !== addressLower) {
      fs.unlinkSync(file.path);
      return res.status(403).json({ error: 'Only sender or receiver can upload documents' });
    }

    const fileHash = await computeFileHash(file.path);

    const doc = {
      shipmentId,
      fileHash,
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploader: address,
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
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Internal server error' });
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
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/shipments/:id/documents/:docId/download
router.get('/shipments/:id/documents/:docId/download', (req, res) => {
  try {
    const shipmentId = Number(req.params.id);
    const docId = Number(req.params.docId);
    const { address, accessKey } = req.query;

    if (!address || !accessKey) {
      return res.status(400).json({ error: 'address and accessKey are required' });
    }

    const cache = req.app.locals.cache;
    const shipment = cache.getShipment(shipmentId);

    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    const addressLower = address.toLowerCase();
    if (shipment.sender.toLowerCase() !== addressLower && shipment.receiver.toLowerCase() !== addressLower) {
      return res.status(403).json({ error: 'Access denied: not sender or receiver' });
    }

    if (shipment.accessKey !== accessKey) {
      return res.status(403).json({ error: 'Access denied: invalid accessKey' });
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
    res.status(500).json({ error: 'Internal server error' });
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
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
