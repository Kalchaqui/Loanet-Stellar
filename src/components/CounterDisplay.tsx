import React from 'react';
import './CounterDisplay.css';

interface CounterDisplayProps {
  value: number;
  loading: boolean;
}

const CounterDisplay: React.FC<CounterDisplayProps> = ({ value, loading }) => {
  return (
    <div className="counter-display">
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      ) : (
        <>
          <div className="counter-value">{value}</div>
          <p className="counter-label">Current counter value</p>
        </>
      )}
    </div>
  );
};

export default CounterDisplay;

