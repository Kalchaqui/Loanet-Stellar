import { useState, useCallback } from 'react';
import { 
  StellarWalletsKit, 
  WalletNetwork, 
  allowAllModules
} from '@creit.tech/stellar-wallets-kit';

const NETWORK = import.meta.env.VITE_STELLAR_NETWORK || 'testnet';

export function useWallet() {
  const [kit, setKit] = useState<StellarWalletsKit | null>(null);
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  /**
   * Initialize the wallet kit lazily (only when needed)
   * Uses the first available module as a placeholder for selectedWalletId
   */
  const initializeKit = useCallback(async (): Promise<StellarWalletsKit | null> => {
    // Wait a bit for extensions to inject into the page
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      // Use allowAllModules - it will return all available modules
      const allModules = allowAllModules();
      
      console.log('All modules found:', allModules);
      
      // Get valid modules with productId (required for selectedWalletId)
      const validModules = allModules.filter((module: any) => {
        const hasProductId = module.productId !== undefined && module.productId !== null && module.productId !== '';
        return hasProductId;
      });

      console.log('Valid modules:', validModules.length);

      if (validModules.length === 0) {
        const errorMsg = 'No hay extensiones de wallet disponibles. Por favor instala una extensión de wallet como Freighter desde https://freighter.app';
        console.warn(errorMsg);
        setInitError(errorMsg);
        return null;
      }

      // Use the first module's productId as placeholder for selectedWalletId
      // This is required by StellarWalletsKit constructor
      const firstModuleProductId = validModules[0].productId;
      
      console.log('Initializing kit with placeholder wallet:', firstModuleProductId);

      try {
        const walletKit = new StellarWalletsKit({
          network: NETWORK === 'public' ? WalletNetwork.PUBLIC : WalletNetwork.TESTNET,
          selectedWalletId: firstModuleProductId, // Required parameter
          modules: validModules,
        });

        console.log('Kit initialized successfully');
        setInitError(null);
        return walletKit;
      } catch (error: any) {
        const errorMsg = error?.message || 'Error al inicializar Stellar Wallet Kit';
        console.error('Error initializing Stellar Wallet Kit:', error);
        setInitError(errorMsg);
        return null;
      }
    } catch (error: any) {
      const errorMsg = error?.message || 'Error al inicializar Stellar Wallet Kit';
      console.error('Error initializing Stellar Wallet Kit:', error);
      setInitError(errorMsg);
      return null;
    }
  }, []);

  const connect = useCallback(async () => {
    // Initialize kit if not already initialized
    let currentKit = kit;
    if (!currentKit) {
      console.log('Kit not initialized, initializing now...');
      currentKit = await initializeKit();
      if (!currentKit) {
        alert('No se pudo inicializar el Wallet Kit. Por favor asegúrate de tener una extensión de wallet instalada.');
        return;
      }
      setKit(currentKit);
    }

    try {
      await currentKit.openModal({
        onWalletSelected: async (option) => {
          try {
            // Set the selected wallet (user's choice from modal)
            currentKit!.setWallet(option.id);
            
            // Get the public key from the wallet
            const publicKey = await currentKit!.getPublicKey();
            
            if (publicKey) {
              setAddress(publicKey);
              setConnected(true);
            }
          } catch (error) {
            console.error('Error connecting wallet:', error);
            alert('Error al conectar la wallet. Por favor intenta de nuevo.');
            throw error;
          }
        },
      });
    } catch (error) {
      console.error('Error opening wallet modal:', error);
      alert('No se pudo abrir el modal de wallet. Asegúrate de tener una extensión de wallet instalada.');
    }
  }, [kit, initializeKit]);

  const disconnect = useCallback(async () => {
    if (!kit) return;

    try {
      setConnected(false);
      setAddress(null);
      // Note: StellarWalletsKit doesn't have a disconnect method
      // The wallet remains connected, we just clear our state
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  }, [kit]);

  return { kit, connected, address, connect, disconnect, initError };
}
