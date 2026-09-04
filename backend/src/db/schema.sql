CREATE TABLE IF NOT EXISTS shipments (
  id INTEGER PRIMARY KEY,
  sender TEXT NOT NULL,
  carrier TEXT NOT NULL,
  receiver TEXT NOT NULL,
  description TEXT NOT NULL,
  status INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  last_updated INTEGER NOT NULL,
  access_key TEXT
);

CREATE TABLE IF NOT EXISTS status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shipment_id INTEGER NOT NULL,
  status INTEGER NOT NULL,
  updater TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (shipment_id) REFERENCES shipments(id)
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shipment_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  status INTEGER,
  actor TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  tx_hash TEXT NOT NULL,
  block_number INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shipment_id INTEGER NOT NULL,
    file_hash TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    uploader TEXT NOT NULL,
    uploaded_at INTEGER NOT NULL,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id)
);
