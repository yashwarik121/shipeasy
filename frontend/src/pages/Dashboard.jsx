import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { useContract } from '../hooks/useContract';
import ShipmentCard from '../components/shipment/ShipmentCard';
import LiveEventFeed from '../components/feed/LiveEventFeed';

const Dashboard = () => {
  const { account } = useWallet();
  const contract = useContract();
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
        if (!contract) return;
        const total = await contract.shipmentCount();
        const count = total.toNumber();
        
        let fetched = [];
        for (let i = 0; i < count; i++) {
          const s = await contract.getShipment(i);
          fetched.push(s);
        }
        
        fetched.sort((a, b) => b.lastUpdate.toNumber() - a.lastUpdate.toNumber());
        setShipments(fetched);
      } catch (err) {
        console.error("Failed to fetch shipments", err);
      }
      setLoading(false);
    };

    fetchShipments();
  }, [account, contract, navigate]);

  if (!account) return null;

  const filteredShipments = shipments.filter(s => {
    const lowerAccount = account.toLowerCase();
    if (activeTab === 'ALL') return true;
    if (activeTab === 'AS SENDER') return s.sender.toLowerCase() === lowerAccount;
    if (activeTab === 'AS CARRIER') return s.carrier.toLowerCase() === lowerAccount;
    if (activeTab === 'AS RECEIVER') return s.receiver.toLowerCase() === lowerAccount;
    return true;
  });

  const tabs = ['ALL', 'AS SENDER', 'AS CARRIER', 'AS RECEIVER'];

  return (
    <div style={{ display: 'flex', gap: '48px', alignItems: 'flex-start' }}>
      
      {/* Main Column */}
      <div style={{ flex: 1 }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 className="display-lg uppercase" style={{ margin: '0 0 8px 0' }}>CUSTODY RECORDS</h1>
          <div className="chain-address font-mono" style={{ fontSize: '16px' }}>{account}</div>
        </div>

        {/* Role Tabs */}
        <div style={{ display: 'flex', gap: '32px', marginBottom: '32px', borderBottom: '1px solid var(--steel)' }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '3px solid var(--ink)' : '3px solid transparent',
                padding: '0 0 12px 0',
                margin: '0 0 -1px 0',
                fontFamily: 'var(--font-mono)',
                fontWeight: 'bold',
                fontSize: '14px',
                color: 'var(--ink)',
                cursor: 'pointer'
              }}
            >
              {tab}
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
