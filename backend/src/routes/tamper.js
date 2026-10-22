const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const router = express.Router();

function computeFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', err => reject(err));
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve('0x' + hash.digest('hex')));
  });
}

function computeBufferHash(buffer) {
  const hash = crypto.createHash('sha256');
  hash.update(buffer);
  return '0x' + hash.digest('hex');
}

// GET /api/tamper/audit - Run audit on all cached shipments & documents against contract & disk
router.get('/tamper/audit', async (req, res) => {
  try {
    const { cache, blockchain } = req.app.locals;
    const shipments = cache.getAllShipments();
    const auditResults = [];

    for (const s of shipments) {
      let chainShipment = null;
      let chainMatch = true;
      let mismatchReason = null;

      if (blockchain && blockchain.contract) {
        try {
          chainShipment = await blockchain.getShipment(s.id);
          if (
            chainShipment.sender.toLowerCase() !== s.sender.toLowerCase() ||
            chainShipment.carrier.toLowerCase() !== s.carrier.toLowerCase() ||
            chainShipment.receiver.toLowerCase() !== s.receiver.toLowerCase() ||
            chainShipment.status !== s.status ||
            chainShipment.accessKey !== s.accessKey
          ) {
            chainMatch = false;
            mismatchReason = 'Cached shipment data differs from on-chain state';
          }
        } catch (err) {
          chainMatch = false;
          mismatchReason = `Blockchain read error: ${err.message}`;
        }
      }

      // Check documents for this shipment
      const docs = cache.getDocuments(s.id);
      const docsAudit = [];

      for (const d of docs) {
        let fileExists = false;
        let diskHash = null;
        let fileIntegrityMatch = false;

        if (fs.existsSync(d.filePath)) {
          fileExists = true;
          diskHash = await computeFileHash(d.filePath);
          fileIntegrityMatch = (diskHash === d.fileHash);
        }

        docsAudit.push({
          id: d.id,
          fileName: d.fileName,
          expectedHash: d.fileHash,
          diskHash,
          fileExists,
          integrityMatch: fileIntegrityMatch
        });
      }

      auditResults.push({
        shipmentId: s.id,
        description: s.description,
        status: s.status,
        accessKey: s.accessKey,
        chainMatch,
        mismatchReason,
        documents: docsAudit
      });
    }

    const hasAnyTamper = auditResults.some(r => !r.chainMatch || r.documents.some(d => !d.integrityMatch));

    res.json({
      status: 'ok',
      timestamp: Math.floor(Date.now() / 1000),
      tamperDetected: hasAnyTamper,
      audit: auditResults
    });
  } catch (error) {
    console.error('Audit failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tamper/simulate - Simulates a 1-byte attack on an input payload or document
router.post('/tamper/simulate', (req, res) => {
  try {
    const { text, byteIndex } = req.body;
    const content = text || 'SHIPPING INVOICE #98231 - AMOUNT: $450,000.00 USD - CUSTODY: CONFIRMED';

    const originalBuf = Buffer.from(content, 'utf-8');
    const originalHash = computeBufferHash(originalBuf);

    // Target a specific byte or middle byte
    const targetIdx = (typeof byteIndex === 'number' && byteIndex >= 0 && byteIndex < originalBuf.length)
      ? byteIndex
      : Math.floor(originalBuf.length / 2);

    // Copy buffer and flip a single bit / byte
    const tamperedBuf = Buffer.from(originalBuf);
    const originalByteVal = tamperedBuf[targetIdx];
    // Flip least significant bit or increment
    tamperedBuf[targetIdx] = originalByteVal ^ 0x01;
    const tamperedByteVal = tamperedBuf[targetIdx];

    const tamperedHash = computeBufferHash(tamperedBuf);

    // Count differing bits between hashes
    let bitDiffs = 0;
    const h1 = Buffer.from(originalHash.slice(2), 'hex');
    const h2 = Buffer.from(tamperedHash.slice(2), 'hex');
    for (let i = 0; i < Math.min(h1.length, h2.length); i++) {
      let xor = h1[i] ^ h2[i];
      while (xor > 0) {
        if (xor & 1) bitDiffs++;
        xor >>= 1;
      }
    }

    res.json({
      originalContent: content,
      tamperedContent: tamperedBuf.toString('utf-8', 0, 500),
      byteIndex: targetIdx,
      originalByte: `0x${originalByteVal.toString(16).padStart(2, '0').toUpperCase()} ('${String.fromCharCode(originalByteVal)}')`,
      tamperedByte: `0x${tamperedByteVal.toString(16).padStart(2, '0').toUpperCase()} ('${String.fromCharCode(tamperedByteVal)}')`,
      originalHash,
      tamperedHash,
      hashMatch: originalHash === tamperedHash,
      avalancheEffect: {
        totalBitsChanged: bitDiffs,
        totalHashBits: 256,
        percentageFlipped: ((bitDiffs / 256) * 100).toFixed(1) + '%'
      }
    });
  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tamper/modify-cache - Live demonstration of attacking SQLite cache directly
router.post('/tamper/modify-cache', (req, res) => {
  try {
    const { shipmentId, tamperedStatus, tamperedAccessKey, tamperedDescription } = req.body;
    const cache = req.app.locals.cache;
    const id = Number(shipmentId);

    const s = cache.getShipment(id);
    if (!s) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    // Apply modification in local DB
    cache.db.run(
      `UPDATE shipments SET 
        status = ?, 
        access_key = ?, 
        description = ?, 
        last_updated = ? 
       WHERE id = ?`,
      [
        tamperedStatus !== undefined ? Number(tamperedStatus) : s.status,
        tamperedAccessKey !== undefined ? tamperedAccessKey : s.accessKey,
        tamperedDescription !== undefined ? tamperedDescription : s.description,
        Math.floor(Date.now() / 1000),
        id
      ]
    );
    cache._save();

    res.json({
      success: true,
      message: `Shipment #${id} modified in local database cache. Run audit to detect divergence!`,
      currentRecord: cache.getShipment(id)
    });
  } catch (error) {
    console.error('Modify cache error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tamper/tamper-doc-file - Physically alters 1 byte in a stored upload file on disk
router.post('/tamper/tamper-doc-file', (req, res) => {
  try {
    const { docId } = req.body;
    const cache = req.app.locals.cache;
    const doc = cache.getDocument(Number(docId));

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (!fs.existsSync(doc.filePath)) {
      return res.status(404).json({ error: 'Document file does not exist on disk' });
    }

    const buf = fs.readFileSync(doc.filePath);
    if (buf.length === 0) {
      return res.status(400).json({ error: 'File is empty' });
    }

    // Flip 1 bit in byte 0
    buf[0] = buf[0] ^ 0x01;
    fs.writeFileSync(doc.filePath, buf);

    const newHash = computeBufferHash(buf);

    res.json({
      success: true,
      docId: doc.id,
      fileName: doc.fileName,
      originalExpectedHash: doc.fileHash,
      newDiskHash: newHash,
      tampered: doc.fileHash !== newHash
    });
  } catch (error) {
    console.error('Tamper doc file error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tamper/restore-cache - Restores cache by resyncing from smart contract
router.post('/tamper/restore-cache', async (req, res) => {
  try {
    const { cache, blockchain } = req.app.locals;
    if (!blockchain || !blockchain.contract) {
      return res.status(400).json({ error: 'Blockchain service not connected' });
    }

    const count = await blockchain.getShipmentCount();
    for (let i = 0; i < count; i++) {
      const shipment = await blockchain.getShipment(i);
      const history = await blockchain.getHistory(i);
      cache.syncShipmentFromChain(i, shipment, history);
    }

    res.json({
      success: true,
      message: `Resynced ${count} shipments from immutable blockchain. All unauthorized local tampering eradicated.`
    });
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
