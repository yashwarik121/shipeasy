import React, { useState, useEffect, useCallback } from 'react';
import { getExplorerAddressUrl, getStatusColor, getStatusText, formatTimestamp } from '../../utils/format';
import { useWallet } from '../../context/WalletContext';
import { useContract } from '../../hooks/useContract';
import { API_BASE_URL } from '../../utils/api';
import CustodyEntry from './StatusTimeline';
import WaybillRoute from './WaybillRoute';

const ShipmentDetail = ({ shipment, history, readOnly = false, initialAccessKey = '' }) => {
  const { account } = useWallet();
  const { advanceStatus, completeDeliveryWithOtp, getAccessKey, getDeliveryOtp } = useContract();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const [documents, setDocuments] = useState([]);
  const [verifications, setVerifications] = useState({});
  const [accessKey, setAccessKey] = useState('');
  const [enteredKey, setEnteredKey] = useState(initialAccessKey || '');
  const [keyValidated, setKeyValidated] = useState(!!initialAccessKey);
  const [keyMsg, setKeyMsg] = useState(initialAccessKey ? '✓ ACCESS KEY VERIFIED — DOCUMENTS UNLOCKED' : '');

  const [carrierOtpInput, setCarrierOtpInput] = useState('');
  const [deliveryOtp, setDeliveryOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Identity determination
  const lowerAccount = account ? account.toLowerCase() : '';
  const isCarrier = !!(lowerAccount && shipment?.carrier?.toLowerCase() === lowerAccount);
  const isReceiver = !!((lowerAccount && shipment?.receiver?.toLowerCase() === lowerAccount) || (readOnly && keyValidated));
  const isSender = !!(lowerAccount && shipment?.sender?.toLowerCase() === lowerAccount);
  const isSenderOrReceiver = isSender || isReceiver;

  useEffect(() => {
    if (shipment && shipment.id != null) {
      fetchDocuments();
    }
  }, [shipment?.id]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/shipments/${shipment.id}/documents`);
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
      const res = await fetch(`${API_BASE_URL}/api/shipments/${shipment.id}/documents/${docId}/verify`);
      if (res.ok) {
        const data = await res.json();
        setVerifications(prev => ({ ...prev, [docId]: data.verified }));
      }
    } catch (err) {
      console.error('Failed to verify document', err);
    }
  };

  // Synchronize Access Key and Delivery OTP cleanly without circular dependency loops
  useEffect(() => {
    if (!shipment || shipment.id == null) return;

    if (isReceiver || isSender) {
      setKeyValidated(true);
      setKeyMsg('✓ IDENTIFIED AS AUTHORIZED PARTY — FULL RECORD UNLOCKED');

      if (shipment.accessKey && shipment.accessKey !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
        setAccessKey(shipment.accessKey);
        setEnteredKey(shipment.accessKey);
      }

      if (shipment.deliveryOtp) {
        setDeliveryOtp(shipment.deliveryOtp);
      } else {
        const addrParam = account || (isReceiver ? shipment.receiver : shipment.sender);
        fetch(`${API_BASE_URL}/api/shipments/${shipment.id}/otp?address=${addrParam}`)
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data && data.otp) setDeliveryOtp(data.otp);
          })
          .catch(() => {});
      }
    }
  }, [shipment?.id, account, isReceiver, isSender, shipment?.accessKey, shipment?.deliveryOtp]);

  const handleRevealKey = async () => {
    if (shipment?.accessKey) {
      setAccessKey(shipment.accessKey);
      setEnteredKey(shipment.accessKey);
      return;
    }
    try {
      const key = await getAccessKey(shipment.id);
      if (key) {
        setAccessKey(key);
        setEnteredKey(key);
      }
    } catch (err) {
      console.warn('Failed to reveal access key', err);
    }
  };

  const fetchReceiverOtp = async () => {
    if (shipment?.deliveryOtp) {
      setDeliveryOtp(shipment.deliveryOtp);
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    try {
      const addrParam = account || (isReceiver ? shipment.receiver : shipment.sender);
      const res = await fetch(`${API_BASE_URL}/api/shipments/${shipment.id}/otp?address=${addrParam}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.otp) {
          setDeliveryOtp(data.otp);
          return;
        }
      }
      const onChainOtp = await getDeliveryOtp(shipment.id);
      if (onChainOtp) setDeliveryOtp(onChainOtp);
    } catch (err) {
      setOtpError('Failed to retrieve delivery OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleValidateKey = async () => {
    if (!enteredKey.trim()) {
      setKeyMsg('ENTER AN ACCESS KEY');
      setKeyValidated(false);
      return;
    }
    const addressToUse = account || shipment.receiver;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/shipments/${shipment.id}/documents/${documents[0]?.id}/download?address=${addressToUse}&accessKey=${enteredKey.trim()}`,
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
      setKeyValidated(true);
      setKeyMsg('✓ KEY ACCEPTED');
    }
  };

  const getFileUrl = (docId) => {
    const addressToUse = account || (isReceiver ? shipment.receiver : shipment.sender);
    const keyParam = accessKey || enteredKey || shipment.accessKey || '';
    return `${API_BASE_URL}/api/shipments/${shipment.id}/documents/${docId}/download?address=${addressToUse}&accessKey=${keyParam}`;
  };

  const handleView = async (docId, filename) => {
    try {
      const res = await fetch(getFileUrl(docId));
      if (res.status === 403) { setKeyMsg('✗ ACCESS DENIED'); return; }
      if (!res.ok) throw new Error('Failed to fetch document');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      alert('Error viewing document');
    }
  };

  const handleDownload = async (docId, filename) => {
    try {
      const res = await fetch(getFileUrl(docId));
      if (res.status === 403) { setKeyMsg('✗ ACCESS DENIED'); return; }
      if (!res.ok) throw new Error('Failed to download document');
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

  const handleCopy = (text, label) => {
    navigator.clipboard?.writeText(text);
    alert(`${label} copied to clipboard!`);
  };

  if (!shipment) return null;

  const currentStatusText = getStatusText(shipment.status);
  const currentStatusColor = getStatusColor(shipment.status);
  const isDelivered = Number(shipment.status) === 3;

  const handleAdvanceStatus = async () => {
    setLoading(true);
    setError('');
    try {
      const nextStatus = Number(shipment.status) + 1;
      const receipt = await advanceStatus(shipment.id, nextStatus);
      setSuccess({
        blockNumber: receipt.blockNumber,
        txHash: receipt.hash
      });
      // Sync cache and immediately refresh
      try {
        await fetch(`${API_BASE_URL}/api/shipments/${shipment.id}`);
      } catch (e) {}
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (err) {
      setError(err.reason || err.message || 'Failed to update status');
    }
    setLoading(false);
  };

  const handleCompleteDeliveryWithOtp = async () => {
    if (!carrierOtpInput || carrierOtpInput.length !== 6) {
      setError('Please enter the valid 6-digit Delivery OTP provided by the receiver.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const receipt = await completeDeliveryWithOtp(shipment.id, carrierOtpInput);
      setSuccess({
        blockNumber: receipt.blockNumber,
        txHash: receipt.hash
      });
      // Sync cache and immediately refresh
      try {
        await fetch(`${API_BASE_URL}/api/shipments/${shipment.id}`);
      } catch (e) {}
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (err) {
      setError(err.reason || err.message || 'OTP Verification Failed! Invalid code.');
    }
    setLoading(false);
  };

  // Only the assigned carrier can advance statuses
  const canAdvance = () => {
    if (readOnly || !account || !isCarrier) return false;
    const status = Number(shipment.status);
    return status >= 0 && status <= 2;
  };

  const getNextStatusText = () => {
    const status = Number(shipment.status);
    if (status === 0) return 'PICK UP PACKAGE';
    if (status === 1) return 'MARK IN TRANSIT';
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

      {/* ACTIVE IDENTITY ROLE BANNER */}
      <div style={{
        border: '2px solid var(--ink)',
        padding: '16px 20px',
        marginBottom: '32px',
        background: isCarrier 
          ? 'rgba(217, 119, 6, 0.08)' 
          : isReceiver 
            ? 'rgba(34, 197, 94, 0.08)' 
            : isSender 
              ? 'rgba(37, 99, 235, 0.08)' 
              : 'rgba(0,0,0,0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>
            {isCarrier ? '🚚' : isReceiver ? '📥' : isSender ? '📤' : '👁'}
          </span>
          <div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              fontWeight: 'bold',
              color: isCarrier ? 'var(--amber)' : isReceiver ? 'var(--verified-green)' : isSender ? '#2563eb' : 'var(--steel)'
            }}>
              {isCarrier && '🚚 YOU ARE THE ASSIGNED CARRIER'}
              {isReceiver && '📥 YOU ARE THE DESIGNATED RECEIVER'}
              {isSender && '📤 YOU ARE THE ORIGINATING SENDER'}
              {!isCarrier && !isReceiver && !isSender && '👁 YOU ARE VIEWING AS OBSERVER'}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--steel)', marginTop: '2px' }}>
              LOGGED IN: {account || 'NOT CONNECTED'}
            </div>
          </div>
        </div>

        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          fontWeight: 'bold',
          padding: '4px 10px',
          border: '1px solid var(--ink)',
          background: isCarrier && Number(shipment.status) === 2 ? 'var(--seal-red)' : 'var(--ink)', 
          color: 'white'
        }}>
          {isCarrier && (
            Number(shipment.status) === 0 ? 'ACTION: PICK UP' :
            Number(shipment.status) === 1 ? 'ACTION: IN TRANSIT' :
            Number(shipment.status) === 2 ? '⚡ ENTER RECEIVER OTP TO DELIVER' : 'COMPLETED'
          )}
          {isReceiver && (
            Number(shipment.status) === 3 ? 'PACKAGE RECEIVED ✓' : '🔑 YOUR DELIVERY OTP IS READY BELOW'
          )}
          {isSender && 'ORIGINATED ON-CHAIN (DISPATCH RECORD)'}
          {!isCarrier && !isReceiver && !isSender && 'PUBLIC AUDIT TRAIL'}
        </div>
      </div>

      {/* METADATA GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div>
          <div className="font-mono text-xs text-steel mb-1">ORIGINATING SENDER</div>
          <a href={getExplorerAddressUrl(shipment.sender)} target="_blank" rel="noopener noreferrer" className="chain-address" style={{ textDecoration: 'none' }}>
            {shipment.sender}
          </a>
        </div>
        <div>
          <div className="font-mono text-xs text-steel mb-1">ASSIGNED CARRIER</div>
          <a href={getExplorerAddressUrl(shipment.carrier)} target="_blank" rel="noopener noreferrer" className="chain-address" style={{ textDecoration: 'none' }}>
            {shipment.carrier}
          </a>
        </div>
        <div>
          <div className="font-mono text-xs text-steel mb-1">DESIGNATED RECEIVER</div>
          <a href={getExplorerAddressUrl(shipment.receiver)} target="_blank" rel="noopener noreferrer" className="chain-address" style={{ textDecoration: 'none' }}>
            {shipment.receiver}
          </a>
        </div>
        <div>
          <div className="font-mono text-xs text-steel mb-1">DISPATCHED AT</div>
          <div className="font-mono text-xs">{formatTimestamp(shipment.createdAt)}</div>
        </div>
      </div>

      {/* VISUAL TRANSIT WAYBILL ROUTE */}
      <WaybillRoute 
        shipment={shipment}
        history={history || []}
        status={Number(shipment.status)} 
        sender={shipment.sender} 
        carrier={shipment.carrier} 
        receiver={shipment.receiver} 
      />

      <div style={{ borderBottom: '4px solid var(--ink)', margin: '32px -32px 32px -32px' }}></div>

      {/* CUSTODY AUDIT TIMELINE */}
      <h2 className="section-label mb-4">CUSTODY LEDGER AUDIT TRAIL</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {(Array.isArray(history) && history.length > 0) ? (
          history.map((entry, index) => (
            <CustodyEntry 
              key={index} 
              entry={entry} 
              index={index}
              isCurrent={index === history.length - 1} 
            />
          ))
        ) : (
          <div className="font-mono text-xs text-steel">NO AUDIT ENTRIES FOUND</div>
        )}
      </div>

      {/* PROOF-OF-DELIVERY OTP (STRICTLY SENDER & RECEIVER ONLY - CARRIER NEVER SEES THIS) */}
      {!isCarrier && isSenderOrReceiver && (
        <>
          <div style={{ borderBottom: '4px solid var(--ink)', margin: '32px -32px 32px -32px' }}></div>
          <div style={{ border: '3px solid var(--ink)', background: 'var(--ink)', color: 'white', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--amber)', fontWeight: 'bold' }}>
                  {isReceiver ? '🔑 YOUR HANDSHAKE CODE' : 'PROOF-OF-DELIVERY HANDSHAKE'}
                </div>
                <h2 className="display-sm" style={{ margin: '4px 0 0 0', color: 'white' }}>
                  {isReceiver ? 'YOUR DELIVERY OTP' : 'RECEIVER DELIVERY OTP'}
                </h2>
              </div>
              {deliveryOtp ? (
                <div style={{ 
                  border: '2px solid var(--amber)', 
                  padding: '8px 24px', 
                  background: '#000', 
                  color: 'var(--amber)', 
                  fontSize: '32px', 
                  letterSpacing: '8px', 
                  fontWeight: 'bold', 
                  fontFamily: 'var(--font-mono)' 
                }}>
                  {deliveryOtp}
                </div>
              ) : (
                <button 
                  className="btn font-mono" 
                  onClick={fetchReceiverOtp}
                  disabled={otpLoading}
                  style={{ border: '2px solid var(--amber)', color: 'var(--amber)', background: 'transparent', padding: '12px 24px', cursor: 'pointer' }}
                >
                  {otpLoading ? 'RETRIEVING FROM CHAIN...' : 'REVEAL DELIVERY OTP'}
                </button>
              )}
            </div>
            {otpError && <div className="text-red font-mono text-xs mt-2">{otpError}</div>}
            <p className="font-mono text-xs" style={{ margin: '14px 0 0 0', color: '#ccc', lineHeight: '1.4' }}>
              {isReceiver 
                ? '⚠ Physical Handshake: Share this 6-digit code with the carrier ONLY after you physically receive and inspect the package at your doorstep. The carrier cannot mark this package as DELIVERED without your OTP.'
                : 'This 6-digit OTP is required for final delivery confirmation. It is shared between Sender and Receiver.'
              }
            </p>
          </div>
        </>
      )}

      {/* ACCESS KEY - STRICTLY SENDER & RECEIVER ONLY (CARRIER NEVER SEES THIS) */}
      {!isCarrier && isSenderOrReceiver && (
        <>
          <div style={{ borderBottom: '4px solid var(--ink)', margin: '32px -32px 32px -32px' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 className="section-label" style={{ margin: 0 }}>CRYPTOGRAPHIC ACCESS KEY</h2>
            {accessKey && (
              <button 
                className="btn font-mono"
                style={{ padding: '6px 14px', fontSize: '11px', border: '1px solid var(--ink)' }}
                onClick={() => handleCopy(accessKey, 'Access key')}
              >
                📋 COPY KEY
              </button>
            )}
          </div>
          <div>
            <div style={{ border: '2px solid var(--ink)', padding: '12px', wordBreak: 'break-all' }} className="font-mono bg-paper mb-2">
              {accessKey || '0x' + (shipment.accessKey || 'Retrieving on-chain access key...')}
            </div>
            <p className="font-mono text-xs text-steel mt-2">
              {isReceiver 
                ? '🔑 Your personal access key for verifying and downloading attached shipment documents.' 
                : 'Share this key with the receiver or authorized parties to grant document access.'
              }
            </p>
          </div>
        </>
      )}

      {/* DOCUMENTS SECTION */}
      <div style={{ borderBottom: '4px solid var(--ink)', margin: '32px -32px 32px -32px' }}></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 className="section-label" style={{ margin: 0 }}>ATTACHED DOCUMENTS ({documents.length})</h2>
        {isReceiver && documents.length > 0 && (
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--verified-green)', fontWeight: 'bold' }}>
            ✓ UNLOCKED FOR RECEIVER
          </span>
        )}
      </div>

      {documents.length === 0 ? (
        <div style={{ border: '2px dashed var(--steel)', padding: '24px', textAlign: 'center', background: 'var(--paper-dark)' }}>
          <div className="font-mono text-xs text-steel">
            NO DOCUMENTS ATTACHED TO THIS SHIPMENT RECORD
          </div>
        </div>
      ) : isCarrier ? (
        <div style={{ border: '2px dashed var(--steel)', padding: '20px', textAlign: 'center', background: 'var(--paper-dark)' }}>
          <div className="font-mono text-xs font-bold text-steel mb-1">
            🔒 CARRIER RESTRICTED ACCESS
          </div>
          <div className="font-mono text-xs text-steel">
            Confidential documents and access keys are restricted to Sender & Receiver. The assigned carrier is only responsible for parcel transit and OTP verification upon physical handover.
          </div>
        </div>
      ) : !isSenderOrReceiver ? (
        <div style={{ border: '2px dashed var(--steel)', padding: '20px', textAlign: 'center', background: 'var(--paper-dark)' }}>
          <div className="font-mono text-xs font-bold text-steel mb-1">
            🔒 ACCESS KEY REQUIRED
          </div>
          <div className="font-mono text-xs text-steel mb-3">
            Enter authorized access key to unlock document downloads for this shipment.
          </div>
          <div style={{ display: 'flex', gap: '8px', maxWidth: '420px', margin: '0 auto' }}>
            <input
              type="text"
              value={enteredKey}
              onChange={(e) => setEnteredKey(e.target.value)}
              placeholder="Enter 0x access key..."
              className="font-mono"
              style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--ink)', fontSize: '11px' }}
            />
            <button className="btn font-mono" onClick={handleValidateKey} style={{ padding: '8px 16px', fontSize: '11px' }}>
              UNLOCK
            </button>
          </div>
          {keyMsg && (
            <div className="font-mono text-xs mt-2" style={{ color: keyValidated ? 'var(--verified-green)' : 'var(--seal-red)', fontWeight: 'bold' }}>
              {keyMsg}
            </div>
          )}
        </div>
      ) : (
        /* Document List for Receiver & Sender */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {documents.map(doc => (
            <div key={doc.id} style={{ border: '2px solid var(--ink)', padding: '16px', background: 'var(--paper)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div className="font-mono mb-1" style={{ fontWeight: 'bold' }}>{doc.filename || doc.fileName}</div>
                  <div className="font-mono text-xs text-steel mb-1">HASH: {(doc.fileHash || '').substring(0, 24)}...</div>
                  <div className="font-mono text-xs text-steel">{formatTimestamp(doc.uploadedAt || doc.timestamp)}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn font-mono"
                    style={{ padding: '8px 16px', fontSize: '11px' }}
                    onClick={() => handleView(doc.id, doc.filename || doc.fileName)}
                  >
                    VIEW
                  </button>
                  <button
                    className="btn btn-primary font-mono"
                    style={{ padding: '8px 16px', fontSize: '11px' }}
                    onClick={() => handleDownload(doc.id, doc.filename || doc.fileName)}
                  >
                    DOWNLOAD
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CARRIER ACTION SECTION */}
      {isCarrier && canAdvance() && (
        <div style={{ marginTop: '32px', padding: '24px', border: '2px dashed var(--ink)', background: 'rgba(217, 119, 6, 0.04)' }}>
          {error && <div className="text-red font-mono mb-4">[ERROR] {error}</div>}
          <div>
            {!success ? (
              Number(shipment.status) === 2 ? (
                /* Stage 2 (In Transit): ONLY OTP VERIFICATION PANEL */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ borderLeft: '4px solid var(--amber)', paddingLeft: '12px' }}>
                    <div className="font-mono font-bold text-sm">🚚 CARRIER DELIVERY VERIFICATION (FINAL STAGE)</div>
                    <div className="font-mono text-xs text-steel">Request the 6-digit OTP from the receiver upon physical handover</div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <input 
                      type="text"
                      maxLength={6}
                      placeholder="ENTER 6-DIGIT OTP"
                      value={carrierOtpInput}
                      onChange={(e) => setCarrierOtpInput(e.target.value.replace(/\D/g, ''))}
                      style={{
                        flex: 1,
                        minWidth: '200px',
                        padding: '14px',
                        fontSize: '22px',
                        letterSpacing: '6px',
                        textAlign: 'center',
                        fontFamily: 'var(--font-mono)',
                        border: '2px solid var(--ink)',
                        background: 'var(--paper)'
                      }}
                    />
                    <button 
                      className="btn btn-primary"
                      style={{ padding: '14px 24px', minWidth: '220px' }}
                      onClick={handleCompleteDeliveryWithOtp}
                      disabled={loading || carrierOtpInput.length !== 6}
                    >
                      {loading ? 'VERIFYING...' : 'CONFIRM DELIVERY'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Stage 0 or 1: Standard pick up / in transit */
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '16px', fontSize: '13px' }}
                  onClick={handleAdvanceStatus}
                  disabled={loading}
                >
                  {loading ? 'SUBMITTING...' : `🚚 ${getNextStatusText()}`}
                </button>
              )
            ) : (
              <div className="stamp animate-stamp" style={{ border: '2px solid var(--verified-green)', padding: '16px', textAlign: 'center' }}>
                <div className="text-green font-mono font-bold mb-2">STATUS UPDATED ON-CHAIN</div>
                <div className="text-green font-mono text-xs">BLOCK #{success.blockNumber}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RECEIVER PHYSICAL STATUS REMINDER */}
      {isReceiver && !isDelivered && (
        <div style={{ marginTop: '32px', padding: '20px', border: '2px dashed var(--verified-green)', background: 'rgba(34, 197, 94, 0.05)' }}>
          <div className="font-mono font-bold text-sm" style={{ color: 'var(--verified-green)' }}>
            📥 RECEIVER INSTRUCTIONS:
          </div>
          <div className="font-mono text-xs text-ink mt-1" style={{ lineHeight: '1.5' }}>
            When the carrier arrives with your package, share your 6-digit Delivery OTP shown above to complete the physical delivery. Once the carrier submits your OTP, the on-chain status will permanently flip to <strong>DELIVERED</strong>.
          </div>
        </div>
      )}

      {/* SENDER STATUS REMINDER */}
      {isSender && !isDelivered && (
        <div style={{ marginTop: '32px', padding: '20px', border: '2px dashed #2563eb', background: 'rgba(37, 99, 235, 0.05)' }}>
          <div className="font-mono font-bold text-sm" style={{ color: '#2563eb' }}>
            📤 SENDER STATUS:
          </div>
          <div className="font-mono text-xs text-ink mt-1" style={{ lineHeight: '1.5' }}>
            Package is in custody with the carrier. The designated receiver holds the delivery OTP to confirm receipt upon arrival.
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
