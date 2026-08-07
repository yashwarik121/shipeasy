require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  rpcUrl: process.env.RPC_URL || 'http://127.0.0.1:8545',
  contractAddress: process.env.CONTRACT_ADDRESS || '',
  explorerUrl: process.env.EXPLORER_URL || 'https://amoy.polygonscan.com',
};
