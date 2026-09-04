const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

class CacheService {
  constructor() {
    this.db = null;
    this.dbPath = path.join(__dirname, '../../data/cache.db');
    this.ready = this._init();
  }

  async _init() {
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const SQL = await initSqlJs();

    if (fs.existsSync(this.dbPath)) {
      const buffer = fs.readFileSync(this.dbPath);
      this.db = new SQL.Database(buffer);
    } else {
      this.db = new SQL.Database();
    }

    const schema = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf-8');
    this.db.run(schema);
    this._save();
  }

  _save() {
    const data = this.db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(this.dbPath, buffer);
  }

  upsertShipment(shipment) {
    this.db.run(
      `INSERT OR REPLACE INTO shipments (id, sender, carrier, receiver, description, status, created_at, last_updated, access_key)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [shipment.id, shipment.sender, shipment.carrier, shipment.receiver, shipment.description, shipment.status, shipment.createdAt, shipment.lastUpdated, shipment.accessKey]
    );
    this._save();
  }

  addHistoryEntry(shipmentId, entry) {
    this.db.run(
      `INSERT INTO status_history (shipment_id, status, updater, timestamp)
       VALUES (?, ?, ?, ?)`,
      [shipmentId, entry.status, entry.updater, entry.timestamp]
    );
    this._save();
  }

  addEvent(event) {
    this.db.run(
      `INSERT INTO events (shipment_id, event_type, status, actor, timestamp, tx_hash, block_number)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [event.shipmentId, event.eventType, event.status, event.actor, event.timestamp, event.txHash, event.blockNumber]
    );
    this._save();
  }

  addDocument(doc) {
    this.db.run(
      `INSERT INTO documents (shipment_id, file_hash, file_name, file_path, file_size, mime_type, uploader, uploaded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [doc.shipmentId, doc.fileHash, doc.fileName, doc.filePath, doc.fileSize, doc.mimeType, doc.uploader, doc.uploadedAt]
    );
    this._save();
    const result = this.db.exec('SELECT last_insert_rowid() AS id');
    return result[0].values[0][0];
  }

  getDocuments(shipmentId) {
    const result = this.db.exec('SELECT * FROM documents WHERE shipment_id = ? ORDER BY uploaded_at DESC', [shipmentId]);
    if (!result.length) return [];
    const cols = result[0].columns;
    return result[0].values.map(row => {
      const obj = {};
      cols.forEach((col, i) => obj[col] = row[i]);
      return {
        id: obj.id,
        shipmentId: obj.shipment_id,
        fileHash: obj.file_hash,
        fileName: obj.file_name,
        filePath: obj.file_path,
        fileSize: obj.file_size,
        mimeType: obj.mime_type,
        uploader: obj.uploader,
        uploadedAt: obj.uploaded_at
      };
    });
  }

  getDocument(docId) {
    const result = this.db.exec('SELECT * FROM documents WHERE id = ?', [docId]);
    if (!result.length || !result[0].values.length) return null;
    const cols = result[0].columns;
    const row = result[0].values[0];
    const obj = {};
    cols.forEach((col, i) => obj[col] = row[i]);
    return {
      id: obj.id,
      shipmentId: obj.shipment_id,
      fileHash: obj.file_hash,
      fileName: obj.file_name,
      filePath: obj.file_path,
      fileSize: obj.file_size,
      mimeType: obj.mime_type,
      uploader: obj.uploader,
      uploadedAt: obj.uploaded_at
    };
  }

  getShipment(id) {
    const result = this.db.exec('SELECT * FROM shipments WHERE id = ?', [id]);
    if (!result.length || !result[0].values.length) return null;
    const cols = result[0].columns;
    const row = result[0].values[0];
    const obj = {};
    cols.forEach((col, i) => obj[col] = row[i]);
    return {
      id: obj.id,
      sender: obj.sender,
      carrier: obj.carrier,
      receiver: obj.receiver,
      description: obj.description,
      status: obj.status,
      createdAt: obj.created_at,
      lastUpdated: obj.last_updated,
      accessKey: obj.access_key
    };
  }

  getAllShipments() {
    const result = this.db.exec('SELECT * FROM shipments ORDER BY id ASC');
    if (!result.length) return [];
    const cols = result[0].columns;
    return result[0].values.map(row => {
      const obj = {};
      cols.forEach((col, i) => obj[col] = row[i]);
      return {
        id: obj.id,
        sender: obj.sender,
        carrier: obj.carrier,
        receiver: obj.receiver,
        description: obj.description,
        status: obj.status,
        createdAt: obj.created_at,
        lastUpdated: obj.last_updated,
        accessKey: obj.access_key
      };
    });
  }

  getHistory(id) {
    const result = this.db.exec('SELECT * FROM status_history WHERE shipment_id = ? ORDER BY timestamp ASC', [id]);
    if (!result.length) return [];
    const cols = result[0].columns;
    return result[0].values.map(row => {
      const obj = {};
      cols.forEach((col, i) => obj[col] = row[i]);
      return {
        id: obj.id,
        shipmentId: obj.shipment_id,
        status: obj.status,
        updater: obj.updater,
        timestamp: obj.timestamp
      };
    });
  }

  getEvents(limit = 50) {
    const result = this.db.exec('SELECT * FROM events ORDER BY block_number DESC LIMIT ?', [limit]);
    if (!result.length) return [];
    const cols = result[0].columns;
    return result[0].values.map(row => {
      const obj = {};
      cols.forEach((col, i) => obj[col] = row[i]);
      return {
        id: obj.id,
        shipmentId: obj.shipment_id,
        eventType: obj.event_type,
        status: obj.status,
        actor: obj.actor,
        timestamp: obj.timestamp,
        txHash: obj.tx_hash,
        blockNumber: obj.block_number,
        createdAt: obj.created_at
      };
    });
  }

  syncShipmentFromChain(id, shipmentData, historyData) {
    this.upsertShipment(shipmentData);
    this.db.run('DELETE FROM status_history WHERE shipment_id = ?', [id]);
    for (const entry of historyData) {
      this.db.run(
        'INSERT INTO status_history (shipment_id, status, updater, timestamp) VALUES (?, ?, ?, ?)',
        [id, entry.status, entry.updater, entry.timestamp]
      );
    }
    this._save();
  }
}

module.exports = CacheService;
