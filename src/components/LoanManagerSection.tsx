import React, { useState, useMemo } from 'react';
import { useLoanManager } from '../hooks/useLoanManager';
import { useWalletContext } from '../contexts/WalletContext';
import LoanetSection from './LoanetSection';
import './LoanManagerSection.css';

export default function LoanManagerSection() {
  const { kit, connected, address } = useWalletContext();
  const { loan, loading, requestLoan, payInstallment, refresh } = useLoanManager(
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
      alert('Por favor ingresa un monto válido');
      return;
    }

    if (payments < 1 || payments > 12) {
      alert('El número de pagos debe estar entre 1 y 12');
      return;
    }

    try {
      await requestLoan(amount * 1e6, payments); // Convert to smallest unit
      setLoanAmount('');
      alert('Préstamo solicitado exitosamente');
    } catch (error: any) {
      const errorMsg = error?.message || 'Error desconocido';
      alert(`Error: ${errorMsg}`);
    }
  };

  const handlePayInstallment = async () => {
    if (!loan) {
      alert('No tienes un préstamo activo');
      return;
    }

    try {
      await payInstallment();
      alert('Pago realizado exitosamente');
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  if (!connected) {
    return null;
  }

  return (
    <LoanetSection title="💰 Mi Préstamo">
      {loan ? (
        <div className="loan-info">
          <div className="loan-header">
            <h3>Préstamo Adquirido</h3>
            <div className="loan-amount-display">
              ${(loan.amount / 1e6).toFixed(2)} USDC
            </div>
            <div className="loan-installments">
              A devolver en {loan.numPayments} {loan.numPayments === 1 ? 'cuota' : 'cuotas'}
            </div>
          </div>

          <div className="loan-details">
            <div className="detail-row">
              <span className="detail-label">Monto Total (con intereses):</span>
              <span className="detail-value">${(loan.totalAmount / 1e6).toFixed(2)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Cuotas Pagadas:</span>
              <span className="detail-value">
                {loan.paidPayments} / {loan.numPayments}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Monto por Cuota:</span>
              <span className="detail-value">${(loan.paymentAmount / 1e6).toFixed(2)}</span>
            </div>
            {nextPaymentDate && (
              <div className="detail-row">
                <span className="detail-label">Próxima Cuota Vence:</span>
                <span className="detail-value payment-due">
                  {nextPaymentDate.toLocaleDateString('es-ES', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                  })}
                </span>
              </div>
            )}
            <div className="detail-row">
              <span className="detail-label">Estado:</span>
              <span className={`detail-value status-${loan.status.toLowerCase()}`}>
                {loan.status === 'Active' ? '🟢 Activo' : loan.status === 'Repaid' ? '✅ Pagado' : '🔴 Vencido'}
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
                {loading ? 'Pagando...' : '💳 Pagar Cuota Ahora'}
              </button>
              <p className="early-payment-note">
                Puedes pagar tu cuota antes de la fecha de vencimiento
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="loan-request">
          <p className="description">
            Solicita un préstamo basado en tu puntaje crediticio.
          </p>
          <div className="request-form">
            <div className="form-group">
              <label>Monto del Préstamo (USDC)</label>
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
              <label>Número de Pagos</label>
              <select
                value={numPayments}
                onChange={(e) => setNumPayments(e.target.value)}
                className="input"
              >
                <option value="1">1 pago</option>
                <option value="3">3 pagos</option>
                <option value="6">6 pagos</option>
                <option value="12">12 pagos</option>
              </select>
            </div>
            <button
              onClick={handleRequestLoan}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Solicitando...' : 'Solicitar Préstamo'}
            </button>
          </div>
        </div>
      )}
    </LoanetSection>
  );
}

