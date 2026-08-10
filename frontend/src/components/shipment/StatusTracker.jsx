import React from 'react';

const StatusTracker = ({ currentStatus }) => {
  const statuses = [
    { label: 'CREATED', index: 0 },
    { label: 'PICKED UP', index: 1 },
    { label: 'IN TRANSIT', index: 2 },
    { label: 'DELIVERED', index: 3 }
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '32px 0' }}>
      {statuses.map((status, i) => {
        const isCompleted = status.index < currentStatus;
        const isCurrent = status.index === currentStatus;
        const isFuture = status.index > currentStatus;

        let color = 'var(--steel)';
        let borderBottom = 'none';
        let fontWeight = 'normal';

        if (isCompleted) {
          color = 'var(--ink)';
          fontWeight = 'bold';
        } else if (isCurrent) {
          color = 'var(--ink)';
          fontWeight = 'bold';
          borderBottom = '3px solid var(--ink)';
        }

        return (
          <React.Fragment key={status.label}>
            <div style={{ 
              color, 
              borderBottom, 
              fontWeight,
              fontFamily: 'var(--font-mono)',
              padding: '4px 8px',
              fontSize: '14px',
              textTransform: 'uppercase'
            }}>
              {status.label}
            </div>
            {i < statuses.length - 1 && (
              <div style={{ 
                color: 'var(--steel)', 
                margin: '0 8px',
                fontFamily: 'var(--font-mono)',
                opacity: 0.5
              }}>
                ———
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StatusTracker;
