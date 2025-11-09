import { useState, useMemo } from 'react';
import { useLoanManager } from '../hooks/useLoanManager';
import { useWalletContext } from '../contexts/WalletContext';
import LoanetSection from './LoanetSection';
import './LoanManagerSection.css';

export default function LoanManagerSection() {
  const { kit, connected, address } = useWalletContext();
  const { loan, loading, requestLoan, payInstallment } = useLoanManager(
    kit,
    connected,
    address
  );
  const [loanAmount, setLoanAmount] = useState('');
  const [numPayments, setNumPayments] = useState('3');

  // Calcular fecha de vencimiento de la próxima cuota
  const nextPaymentDate = useMemo(() => {
    if (!loan || loan.status !== 'Active') return null;
    
    // createdAt está en segundos (timestamp Unix)
    const loanDate = new Date(loan.createdAt * 1000);
    // La próxima cuota vence un mes después de la fecha de creación + meses de cuotas ya pagadas
    // Ejemplo: si se creó el 8/11/2025 y pagó 0 cuotas, la primera vence el 8/12/2025
    // Si pagó 1 cuota, la próxima (segunda) vence el 8/01/2026
    const nextPayment = new Date(loanDate);
    nextPayment.setMonth(nextPayment.getMonth() + loan.paidPayments + 1);
    
    return nextPayment;
  }, [loan]);

  const handleRequestLoan = async () => {
    const amount = parseFloat(loanAmount);
    const payments = parseInt(numPayments);

    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (payments < 1 || payments > 12) {
      alert('The number of payments must be between 1 and 12');
      return;
    }

    try {
      await requestLoan(amount * 1e6, payments); // Convert to smallest unit
      setLoanAmount('');
      alert('Loan requested successfully');
    } catch (error: any) {
      const errorMsg = error?.message || 'Unknown error';
      alert(`Error: ${errorMsg}`);
    }
  };

  const handlePayInstallment = async () => {
    if (!loan) {
      alert('You do not have an active loan');
      return;
    }

    try {
      await payInstallment();
      alert('Payment completed successfully');
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  if (!connected) {
    return null;
  }

  return (
    <LoanetSection title="💰 My Loan">
      {loan ? (
        <div className="loan-info">
          <div className="loan-header">
            <h3>Loan Acquired</h3>
            <div className="loan-amount-display">
              ${(loan.amount / 1e6).toFixed(2)} USDC
            </div>
            <div className="loan-installments">
              To be repaid in {loan.numPayments} {loan.numPayments === 1 ? 'installment' : 'installments'}
            </div>
          </div>

          <div className="loan-details">
            <div className="detail-row">
              <span className="detail-label">Total Amount (with interest):</span>
              <span className="detail-value">${(loan.totalAmount / 1e6).toFixed(2)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Paid Installments:</span>
              <span className="detail-value">
                {loan.paidPayments} / {loan.numPayments}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Amount per Installment:</span>
              <span className="detail-value">${(loan.paymentAmount / 1e6).toFixed(2)}</span>
            </div>
            {nextPaymentDate && (
              <div className="detail-row">
                <span className="detail-label">Next Installment Due:</span>
                <span className="detail-value payment-due">
                  {nextPaymentDate.toLocaleDateString('en-US', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                  })}
                </span>
              </div>
            )}
            <div className="detail-row">
              <span className="detail-label">Status:</span>
              <span className={`detail-value status-${loan.status.toLowerCase()}`}>
                {loan.status === 'Active' ? '🟢 Active' : loan.status === 'Repaid' ? '✅ Paid' : '🔴 Defaulted'}
              </span>
            </div>
          </div>

          {loan.status === 'Active' && (
            <div className="payment-actions">
              <button
                onClick={handlePayInstallment}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Paying...' : '💳 Pay Installment Now'}
              </button>
              <p className="early-payment-note">
                You can pay your installment before the due date
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="loan-request">
          <p className="description">
            Request a loan based on your credit score.
          </p>
          <div className="request-form">
            <div className="form-group">
              <label>Loan Amount (USDC)</label>
              <input
                type="number"
                placeholder="0.00"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                className="input"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label>Number of Payments</label>
              <select
                value={numPayments}
                onChange={(e) => setNumPayments(e.target.value)}
                className="input"
              >
                <option value="1">1 payment</option>
                <option value="3">3 payments</option>
                <option value="6">6 payments</option>
                <option value="12">12 payments</option>
              </select>
            </div>
            <button
              onClick={handleRequestLoan}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Requesting...' : 'Request Loan'}
            </button>
          </div>
        </div>
      )}
    </LoanetSection>
  );
}

