import React from 'react';

interface InactivityWarningModalProps {
  remainingSeconds: number;
  onStayActive: () => void;
}

const InactivityWarningModal: React.FC<InactivityWarningModalProps> = ({
  remainingSeconds,
  onStayActive,
}) => {
  console.log('[InactivityModal] Modal is rendering! Remaining seconds:', remainingSeconds);

  // Format seconds as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
        <h2 style={{ marginBottom: '20px', textAlign: 'center', width: '100%' }}>Are you still there?</h2>
        <div className="modal-body">
          <p style={{ fontSize: '1.125rem', marginBottom: '24px', textAlign: 'center' }}>
            You'll be logged out in <strong>{formatTime(remainingSeconds)}</strong> due to inactivity.
          </p>
          <button
            className="btn btn-primary btn-large"
            onClick={onStayActive}
            style={{ width: '100%' }}
          >
            I'm Still Here
          </button>
        </div>
      </div>
    </div>
  );
};

export default InactivityWarningModal;
