import { useState, useEffect } from 'react';
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';
import { callSorobanContract, readSorobanContract, toScValString, toScValAddress } from '../utils/sorobanHelpers';
import { xdr } from 'stellar-sdk';

const IDENTITY_REGISTRY_CONTRACT = (import.meta as any).env?.VITE_IDENTITY_REGISTRY_CONTRACT || '';

export interface Identity {
  ipfsCid: string;
  verificationLevel: number;
  verified: boolean;
  createdAt: number;
}

export function useIdentityRegistry(kit: StellarWalletsKit | null, connected: boolean, address: string | null) {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [hasIdentity, setHasIdentity] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkIdentity = async () => {
    if (!kit || !connected || !address || !IDENTITY_REGISTRY_CONTRACT) {
      console.log('checkIdentity: Missing requirements', { kit: !!kit, connected, address, contract: IDENTITY_REGISTRY_CONTRACT });
      setHasIdentity(false);
      setIdentity(null);
      return;
    }

    console.log('checkIdentity: Starting check for address:', address);
    setLoading(true);
    try {
      console.log('Checking identity for address:', address);
      
      // First check if identity exists
      const hasIdentityResult = await readSorobanContract(
        IDENTITY_REGISTRY_CONTRACT,
        'has_identity',
        [toScValAddress(address)]
      );

      console.log('has_identity result:', hasIdentityResult);

      // Convert ScVal to boolean
      let hasIdentityValue = false;
      if (hasIdentityResult !== null && hasIdentityResult !== undefined) {
        try {
          // The ScVal object has _value property directly accessible
          if (hasIdentityResult._value !== undefined) {
            hasIdentityValue = Boolean(hasIdentityResult._value);
            console.log('Extracted boolean value from _value:', hasIdentityValue);
          } else if (hasIdentityResult.b && typeof hasIdentityResult.b === 'function') {
            // Try calling .b() method
            hasIdentityValue = hasIdentityResult.b();
            console.log('Extracted boolean value from .b():', hasIdentityValue);
          } else if (hasIdentityResult.switch) {
            const switchValue = hasIdentityResult.switch();
            // switch() returns an object with .value property
            const switchValueNum = switchValue?.value ?? switchValue;
            console.log('hasIdentityResult switch value:', switchValue, 'scvBool value:', xdr.ScValType.scvBool().value);
            if (switchValueNum === xdr.ScValType.scvBool().value || switchValue?.name === 'scvBool') {
              hasIdentityValue = hasIdentityResult.b();
              console.log('Extracted boolean value from scvBool:', hasIdentityValue);
            }
          } else if (typeof hasIdentityResult === 'boolean') {
            hasIdentityValue = hasIdentityResult;
            console.log('Extracted boolean value (direct):', hasIdentityValue);
          } else if (hasIdentityResult === true || hasIdentityResult === false) {
            hasIdentityValue = hasIdentityResult;
            console.log('Extracted boolean value (literal):', hasIdentityValue);
          } else {
            // Try to convert to string and check
            const resultStr = String(hasIdentityResult);
            console.log('hasIdentityResult as string:', resultStr);
            if (resultStr === 'true' || resultStr === '1') {
              hasIdentityValue = true;
            }
          }
        } catch (parseError) {
          console.error('Error parsing boolean result:', parseError);
        }
      }
      
      console.log('hasIdentityValue:', hasIdentityValue);

      if (hasIdentityValue) {
        console.log('Identity exists, fetching full identity data...');
        // Identity exists, get full identity data
        const identityResult = await readSorobanContract(
          IDENTITY_REGISTRY_CONTRACT,
          'get_identity',
          [toScValAddress(address)]
        );

        console.log('get_identity result:', identityResult);

        if (identityResult) {
          // Parse IdentityRecord from ScVal
          // IdentityRecord is a struct (map) with fields: ipfs_cid, dni, verification_level, verified, created_at
          try {
            console.log('Parsing identity result, type:', identityResult._arm, '_value:', identityResult._value);
            
            // Check if it's a map/struct - the _arm property tells us the type
            if (identityResult._arm === 'map' || (identityResult.switch && identityResult.switch().name === 'scvMap')) {
              const map = identityResult.map();
              console.log('Identity result is a map, entries:', map?.length);
              
              if (map && map.length > 0) {
                const fields: any = {};
                map.forEach((entry: any) => {
                  try {
                    const key = entry.key();
                    const val = entry.val();
                    if (key && val) {
                      let keyStr = '';
                      // Try different ways to get the key string
                      if (key.str && typeof key.str === 'function') {
                        try {
                          keyStr = key.str();
                        } catch (e) {
                          // str not set, try other methods
                        }
                      }
                      if (!keyStr && key.sym && typeof key.sym === 'function') {
                        try {
                          keyStr = key.sym().toString();
                        } catch (e) {
                          // sym not set
                        }
                      }
                      if (!keyStr && key._arm) {
                        // Try to get from _arm and _value
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
                        console.log('Map entry:', keyStr, val);
                      }
                    }
                  } catch (entryError) {
                    console.warn('Error parsing map entry:', entryError);
                  }
                });

                // Extract values from struct fields
                let ipfsCid = '';
                if (fields.ipfs_cid) {
                  if (fields.ipfs_cid.str && typeof fields.ipfs_cid.str === 'function') {
                    try {
                      ipfsCid = fields.ipfs_cid.str();
                    } catch (e) {
                      // Try _value
                      if (fields.ipfs_cid._value) {
                        if (fields.ipfs_cid._value instanceof Uint8Array) {
                          ipfsCid = new TextDecoder().decode(fields.ipfs_cid._value);
                        } else {
                          ipfsCid = String(fields.ipfs_cid._value);
                        }
                      }
                    }
                  } else if (fields.ipfs_cid._value) {
                    if (fields.ipfs_cid._value instanceof Uint8Array) {
                      ipfsCid = new TextDecoder().decode(fields.ipfs_cid._value);
                    } else {
                      ipfsCid = String(fields.ipfs_cid._value);
                    }
                  }
                }
                
                const verificationLevel = fields.verification_level?._value !== undefined 
                  ? Number(fields.verification_level._value) 
                  : (fields.verification_level?.i32 ? fields.verification_level.i32() : 0);
                
                const verified = fields.verified?._value !== undefined 
                  ? Boolean(fields.verified._value) 
                  : (fields.verified?.b ? fields.verified.b() : false);
                
                const createdAtParts = fields.created_at?.i128 ? fields.created_at.i128() : fields.created_at;
                let createdAt = 0;
                if (createdAtParts) {
                  try {
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
                  } catch (e) {
                    console.warn('Error parsing createdAt:', e);
                  }
                }

                console.log('Parsed identity:', { ipfsCid, verificationLevel, verified, createdAt });

                setIdentity({
                  ipfsCid,
                  verificationLevel,
                  verified,
                  createdAt,
                });
              }
            } else if (identityResult._value && Array.isArray(identityResult._value)) {
              // Fallback: if _value is an array, try to parse it as a tuple/vec
              console.log('Identity result is an array, length:', identityResult._value.length);
              const identityData = identityResult._value;
              if (identityData && identityData.length >= 5) {
                const ipfsCid = identityData[0]?._value || identityData[0]?.str() || '';
                const verificationLevel = identityData[2]?._value || identityData[2]?.i32() || 0;
                const verified = identityData[3]?._value !== undefined ? Boolean(identityData[3]._value) : (identityData[3]?.b() || false);
                const createdAtParts = identityData[4]?.i128 ? identityData[4].i128() : identityData[4];
                let createdAt = 0;
                if (createdAtParts) {
                  const lo = createdAtParts.lo ? createdAtParts.lo() : createdAtParts._value?.lo;
                  if (lo) {
                    createdAt = parseInt(lo.toString(), 10);
                  }
                }

                console.log('Parsed identity from array:', { ipfsCid, verificationLevel, verified, createdAt });

                setIdentity({
                  ipfsCid,
                  verificationLevel,
                  verified,
                  createdAt,
                });
              }
            } else {
              console.warn('Unknown identity result format:', identityResult);
            }
          } catch (parseError) {
            console.error('Error parsing identity result:', parseError);
            // If parsing fails, at least we know identity exists
            setIdentity({
              ipfsCid: '',
              verificationLevel: 0,
              verified: false,
              createdAt: 0,
            });
          }
        }
        setHasIdentity(true);
      } else {
        setHasIdentity(false);
        setIdentity(null);
      }
    } catch (error: any) {
      console.error('Error checking identity:', error);
      // If error is "not found" or similar, assume no identity
      const errorStr = error?.message?.toLowerCase() || '';
      if (errorStr.includes('not found') || errorStr.includes('does not exist')) {
        setHasIdentity(false);
        setIdentity(null);
      } else {
        // For other errors, assume no identity to avoid blocking UI
        setHasIdentity(false);
        setIdentity(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const createIdentity = async (dni: string, ipfsCid: string) => {
    // Better error messages
    if (!kit) {
      throw new Error('Wallet kit is not initialized');
        }
        if (!connected) {
          throw new Error('Wallet is not connected');
        }
        if (!address) {
          throw new Error('Wallet address not available');
        }
        if (!IDENTITY_REGISTRY_CONTRACT || IDENTITY_REGISTRY_CONTRACT.trim() === '') {
          throw new Error('IdentityRegistry contract ID is not configured. Please configure VITE_IDENTITY_REGISTRY_CONTRACT in your .env file');
    }

    setLoading(true);
    try {
      console.log('Creating identity with:', {
        dni,
        ipfsCid,
        contractId: IDENTITY_REGISTRY_CONTRACT,
        address,
      });
      
      await callSorobanContract(kit, address, {
        contractId: IDENTITY_REGISTRY_CONTRACT,
        functionName: 'create_identity',
        args: [
          toScValAddress(address),
          toScValString(dni),
          toScValString(ipfsCid),
        ],
      });
      await checkIdentity();
    } catch (error) {
      console.error('Error creating identity:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connected && address) {
      checkIdentity();
    }
  }, [connected, address]);

  return {
    identity,
    hasIdentity,
    loading,
    createIdentity,
    refresh: checkIdentity,
  };
}


