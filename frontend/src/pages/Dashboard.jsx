import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { API_BASE_URL } from '../utils/api';
import ShipmentCard from '../components/shipment/ShipmentCard';
import LiveEventFeed from '../components/feed/LiveEventFeed';

const Dashboard = () => {
  const { account } = useWallet();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL');
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!account) {
      navigate('/');
      return;
    }

    const fetchShipments = async () => {
      setLoading(true);
      try {
        // Fetch from backend API
        const res = await fetch(`${API_BASE_URL}/api/shipments`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.value || []);
          list.sort((a, b) => Number(b.lastUpdated || b.updatedAt || 0) - Number(a.lastUpdated || a.updatedAt || 0));
          setShipments(list);
        }
      } catch (err) {
        console.error("Failed to fetch shipments", err);
      }
      setLoading(false);
    };

    fetchShipments();
  }, [account, navigate]);

  if (!account) return null;

  const lowerAccount = account.toLowerCase();
  const myShipments = shipments.filter(s => 
    s.sender.toLowerCase() === lowerAccount || 
    s.carrier.toLowerCase() === lowerAccount || 
    s.receiver.toLowerCase() === lowerAccount
  );
  const carrierShipments = shipments.filter(s => s.carrier.toLowerCase() === lowerAccount);
  const receiverShipments = shipments.filter(s => s.receiver.toLowerCase() === lowerAccount);
  const senderShipments = shipments.filter(s => s.sender.toLowerCase() === lowerAccount);

  const filteredShipments = shipments.filter(s => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'ASSIGNED TO ME') return s.sender.toLowerCase() === lowerAccount || s.carrier.toLowerCase() === lowerAccount || s.receiver.toLowerCase() === lowerAccount;
    if (activeTab === 'AS CARRIER') return s.carrier.toLowerCase() === lowerAccount;
    if (activeTab === 'AS RECEIVER') return s.receiver.toLowerCase() === lowerAccount;
    if (activeTab === 'AS SENDER') return s.sender.toLowerCase() === lowerAccount;
    return true;
  });

  const tabOptions = [
    { id: 'ALL', label: `ALL (${shipments.length})` },
    { id: 'ASSIGNED TO ME', label: `ASSIGNED TO ME (${myShipments.length})` },
    { id: 'AS CARRIER', label: `AS CARRIER (${carrierShipments.length})` },
    { id: 'AS RECEIVER', label: `AS RECEIVER (${receiverShipments.length})` },
    { id: 'AS SENDER', label: `AS SENDER (${senderShipments.length})` }
  ];

  return (
    <div style={{ display: 'flex', gap: '48px', alignItems: 'flex-start' }}>
      
      {/* Main Column */}
      <div style={{ flex: 1 }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 className="display-lg uppercase" style={{ margin: '0 0 8px 0' }}>CUSTODY LEDGER</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--steel)' }}>LOGGED IN IDENTITY:</span>
            <span className="chain-address font-mono" style={{ fontSize: '14px', fontWeight: 'bold' }}>{account}</span>
          </div>
        </div>

        {/* Role Tabs */}
        <div style={{ display: 'flex', gap: '24px', marginBottom: '28px', borderBottom: '2px solid var(--steel)', overflowX: 'auto' }}>
          {tabOptions.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid var(--ink)' : '3px solid transparent',
                padding: '0 0 10px 0',
                margin: '0 0 -2px 0',
                fontFamily: 'var(--font-mono)',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                fontSize: '13px',
                color: activeTab === tab.id ? 'var(--ink)' : 'var(--steel)',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Ledger Table */}
        <div style={{ border: '3px solid var(--ink)', backgroundColor: 'var(--paper)', marginBottom: '24px' }}>
          <table className="ledger" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '3px solid var(--ink)', backgroundColor: 'var(--paper)' }}>
                <th style={{ padding: '16px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--steel)' }}>#</th>
                <th style={{ padding: '16px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--steel)' }}>DESCRIPTION</th>
                <th style={{ padding: '16px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--steel)' }}>STATUS</th>
                <th style={{ padding: '16px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--steel)' }}>CARRIER</th>
                <th style={{ padding: '16px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--steel)' }}>LAST UPDATED</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>Loading records...</td>
                </tr>
              ) : filteredShipments.length > 0 ? (
                filteredShipments.map(s => <ShipmentCard key={s.id.toString()} shipment={s} />)
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--steel)' }}>
                    No custody records found for this role.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Link 
          to="/create" 
          className="btn btn-primary" 
          style={{ padding: '16px 24px', textDecoration: 'none', display: 'inline-block' }}
        >
          INITIATE NEW TRANSFER
        </Link>
        
        <p className="text-xs text-steel font-mono mt-4">
          Role filtering is a UI convenience. Enforcement is on-chain.
        </p>

      </div>

      {/* Side Column */}
      <div style={{ width: '350px' }}>
        <LiveEventFeed />
      </div>

    </div>
  );
};

export default Dashboard;
