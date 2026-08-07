import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useContract } from '../hooks/useContract';
import { useWallet } from '../context/WalletContext';
import ShipmentCard from '../components/shipment/ShipmentCard';
import LiveEventFeed from '../components/feed/LiveEventFeed';
import ConnectWallet from '../components/wallet/ConnectWallet';

const Dashboard = () => {
  const { address, isConnected } = useWallet();
  const { getShipmentCount, getShipment } = useContract();
  
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('sender'); // sender, carrier, receiver

  useEffect(() => {
    const fetchShipments = async () => {
      if (!isConnected || !address) return;
      
      try {
        setLoading(true);
        const count = await getShipmentCount();
        const fetchedShipments = [];
        
        // In a real dApp, you might want to fetch these in parallel or use an indexer.
        for (let i = 0; i < count; i++) {
          const shipment = await getShipment(i);
          fetchedShipments.push(shipment);
        }
        
        // Sort newest first
        fetchedShipments.sort((a, b) => b.id - a.id);
        setShipments(fetchedShipments);
      } catch (err) {
        console.error('Failed to fetch shipments', err);
      } finally {
        setLoading(false);
      }
    };

    fetchShipments();
  }, [isConnected, address, getShipmentCount, getShipment]);

  const filteredShipments = useMemo(() => {
    if (!address) return [];
    
    return shipments.filter(s => {
      const addrLower = address.toLowerCase();
      if (activeTab === 'sender') return s.sender.toLowerCase() === addrLower;
      if (activeTab === 'carrier') return s.carrier.toLowerCase() === addrLower;
      if (activeTab === 'receiver') return s.receiver.toLowerCase() === addrLower;
      return false;
    });
  }, [shipments, address, activeTab]);

  if (!isConnected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '16px', color: 'var(--text-primary, #fff)', fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)' }}>
          Ship<span style={{ color: 'var(--accent-green, #00d474)' }}>.Eazy</span>
        </h1>
        <p className="text-secondary" style={{ fontSize: '1.25rem', marginBottom: '32px', maxWidth: '500px' }}>
          Tamper-evident shipment tracking on Polygon. Connect your wallet to get started.
        </p>
        <ConnectWallet />
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
      {/* Desktop uses 2 columns, Mobile stacks */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
        
        {/* Main Content (2/3 approx on large screens if we set flex or grid columns manually) */}
        <div style={{ gridColumn: '1 / span 2' }}>
          <div className="flex-between" style={{ marginBottom: '24px' }}>
            <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Dashboard</h1>
            <Link to="/create" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              Create Shipment
            </Link>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--border-subtle, #333)' }}>
            <button 
              onClick={() => setActiveTab('sender')} 
              style={{ 
                background: 'none', 
                border: 'none', 
                color: activeTab === 'sender' ? 'var(--accent-green, #00d474)' : 'var(--text-secondary, #a1a1aa)', 
                padding: '12px 16px', 
                cursor: 'pointer',
                borderBottom: activeTab === 'sender' ? '2px solid var(--accent-green, #00d474)' : '2px solid transparent',
                fontWeight: activeTab === 'sender' ? 600 : 400
              }}
            >
              As Sender
            </button>
            <button 
              onClick={() => setActiveTab('carrier')} 
              style={{ 
                background: 'none', 
                border: 'none', 
                color: activeTab === 'carrier' ? 'var(--accent-green, #00d474)' : 'var(--text-secondary, #a1a1aa)', 
                padding: '12px 16px', 
                cursor: 'pointer',
                borderBottom: activeTab === 'carrier' ? '2px solid var(--accent-green, #00d474)' : '2px solid transparent',
                fontWeight: activeTab === 'carrier' ? 600 : 400
              }}
            >
              As Carrier
            </button>
            <button 
              onClick={() => setActiveTab('receiver')} 
              style={{ 
                background: 'none', 
                border: 'none', 
                color: activeTab === 'receiver' ? 'var(--accent-green, #00d474)' : 'var(--text-secondary, #a1a1aa)', 
                padding: '12px 16px', 
                cursor: 'pointer',
                borderBottom: activeTab === 'receiver' ? '2px solid var(--accent-green, #00d474)' : '2px solid transparent',
                fontWeight: activeTab === 'receiver' ? 600 : 400
              }}
            >
              As Receiver
            </button>
          </div>

          {loading ? (
            <p className="text-secondary" style={{ padding: '24px 0' }}>Loading shipments...</p>
          ) : filteredShipments.length > 0 ? (
            <div>
              {filteredShipments.map(shipment => (
                <ShipmentCard key={shipment.id} shipment={shipment} />
              ))}
            </div>
          ) : (
            <p className="text-muted" style={{ padding: '24px 0' }}>No shipments found for this role.</p>
          )}

          <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '32px', fontStyle: 'italic' }}>
            Actions filtered by wallet role. Enforcement is on-chain — this is a UX convenience, not a security boundary.
          </p>
        </div>

        {/* Live Feed Sidebar */}
        <div style={{ gridColumn: 'span 1' }}>
          <LiveEventFeed />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
