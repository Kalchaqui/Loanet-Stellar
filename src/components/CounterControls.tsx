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
          ➖ Decrement
        </button>
        <button
          onClick={onIncrement}
          disabled={loading}
          className="control-btn increment-btn"
        >
          ➕ Increment
        </button>
      </div>
      <div className="secondary-buttons">
        <button
          onClick={onReset}
          disabled={loading}
          className="control-btn reset-btn"
        >
          🔄 Reset
        </button>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="control-btn refresh-btn"
        >
          🔃 Refresh
        </button>
      </div>
    </div>
  );
};

export default CounterControls;

