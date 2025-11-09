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
        <p className="subtitle">Decentralized Lending System on Stellar</p>
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
              <h3>🔐 Connect your Wallet</h3>
              <p>To use the decentralized lending system, you first need to connect your Stellar wallet.</p>
              <ul>
                <li>✅ Deployed Smart Contracts (Rust/WASM)</li>
                <li>✅ Verified Identity System</li>
                <li>✅ On-chain Credit Score</li>
                <li>✅ Loan Manager</li>
                <li>✅ Stellar Wallet Kit Integrated</li>
              </ul>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Loanet - Decentralized Lending System on Stellar</p>
      </footer>
    </div>
  );
}

export default App;
