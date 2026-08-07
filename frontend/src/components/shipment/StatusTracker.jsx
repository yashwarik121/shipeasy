import React from 'react';

const StatusTracker = ({ currentStatus }) => {
  const stages = ['Created', 'Picked Up', 'In Transit', 'Delivered'];
  
  return (
    <div className="card" style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%', maxWidth: '800px' }}>
        {stages.map((stage, index) => {
          const isCompleted = index < currentStatus;
          const isCurrent = index === currentStatus;
          const isFuture = index > currentStatus;

          return (
            <React.Fragment key={index}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', width: '40px' }}>
                <div 
                  className={isCurrent ? 'animate-confirm' : ''}
                  style={{
                    width: '16px',
                    height: '16px',
                    backgroundColor: isCompleted || isCurrent ? 'var(--accent-green, #00d474)' : 'transparent',
                    border: isFuture ? '1px solid var(--border-subtle, #333)' : '1px solid var(--accent-green, #00d474)',
                    transform: 'rotate(45deg)',
                    marginBottom: '12px',
                    zIndex: 2
                  }}
                />
                <span 
                  style={{
                    position: 'absolute',
                    top: '32px',
                    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                    fontSize: '0.75rem',
                    color: isFuture ? 'var(--text-muted, #71717a)' : 'var(--text-primary, #fff)',
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  {stage}
                </span>
              </div>
              
              {index < stages.length - 1 && (
                <div 
                  style={{
                    flex: 1,
                    height: '1px',
                    backgroundColor: isCompleted ? 'var(--accent-green, #00d474)' : 'var(--border-subtle, #333)',
                    marginTop: '7px'
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default StatusTracker;
