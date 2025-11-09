import React from 'react';
import './WalletButton.css';

interface WalletButtonProps {
  connected: boolean;
  address: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  initError?: string | null;
}

const WalletButton: React.FC<WalletButtonProps> = ({
  connected,
  address,
  onConnect,
  onDisconnect,
  initError,
}) => {
  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  return (
    <div className="wallet-button-container">
      {initError && (
        <div className="wallet-error">
          <p>⚠️ {initError}</p>
          <a 
            href="https://freighter.app" 
            target="_blank" 
            rel="noopener noreferrer"
            className="wallet-link"
          >
            Instalar Freighter
          </a>
        </div>
      )}
      {connected ? (
        <div className="wallet-info">
          <div className="wallet-address">
            <span className="address-label">Conectado:</span>
            <span className="address-value">{formatAddress(address || '')}</span>
          </div>
          <button onClick={onDisconnect} className="wallet-btn disconnect-btn">
            Desconectar
          </button>
        </div>
      ) : (
        <button 
          onClick={onConnect} 
          className="wallet-btn connect-btn"
          disabled={!!initError}
        >
          🔗 Conectar Wallet
        </button>
      )}
    </div>
  );
};

export default WalletButton;

