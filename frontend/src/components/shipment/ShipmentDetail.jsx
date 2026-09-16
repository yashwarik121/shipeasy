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
  const [enteredKey, setEnteredKey] = useState('');
  const [keyValidated, setKeyValidated] = useState(false);
  const [keyMsg, setKeyMsg] = useState('');

  useEffect(() => {
    if (shipment && shipment.id != null) {
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

  const handleValidateKey = async () => {
    if (!enteredKey.trim()) {
      setKeyMsg('ENTER AN ACCESS KEY');
      setKeyValidated(false);
      return;
    }
    // Try a test download to validate the key
    const addressToUse = account || shipment.sender;
    try {
      const res = await fetch(
        `http://localhost:3001/api/shipments/${shipment.id}/documents/${documents[0]?.id}/download?address=${addressToUse}&accessKey=${enteredKey.trim()}`,
        { method: 'HEAD' }
      );
      if (res.ok || res.status === 200) {
        setKeyValidated(true);
        setKeyMsg('✓ KEY VALIDATED — DOCUMENTS UNLOCKED');
      } else {
        setKeyValidated(false);
        setKeyMsg('✗ INVALID KEY OR UNAUTHORIZED ADDRESS');
      }
    } catch {
      // If HEAD not supported, just accept the key and let download validate
      setKeyValidated(true);
      setKeyMsg('✓ KEY ACCEPTED');
    }
  };

  const getFileUrl = (docId) => {
    const addressToUse = account || shipment.sender;
    return `http://localhost:3001/api/shipments/${shipment.id}/documents/${docId}/download?address=${addressToUse}&accessKey=${enteredKey.trim()}`;
  };

  const handleView = async (docId, filename) => {
    if (!keyValidated) {
      setKeyMsg('⚠ ENTER AND VALIDATE ACCESS KEY FIRST');
      return;
    }
    try {
      const res = await fetch(getFileUrl(docId));
      if (res.status === 403) { setKeyMsg('✗ ACCESS DENIED'); setKeyValidated(false); return; }
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      alert('Error viewing document');
    }
  };

  const handleDownload = async (docId, filename) => {
    if (!keyValidated) {
      setKeyMsg('⚠ ENTER AND VALIDATE ACCESS KEY FIRST');
      return;
    }
    try {
      const res = await fetch(getFileUrl(docId));
      if (res.status === 403) { setKeyMsg('✗ ACCESS DENIED'); setKeyValidated(false); return; }
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
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

          {/* Access Key Input */}
          <div style={{ border: '2px solid var(--ink)', padding: '16px', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span className="font-mono text-xs" style={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>🔑 ACCESS KEY:</span>
            <input
              type="text"
              value={enteredKey}
              onChange={(e) => { setEnteredKey(e.target.value); setKeyValidated(false); setKeyMsg(''); }}
              placeholder="Enter access key to unlock documents..."
              className="font-mono"
              style={{
                flex: 1, padding: '8px 12px', border: '2px solid var(--steel)',
                background: 'transparent', fontSize: '12px', borderRadius: 0,
                color: 'var(--ink)'
              }}
            />
            <button
              className="btn font-mono"
              style={{ padding: '8px 16px', fontSize: '12px', whiteSpace: 'nowrap' }}
              onClick={handleValidateKey}
            >
              VALIDATE
            </button>
          </div>
          {keyMsg && (
            <div className="font-mono text-xs mb-4" style={{ color: keyValidated ? 'var(--verified-green)' : 'var(--seal-red)', fontWeight: 'bold' }}>
              {keyMsg}
            </div>
          )}

          {/* Document List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {documents.map(doc => (
              <div key={doc.id} style={{ border: '2px solid var(--ink)', padding: '16px', opacity: keyValidated ? 1 : 0.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div className="font-mono mb-2" style={{ fontWeight: 'bold' }}>{doc.filename || doc.fileName}</div>
                    <div className="font-mono text-xs text-steel mb-1">HASH: {(doc.fileHash || '').substring(0, 20)}...</div>
                    <div className="font-mono text-xs text-steel">{formatTimestamp(doc.uploadedAt || doc.timestamp)}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    {verifications[doc.id] !== undefined && (
                      <div className="font-mono text-xs font-bold" style={{ color: verifications[doc.id] ? 'var(--verified-green)' : 'var(--seal-red)' }}>
                        {verifications[doc.id] ? '✓ HASH VERIFIED' : '✗ HASH MISMATCH'}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn font-mono"
                        style={{ padding: '6px 14px', fontSize: '11px' }}
                        onClick={() => handleView(doc.id, doc.filename || doc.fileName)}
                      >
                        VIEW
                      </button>
                      <button
                        className="btn btn-primary font-mono"
                        style={{ padding: '6px 14px', fontSize: '11px' }}
                        onClick={() => handleDownload(doc.id, doc.filename || doc.fileName)}
                      >
                        DOWNLOAD
                      </button>
                    </div>
                  </div>
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
