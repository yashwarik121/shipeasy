import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const DEFAULT_SAMPLE_DOC = `INVOICE #98231
CARRIER: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
RECEIVER: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
AMOUNT: $450,000.00 USD
CARGO: High-Grade Microcontroller Wafers (Class A)
SIGNATURE: CONFIRMED_ON_CHAIN`;

export default function TamperLab() {
  const [docText, setDocText] = useState(DEFAULT_SAMPLE_DOC);
  const [simResult, setSimResult] = useState(null);
  const [loadingSim, setLoadingSim] = useState(false);

  // System audit state
  const [auditData, setAuditData] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  // Manual 1-bit flip simulation
  const runSimulation = async (customText) => {
    setLoadingSim(true);
    try {
      const textToUse = customText !== undefined ? customText : docText;
      const res = await fetch('http://localhost:3001/api/tamper/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToUse })
      });
      const data = await res.json();
      setSimResult(data);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setLoadingSim(false);
    }
  };

  // Run integrity audit
  const runSystemAudit = async () => {
    setAuditLoading(true);
    setActionMsg('');
    try {
      const res = await fetch('http://localhost:3001/api/tamper/audit');
      const data = await res.json();
      setAuditData(data);
    } catch (err) {
      console.error('Audit error:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  // Tamper with SQLite cache (change status)
  const handleTamperShipment = async (id, currentStatus) => {
    const forgedStatus = currentStatus === 3 ? 1 : 3;
    setActionMsg(`Injecting forged status (Stage ${forgedStatus}) into local database for Shipment #${id}...`);
    try {
      const res = await fetch('http://localhost:3001/api/tamper/modify-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentId: id, tamperedStatus: forgedStatus })
      });
      const data = await res.json();
      setActionMsg(data.message || 'Modified local cache.');
      runSystemAudit();
    } catch (err) {
      setActionMsg('Error: ' + err.message);
    }
  };

  // Tamper with disk file
  const handleTamperFile = async (docId) => {
    setActionMsg(`Flipping 1 byte in disk file #${docId}...`);
    try {
      const res = await fetch('http://localhost:3001/api/tamper/tamper-doc-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId })
      });
      const data = await res.json();
      setActionMsg(`Flipped byte in ${data.fileName || 'file'}. Hash mismatch detected.`);
      runSystemAudit();
    } catch (err) {
      setActionMsg('Error: ' + err.message);
    }
  };

  // Restore cache from blockchain
  const handleRestoreCache = async () => {
    setActionMsg('Resyncing from blockchain smart contract...');
    try {
      const res = await fetch('http://localhost:3001/api/tamper/restore-cache', {
        method: 'POST'
      });
      const data = await res.json();
      setActionMsg(data.message || 'Restored from chain.');
      runSystemAudit();
    } catch (err) {
      setActionMsg('Error: ' + err.message);
    }
  };

  useEffect(() => {
    runSimulation();
    runSystemAudit();
  }, []);

  return (
    <div className="container" style={{ paddingTop: '24px', paddingBottom: '60px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid var(--ink)', paddingBottom: '16px', marginBottom: '24px' }}>
        <div>
          <div className="section-label" style={{ marginBottom: '6px', color: 'var(--seal-red)' }}>
            DEMO LAB
          </div>
          <h1 className="display-lg" style={{ margin: 0 }}>
            TAMPER LAB
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn font-mono text-xs" 
            onClick={runSystemAudit}
            disabled={auditLoading}
            style={{ padding: '8px 14px' }}
          >
            {auditLoading ? 'CHECKING...' : 'RE-SCAN AUDIT'}
          </button>
          {auditData?.tamperDetected && (
            <button 
              className="btn btn-primary font-mono text-xs" 
              onClick={handleRestoreCache}
              style={{ padding: '8px 14px' }}
            >
              RESTORE FROM CHAIN
            </button>
          )}
        </div>
      </div>

      {/* System Status Banner */}
      {auditData && (
        <div style={{
          border: `2px solid ${auditData.tamperDetected ? 'var(--seal-red)' : 'var(--verified-green)'}`,
          padding: '12px 16px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span className="font-mono text-xs font-bold" style={{ color: auditData.tamperDetected ? 'var(--seal-red)' : 'var(--verified-green)' }}>
            {auditData.tamperDetected 
              ? '🚨 INTEGRITY BREACH: LOCAL STORAGE DIFFERS FROM ON-CHAIN STATE' 
              : '✓ 100% CRYPTOGRAPHIC INTEGRITY: ALL RECORDS MATCH BLOCKCHAIN'}
          </span>
          <span className="font-mono text-xs text-steel">
            {auditData.tamperDetected ? 'Chain divergence detected' : 'Smart contract verified'}
          </span>
        </div>
      )}

      {actionMsg && (
        <div className="font-mono text-xs" style={{ background: 'var(--paper-dark)', padding: '10px 14px', borderLeft: '3px solid var(--stamp-blue)', marginBottom: '20px' }}>
          {actionMsg}
        </div>
      )}

      {/* DEMO 1: THE 1-BYTE ATTACK */}
      <div style={{ border: '2px solid var(--ink)', padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span className="section-label" style={{ margin: 0 }}>
            DEMO 01 — 1-BYTE SILENT DOCUMENT ALTERATION
          </span>
          <button 
            className="btn btn-primary font-mono text-xs" 
            onClick={() => runSimulation()}
            disabled={loadingSim}
            style={{ padding: '6px 14px' }}
          >
            {loadingSim ? 'RUNNING...' : 'TRIGGER 1-BIT FLIP'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div className="font-mono text-xs text-steel mb-1">ORIGINAL DOCUMENT TEXT:</div>
            <textarea
              rows={6}
              value={docText}
              onChange={(e) => {
                setDocText(e.target.value);
                runSimulation(e.target.value);
              }}
              className="font-mono"
              style={{ width: '100%', fontSize: '11px', padding: '10px', border: '1px solid var(--ink)', background: 'var(--paper-dark)', color: 'var(--ink)' }}
            />
          </div>

          <div>
            <div className="font-mono text-xs text-steel mb-1">ALTERED BYTE:</div>
            {simResult && (
              <div style={{ border: '1px solid var(--border-light)', padding: '12px', background: 'var(--paper-dark)', height: 'calc(100% - 22px)' }}>
                <div className="font-mono text-xs mb-2">
                  Byte Offset: <strong>[{simResult.byteIndex}]</strong>
                </div>
                <div className="font-mono text-xs mb-2">
                  Original: <strong>{simResult.originalByte}</strong>
                </div>
                <div className="font-mono text-xs mb-3">
                  Tampered: <strong style={{ color: 'var(--seal-red)' }}>{simResult.tamperedByte}</strong>
                </div>
                <div className="font-mono text-xs text-steel" style={{ borderTop: '1px dashed var(--border-light)', paddingTop: '8px' }}>
                  Hash Avalanche: <strong style={{ color: 'var(--ink)' }}>{simResult.avalancheEffect.totalBitsChanged} / 256 bits flipped ({simResult.avalancheEffect.percentageFlipped})</strong>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hashes Side by Side */}
        {simResult && (
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <div className="font-mono text-xs text-green" style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  ON-CHAIN EXPECTED HASH
                </div>
                <div className="chain-hash font-mono text-xs" style={{ wordBreak: 'break-all', padding: '8px', background: 'var(--paper-dark)', border: '1px solid var(--border-light)' }}>
                  {simResult.originalHash}
                </div>
              </div>
              <div>
                <div className="font-mono text-xs text-red" style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  CALCULATED TAMPERED HASH
                </div>
                <div className="chain-hash font-mono text-xs" style={{ wordBreak: 'break-all', padding: '8px', background: 'var(--paper-dark)', border: '1px solid var(--seal-red)', color: 'var(--seal-red)' }}>
                  {simResult.tamperedHash}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <span className="stamp stamp-breach" style={{ fontSize: '0.85rem', padding: '6px 16px' }}>
                🚨 INTEGRITY CHECK FAILED: SHA-256 HASH MISMATCH
              </span>
            </div>
          </div>
        )}
      </div>

      {/* DEMO 2: REAL ON-CHAIN RECONCILIATION */}
      <div style={{ border: '2px solid var(--ink)', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span className="section-label" style={{ margin: 0 }}>
            DEMO 02 — LIVE BLOCKCHAIN AUDIT & RECONCILIATION
          </span>
          <span className="font-mono text-xs text-steel">
            Contract vs Local Cache
          </span>
        </div>

        <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
          <table className="ledger" style={{ border: '1px solid var(--border-light)' }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>DESCRIPTION</th>
                <th>LOCAL STATE</th>
                <th>BLOCKCHAIN CHECK</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {auditData?.audit?.map(item => (
                <tr key={item.shipmentId} style={{ background: item.chainMatch ? 'transparent' : 'rgba(184, 51, 47, 0.05)' }}>
                  <td className="font-mono font-bold">#{item.shipmentId}</td>
                  <td>{item.description}</td>
                  <td className="font-mono text-xs">Stage {item.status}</td>
                  <td>
                    {item.chainMatch ? (
                      <span className="font-mono text-xs text-green" style={{ fontWeight: 'bold' }}>✓ ON-CHAIN MATCH</span>
                    ) : (
                      <span className="font-mono text-xs text-red" style={{ fontWeight: 'bold' }}>✗ TAMPER DETECTED</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn font-mono text-xs"
                      onClick={() => handleTamperShipment(item.shipmentId, item.status)}
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                    >
                      {item.chainMatch ? 'FORGE LOCAL STATUS' : 'RESET'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Disk Documents List if any */}
        {auditData?.audit?.some(s => s.documents?.length > 0) && (
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '14px' }}>
            <div className="font-mono text-xs text-steel mb-2">STORED PHYSICAL FILES:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {auditData.audit.flatMap(s => s.documents.map(doc => (
                <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--paper-dark)', border: '1px solid var(--border-light)' }}>
                  <div>
                    <span className="font-mono text-xs font-bold">{doc.fileName}</span>
                    <span className="font-mono text-xs text-steel" style={{ marginLeft: '12px' }}>
                      Hash: {doc.expectedHash?.slice(0, 16)}...
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span className={`font-mono text-xs font-bold ${doc.integrityMatch ? 'text-green' : 'text-red'}`}>
                      {doc.integrityMatch ? '✓ INTACT' : '🚨 TAMPERED'}
                    </span>
                    <button
                      className="btn font-mono text-xs"
                      onClick={() => handleTamperFile(doc.id)}
                      style={{ padding: '3px 8px', fontSize: '10px' }}
                    >
                      FLIP BYTE
                    </button>
                  </div>
                </div>
              )))}
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <Link to="/dashboard" className="btn btn-primary font-mono text-xs" style={{ padding: '10px 20px' }}>
          BACK TO DASHBOARD
        </Link>
        <Link to="/verify" className="btn btn-secondary font-mono text-xs" style={{ padding: '10px 20px' }}>
          VERIFY A SHIPMENT
        </Link>
      </div>

    </div>
  );
}
