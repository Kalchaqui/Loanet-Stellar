import { useState } from 'react';
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';
import { Contract, Networks, Server, TransactionBuilder, xdr } from 'stellar-sdk';

const NETWORK = import.meta.env.VITE_STELLAR_NETWORK || 'testnet';
const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID || '';

export function useCounter(kit: StellarWalletsKit | null, connected: boolean) {
  const [counterValue, setCounterValue] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const callContract = async (functionName: string, args: xdr.ScVal[] = []) => {
    if (!kit || !connected || !CONTRACT_ID) {
      throw new Error('Wallet not connected or contract ID not configured');
    }

    try {
      const addressResult = await kit.getAddress();
      if (!addressResult?.address) {
        throw new Error('No address available');
      }

      const networkPassphrase = NETWORK === 'public' 
        ? Networks.PUBLIC 
        : Networks.TESTNET;

      const server = new Server(
        NETWORK === 'public' 
          ? 'https://horizon.stellar.org' 
          : 'https://horizon-testnet.stellar.org'
      );

      const contract = new Contract(CONTRACT_ID);
      
      // Build the transaction
      const sourceAccount = await server.loadAccount(addressResult.address);
      
      const operation = contract.call(
        functionName,
        ...args
      );

      const transaction = new TransactionBuilder(sourceAccount, {
        fee: '100',
        networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      // Sign the transaction
      const { signedTxXdr } = await kit.signTransaction(transaction.toXDR(), {
        address: addressResult.address,
        networkPassphrase,
      });

      // Submit the transaction
      const signedTx = TransactionBuilder.fromXDR(
        signedTxXdr,
        networkPassphrase
      );

      const result = await server.submitTransaction(signedTx);
      return result;
    } catch (error) {
      console.error(`Error calling contract function ${functionName}:`, error);
      throw error;
    }
  };

  const readContract = async (functionName: string): Promise<number> => {
    if (!CONTRACT_ID) {
      throw new Error('Contract ID not configured');
    }

    try {
      const server = new Server(
        NETWORK === 'public' 
          ? 'https://horizon.stellar.org' 
          : 'https://horizon-testnet.stellar.org'
      );

      // For reading contract state, we'll use a simulation approach
      // In a real implementation, you'd use Soroban RPC to invoke view functions
      // This is a simplified version that returns a mock value
      // TODO: Implement actual contract read using Soroban RPC
      return 0; // Placeholder - would need actual contract response parsing
    } catch (error) {
      console.error(`Error reading contract function ${functionName}:`, error);
      throw error;
    }
  };

  const increment = async () => {
    setLoading(true);
    try {
      await callContract('increment');
      await refresh();
    } catch (error) {
      console.error('Error incrementing counter:', error);
      alert('Error al incrementar el contador. Asegúrate de que el contrato esté desplegado.');
    } finally {
      setLoading(false);
    }
  };

  const decrement = async () => {
    setLoading(true);
    try {
      await callContract('decrement');
      await refresh();
    } catch (error) {
      console.error('Error decrementing counter:', error);
      alert('Error al decrementar el contador. Asegúrate de que el contrato esté desplegado.');
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    setLoading(true);
    try {
      await callContract('reset');
      await refresh();
    } catch (error) {
      console.error('Error resetting counter:', error);
      alert('Error al resetear el contador. Asegúrate de que el contrato esté desplegado.');
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const value = await readContract('get_value');
      setCounterValue(value);
    } catch (error) {
      console.error('Error reading counter value:', error);
      // Fallback to showing 0 if read fails
      setCounterValue(0);
    } finally {
      setLoading(false);
    }
  };

  return {
    counterValue,
    loading,
    increment,
    decrement,
    reset,
    refresh,
  };
}

