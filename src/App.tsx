import { useWalletContext } from './contexts/WalletContext';
import WalletButton from './components/WalletButton';
import IdentitySection from './components/IdentitySection';
import CreditScoreSection from './components/CreditScoreSection';
import MockUSDCSection from './components/MockUSDCSection';
import LoanManagerSection from './components/LoanManagerSection';
import './App.css';

function App() {
  const { kit, connected, address, connect, disconnect, initError } = useWalletContext();

  return (
    <div className="app">
      <header className="app-header">
        <h1>🌟 Loanet</h1>
        <p className="subtitle">Sistema de Préstamos Descentralizado en Stellar</p>
      </header>

      <main className="app-main">
        <div className="wallet-section">
          <WalletButton
            connected={connected}
            address={address}
            onConnect={connect}
            onDisconnect={disconnect}
            initError={initError}
          />
        </div>

        {connected && (
          <div className="loanet-sections">
            <IdentitySection />
            <CreditScoreSection />
            <MockUSDCSection />
            <LoanManagerSection />
          </div>
        )}

        {!connected && (
          <div className="info-section">
            <div className="info-card">
              <h3>🔐 Conecta tu Wallet</h3>
              <p>Para usar el sistema de préstamos descentralizado, primero necesitas conectar tu wallet Stellar.</p>
              <ul>
                <li>✅ Smart Contracts desplegados (Rust/WASM)</li>
                <li>✅ Sistema de identidades verificadas</li>
                <li>✅ Puntaje crediticio on-chain</li>
                <li>✅ Gestor de préstamos</li>
                <li>✅ Stellar Wallet Kit integrado</li>
              </ul>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Loanet - Sistema de Préstamos Descentralizado en Stellar</p>
      </footer>
    </div>
  );
}

export default App;
