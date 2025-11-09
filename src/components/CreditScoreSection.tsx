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
      alert('✅ ¡Excelente! Tu scoring fue aprobado.\n\nTienes hasta $1000 USDC disponibles para solicitar préstamos.\n\nNota: Asegúrate de que el pool de liquidez tenga fondos suficientes antes de solicitar un préstamo.');
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  if (!connected) {
    return null;
  }

  return (
    <LoanetSection title="📊 Puntaje Crediticio">
      {creditScore ? (
        <div className="credit-score-info">
          <div className="score-display">
            <div className="score-value">{creditScore.score}</div>
            <div className="score-label">Puntos</div>
          </div>
          <div className="score-details">
            <div className="detail-item">
              <span className="detail-label">Monto Máximo de Préstamo:</span>
              <span className="detail-value">${creditScore.maxLoanAmount.toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Estado:</span>
              <span className={`detail-value ${creditScore.blacklisted ? 'blacklisted' : 'active'}`}>
                {creditScore.blacklisted ? '🚫 En Lista Negra' : '✅ Activo'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="credit-score-init">
          <p className="description">
            Inicializa tu puntaje crediticio para comenzar a solicitar préstamos.
            <br />
            <strong>Nota:</strong> Al inicializar, obtendrás un score de 300 puntos, lo que te permite solicitar préstamos hasta $1000 USDC.
          </p>
          <button
            onClick={handleInitialize}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Inicializando...' : 'Inicializar Score'}
          </button>
        </div>
      )}
    </LoanetSection>
  );
}

