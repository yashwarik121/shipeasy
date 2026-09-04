export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

export const CONTRACT_ABI = [
  "function createShipment(address carrier, address receiver, string description)",
  "function advanceStatus(uint256 id, uint8 nextStatus)",
  "function getShipment(uint256 id) view returns (uint256, address, address, address, string, uint8, bytes32, uint256, uint256)",
  "function getHistory(uint256 id) view returns (tuple(uint8 status, address updater, uint256 timestamp)[])",
  "function getShipmentCount() view returns (uint256)",
  "function shipmentCount() view returns (uint256)",
  "function addDocument(uint256 id, bytes32 fileHash, string fileName)",
  "function getDocuments(uint256 id) view returns (tuple(bytes32 fileHash, string fileName, address uploader, uint256 timestamp)[])",
  "function getAccessKey(uint256 id) view returns (bytes32)",
  "event ShipmentCreated(uint256 indexed id, address indexed sender, address carrier, address receiver, string description, bytes32 accessKey, uint256 timestamp)",
  "event StatusUpdated(uint256 indexed id, uint8 status, address indexed updater, uint256 timestamp)",
  "event DocumentAdded(uint256 indexed id, bytes32 fileHash, string fileName, address indexed uploader, uint256 timestamp)"
];

export const STATUS_LABELS = ['Created', 'Picked Up', 'In Transit', 'Delivered'];

export const EXPLORER_URL = 'https://amoy.polygonscan.com';
