import { EXPLORER_URL } from './contract';

export const truncateAddress = (address, chars = 4) => {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

export const truncateHash = (hash, chars = 6) => {
  if (!hash) return '';
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
};

export const formatTimestamp = (unixSeconds) => {
  if (!unixSeconds) return '';
  const date = new Date(Number(unixSeconds) * 1000);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export const getStatusColor = (status) => {
  switch (Number(status)) {
    case 0: return 'status-created';
    case 1: return 'status-pickedup';
    case 2: return 'status-intransit';
    case 3: return 'status-delivered';
    default: return 'status-created';
  }
};

export const getExplorerTxUrl = (txHash) => {
  if (!txHash) return '#';
  return `${EXPLORER_URL}/tx/${txHash}`;
};

export const getExplorerAddressUrl = (address) => {
  if (!address) return '#';
  return `${EXPLORER_URL}/address/${address}`;
};

export const timeAgo = (unixSeconds) => {
  if (!unixSeconds) return '';
  const seconds = Math.floor((new Date() - new Date(Number(unixSeconds) * 1000)) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' yrs ago';
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' mos ago';
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hr ago';
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' min ago';
  
  return Math.floor(seconds) + ' sec ago';
};
