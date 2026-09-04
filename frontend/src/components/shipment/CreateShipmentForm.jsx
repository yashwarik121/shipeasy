import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import { useContract } from '../../hooks/useContract';

const CreateShipmentForm = () => {
  const [carrier, setCarrier] = useState('');
  const [receiver, setReceiver] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [progress, setProgress] = useState([]);
  
  const { account } = useWallet();
  const { createShipment, addDocument } = useContract();
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
      setProgress(p => [...p, 'CREATING SHIPMENT ON-CHAIN...']);
      const receipt = await createShipment(carrier, receiver, description);
      
      let shipmentId;
      try {
        const res = await fetch('http://localhost:3001/api/shipments');
        const data = await res.json();
        shipmentId = data.length - 1;
      } catch (err) {
        console.error('Failed to fetch shipment ID', err);
        throw new Error('Failed to retrieve shipment ID after creation');
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

          const uploadRes = await fetch(`http://localhost:3001/api/shipments/${shipmentId}/documents`, {
            method: 'POST',
            body: formData,
          });

          if (!uploadRes.ok) {
            throw new Error(`Failed to upload ${file.name}`);
          }
        }
        setProgress(p => [...p, '✓ ALL FILES UPLOADED']);
      }

      setSuccess({
        blockNumber: receipt.blockNumber,
        txHash: receipt.hash
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
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
          <label className="section-label" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>CARRIER ADDRESS</label>
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
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="section-label" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>RECEIVER ADDRESS</label>
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
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default CreateShipmentForm;
