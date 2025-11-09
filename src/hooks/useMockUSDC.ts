import { useState, useEffect } from 'react';
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';
import { callSorobanContract, readSorobanContract, toScValAddress, toScValI128 } from '../utils/sorobanHelpers';

const MOCK_USDC_CONTRACT = (import.meta as any).env?.VITE_MOCK_USDC_CONTRACT || '';

export function useMockUSDC(kit: StellarWalletsKit | null, connected: boolean, address: string | null) {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const loadBalance = async () => {
    if (!kit || !connected || !address || !MOCK_USDC_CONTRACT) {
      setBalance(0);
      return;
    }

    setLoading(true);
    try {
      console.log('Loading balance for address:', address);
      
      // Read balance from contract
      const balanceResult = await readSorobanContract(
        MOCK_USDC_CONTRACT,
        'balance',
        [toScValAddress(address)]
      );

      console.log('Balance result:', balanceResult);

      // Parse i128 balance from ScVal
      let balanceValue = 0;
      if (balanceResult !== null && balanceResult !== undefined) {
        try {
          console.log('Raw balanceResult:', balanceResult);
          console.log('balanceResult type:', typeof balanceResult);
          console.log('balanceResult._arm:', balanceResult._arm);
          console.log('balanceResult._value:', balanceResult._value);
          
          // i128 is stored as Int128Parts with hi and lo
          if (balanceResult.i128 && typeof balanceResult.i128 === 'function') {
            try {
              const i128Parts = balanceResult.i128();
              console.log('i128Parts:', i128Parts);
              if (i128Parts) {
                const lo = i128Parts.lo ? i128Parts.lo() : (i128Parts._value?.lo || i128Parts.lo);
                const hi = i128Parts.hi ? i128Parts.hi() : (i128Parts._value?.hi || i128Parts.hi || 0);
                
                console.log('i128 lo:', lo, 'hi:', hi);
                
                if (lo !== undefined && lo !== null) {
                  // Convert to BigInt to handle large numbers correctly
                  const loStr = lo.toString ? lo.toString() : String(lo);
                  const hiStr = hi ? (hi.toString ? hi.toString() : String(hi)) : '0';
                  
                  const loBigInt = BigInt(loStr);
                  const hiBigInt = BigInt(hiStr);
                  
                  // Combine hi and lo: value = (hi << 64) | lo
                  const combinedBigInt = (hiBigInt << BigInt(64)) | loBigInt;
                  balanceValue = Number(combinedBigInt);
                  
                  console.log('Parsed balance from i128:', {
                    lo: loBigInt.toString(),
                    hi: hiBigInt.toString(),
                    combined: combinedBigInt.toString(),
                    asNumber: balanceValue
                  });
                }
              }
            } catch (i128Error) {
              console.warn('Error calling i128():', i128Error);
            }
          }
          
          // Try _value access if it's an i128
          if (balanceValue === 0 && balanceResult._arm === 'i128' && balanceResult._value) {
            const value = balanceResult._value;
            console.log('Trying _value access, value:', value);
            
            if (typeof value === 'bigint') {
              balanceValue = Number(value);
              console.log('Parsed from bigint _value:', balanceValue);
            } else if (typeof value === 'object' && value !== null) {
              // It might be the i128 parts directly
              const lo = value.lo?.toString ? value.lo.toString() : (value.lo?.toString ? value.lo.toString() : value.lo);
              const hi = value.hi?.toString ? value.hi.toString() : (value.hi?.toString ? value.hi.toString() : (value.hi || 0));
              
              if (lo !== undefined) {
                const loBigInt = BigInt(String(lo));
                const hiBigInt = BigInt(String(hi || 0));
                const combinedBigInt = (hiBigInt << BigInt(64)) | loBigInt;
                balanceValue = Number(combinedBigInt);
                console.log('Parsed from object _value:', { lo, hi, combined: balanceValue });
              } else if (typeof value === 'number') {
                balanceValue = value;
              }
            } else if (typeof value === 'number') {
              balanceValue = value;
              console.log('Parsed from number _value:', balanceValue);
            }
          }
          
          // Fallback: try direct number or bigint
          if (balanceValue === 0 && (typeof balanceResult === 'number' || typeof balanceResult === 'bigint')) {
            balanceValue = Number(balanceResult);
            console.log('Parsed from direct number/bigint:', balanceValue);
          }
          
          // Last fallback: try _value directly
          if (balanceValue === 0 && balanceResult._value !== undefined) {
            const value = balanceResult._value;
            if (typeof value === 'bigint' || typeof value === 'number') {
              balanceValue = Number(value);
              console.log('Parsed from _value fallback:', balanceValue);
            } else if (typeof value === 'object' && value !== null && value.lo !== undefined) {
              const lo = value.lo?.toString ? value.lo.toString() : String(value.lo);
              const hi = value.hi ? (value.hi?.toString ? value.hi.toString() : String(value.hi)) : '0';
              const loBigInt = BigInt(lo);
              const hiBigInt = BigInt(hi);
              const combinedBigInt = (hiBigInt << BigInt(64)) | loBigInt;
              balanceValue = Number(combinedBigInt);
              console.log('Parsed from _value object fallback:', balanceValue);
            }
          }
          
          if (balanceValue === 0) {
            console.warn('Could not parse balance, result:', balanceResult);
          }
        } catch (parseError) {
          console.error('Error parsing balance:', parseError);
          balanceValue = 0;
        }
      }

      // Convert from smallest unit (with decimals) to display units
      // MockUSDC uses 6 decimals, so the contract ALWAYS returns balance in smallest units
      // Example: 1000 USDC = 1,000,000,000 (1000 * 10^6) in smallest units
      // We need to divide by 10^6 to get display units
      const decimals = 6;
      const totalBalance = balanceValue / Math.pow(10, decimals);
      
      // Track initial balance (before first faucet call) using localStorage
      // This way we only show tokens obtained from faucet
      const storageKey = `mock_usdc_initial_balance_${address}`;
      let initialBalance = 0;
      
      // Get stored initial balance
      const storedInitial = localStorage.getItem(storageKey);
      if (storedInitial !== null) {
        initialBalance = parseFloat(storedInitial);
      } else {
        // First time loading - store current balance as initial
        // This assumes user hasn't used faucet yet, or we'll update it after first faucet
        localStorage.setItem(storageKey, totalBalance.toString());
        initialBalance = totalBalance;
      }
      
      // Calculate faucet balance: current - initial (only tokens from faucet)
      const faucetBalance = Math.max(0, totalBalance - initialBalance);
      
      console.log('Final balance calculation:', {
        rawBalance: balanceValue,
        totalBalance: totalBalance,
        initialBalance: initialBalance,
        faucetBalance: faucetBalance,
        calculation: `${totalBalance} - ${initialBalance} = ${faucetBalance}`
      });
      setBalance(faucetBalance);
    } catch (error) {
      console.error('Error loading USDC balance:', error);
      setBalance(0);
    } finally {
      setLoading(false);
    }
  };

  const faucet = async () => {
    if (!kit || !connected || !address || !MOCK_USDC_CONTRACT) {
      throw new Error('Wallet not connected or contract not configured');
    }

    setLoading(true);
    try {
      // Store balance before faucet to track initial balance
      const storageKey = `mock_usdc_initial_balance_${address}`;
      const currentBalanceResult = await readSorobanContract(
        MOCK_USDC_CONTRACT,
        'balance',
        [toScValAddress(address)]
      );
      
      // Parse current balance before faucet
      let currentBalanceValue = 0;
      if (currentBalanceResult !== null && currentBalanceResult !== undefined) {
        if (currentBalanceResult.i128 && typeof currentBalanceResult.i128 === 'function') {
          const i128Parts = currentBalanceResult.i128();
          if (i128Parts) {
            const lo = i128Parts.lo ? i128Parts.lo() : (i128Parts._value?.lo || i128Parts.lo);
            const hi = i128Parts.hi ? i128Parts.hi() : (i128Parts._value?.hi || i128Parts.hi || 0);
            if (lo !== undefined && lo !== null) {
              const loStr = lo.toString ? lo.toString() : String(lo);
              const hiStr = hi ? (hi.toString ? hi.toString() : String(hi)) : '0';
              const loBigInt = BigInt(loStr);
              const hiBigInt = BigInt(hiStr);
              const combinedBigInt = (hiBigInt << BigInt(64)) | loBigInt;
              currentBalanceValue = Number(combinedBigInt);
            }
          }
        }
      }
      
      const decimals = 6;
      const currentBalance = currentBalanceValue / Math.pow(10, decimals);
      
      // If no initial balance stored, store current balance as initial
      const storedInitial = localStorage.getItem(storageKey);
      if (storedInitial === null) {
        localStorage.setItem(storageKey, currentBalance.toString());
      }
      
      await callSorobanContract(kit, address, {
        contractId: MOCK_USDC_CONTRACT,
        functionName: 'faucet',
        args: [toScValAddress(address)],
      });
      await loadBalance();
    } catch (error) {
      console.error('Error getting faucet:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const transfer = async (to: string, amount: number) => {
    if (!kit || !connected || !address || !MOCK_USDC_CONTRACT) {
      throw new Error('Wallet not connected or contract not configured');
    }

    setLoading(true);
    try {
      await callSorobanContract(kit, address, {
        contractId: MOCK_USDC_CONTRACT,
        functionName: 'transfer',
        args: [
          toScValAddress(address),
          toScValAddress(to),
          toScValI128(amount),
        ],
      });
      await loadBalance();
    } catch (error) {
      console.error('Error transferring:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connected && address) {
      loadBalance();
    }
  }, [connected, address]);

  return {
    balance,
    loading,
    faucet,
    transfer,
    refresh: loadBalance,
  };
}

