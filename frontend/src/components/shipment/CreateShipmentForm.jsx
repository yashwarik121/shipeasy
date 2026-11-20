import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { keccak256, toUtf8Bytes } from 'ethers';
import { useWallet } from '../../context/WalletContext';
import { useContract } from '../../hooks/useContract';
import { API_BASE_URL } from '../../utils/api';

const CreateShipmentForm = () => {
  const [carrier, setCarrier] = useState('');
  const [receiver, setReceiver] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [progress, setProgress] = useState([]);
  
  const { account, testAccounts } = useWallet();
  const { createShipmentWithOtp, addDocument } = useContract();
  const navigate = useNavigate();

  const validateAddress = (addr) => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const hashFile = async (file) => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setProgress([]);
    
    if (!validateAddress(carrier)) {
      setError('Invalid carrier address. Must be 0x followed by 40 hex characters.');
      return;
    }
    
    if (!validateAddress(receiver)) {
      setError('Invalid receiver address. Must be 0x followed by 40 hex characters.');
      return;
    }

    if (!description.trim()) {
      setError('Description is required.');
      return;
    }

    setLoading(true);

    try {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = keccak256(toUtf8Bytes(generatedOtp));

      setProgress(p => [...p, 'GENERATING PROOF-OF-DELIVERY OTP...', 'CREATING SHIPMENT ON-CHAIN...']);
      const receipt = await createShipmentWithOtp(carrier, receiver, description, otpHash, generatedOtp);
      
      // Extract the exact created shipment ID from the transaction receipt logs
      let shipmentId = null;
      if (receipt && receipt.logs) {
        for (const log of receipt.logs) {
          try {
            // ShipmentCreated topic0 is the event signature; topic1 is the indexed id
            if (log.topics && log.topics.length > 1) {
              shipmentId = Number(BigInt(log.topics[1]));
              break;
            }
          } catch (e) {
            console.warn('Could not parse log topic', e);
          }
        }
      }

      // Fallback: query on-chain count
      if (shipmentId === null || isNaN(shipmentId)) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/shipments`);
          const data = await res.json();
          shipmentId = data.length; // The new one is at the current count
        } catch (err) {
          console.error('Failed to retrieve shipment ID', err);
        }
      }

      if (shipmentId !== null) {
        try {
          await fetch(`${API_BASE_URL}/api/shipments/${shipmentId}/otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ otp: generatedOtp })
          });
        } catch (err) {
          console.warn('Could not post OTP to backend', err);
        }
      }

      if (files.length > 0) {
        setProgress(p => [...p, '✓ SHIPMENT CREATED', 'HASHING FILES...']);
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const hash = await hashFile(file);
          
          setProgress(p => {
             const newP = [...p];
             if (!newP.includes('WRITING HASHES TO CHAIN...')) newP.push('WRITING HASHES TO CHAIN...');
             return newP;
          });
          
          await addDocument(shipmentId, hash, file.name);
          
          setProgress(p => {
             const newP = [...p];
             if (!newP.includes('UPLOADING FILES...')) newP.push('UPLOADING FILES...');
             return newP;
          });

          const formData = new FormData();
          formData.append('file', file);
          formData.append('address', account);

          const uploadRes = await fetch(`${API_BASE_URL}/api/shipments/${shipmentId}/documents`, {
            method: 'POST',
            body: formData,
          });

          if (!uploadRes.ok) {
            const errData = await uploadRes.json().catch(() => ({}));
            throw new Error(errData.error || `Failed to upload ${file.name} (status ${uploadRes.status})`);
          }
        }
        setProgress(p => [...p, '✓ ALL FILES UPLOADED']);
      }

      setSuccess({
        blockNumber: receipt.blockNumber,
        txHash: receipt.hash,
        otp: generatedOtp,
        shipmentId
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 3500);
      
    } catch (err) {
      console.error(err);
      setError(err.reason || err.message || 'Transaction failed');
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', border: '3px solid var(--ink)', padding: '32px' }}>
      <h2 className="display-md uppercase mb-4" style={{ margin: '0 0 24px 0' }}>INITIATE CUSTODY TRANSFER</h2>
      
      {error && (
        <div className="text-red font-mono mb-4" style={{ padding: '16px', border: '2px solid var(--seal-red)', background: 'rgba(184, 51, 47, 0.1)' }}>
          [ERROR] {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="section-label" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>CARRIER ADDRESS</label>
          </div>
          <input 
            type="text" 
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            className="font-mono"
            placeholder="0x..."
            style={{ 
              padding: '12px', 
              border: '2px solid var(--ink)', 
              background: 'transparent', 
              color: 'var(--ink)',
              width: '100%',
              boxSizing: 'border-box',
              borderRadius: '0'
            }}
            disabled={loading || success}
          />
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
            <span style={{ fontSize: '10px', color: 'var(--steel)', fontFamily: 'var(--font-mono)', alignSelf: 'center' }}>QUICK SELECT:</span>
            {testAccounts?.slice(0, 5).map(acc => (
              <button
                key={acc.address}
                type="button"
                onClick={() => setCarrier(acc.address)}
                style={{
                  padding: '3px 8px',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  border: '1px solid var(--ink)',
                  background: carrier.toLowerCase() === acc.address.toLowerCase() ? 'var(--ink)' : 'transparent',
                  color: carrier.toLowerCase() === acc.address.toLowerCase() ? 'white' : 'var(--ink)',
                  cursor: 'pointer'
                }}
              >
                {acc.shortLabel}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="section-label" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>RECEIVER ADDRESS</label>
          </div>
          <input 
            type="text" 
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            className="font-mono"
            placeholder="0x..."
            style={{ 
              padding: '12px', 
              border: '2px solid var(--ink)', 
              background: 'transparent', 
              color: 'var(--ink)',
              width: '100%',
              boxSizing: 'border-box',
              borderRadius: '0'
            }}
            disabled={loading || success}
          />
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
            <span style={{ fontSize: '10px', color: 'var(--steel)', fontFamily: 'var(--font-mono)', alignSelf: 'center' }}>QUICK SELECT:</span>
            {testAccounts?.slice(0, 5).map(acc => (
              <button
                key={acc.address}
                type="button"
                onClick={() => setReceiver(acc.address)}
                style={{
                  padding: '3px 8px',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  border: '1px solid var(--ink)',
                  background: receiver.toLowerCase() === acc.address.toLowerCase() ? 'var(--ink)' : 'transparent',
                  color: receiver.toLowerCase() === acc.address.toLowerCase() ? 'white' : 'var(--ink)',
                  cursor: 'pointer'
                }}
              >
                {acc.shortLabel}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="section-label" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>SHIPMENT DESCRIPTION</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{ 
              padding: '12px', 
              border: '2px solid var(--ink)', 
              background: 'transparent', 
              color: 'var(--ink)',
              fontFamily: '"Inter", sans-serif',
              resize: 'vertical',
              width: '100%',
              boxSizing: 'border-box',
              borderRadius: '0'
            }}
            disabled={loading || success}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="section-label" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>ATTACH DOCUMENTS</label>
          <div style={{ position: 'relative' }}>
            <input 
              type="file" 
              multiple 
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              disabled={loading || success}
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer'
              }}
            />
            <div style={{
              padding: '32px',
              border: '2px dashed var(--ink)',
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
              background: 'var(--paper)',
              color: 'var(--ink)'
            }}>
              DROP FILES OR CLICK TO ATTACH
            </div>
          </div>
          {files.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              {files.map((f, i) => (
                <div key={i} className="font-mono text-sm">
                  - {f.name} ({(f.size / 1024).toFixed(1)} KB)
                </div>
              ))}
            </div>
          )}
        </div>

        {progress.length > 0 && (
          <div style={{ padding: '16px', border: '2px solid var(--ink)', background: 'var(--steel)', color: 'white' }} className="font-mono text-sm">
            {progress.map((step, i) => (
              <div key={i}>{step}</div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '16px', border: success ? '2px solid var(--verified-green)' : 'none', position: 'relative' }} className={success ? 'animate-stamp-flash' : ''}>
          {!success ? (
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ width: '100%', padding: '16px', fontSize: '16px' }}
              disabled={loading || !account}
            >
              {loading ? 'PROCESSING...' : 'SUBMIT TO CHAIN'}
            </button>
          ) : (
            <div className="stamp animate-stamp" style={{ border: '2px solid var(--verified-green)', padding: '16px', textAlign: 'center' }}>
              <div className="text-green font-mono font-bold mb-2">CONFIRMED ON-CHAIN</div>
              <div className="text-green font-mono text-xs">BLOCK #{success.blockNumber}</div>
              <div className="text-green font-mono text-xs">TX: {success.txHash ? success.txHash.substring(0, 16) + '...' : ''}</div>
              {success.otp && (
                <div style={{ marginTop: '12px', padding: '12px', background: 'var(--ink)', color: 'white', border: '2px solid var(--verified-green)' }}>
                  <div style={{ fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: '#ccc' }}>RECEIVER DELIVERY OTP</div>
                  <div style={{ fontSize: '28px', letterSpacing: '6px', fontWeight: 'bold', color: 'var(--amber)', margin: '6px 0' }}>{success.otp}</div>
                  <div style={{ fontSize: '11px', color: '#aaa' }}>Cryptographic Proof-of-Delivery hash stored on-chain.</div>
                </div>
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default CreateShipmentForm;
