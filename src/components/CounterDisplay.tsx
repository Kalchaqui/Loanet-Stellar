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
          <p>Cargando...</p>
        </div>
      ) : (
        <>
          <div className="counter-value">{value}</div>
          <p className="counter-label">Valor actual del contador</p>
        </>
      )}
    </div>
  );
};

export default CounterDisplay;

