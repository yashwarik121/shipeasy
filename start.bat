@echo off
echo ========================================================
echo        STARTING SHIP.EAZY LOCAL DEVELOPMENT STACK
echo ========================================================

echo [1/3] Launching Local Ganache Blockchain (Port 8545)...
start "ShipEazy Blockchain (Port 8545)" cmd /k "ganache --wallet.mnemonic \"test test test test test test test test test test test junk\" --wallet.defaultBalance 10000 --chain.chainId 31337 --database.dbPath \"ganache_db\" --server.port 8545"

timeout /t 3 /nobreak >nul

echo [2/3] Launching Express Backend API (Port 3001)...
start "ShipEazy Backend (Port 3001)" cmd /k "cd backend && node src/server.js"

timeout /t 2 /nobreak >nul

echo [3/3] Launching Vite React Frontend (Port 5173)...
start "ShipEazy Frontend (Port 5173)" cmd /k "cd frontend && npx vite --host"

echo ========================================================
echo All 3 services are running!
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3001
echo RPC Node: http://127.0.0.1:8545
echo ========================================================
