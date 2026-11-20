# SHIP.EAZY — Decentralized Custody & Shipment Tracking System

A brutalist Web3 supply chain verification system with Proof-of-Delivery OTP, tamper-evident audit trails, and multi-identity role controls.

---

## 🚀 Quick Start in VS Code (3 Methods)

### Method 1: The 1-Click VS Code Build Task (Easiest)
1. Open the project folder in VS Code (`File > Open Folder`).
2. Press **`Ctrl + Shift + B`** (or go to menu **Terminal > Run Build Task...**).
3. Select **`Start All Services (Ship.Eazy)`**.
4. VS Code will automatically open 3 terminal splits and start all three services together.

---

### Method 2: 1-Click Startup Script
Open the integrated terminal in VS Code (`Ctrl + ~`) and run:
```powershell
.\start.bat
```
*(Or double-click `start.bat` in Windows Explorer)*. It will launch the 3 services in separate labeled windows.

---

### Method 3: Manual 3-Terminal Split
Open 3 terminal tabs in VS Code (`Terminal > New Terminal`):

#### Terminal 1 — Blockchain RPC (Port 8545):
```powershell
ganache --wallet.mnemonic "test test test test test test test test test test test junk" --wallet.defaultBalance 10000 --chain.chainId 31337 --database.dbPath "ganache_db" --server.port 8545
```

#### Terminal 2 — Backend API (Port 3001):
```powershell
cd backend
node src/server.js
```

#### Terminal 3 — Frontend UI (Port 5173):
```powershell
cd frontend
npx vite --host
```

---

## 🌐 Endpoints & Ports

| Service | Address | Description |
| :--- | :--- | :--- |
| **Frontend UI** | [http://localhost:5173](http://localhost:5173) | Vite + React Brutalist UI |
| **Backend API** | [http://localhost:3001](http://localhost:3001) | Express REST API + Tamper Audit |
| **Blockchain RPC** | `http://127.0.0.1:8545` | Local Ganache RPC Node (`Chain ID: 31337`) |
| **Contract** | `0x8A791620dd6260079BF849Dc5567aDC3F2FdC318` | Deployed `ShipmentTracker` |

---

## 👥 Role & Identity Flow

- **Sender**: Dispatches shipment, generates 6-digit Delivery OTP, holds cryptographic access key, attaches documents.
- **Carrier**: Moves cargo through waypoints: `PICK UP` (Stage 1) → `IN TRANSIT` (Stage 2) → enters Receiver's OTP at doorstep to finalize `DELIVERED` (Stage 3). Carrier never sees the OTP or access key beforehand.
- **Receiver**: Receives parcel, holds the delivery OTP and access key, downloads unlocked documents, presents OTP to carrier upon physical inspection.

---

## 🦊 Connecting MetaMask Locally

1. Open [http://localhost:5173](http://localhost:5173).
2. Click **`🦊 METAMASK`** in the header.
3. Switch network to **Ganache / Hardhat Local**:
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency**: `ETH`
4. If you need test gas funds, click your wallet pill `[🦊 METAMASK ▾]` and click **`💧 GET 100 TEST ETH`**.
