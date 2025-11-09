import { useState, useEffect } from 'react';
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';
import { callSorobanContract, readSorobanContract, toScValAddress, toScValI128, toScValU32 } from '../utils/sorobanHelpers';

const LOAN_MANAGER_CONTRACT = (import.meta as any).env?.VITE_LOAN_MANAGER_CONTRACT || '';

export interface Loan {
  borrower: string;
  amount: number;
  totalAmount: number;
  interestRate: number;
  numPayments: number;
  paidPayments: number;
  paymentAmount: number;
  createdAt: number;
  status: 'Active' | 'Repaid' | 'Defaulted';
}

export function useLoanManager(kit: StellarWalletsKit | null, connected: boolean, address: string | null) {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loanId, setLoanId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const loadLoan = async () => {
    if (!kit || !connected || !address || !LOAN_MANAGER_CONTRACT) {
      setLoan(null);
      return;
    }

    setLoading(true);
    try {
      console.log('Loading loan for address:', address);
      
      // First, get the loan ID for this borrower
      const loanIdResult = await readSorobanContract(
        LOAN_MANAGER_CONTRACT,
        'get_loan_id',
        [toScValAddress(address)]
      );

      console.log('Loan ID result:', loanIdResult);

      // If no loan ID, user has no active loan
      if (!loanIdResult) {
        setLoan(null);
        return;
      }

      // Parse loan ID from ScVal
      let loanId: number = 0;
      if (loanIdResult !== null && loanIdResult !== undefined) {
        try {
          if (loanIdResult.u32 && typeof loanIdResult.u32 === 'function') {
            loanId = loanIdResult.u32();
          } else if (loanIdResult._value !== undefined) {
            loanId = Number(loanIdResult._value);
          } else if (typeof loanIdResult === 'number') {
            loanId = loanIdResult;
          }
        } catch (parseError) {
          console.error('Error parsing loan ID:', parseError);
          setLoan(null);
          return;
        }
      }

      if (loanId === 0) {
        setLoan(null);
        return;
      }

      console.log('Fetching loan details for ID:', loanId);

      // Get loan details
      const loanResult = await readSorobanContract(
        LOAN_MANAGER_CONTRACT,
        'get_loan',
        [toScValU32(loanId)]
      );

      console.log('Loan result:', loanResult);

      if (!loanResult) {
        setLoan(null);
        return;
      }

      // Parse Loan struct from ScVal (it's a map/struct)
      try {
        let borrower = '';
        let amount = 0;
        let totalAmount = 0;
        let interestRate = 0;
        let numPayments = 0;
        let paidPayments = 0;
        let paymentAmount = 0;
        let createdAt = 0;
        let status: 'Active' | 'Repaid' | 'Defaulted' = 'Active';

        if (loanResult._arm === 'map' || (loanResult.switch && loanResult.switch().name === 'scvMap')) {
          const map = loanResult.map();
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
            // borrower: Address
            if (fields.borrower) {
              const addr = fields.borrower.address ? fields.borrower.address() : fields.borrower;
              if (addr && addr._value) {
                // Address is stored as bytes, need to convert
                borrower = address; // Use the connected address
              }
            }

            // amount: i128
            if (fields.amount) {
              const amountParts = fields.amount.i128 ? fields.amount.i128() : fields.amount;
              if (amountParts) {
                const lo = amountParts.lo ? amountParts.lo() : (amountParts._value?.lo || amountParts.lo);
                const hi = amountParts.hi ? amountParts.hi() : (amountParts._value?.hi || amountParts.hi || 0);
                if (lo !== undefined && lo !== null) {
                  const loStr = lo.toString ? lo.toString() : String(lo);
                  const hiStr = hi ? (hi.toString ? hi.toString() : String(hi)) : '0';
                  const loBigInt = BigInt(loStr);
                  const hiBigInt = BigInt(hiStr);
                  const combinedBigInt = (hiBigInt << BigInt(64)) | loBigInt;
                  amount = Number(combinedBigInt);
                }
              }
            }

            // total_amount: i128
            if (fields.total_amount) {
              const totalParts = fields.total_amount.i128 ? fields.total_amount.i128() : fields.total_amount;
              if (totalParts) {
                const lo = totalParts.lo ? totalParts.lo() : (totalParts._value?.lo || totalParts.lo);
                const hi = totalParts.hi ? totalParts.hi() : (totalParts._value?.hi || totalParts.hi || 0);
                if (lo !== undefined && lo !== null) {
                  const loStr = lo.toString ? lo.toString() : String(lo);
                  const hiStr = hi ? (hi.toString ? hi.toString() : String(hi)) : '0';
                  const loBigInt = BigInt(loStr);
                  const hiBigInt = BigInt(hiStr);
                  const combinedBigInt = (hiBigInt << BigInt(64)) | loBigInt;
                  totalAmount = Number(combinedBigInt);
                }
              }
            }

            // interest_rate: i128
            if (fields.interest_rate) {
              const rateParts = fields.interest_rate.i128 ? fields.interest_rate.i128() : fields.interest_rate;
              if (rateParts) {
                const lo = rateParts.lo ? rateParts.lo() : (rateParts._value?.lo || rateParts.lo);
                const hi = rateParts.hi ? rateParts.hi() : (rateParts._value?.hi || rateParts.hi || 0);
                if (lo !== undefined && lo !== null) {
                  const loStr = lo.toString ? lo.toString() : String(lo);
                  const hiStr = hi ? (hi.toString ? hi.toString() : String(hi)) : '0';
                  const loBigInt = BigInt(loStr);
                  const hiBigInt = BigInt(hiStr);
                  const combinedBigInt = (hiBigInt << BigInt(64)) | loBigInt;
                  interestRate = Number(combinedBigInt);
                }
              }
            }

            // num_payments: u32
            numPayments = fields.num_payments?._value !== undefined 
              ? Number(fields.num_payments._value) 
              : (fields.num_payments?.u32 ? fields.num_payments.u32() : 0);

            // paid_payments: u32
            paidPayments = fields.paid_payments?._value !== undefined 
              ? Number(fields.paid_payments._value) 
              : (fields.paid_payments?.u32 ? fields.paid_payments.u32() : 0);

            // payment_amount: i128
            if (fields.payment_amount) {
              const paymentParts = fields.payment_amount.i128 ? fields.payment_amount.i128() : fields.payment_amount;
              if (paymentParts) {
                const lo = paymentParts.lo ? paymentParts.lo() : (paymentParts._value?.lo || paymentParts.lo);
                const hi = paymentParts.hi ? paymentParts.hi() : (paymentParts._value?.hi || paymentParts.hi || 0);
                if (lo !== undefined && lo !== null) {
                  const loStr = lo.toString ? lo.toString() : String(lo);
                  const hiStr = hi ? (hi.toString ? hi.toString() : String(hi)) : '0';
                  const loBigInt = BigInt(loStr);
                  const hiBigInt = BigInt(hiStr);
                  const combinedBigInt = (hiBigInt << BigInt(64)) | loBigInt;
                  paymentAmount = Number(combinedBigInt);
                }
              }
            }

            // created_at: i128
            if (fields.created_at) {
              const createdAtParts = fields.created_at.i128 ? fields.created_at.i128() : fields.created_at;
              if (createdAtParts) {
                const lo = createdAtParts.lo ? createdAtParts.lo() : (createdAtParts._value?.lo || createdAtParts.lo);
                const hi = createdAtParts.hi ? createdAtParts.hi() : (createdAtParts._value?.hi || createdAtParts.hi || 0);
                if (lo !== undefined && lo !== null) {
                  const loStr = lo.toString ? lo.toString() : String(lo);
                  const hiStr = hi ? (hi.toString ? hi.toString() : String(hi)) : '0';
                  const loBigInt = BigInt(loStr);
                  const hiBigInt = BigInt(hiStr);
                  const combinedBigInt = (hiBigInt << BigInt(64)) | loBigInt;
                  createdAt = Number(combinedBigInt);
                }
              }
            }

            // status: i32 (0=Active, 1=Repaid, 2=Defaulted)
            const statusNum = fields.status?._value !== undefined 
              ? Number(fields.status._value) 
              : (fields.status?.i32 ? fields.status.i32() : 0);
            if (statusNum === 0) {
              status = 'Active';
            } else if (statusNum === 1) {
              status = 'Repaid';
            } else {
              status = 'Defaulted';
            }

            console.log('Parsed loan:', {
              borrower,
              amount,
              totalAmount,
              interestRate,
              numPayments,
              paidPayments,
              paymentAmount,
              createdAt,
              status,
            });

            setLoanId(loanId);
            setLoan({
              borrower: address,
              amount,
              totalAmount,
              interestRate,
              numPayments,
              paidPayments,
              paymentAmount,
              createdAt,
              status,
            });
          }
        } else {
          console.warn('Unknown loan result format:', loanResult);
          setLoan(null);
        }
      } catch (parseError) {
        console.error('Error parsing loan result:', parseError);
        setLoan(null);
      }
    } catch (error) {
      console.error('Error loading loan:', error);
      setLoan(null);
    } finally {
      setLoading(false);
    }
  };

  const requestLoan = async (amount: number, numPayments: number) => {
    if (!kit || !connected || !address || !LOAN_MANAGER_CONTRACT) {
      throw new Error('Wallet not connected or contract not configured');
    }

    setLoading(true);
    try {
      await callSorobanContract(kit, address, {
        contractId: LOAN_MANAGER_CONTRACT,
        functionName: 'request_loan',
        args: [
          toScValAddress(address),
          toScValI128(amount),
          toScValU32(numPayments),
        ],
      });
      await loadLoan();
    } catch (error) {
      console.error('Error requesting loan:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const payInstallment = async (id?: number) => {
    if (!kit || !connected || !address || !LOAN_MANAGER_CONTRACT) {
      throw new Error('Wallet not connected or contract not configured');
    }

    const currentLoanId = id ?? loanId;
    if (currentLoanId === null || currentLoanId === undefined) {
      throw new Error('No loan ID available');
    }

    setLoading(true);
    try {
      await callSorobanContract(kit, address, {
        contractId: LOAN_MANAGER_CONTRACT,
        functionName: 'pay_installment',
        args: [
          toScValAddress(address),
          toScValU32(currentLoanId),
        ],
      });
      await loadLoan();
    } catch (error) {
      console.error('Error paying installment:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connected && address) {
      loadLoan();
    }
  }, [connected, address]);

  return {
    loan,
    loading,
    requestLoan,
    payInstallment,
    refresh: loadLoan,
  };
}

