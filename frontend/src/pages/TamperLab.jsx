import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const DEFAULT_SAMPLE_DOC = `=======================================================
             GLOBAL FREIGHT MANIFEST & INVOICE
=======================================================
INVOICE ID: INV-2026-X994
CARRIER ID: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
RECEIVER ID: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
DECLARED VALUE: $450,000.00 USD
CARGO: High-Grade Microcontroller Wafers (Class A)
CUSTODY PROTOCOL: SECURED VIA SHIP.EAZY SMART CONTRACT
AUTHORIZED SIGNATURE: VALIDATED_ON_CHAIN
=======================================================`;

export default function TamperLab() {
  const [docText, setDocText] = useState(DEFAULT_SAMPLE_DOC);
  const [byteIndex, setByteIndex] = useState(128);
  const [simResult, setSimResult] = useState(null);
  const [loadingSim, setLoadingSim] = useState(false);

  // System audit state
  const [auditData, setAuditData] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  // Local cache tampering state
  const [targetShipmentId, setTargetShipmentId] = useState(0);
  const [tamperField, setTamperField] = useState('status');
  const [tamperValue, setTamperValue] = useState('3');

  // Manual byte flip test runner
  const runSimulation = async (customText, customByteIdx) => {
    setLoadingSim(true);
    try {
      const res = await fetch('http://localhost:3001/api/tamper/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: customText !== undefined ? customText : docText,
          byteIndex: customByteIdx !== undefined ? Number(customByteIdx) : Number(byteIndex)
        })
      });
      const data = await res.json();
      setSimResult(data);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setLoadingSim(false);
    }
  };

  // Run full system integrity audit
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

  // Attack local cache database directly
  const handleTamperCache = async () => {
    setActionMsg('Injecting unauthorized modification into local database...');
    try {
      const payload = { shipmentId: targetShipmentId };
      if (tamperField === 'status') payload.tamperedStatus = Number(tamperValue);
      if (tamperField === 'accessKey') payload.tamperedAccessKey = tamperValue;
      if (tamperField === 'description') payload.tamperedDescription = tamperValue;

      const res = await fetch('http://localhost:3001/api/tamper/modify-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setActionMsg(data.message || 'Cache modified!');
      runSystemAudit();
    } catch (err) {
      setActionMsg('Error tampering with cache: ' + err.message);
    }
  };

  // Tamper with real physical uploaded file on disk
  const handleTamperFile = async (docId) => {
    setActionMsg(`Injecting 1-bit flip into physical disk file #${docId}...`);
    try {
      const res = await fetch('http://localhost:3001/api/tamper/tamper-doc-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId })
      });
      const data = await res.json();
      if (data.success) {
        setActionMsg(`Altered byte in file "${data.fileName}". Hash changed from ${data.originalExpectedHash.slice(0, 10)}... to ${data.newDiskHash.slice(0, 10)}...!`);
      } else {
        setActionMsg(data.error || 'Failed to tamper file');
      }
      runSystemAudit();
    } catch (err) {
      setActionMsg('Error: ' + err.message);
    }
  };

  // Restore cache from blockchain
  const handleRestoreCache = async () => {
    setActionMsg('Querying immutable smart contract to eradicate unauthorized local changes...');
    try {
      const res = await fetch('http://localhost:3001/api/tamper/restore-cache', {
        method: 'POST'
      });
      const data = await res.json();
      setActionMsg(data.message);
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
    <div className="container" style={{ paddingTop: '24px', paddingBottom: '80px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid var(--ink)', paddingBottom: '20px', marginBottom: '32px' }}>
        <div>
          <div className="section-label" style={{ marginBottom: '8px', color: 'var(--seal-red)' }}>
            CRYPTOGRAPHIC AUDIT & DEFENSE LAB
          </div>
          <h1 className="display-lg" style={{ margin: 0 }}>
            TAMPER LAB
          </h1>
          <p className="font-mono text-steel text-sm" style={{ marginTop: '8px', maxWidth: '650px' }}>
            Live laboratory demonstrating the cryptographic **Avalanche Effect** and proving that neither silent file modifications nor local database alterations can bypass on-chain mathematical immutability.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <button 
            className="btn btn-primary font-mono text-xs" 
            onClick={runSystemAudit}
            disabled={auditLoading}
          >
            {auditLoading ? 'SCANNING SYSTEM...' : '⚡ RUN SYSTEM AUDIT'}
          </button>
        </div>
      </div>

      {/* Global System Integrity Status Banner */}
      {auditData && (
        <div style={{
          border: `3px solid ${auditData.tamperDetected ? 'var(--seal-red)' : 'var(--verified-green)'}`,
          background: auditData.tamperDetected ? 'rgba(184, 51, 47, 0.08)' : 'rgba(47, 93, 52, 0.08)',
          padding: '20px 24px',
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div className="font-mono text-xs font-bold" style={{ color: auditData.tamperDetected ? 'var(--seal-red)' : 'var(--verified-green)', letterSpacing: '0.1em' }}>
              {auditData.tamperDetected ? '🚨 TAMPER / DIVERGENCE DETECTED IN STORAGE' : '✓ 100% CRYPTOGRAPHIC PARITY (ON-CHAIN MATCH)'}
            </div>
            <div className="font-mono text-sm mt-1" style={{ color: 'var(--ink)' }}>
              {auditData.tamperDetected 
                ? 'Warning: Local records or stored disk files disagree with the on-chain root of trust.' 
                : 'All local cached shipments and document hashes exactly match the smart contract state.'}
            </div>
          </div>
          {auditData.tamperDetected && (
            <button 
              className="btn btn-danger font-mono text-xs" 
              onClick={handleRestoreCache}
              style={{ padding: '8px 18px' }}
            >
              PURGE LOCAL MODIFICATIONS & SYNC FROM CHAIN
            </button>
          )}
        </div>
      )}

      {actionMsg && (
        <div className="font-mono text-xs" style={{ background: 'var(--paper-dark)', padding: '12px 16px', borderLeft: '4px solid var(--stamp-blue)', marginBottom: '24px' }}>
          {actionMsg}
        </div>
      )}

      {/* ================= SECTION 1: THE 1-BYTE FILE TAMPER ATTACK ================= */}
      <section style={{ border: '2px solid var(--ink)', padding: '24px', marginBottom: '40px' }}>
        <div className="section-label" style={{ color: 'var(--stamp-blue)' }}>
          EXPERIMENT 01: THE 1-BYTE INVISIBLE ATTACK (AVALANCHE EFFECT)
        </div>
        <p className="text-sm text-steel mb-4">
          To the human eye, an invoice or contract altered by only 1 byte (or 1 character in thousands of lines) looks virtually identical. Watch what happens to the cryptographic SHA-256 hash when just 1 single bit flips.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label className="section-label text-xs">GENUINE DOCUMENT PAYLOAD</label>
            <textarea
              rows={8}
              value={docText}
              onChange={(e) => {
                setDocText(e.target.value);
                runSimulation(e.target.value, byteIndex);
              }}
              className="font-mono"
              style={{ width: '100%', fontSize: '11px', padding: '12px', border: '2px solid var(--ink)', background: 'var(--paper-dark)', color: 'var(--ink)' }}
            />
          </div>

          <div>
            <label className="section-label text-xs">TARGET BYTE INJECTION OFFSET</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
              <input
                type="number"
                min="0"
                max={docText.length - 1}
                value={byteIndex}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setByteIndex(val);
                  runSimulation(docText, val);
                }}
                className="font-mono"
                style={{ width: '100px', border: '2px solid var(--ink)', padding: '8px 12px' }}
              />
              <span className="font-mono text-xs text-steel">Offset / {docText.length} Bytes</span>
              <button 
                className="btn btn-primary font-mono text-xs" 
                onClick={() => runSimulation(docText, byteIndex)}
                disabled={loadingSim}
                style={{ marginLeft: 'auto' }}
              >
                {loadingSim ? 'INJECTING...' : 'FLIP 1 BIT'}
              </button>
            </div>

            {simResult && (
              <div style={{ border: '1px solid var(--border-light)', padding: '16px', background: 'var(--paper-dark)' }}>
                <div className="font-mono text-xs mb-2">
                  <span className="text-steel">ORIGINAL BYTE AT [{simResult.byteIndex}]: </span>
                  <strong>{simResult.originalByte}</strong>
                </div>
                <div className="font-mono text-xs mb-3">
                  <span className="text-steel">TAMPERED BYTE AT [{simResult.byteIndex}]: </span>
                  <strong style={{ color: 'var(--seal-red)' }}>{simResult.tamperedByte}</strong>
                </div>
                <div className="font-mono text-xs text-steel" style={{ borderTop: '1px dashed var(--border-light)', paddingTop: '8px' }}>
                  Bits Flipped Across Hash: <strong style={{ color: 'var(--ink)' }}>{simResult.avalancheEffect.totalBitsChanged} / 256 ({simResult.avalancheEffect.percentageFlipped})</strong>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hash Comparison & Verification Result */}
        {simResult && (
          <div style={{ border: '3px solid var(--ink)', padding: '20px', background: 'var(--paper)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div>
                <div className="section-label text-xs" style={{ color: 'var(--verified-green)' }}>
                  ORIGINAL HASH (ANCHORED TO SMART CONTRACT)
                </div>
                <div className="chain-hash font-mono text-xs" style={{ wordBreak: 'break-all', padding: '10px', background: 'var(--paper-dark)', border: '1px solid var(--border-light)' }}>
                  {simResult.originalHash}
                </div>
              </div>

              <div>
                <div className="section-label text-xs" style={{ color: 'var(--seal-red)' }}>
                  NEW HASH AFTER 1-BIT MODIFICATION
                </div>
                <div className="chain-hash font-mono text-xs" style={{ wordBreak: 'break-all', padding: '10px', background: 'var(--paper-dark)', border: '1px solid var(--seal-red)', color: 'var(--seal-red)' }}>
                  {simResult.tamperedHash}
                </div>
              </div>
            </div>

            {/* Verdict Stamp */}
            <div style={{ textAlign: 'center', paddingTop: '10px' }}>
              <div className="stamp stamp-breach animate-stamp" style={{ fontSize: '1.1rem', padding: '10px 24px' }}>
                🚨 INTEGRITY CHECK FAILED: SHA-256 HASH MISMATCH
              </div>
              <p className="font-mono text-xs text-steel mt-2">
                Verification status: REJECTED BY PROTOCOL. Zero mathematical tolerance for retroactive alterations.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ================= SECTION 2: ATTACKING LOCAL DATABASE / CACHE ================= */}
      <section style={{ border: '2px solid var(--ink)', padding: '24px', marginBottom: '40px' }}>
        <div className="section-label" style={{ color: 'var(--seal-red)' }}>
          EXPERIMENT 02: ROGUE DATABASE ADMINISTRATOR ATTACK
        </div>
        <p className="text-sm text-steel mb-4">
          Suppose a rogue database admin or hacker accesses the backend database directly and attempts to forge a shipment status (e.g. prematurely marking it DELIVERED) or rewrite an access key. Can they fool Ship.Eazy?
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span className="font-mono text-xs text-steel">SHIPMENT ID:</span>
            <input 
              type="number"
              value={targetShipmentId}
              onChange={e => setTargetShipmentId(e.target.value)}
              className="font-mono"
              style={{ width: '80px', border: '2px solid var(--ink)', padding: '8px' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span className="font-mono text-xs text-steel">TARGET FIELD:</span>
            <select
              value={tamperField}
              onChange={e => setTamperField(e.target.value)}
              className="font-mono"
              style={{ border: '2px solid var(--ink)', padding: '8px' }}
            >
              <option value="status">Status (0=Created, 3=Delivered)</option>
              <option value="description">Description String</option>
              <option value="accessKey">Access Key (Secret Hash)</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '180px' }}>
            <span className="font-mono text-xs text-steel">FORGED VALUE:</span>
            <input 
              type="text"
              value={tamperValue}
              onChange={e => setTamperValue(e.target.value)}
              className="font-mono"
              placeholder="Enter altered value"
              style={{ border: '2px solid var(--ink)', padding: '8px' }}
            />
          </div>

          <button 
            className="btn btn-danger font-mono text-xs" 
            onClick={handleTamperCache}
            style={{ marginTop: '20px', padding: '10px 18px' }}
          >
            INJECT DB TAMPER
          </button>
        </div>

        {/* Audit Results Table */}
        {auditData && auditData.audit && (
          <div>
            <div className="section-label text-xs mb-2">LIVE SYSTEM RECONCILIATION TABLE</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="ledger" style={{ border: '1px solid var(--border-light)' }}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>DESCRIPTION</th>
                    <th>LOCAL CACHE STATUS</th>
                    <th>ON-CHAIN PARITY</th>
                    <th>INTEGRITY STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {auditData.audit.map(item => (
                    <tr key={item.shipmentId} style={{ background: item.chainMatch ? 'transparent' : 'rgba(184, 51, 47, 0.05)' }}>
                      <td className="font-mono font-bold">#{item.shipmentId}</td>
                      <td>{item.description}</td>
                      <td className="font-mono">Stage {item.status}</td>
                      <td>
                        {item.chainMatch ? (
                          <span className="font-mono text-xs text-green" style={{ fontWeight: 'bold' }}>✓ ON-CHAIN MATCH</span>
                        ) : (
                          <span className="font-mono text-xs text-red" style={{ fontWeight: 'bold' }}>✗ DIVERGENCE: {item.mismatchReason}</span>
                        )}
                      </td>
                      <td>
                        {item.chainMatch ? (
                          <span className="stamp" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>VERIFIED</span>
                        ) : (
                          <span className="stamp stamp-breach" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>BREACH DETECTED</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ================= SECTION 3: PHYSICAL DISK FILE ATTACK ================= */}
      {auditData && auditData.audit && auditData.audit.some(s => s.documents.length > 0) && (
        <section style={{ border: '2px solid var(--ink)', padding: '24px' }}>
          <div className="section-label" style={{ color: 'var(--steel)' }}>
            EXPERIMENT 03: PHYSICAL ATTACHMENT INTEGRITY MONITOR
          </div>
          <p className="text-sm text-steel mb-4">
            Test flipping bytes in the actual files stored on the server's disk storage. The blockchain smart contract holds the immutable hash stamped at creation time.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {auditData.audit.map(s => 
              s.documents.map(doc => (
                <div key={doc.id} style={{ border: '1px solid var(--ink)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div className="font-mono font-bold">{doc.fileName} (Shipment #{s.shipmentId})</div>
                    <div className="font-mono text-xs text-steel mt-1">EXPECTED ON-CHAIN HASH: {doc.expectedHash}</div>
                    <div className="font-mono text-xs text-steel">DISK COMPUTED HASH: {doc.diskHash || 'File missing'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span 
                      className={`font-mono text-xs font-bold ${doc.integrityMatch ? 'text-green' : 'text-red'}`}
                    >
                      {doc.integrityMatch ? '✓ HASH MATCH' : '🚨 CORRUPTED / TAMPERED'}
                    </span>
                    <button
                      className="btn font-mono text-xs"
                      onClick={() => handleTamperFile(doc.id)}
                      style={{ padding: '6px 12px' }}
                    >
                      FLIP BYTE ON DISK
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* Footer Navigation */}
      <div style={{ marginTop: '40px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
        <Link to="/dashboard" className="btn btn-primary font-mono text-xs">
          BACK TO DASHBOARD
        </Link>
        <Link to="/verify" className="btn btn-secondary font-mono text-xs">
          GO TO VERIFY PAGE
        </Link>
      </div>
    </div>
  );
}
