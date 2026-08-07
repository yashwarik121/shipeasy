export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

export const CONTRACT_ABI = [
  "function createShipment(address carrier, address receiver, string description)",
  "function advanceStatus(uint256 id, uint8 nextStatus)",
  "function getShipment(uint256 id) view returns (uint256, address, address, address, string, uint8, uint256, uint256)",
  "function getHistory(uint256 id) view returns (tuple(uint8 status, address updatedBy, uint256 timestamp)[])",
  "function getShipmentCount() view returns (uint256)",
  "function shipmentCount() view returns (uint256)",
  "event ShipmentCreated(uint256 indexed id, address indexed sender, address carrier, address receiver, string description, uint256 timestamp)",
  "event StatusUpdated(uint256 indexed id, uint8 status, address indexed updatedBy, uint256 timestamp)"
];

export const STATUS_LABELS = ['Created', 'Picked Up', 'In Transit', 'Delivered'];

export const EXPLORER_URL = 'https://amoy.polygonscan.com';
