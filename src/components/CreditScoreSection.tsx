import React from 'react';
import { useCreditScoring } from '../hooks/useCreditScoring';
import { useWalletContext } from '../contexts/WalletContext';
import LoanetSection from './LoanetSection';
import './CreditScoreSection.css';

export default function CreditScoreSection() {
  const { kit, connected, address } = useWalletContext();
  const { creditScore, loading, initializeUser, refresh } = useCreditScoring(
    kit,
    connected,
    address
  );

  const handleInitialize = async () => {
    try {
      await initializeUser();
      alert('✅ Excellent! Your credit score was approved.\n\nYou have up to $1000 USDC available to request loans.\n\nNote: Make sure the liquidity pool has sufficient funds before requesting a loan.');
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  if (!connected) {
    return null;
  }

  return (
    <LoanetSection title="📊 Credit Score">
      {creditScore ? (
        <div className="credit-score-info">
          <div className="score-display">
            <div className="score-value">{creditScore.score}</div>
            <div className="score-label">Points</div>
          </div>
          <div className="score-details">
            <div className="detail-item">
              <span className="detail-label">Maximum Loan Amount:</span>
              <span className="detail-value">${creditScore.maxLoanAmount.toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status:</span>
              <span className={`detail-value ${creditScore.blacklisted ? 'blacklisted' : 'active'}`}>
                {creditScore.blacklisted ? '🚫 Blacklisted' : '✅ Active'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="credit-score-init">
          <p className="description">
            Initialize your credit score to start requesting loans.
            <br />
            <strong>Note:</strong> When initializing, you will get a score of 300 points, which allows you to request loans up to $1000 USDC.
          </p>
          <button
            onClick={handleInitialize}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Initializing...' : 'Initialize Score'}
          </button>
        </div>
      )}
    </LoanetSection>
  );
}

