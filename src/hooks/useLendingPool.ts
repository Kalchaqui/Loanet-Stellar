import { useState, useEffect } from 'react';
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';
import { callSorobanContract, readSorobanContract, toScValAddress, toScValI128 } from '../utils/sorobanHelpers';
import { xdr } from 'stellar-sdk';

const LENDING_POOL_CONTRACT = import.meta.env.VITE_LENDING_POOL_CONTRACT || '';

export function useLendingPool(kit: StellarWalletsKit | null, connected: boolean, address: string | null) {
  const [balance, setBalance] = useState<number>(0);
  const [totalLiquidity, setTotalLiquidity] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    if (!kit || !connected || !address || !LENDING_POOL_CONTRACT) {
      setBalance(0);
      setTotalLiquidity(0);
      return;
    }

    setLoading(true);
    try {
      console.log('Loading lending pool data for address:', address);
      
      // Get user balance
      const balanceResult = await readSorobanContract(
        LENDING_POOL_CONTRACT,
        'get_balance',
        [toScValAddress(address)]
      );

      console.log('Balance result:', balanceResult);

      // Parse i128 balance
      let balanceValue = 0;
      if (balanceResult !== null && balanceResult !== undefined) {
        try {
          if (balanceResult.i128 && typeof balanceResult.i128 === 'function') {
            const i128Parts = balanceResult.i128();
            if (i128Parts) {
              const lo = i128Parts.lo ? i128Parts.lo() : (i128Parts._value?.lo || i128Parts.lo);
              const hi = i128Parts.hi ? i128Parts.hi() : (i128Parts._value?.hi || i128Parts.hi || 0);
              if (lo !== undefined && lo !== null) {
                const loStr = lo.toString ? lo.toString() : String(lo);
                const hiStr = hi ? (hi.toString ? hi.toString() : String(hi)) : '0';
                const loBigInt = BigInt(loStr);
                const hiBigInt = BigInt(hiStr);
                const combinedBigInt = (hiBigInt << BigInt(64)) | loBigInt;
                balanceValue = Number(combinedBigInt);
              }
            }
          } else if (balanceResult._value !== undefined) {
            const value = balanceResult._value;
            if (typeof value === 'bigint' || typeof value === 'number') {
              balanceValue = Number(value);
            } else if (typeof value === 'object' && value !== null && value.lo !== undefined) {
              const lo = value.lo?.toString ? value.lo.toString() : String(value.lo);
              const hi = value.hi ? (value.hi?.toString ? value.hi.toString() : String(value.hi)) : '0';
              const loBigInt = BigInt(lo);
              const hiBigInt = BigInt(hi);
              const combinedBigInt = (hiBigInt << BigInt(64)) | loBigInt;
              balanceValue = Number(combinedBigInt);
            }
          }
        } catch (parseError) {
          console.error('Error parsing balance:', parseError);
        }
      }

      // Get total liquidity
      const liquidityResult = await readSorobanContract(
        LENDING_POOL_CONTRACT,
        'get_total_liquidity',
        []
      );

      console.log('Total liquidity result:', liquidityResult);

      // Parse i128 liquidity
      let liquidityValue = 0;
      if (liquidityResult !== null && liquidityResult !== undefined) {
        try {
          if (liquidityResult.i128 && typeof liquidityResult.i128 === 'function') {
            const i128Parts = liquidityResult.i128();
            if (i128Parts) {
              const lo = i128Parts.lo ? i128Parts.lo() : (i128Parts._value?.lo || i128Parts.lo);
              const hi = i128Parts.hi ? i128Parts.hi() : (i128Parts._value?.hi || i128Parts.hi || 0);
              if (lo !== undefined && lo !== null) {
                const loStr = lo.toString ? lo.toString() : String(lo);
                const hiStr = hi ? (hi.toString ? hi.toString() : String(hi)) : '0';
                const loBigInt = BigInt(loStr);
                const hiBigInt = BigInt(hiStr);
                const combinedBigInt = (hiBigInt << BigInt(64)) | loBigInt;
                liquidityValue = Number(combinedBigInt);
              }
            }
          } else if (liquidityResult._value !== undefined) {
            const value = liquidityResult._value;
            if (typeof value === 'bigint' || typeof value === 'number') {
              liquidityValue = Number(value);
            } else if (typeof value === 'object' && value !== null && value.lo !== undefined) {
              const lo = value.lo?.toString ? value.lo.toString() : String(value.lo);
              const hi = value.hi ? (value.hi?.toString ? value.hi.toString() : String(value.hi)) : '0';
              const loBigInt = BigInt(lo);
              const hiBigInt = BigInt(hi);
              const combinedBigInt = (hiBigInt << BigInt(64)) | loBigInt;
              liquidityValue = Number(combinedBigInt);
            }
          }
        } catch (parseError) {
          console.error('Error parsing liquidity:', parseError);
        }
      }

      // Convert from smallest units to display units (6 decimals)
      const displayBalance = balanceValue / Math.pow(10, 6);
      const displayLiquidity = liquidityValue / Math.pow(10, 6);

      console.log('Final lending pool data:', {
        balance: displayBalance,
        totalLiquidity: displayLiquidity,
      });

      setBalance(displayBalance);
      setTotalLiquidity(displayLiquidity);
    } catch (error) {
      console.error('Error loading lending pool data:', error);
      setBalance(0);
      setTotalLiquidity(0);
    } finally {
      setLoading(false);
    }
  };

  const deposit = async (amount: number) => {
    if (!kit || !connected || !address || !LENDING_POOL_CONTRACT) {
      throw new Error('Wallet not connected or contract not configured');
    }

    setLoading(true);
    try {
      await callSorobanContract(kit, address, {
        contractId: LENDING_POOL_CONTRACT,
        functionName: 'deposit',
        args: [
          toScValAddress(address),
          toScValI128(amount),
        ],
      });
      await loadData();
    } catch (error) {
      console.error('Error depositing:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const withdraw = async (amount: number) => {
    if (!kit || !connected || !address || !LENDING_POOL_CONTRACT) {
      throw new Error('Wallet not connected or contract not configured');
    }

    setLoading(true);
    try {
      await callSorobanContract(kit, address, {
        contractId: LENDING_POOL_CONTRACT,
        functionName: 'withdraw',
        args: [
          toScValAddress(address),
          toScValI128(amount),
        ],
      });
      await loadData();
    } catch (error) {
      console.error('Error withdrawing:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connected && address) {
      loadData();
    }
  }, [connected, address]);

  return {
    balance,
    totalLiquidity,
    loading,
    deposit,
    withdraw,
    refresh: loadData,
  };
}

