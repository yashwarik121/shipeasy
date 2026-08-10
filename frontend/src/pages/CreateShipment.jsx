import React from 'react';
import { Link } from 'react-router-dom';
import CreateShipmentForm from '../components/shipment/CreateShipmentForm';

const CreateShipment = () => {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Breadcrumb */}
      <div className="font-mono text-sm mb-4" style={{ color: 'var(--steel)' }}>
        <Link to="/dashboard" style={{ color: 'var(--ink)', textDecoration: 'none' }}>DASHBOARD</Link>
        {' > '}
        <span>NEW CUSTODY TRANSFER</span>
      </div>

      <CreateShipmentForm />

    </div>
  );
};

export default CreateShipment;
