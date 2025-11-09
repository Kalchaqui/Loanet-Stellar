import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';
import { Contract, Networks, TransactionBuilder, xdr, StrKey, Account, SorobanRpc } from 'stellar-sdk';
import { Buffer } from 'buffer';

const NETWORK = (import.meta as any).env?.VITE_STELLAR_NETWORK || 'testnet';

const SOROBAN_RPC_URL = NETWORK === 'public'
  ? 'https://rpc.stellar.org'
  : 'https://soroban-testnet.stellar.org';

let sorobanServerInstance: SorobanRpc.Server | null = null;

function getSorobanServer(): SorobanRpc.Server {
  if (!sorobanServerInstance) {
    sorobanServerInstance = new SorobanRpc.Server(SOROBAN_RPC_URL, {
      allowHttp: SOROBAN_RPC_URL.startsWith('http://'),
    });
  }
  return sorobanServerInstance;
}

export interface ContractCallOptions {
  contractId: string;
  functionName: string;
  args?: xdr.ScVal[];
}

/**
 * Load account data from Horizon API using fetch
 */
async function loadAccount(address: string): Promise<any> {
  const horizonUrl = NETWORK === 'public' 
    ? 'https://horizon.stellar.org' 
    : 'https://horizon-testnet.stellar.org';
  
  const response = await fetch(`${horizonUrl}/accounts/${address}`);
  if (!response.ok) {
    throw new Error(`Failed to load account: ${response.statusText}`);
  }
  return await response.json();
}

/**
 * Wait for Soroban transaction confirmation
 */
async function waitForSorobanConfirmation(server: SorobanRpc.Server, txHash: string, timeoutMs = 20000, intervalMs = 2000): Promise<any> {
  const maxAttempts = Math.ceil(timeoutMs / intervalMs);
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await server.getTransaction(txHash);
      
      // Check if response has status property
      if (response && 'status' in response) {
        if (response.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
          return response;
        }
        if (response.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
          const failedResponse = response as SorobanRpc.Api.GetFailedTransactionResponse;
          const reason = failedResponse.resultXdr || 'Transaction failed without result';
          throw new Error(`Transaction failed: ${reason}`);
        }
        // If status is NOT_FOUND, continue polling
        if (response.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND) {
          // Continue polling
        }
      } else {
        // If response doesn't have status, assume it's successful
        return response;
      }
    } catch (error: any) {
      // getTransaction may return 404 while the transaction is not yet found; ignore and keep polling
      const message = error?.message || error?.toString() || '';
      const errorStr = message.toLowerCase();
      
      // Ignore 404 and "not found" errors - transaction might not be indexed yet
      if (errorStr.includes('404') || errorStr.includes('not found') || errorStr.includes('bad union switch')) {
        // Continue polling
      } else {
        console.warn('Error while waiting for transaction confirmation:', message);
        // For other errors, wait a bit and retry
      }
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error('Transaction timed out while waiting for confirmation.');
}

/**
 * Submit Soroban transaction via RPC
 */
async function submitTransaction(signedTxXdr: string): Promise<any> {
  const server = getSorobanServer();
  const networkPassphrase = NETWORK === 'public' ? Networks.PUBLIC : Networks.TESTNET;
  
  // Parse the signed transaction to get the hash
  const signedTx = TransactionBuilder.fromXDR(signedTxXdr, networkPassphrase);
  const txHash = signedTx.hash().toString('hex');
  
  console.log('Submitting transaction with hash:', txHash);
  
  const sendResponse = await server.sendTransaction(signedTx);

  console.log('Send transaction response:', {
    status: (sendResponse as any).status,
    hash: (sendResponse as any).hash,
    errorResult: (sendResponse as any).errorResult,
  });

  if ('errorResult' in sendResponse && sendResponse.errorResult) {
    throw new Error(`Transaction failed: ${sendResponse.errorResult}`);
  }

  // Check status - SendTransactionResponse status is a string literal type
  const status = (sendResponse as any).status as string;
  
  // If we have a hash in the response, use it; otherwise use the computed hash
  const responseHash = (sendResponse as any).hash || txHash;
  
  if (status === 'SUCCESS' || status === 'PENDING') {
    // Wait for confirmation with longer timeout for Soroban transactions
    try {
      return await waitForSorobanConfirmation(server, responseHash, 60000, 3000);
    } catch (error: any) {
      // If confirmation times out but transaction was sent successfully, 
      // return the send response as success
      console.warn('Confirmation timeout, but transaction was sent:', error.message);
      return {
        status: 'SUCCESS',
        hash: responseHash,
        message: 'Transaction submitted successfully. Confirmation pending.',
      };
    }
  }

  throw new Error(`Unexpected transaction status: ${status}`);
}

/**
 * Calls a Soroban contract function (write operation)
 * Uses fetch instead of Server to avoid constructor issues
 */
export async function callSorobanContract(
  kit: StellarWalletsKit,
  address: string,
  options: ContractCallOptions
): Promise<any> {
  const networkPassphrase = NETWORK === 'public' 
    ? Networks.PUBLIC 
    : Networks.TESTNET;

  // Load account using fetch
  const accountData = await loadAccount(address);
  
  // Create account object from the loaded data
  const sourceAccount = new Account(
    accountData.account_id,
    accountData.sequence
  );

  const contract = new Contract(options.contractId);
  
  // Build the transaction
  const operation = contract.call(
    options.functionName,
    ...(options.args || [])
  );

  // Build the transaction with proper Soroban settings
  const transaction = new TransactionBuilder(sourceAccount, {
    fee: '100',
    networkPassphrase,
  })
    .addOperation(operation)
    .setTimeout(30)
    .build();
  
  // Simulate transaction first to get footprint and resource estimates
  const sorobanServer = getSorobanServer();
  const simulation = await sorobanServer.simulateTransaction(transaction);
  
  if ('error' in simulation && simulation.error) {
    throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.error)}`);
  }
  
  // Prepare transaction for Soroban (adds footprint, resource fee, etc.)
  const preparedTransaction = await sorobanServer.prepareTransaction(transaction);
  
  // Log transaction details for debugging
  console.log('Transaction prepared:', {
    sourceAccount: sourceAccount.accountId(),
    sequence: sourceAccount.sequenceNumber(),
    operations: preparedTransaction.operations.length,
    network: networkPassphrase,
    contractId: options.contractId,
    functionName: options.functionName,
    fee: preparedTransaction.fee,
  });

  const transactionToSign = preparedTransaction;

  // Sign the transaction using the wallet module's signTx method (correct for Soroban transactions)
  let signedTxXdr: string | undefined;
  try {
    const selectedModule = (kit as any).selectedModule;
    const selectedWallet = (kit as any).selectedWallet;
    
    if (!selectedModule) {
      throw new Error('No wallet module selected. Please connect a wallet first.');
    }

    // For Freighter, try using window.freighterApi.signTransaction directly first
    if (selectedWallet === 'freighter' && typeof (window as any).freighterApi !== 'undefined') {
      const freighterApi = (window as any).freighterApi;
      
      if (freighterApi.signTransaction) {
        try {
          console.log('Signing transaction with Freighter API signTransaction...');
          const result = await freighterApi.signTransaction(transactionToSign.toXDR(), {
            network: networkPassphrase,
            accountToSign: address,
          });
          
          if (!result || (typeof result === 'string' && result.length === 0)) {
            throw new Error('Transaction was rejected or cancelled');
          }
          
          signedTxXdr = result;
          console.log('Transaction signed successfully with Freighter API');
        } catch (error: any) {
          const errorMsg = error?.message || error?.toString() || '';
          console.error('Freighter API signTransaction error:', errorMsg);
          if (errorMsg.toLowerCase().includes('rejected') || errorMsg.toLowerCase().includes('user rejected')) {
            throw new Error('Transaction was rejected. Please accept the transaction in Freighter to continue.');
          }
          // Fall through to try signTx method - don't set signedTxXdr so it tries next method
          console.log('Freighter API failed, trying signTx method...');
        }
      }
    }

    // Use signTx method (works for all wallets including Freighter)
    if (!signedTxXdr && typeof selectedModule.signTx === 'function') {
      try {
        console.log('Signing transaction with signTx method...');

        // Get public key from the module if available, otherwise use address
        let publicKey: string;
        if (typeof selectedModule.getPublicKey === 'function') {
          try {
            publicKey = await selectedModule.getPublicKey();
            console.log('Got public key from module:', publicKey);
          } catch (e) {
            console.warn('Could not get public key from module, using address:', e);
            publicKey = address;
          }
        } else {
          publicKey = address;
        }

        // signTx requires publicKeys array - ensure it's a proper JavaScript array
        const publicKeysArray: string[] = Array.isArray(publicKey)
          ? [...publicKey]
          : [String(publicKey)];

        // Validate it's a proper array
        if (!Array.isArray(publicKeysArray) || publicKeysArray.length === 0) {
          throw new Error('Invalid publicKeys array format');
        }

        console.log('Using publicKeys array:', publicKeysArray, 'Length:', publicKeysArray.length, 'IsArray:', Array.isArray(publicKeysArray));

        const result = await selectedModule.signTx({
          xdr: transactionToSign.toXDR(),
          network: networkPassphrase,
          publicKeys: publicKeysArray,
        });

        if (!result) {
          throw new Error('La transacción fue rechazada o cancelada');
        }

        if (typeof result === 'string') {
          signedTxXdr = result;
        } else if (result.result) {
          signedTxXdr = result.result;
        } else {
          signedTxXdr = result.signedTxXdr || result.xdr || result.tx || '';
        }

        if (!signedTxXdr) {
          throw new Error('Transaction was not signed correctly.');
        }

        console.log('Transaction signed successfully with signTx');
      } catch (error: any) {
        const errorMsg = error?.message || error?.toString() || '';
        console.error('signTx error:', errorMsg);
        if (errorMsg.toLowerCase().includes('rejected') || errorMsg.toLowerCase().includes('user rejected')) {
          throw new Error('Transaction was rejected. Please accept the transaction in your wallet to continue.');
        }
        throw error;
      }
    }
    // Last resort: Try signBlob (but this may show "Signed Message" in modal)
    else if (!signedTxXdr && typeof selectedModule.signBlob === 'function') {
      try {
        console.log('Signing transaction with signBlob method (fallback)...');
        const result = await selectedModule.signBlob({
          blob: transactionToSign.toXDR(),
          publicKey: String(address),
        });

        if (!result) {
          throw new Error('La transacción fue rechazada o cancelada');
        }

        if (typeof result === 'string') {
          signedTxXdr = result;
        } else if (result.result) {
          signedTxXdr = result.result;
        } else {
          signedTxXdr = result.signedTxXdr || result.xdr || result.tx || '';
        }

        if (!signedTxXdr) {
          throw new Error('Transaction was not signed correctly.');
        }

        console.log('Transaction signed successfully with signBlob');
      } catch (error: any) {
        const errorMsg = error?.message || error?.toString() || '';
        console.error('signBlob error:', errorMsg);
        if (errorMsg.toLowerCase().includes('rejected') || errorMsg.toLowerCase().includes('user rejected')) {
          throw new Error('Transaction was rejected. Please accept the transaction in your wallet to continue.');
        }
        throw error;
      }
    }
    
    if (!signedTxXdr) {
      throw new Error(`No signing method available. Please ensure your wallet is connected.`);
    }
    
    // Final validation
    if (!signedTxXdr || (typeof signedTxXdr === 'string' && signedTxXdr.length === 0)) {
      throw new Error('Transaction was not signed correctly. Please try again.');
    }
  } catch (error: any) {
    console.error('Error signing transaction:', error);
    // Provide user-friendly error message
    const errorMessage = error?.message || error?.toString() || 'Unknown error signing transaction';
    
    // Check if it's a rejection error that wasn't caught earlier
    if (errorMessage.toLowerCase().includes('rejected') || errorMessage.toLowerCase().includes('user rejected')) {
      throw new Error('Transaction was rejected. Please accept the transaction in your wallet to continue.');
    }
    
    throw new Error(`Failed to sign transaction: ${errorMessage}`);
  }

  // Submit the transaction using Soroban RPC
  const result = await submitTransaction(signedTxXdr);
  return result;
}

/**
 * Reads from a Soroban contract (read-only operation)
 * Uses simulateTransaction which doesn't require signing
 */
export async function readSorobanContract(
  contractId: string,
  functionName: string,
  args?: xdr.ScVal[]
): Promise<any> {
  const networkPassphrase = NETWORK === 'public' 
    ? Networks.PUBLIC 
    : Networks.TESTNET;

  // Create a dummy account for simulation (doesn't need to be real)
  const dummyAccount = new Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0');

  const contract = new Contract(contractId);
  
  // Build the transaction (won't be submitted, just simulated)
  const operation = contract.call(
    functionName,
    ...(args || [])
  );

  const transaction = new TransactionBuilder(dummyAccount, {
    fee: '100',
    networkPassphrase,
  })
    .addOperation(operation)
    .setTimeout(30)
    .build();

  // Simulate the transaction (read-only, no signing needed)
  const sorobanServer = getSorobanServer();
  console.log(`readSorobanContract: Calling ${functionName} on contract ${contractId}`);
  const simulation = await sorobanServer.simulateTransaction(transaction);

  console.log(`readSorobanContract: Simulation response for ${functionName}:`, {
    hasError: 'error' in simulation,
    hasResult: 'result' in simulation,
    error: 'error' in simulation ? simulation.error : undefined,
  });

  if ('error' in simulation && simulation.error) {
    // If error is "not found" or similar, return null
    const errorStr = JSON.stringify(simulation.error).toLowerCase();
    console.log(`readSorobanContract: Error for ${functionName}:`, errorStr);
    if (errorStr.includes('not found') || errorStr.includes('does not exist')) {
      console.log(`readSorobanContract: Returning null for ${functionName} (not found)`);
      return null;
    }
    throw new Error(`Contract read failed: ${JSON.stringify(simulation.error)}`);
  }

  // Extract result from simulation
  if ('result' in simulation && simulation.result) {
    const retval = simulation.result.retval;
    console.log('Simulation result retval:', retval);
    return retval;
  }

  console.log('No result in simulation, returning null');
  return null;
}

// Helper to convert string to xdr.ScVal
export function toScValString(value: string): xdr.ScVal {
  return xdr.ScVal.scvString(value);
}

// Helper to convert number to xdr.ScVal (i128)
export function toScValI128(value: number | bigint): xdr.ScVal {
  const bigintValue = typeof value === 'bigint' ? value : BigInt(value);
  // Convert to i128: high 64 bits and low 64 bits
  const low = bigintValue & BigInt('0xFFFFFFFFFFFFFFFF');
  const high = bigintValue >> BigInt(64);
  const parts = new xdr.Int128Parts({
    hi: new xdr.Int64(high.toString()),
    lo: new xdr.Uint64(low.toString()),
  });
  return xdr.ScVal.scvI128(parts);
}

// Helper to convert Address string to xdr.ScVal
export function toScValAddress(address: string): xdr.ScVal {
  // Check if it's a contract address (starts with C) or account address (starts with G)
  if (address.startsWith('C')) {
    // Contract address
    const contractIdBytes = StrKey.decodeContract(address);
    // Convert to Buffer for fromXDR
    const buffer = Buffer.from(contractIdBytes);
    const hash = xdr.Hash.fromXDR(buffer);
    const contractId = xdr.ScAddress.scAddressTypeContract(hash);
    return xdr.ScVal.scvAddress(contractId);
  } else {
    // Account address (starts with G)
    const accountIdBytes = StrKey.decodeEd25519PublicKey(address);
    // Convert to Buffer for fromXDR
    const buffer = Buffer.from(accountIdBytes);
    const uint256 = xdr.Uint256.fromXDR(buffer);
    const accountId = xdr.PublicKey.publicKeyTypeEd25519(uint256);
    return xdr.ScVal.scvAddress(xdr.ScAddress.scAddressTypeAccount(accountId));
  }
}

// Helper to convert u32 to xdr.ScVal
export function toScValU32(value: number): xdr.ScVal {
  return xdr.ScVal.scvU32(value);
}

// Helper to convert u64 to xdr.ScVal
export function toScValU64(value: number | bigint): xdr.ScVal {
  const bigintValue = typeof value === 'bigint' ? value : BigInt(value);
  // Convert bigint to string for Uint64
  return xdr.ScVal.scvU64(xdr.Uint64.fromString(bigintValue.toString()));
}

// Helper to convert u8 to xdr.ScVal
export function toScValU8(value: number): xdr.ScVal {
  return xdr.ScVal.scvU32(value); // u8 can be represented as u32
}

