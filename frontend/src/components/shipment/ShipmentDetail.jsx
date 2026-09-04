import React, { useState, useEffect } from 'react';
import { getExplorerAddressUrl, getStatusColor, getStatusText, formatTimestamp } from '../../utils/format';
import { useWallet } from '../../context/WalletContext';
import { useContract } from '../../hooks/useContract';
import CustodyEntry from './StatusTimeline';

const ShipmentDetail = ({ shipment, history, readOnly = false }) => {
  const { account } = useWallet();
  const { advanceStatus, getAccessKey } = useContract();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const [documents, setDocuments] = useState([]);
  const [verifications, setVerifications] = useState({});
  const [accessKey, setAccessKey] = useState('');
  const [keyError, setKeyError] = useState('');

  useEffect(() => {
    if (shipment && shipment.id) {
      fetchDocuments();
    }
  }, [shipment]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/shipments/${shipment.id}/documents`);
      if (res.ok) {
        const docs = await res.json();
        setDocuments(docs);
        docs.forEach(doc => verifyDocument(doc.id));
      }
    } catch (err) {
      console.error('Failed to fetch documents', err);
    }
  };

  const verifyDocument = async (docId) => {
    try {
      const res = await fetch(`http://localhost:3001/api/shipments/${shipment.id}/documents/${docId}/verify`);
      if (res.ok) {
        const data = await res.json();
        setVerifications(prev => ({ ...prev, [docId]: data.verified }));
      }
    } catch (err) {
      console.error('Failed to verify document', err);
    }
  };

  const handleRevealKey = async () => {
    try {
      setKeyError('');
      const key = await getAccessKey(shipment.id);
      setAccessKey(key);
    } catch (err) {
      setKeyError(err.message || 'Failed to get access key');
    }
  };

  const handleDownload = async (docId, filename) => {
    let keyToUse = accessKey;
    if (!keyToUse) {
      keyToUse = window.prompt('Enter access key to download this document:');
      if (!keyToUse) return;
    }
    
    try {
      const url = `http://localhost:3001/api/shipments/${shipment.id}/documents/${docId}/download?address=${account}&accessKey=${keyToUse}`;
      const res = await fetch(url);
      
      if (res.status === 403) {
        alert('ACCESS DENIED — invalid key or unauthorized address');
        return;
      }
      
      if (!res.ok) throw new Error('Download failed');
      
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert('Error downloading document');
    }
  };

  if (!shipment) return null;

  const currentStatusText = getStatusText(shipment.status);
  const currentStatusColor = getStatusColor(shipment.status);
  const isDelivered = Number(shipment.status) === 3;

  const isSenderOrReceiver = account && (
    shipment.sender.toLowerCase() === account.toLowerCase() || 
    shipment.receiver.toLowerCase() === account.toLowerCase()
  );

  const handleAdvanceStatus = async () => {
    if (!account) return;
    setLoading(true);
    setError('');
    try {
      const nextStatus = Number(shipment.status) + 1;
      const receipt = await advanceStatus(shipment.id, nextStatus);
      setSuccess({
        blockNumber: receipt.blockNumber,
        txHash: receipt.hash
      });
    } catch (err) {
      setError(err.reason || err.message || 'Failed to update status');
    }
    setLoading(false);
  };

  const canAdvance = () => {
    if (readOnly || !account) return false;
    const lowerAccount = account.toLowerCase();
    const status = Number(shipment.status);
    if (status === 0 && shipment.carrier.toLowerCase() === lowerAccount) return true;
    if (status === 1 && shipment.carrier.toLowerCase() === lowerAccount) return true;
    if (status === 2 && shipment.receiver.toLowerCase() === lowerAccount) return true;
    return false;
  };

  const getNextStatusText = () => {
    const status = Number(shipment.status);
    if (status === 0) return 'PICK UP';
    if (status === 1) return 'MARK IN TRANSIT';
    if (status === 2) return 'CONFIRM DELIVERY';
    return '';
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', border: '3px solid var(--ink)', padding: '32px' }}>
      
      {/* Top Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 className="display-lg" style={{ margin: '0 0 8px 0' }}>SHIPMENT #{String(shipment.id).padStart(3, '0')}</h1>
          <p style={{ margin: 0, fontSize: '16px', lineHeight: '1.5' }}>{shipment.description}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className={`status-text ${currentStatusColor}`} style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {currentStatusText}
          </div>
          {isDelivered && (
            <div className="stamp mt-2" style={{ border: '2px solid var(--verified-green)', color: 'var(--verified-green)', padding: '8px' }}>
              CONFIRMED
            </div>
          )}
        </div>
      </div>

      <div style={{ borderBottom: '3px solid var(--ink)', margin: '0 -32px 32px -32px' }}></div>

      {/* Metadata Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="section-label" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>SENDER</span>
          <a href={getExplorerAddressUrl(shipment.sender)} target="_blank" rel="noopener noreferrer" className="chain-address copy-trigger">
            {shipment.sender}
          </a>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="section-label" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>CARRIER</span>
          <a href={getExplorerAddressUrl(shipment.carrier)} target="_blank" rel="noopener noreferrer" className="chain-address copy-trigger">
            {shipment.carrier}
          </a>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="section-label" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>RECEIVER</span>
          <a href={getExplorerAddressUrl(shipment.receiver)} target="_blank" rel="noopener noreferrer" className="chain-address copy-trigger">
            {shipment.receiver}
          </a>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="section-label" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>INITIATED</span>
          <span className="chain-timestamp">{formatTimestamp(shipment.createdAt || shipment.created_at)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="section-label" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>LAST RECORDED</span>
          <span className="chain-timestamp">{formatTimestamp(shipment.updatedAt || shipment.lastUpdated || shipment.last_updated)}</span>
        </div>
      </div>

      <div style={{ borderBottom: '4px solid var(--ink)', margin: '0 -32px 32px -32px' }}></div>

      {/* CUSTODY TRAIL */}
      <h2 className="section-label mb-4">CUSTODY TRAIL</h2>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {history && history.map((entry, idx) => (
          <CustodyEntry 
            key={idx} 
            entry={{
              status: Number(entry.status),
              updatedBy: entry.updatedBy || entry.updater,
              timestamp: Number(entry.timestamp)
            }}
            index={idx + 1} 
            isLatest={idx === history.length - 1} 
          />
        ))}
      </div>

      {/* ATTACHED DOCUMENTS */}
      {documents.length > 0 && (
        <>
          <div style={{ borderBottom: '4px solid var(--ink)', margin: '32px -32px 32px -32px' }}></div>
          <h2 className="section-label mb-4">ATTACHED DOCUMENTS</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {documents.map(doc => (
              <div key={doc.id} style={{ border: '2px solid var(--ink)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="font-mono mb-2">{doc.filename || doc.fileName}</div>
                  <div className="font-mono text-xs text-steel mb-1">HASH: {(doc.fileHash || '').substring(0, 16)}...</div>
                  <div className="font-mono text-xs text-steel">UPLOADER: {(doc.uploader || '').substring(0, 16)}...</div>
                  <div className="font-mono text-xs text-steel mt-2">{formatTimestamp(doc.uploadedAt || doc.timestamp)}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                  {verifications[doc.id] !== undefined && (
                    <div className="font-mono text-xs font-bold" style={{ color: verifications[doc.id] ? 'var(--verified-green)' : 'var(--seal-red)' }}>
                      {verifications[doc.id] ? '✓ HASH VERIFIED' : '✗ HASH MISMATCH'}
                    </div>
                  )}
                  <button 
                    className="btn btn-primary font-mono" 
                    onClick={() => handleDownload(doc.id, doc.filename || doc.fileName)}
                    style={{ padding: '8px 16px' }}
                  >
                    DOWNLOAD
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ACCESS KEY */}
      {isSenderOrReceiver && (
        <>
          <div style={{ borderBottom: '4px solid var(--ink)', margin: '32px -32px 32px -32px' }}></div>
          <h2 className="section-label mb-4">ACCESS KEY</h2>
          {!accessKey ? (
            <button className="btn font-mono" onClick={handleRevealKey} style={{ border: '2px solid var(--ink)', padding: '12px 24px', background: 'transparent' }}>
              REVEAL ACCESS KEY
            </button>
          ) : (
            <div>
              <div style={{ border: '2px solid var(--ink)', padding: '12px', wordBreak: 'break-all' }} className="font-mono bg-paper mb-2">
                {accessKey}
              </div>
              <p className="font-mono text-xs text-steel mt-2">
                Share this key with authorized parties to grant document access
              </p>
            </div>
          )}
          {keyError && <div className="text-red font-mono mt-2">{keyError}</div>}
        </>
      )}

      {/* ACTION SECTION */}
      {canAdvance() && (
        <div style={{ marginTop: '32px', padding: '24px', border: '2px dashed var(--ink)' }}>
          {error && <div className="text-red font-mono mb-4">[ERROR] {error}</div>}
          <div className={success ? 'animate-stamp-flash' : ''}>
            {!success ? (
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '16px' }}
                onClick={handleAdvanceStatus}
                disabled={loading}
              >
                {loading ? 'SUBMITTING...' : `ADVANCE TO ${getNextStatusText()}`}
              </button>
            ) : (
              <div className="stamp animate-stamp" style={{ border: '2px solid var(--verified-green)', padding: '16px', textAlign: 'center' }}>
                <div className="text-green font-mono font-bold mb-2">STATUS UPDATED ON-CHAIN</div>
                <div className="text-green font-mono text-xs">BLOCK #{success.blockNumber}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ marginTop: '48px', paddingTop: '16px', borderTop: '1px solid var(--steel)' }}>
        <p className="text-steel font-mono text-xs" style={{ margin: 0, textAlign: 'center' }}>
          This trail proves records weren't altered after confirmation. It does not verify physical delivery.
        </p>
      </div>

    </div>
  );
};

export default ShipmentDetail;
