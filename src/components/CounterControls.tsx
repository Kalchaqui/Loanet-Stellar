import React from 'react';
import './CounterControls.css';

interface CounterControlsProps {
  onIncrement: () => void;
  onDecrement: () => void;
  onReset: () => void;
  onRefresh: () => void;
  loading: boolean;
}

const CounterControls: React.FC<CounterControlsProps> = ({
  onIncrement,
  onDecrement,
  onReset,
  onRefresh,
  loading,
}) => {
  return (
    <div className="counter-controls">
      <div className="control-buttons">
        <button
          onClick={onDecrement}
          disabled={loading}
          className="control-btn decrement-btn"
        >
          ➖ Decrementar
        </button>
        <button
          onClick={onIncrement}
          disabled={loading}
          className="control-btn increment-btn"
        >
          ➕ Incrementar
        </button>
      </div>
      <div className="secondary-buttons">
        <button
          onClick={onReset}
          disabled={loading}
          className="control-btn reset-btn"
        >
          🔄 Resetear
        </button>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="control-btn refresh-btn"
        >
          🔃 Actualizar
        </button>
      </div>
    </div>
  );
};

export default CounterControls;

