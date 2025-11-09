import { useState, useEffect } from 'react';
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';
import { callSorobanContract, readSorobanContract, toScValAddress } from '../utils/sorobanHelpers';

const CREDIT_SCORING_CONTRACT = (import.meta as any).env?.VITE_CREDIT_SCORING_CONTRACT || '';

export interface CreditScore {
  score: number;
  maxLoanAmount: number;
  blacklisted: boolean;
}

export function useCreditScoring(kit: StellarWalletsKit | null, connected: boolean, address: string | null) {
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null);
  const [loading, setLoading] = useState(false);

  const loadCreditScore = async () => {
    if (!kit || !connected || !address || !CREDIT_SCORING_CONTRACT) {
      setCreditScore(null);
      return;
    }

    setLoading(true);
    try {
      console.log('Loading credit score for address:', address);
      
      // Check if user has a score
      const hasScoreResult = await readSorobanContract(
        CREDIT_SCORING_CONTRACT,
        'has_score',
        [toScValAddress(address)]
      );

      console.log('has_score result:', hasScoreResult);

      // Parse boolean result
      let hasScore = false;
      if (hasScoreResult !== null && hasScoreResult !== undefined) {
        try {
          if (hasScoreResult._value !== undefined) {
            hasScore = Boolean(hasScoreResult._value);
          } else if (hasScoreResult.b && typeof hasScoreResult.b === 'function') {
            hasScore = hasScoreResult.b();
          } else if (typeof hasScoreResult === 'boolean') {
            hasScore = hasScoreResult;
          }
        } catch (parseError) {
          console.error('Error parsing boolean result:', parseError);
        }
      }

      if (!hasScore) {
        console.log('User has no credit score');
        setCreditScore(null);
        return;
      }

      // Get credit score
      const scoreResult = await readSorobanContract(
        CREDIT_SCORING_CONTRACT,
        'get_score',
        [toScValAddress(address)]
      );

      console.log('get_score result:', scoreResult);

      if (!scoreResult) {
        setCreditScore(null);
        return;
      }

      // Parse CreditScore struct from ScVal (it's a map/struct)
      try {
        let score = 0;
        let maxLoanAmount = 0;
        let blacklisted = false;

        if (scoreResult._arm === 'map' || (scoreResult.switch && scoreResult.switch().name === 'scvMap')) {
          const map = scoreResult.map();
          if (map && map.length > 0) {
            const fields: any = {};
            map.forEach((entry: any) => {
              try {
                const key = entry.key();
                const val = entry.val();
                if (key && val) {
                  let keyStr = '';
                  if (key.str && typeof key.str === 'function') {
                    try {
                      keyStr = key.str();
                    } catch (e) {
                      if (key._value) {
                        if (key._value instanceof Uint8Array) {
                          keyStr = new TextDecoder().decode(key._value);
                        } else {
                          keyStr = String(key._value);
                        }
                      }
                    }
                  }
                  if (!keyStr && key.sym && typeof key.sym === 'function') {
                    try {
                      keyStr = key.sym().toString();
                    } catch (e) {}
                  }
                  if (!keyStr && key._arm) {
                    if (key._arm === 'str' && key._value) {
                      keyStr = String(key._value);
                    } else if (key._arm === 'sym' && key._value) {
                      keyStr = String(key._value);
                    }
                  }
                  if (!keyStr && key._value) {
                    keyStr = String(key._value);
                  }
                  
                  if (keyStr) {
                    fields[keyStr] = val;
                  }
                }
              } catch (entryError) {
                console.warn('Error parsing map entry:', entryError);
              }
            });

            // Extract values from struct fields
            // score: i128
            if (fields.score) {
              const scoreParts = fields.score.i128 ? fields.score.i128() : fields.score;
              if (scoreParts) {
                const lo = scoreParts.lo ? scoreParts.lo() : (scoreParts._value?.lo || scoreParts.lo);
                const hi = scoreParts.hi ? scoreParts.hi() : (scoreParts._value?.hi || scoreParts.hi || 0);
                if (lo !== undefined && lo !== null) {
                  const loStr = lo.toString ? lo.toString() : String(lo);
                  const hiStr = hi ? (hi.toString ? hi.toString() : String(hi)) : '0';
                  const loBigInt = BigInt(loStr);
                  const hiBigInt = BigInt(hiStr);
                  const combinedBigInt = (hiBigInt << BigInt(64)) | loBigInt;
                  score = Number(combinedBigInt);
                }
              }
            }

            // max_loan_amount: i128
            if (fields.max_loan_amount) {
              const maxParts = fields.max_loan_amount.i128 ? fields.max_loan_amount.i128() : fields.max_loan_amount;
              if (maxParts) {
                const lo = maxParts.lo ? maxParts.lo() : (maxParts._value?.lo || maxParts.lo);
                const hi = maxParts.hi ? maxParts.hi() : (maxParts._value?.hi || maxParts.hi || 0);
                if (lo !== undefined && lo !== null) {
                  const loStr = lo.toString ? lo.toString() : String(lo);
                  const hiStr = hi ? (hi.toString ? hi.toString() : String(hi)) : '0';
                  const loBigInt = BigInt(loStr);
                  const hiBigInt = BigInt(hiStr);
                  const combinedBigInt = (hiBigInt << BigInt(64)) | loBigInt;
                  maxLoanAmount = Number(combinedBigInt);
                }
              }
            }

            // blacklisted: bool
            blacklisted = fields.blacklisted?._value !== undefined 
              ? Boolean(fields.blacklisted._value) 
              : (fields.blacklisted?.b ? fields.blacklisted.b() : false);

            // Convert maxLoanAmount from smallest units to display units (6 decimals)
            const displayMaxLoan = maxLoanAmount / Math.pow(10, 6);

            console.log('Parsed credit score:', { score, maxLoanAmount: displayMaxLoan, blacklisted });

            setCreditScore({
              score,
              maxLoanAmount: displayMaxLoan,
              blacklisted,
            });
          }
        } else {
          console.warn('Unknown credit score result format:', scoreResult);
          setCreditScore(null);
        }
      } catch (parseError) {
        console.error('Error parsing credit score result:', parseError);
        setCreditScore(null);
      }
    } catch (error) {
      console.error('Error loading credit score:', error);
      setCreditScore(null);
    } finally {
      setLoading(false);
    }
  };

  const initializeUser = async () => {
    if (!kit || !connected || !address || !CREDIT_SCORING_CONTRACT) {
      throw new Error('Wallet not connected or contract not configured');
    }

    setLoading(true);
    try {
      await callSorobanContract(kit, address, {
        contractId: CREDIT_SCORING_CONTRACT,
        functionName: 'initialize_user',
        args: [toScValAddress(address)],
      });
      await loadCreditScore();
    } catch (error) {
      console.error('Error initializing user:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connected && address) {
      loadCreditScore();
    }
  }, [connected, address]);

  return {
    creditScore,
    loading,
    initializeUser,
    refresh: loadCreditScore,
  };
}

