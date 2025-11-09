import React from 'react';
import { useMockUSDC } from '../hooks/useMockUSDC';
import { useWalletContext } from '../contexts/WalletContext';
import LoanetSection from './LoanetSection';
import './MockUSDCSection.css';

export default function MockUSDCSection() {
  const { kit, connected, address } = useWalletContext();
  const { balance, loading, faucet, refresh } = useMockUSDC(
    kit,
    connected,
    address
  );

  const handleFaucet = async () => {
    try {
      await faucet();
      alert('You received 1000 test USDC!');
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  if (!connected) {
    return null;
  }

  return (
    <LoanetSection title="🪙 Mock USDC (Testing)">
      <div className="mock-usdc-info">
        <div className="balance-display">
          <span className="balance-label">Your Balance:</span>
          <span className="balance-value">${balance.toFixed(2)} USDC</span>
        </div>
        <div className="faucet-section">
          <p className="description">
            Get test tokens to use in the lending system.
          </p>
          <button
            onClick={handleFaucet}
            disabled={loading}
            className="btn btn-faucet"
          >
            {loading ? 'Getting...' : '🚰 Get 1000 USDC'}
          </button>
        </div>
      </div>
    </LoanetSection>
  );
}

