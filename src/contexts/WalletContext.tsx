import { createContext, useContext, ReactNode } from 'react';
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';
import { useWallet } from '../hooks/useWallet';

interface WalletContextType {
  kit: StellarWalletsKit | null;
  connected: boolean;
  address: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  initError: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const wallet = useWallet();
  
  return (
    <WalletContext.Provider value={wallet}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
}

