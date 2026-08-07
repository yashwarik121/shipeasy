import React from 'react';
import { Link } from 'react-router-dom';
import CreateShipmentForm from '../components/shipment/CreateShipmentForm';

const CreateShipment = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', gap: '8px', fontSize: '0.875rem' }}>
        <Link to="/" style={{ color: 'var(--text-secondary, #a1a1aa)', textDecoration: 'none' }}>Dashboard</Link>
        <span className="text-muted">{'>'}</span>
        <span style={{ color: 'var(--text-primary, #fff)' }}>Create Shipment</span>
      </div>
      
      <div style={{ marginTop: '16px' }}>
        <CreateShipmentForm />
      </div>
    </div>
  );
};

export default CreateShipment;
