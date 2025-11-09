# Guía paso a paso para desplegar contratos Loanet

## Método más simple: Compilar y desplegar manualmente

### Paso 1: Verificar herramientas

```powershell
# Verificar Rust
rustc --version

# Verificar Soroban CLI  
soroban --version

# Si falta algo, instala:
# rustup target add wasm32-unknown-unknown
# cargo install --locked soroban-cli
```

### Paso 2: Configurar cuenta Stellar

```powershell
# Generar clave (si no tienes una)
soroban keys generate --network testnet --global loanet-key

# Obtener fondos de prueba
soroban keys fund --network testnet loanet-key

# Ver tu address (GUARDA ESTO - lo necesitarás para inicializar)
soroban keys address loanet-key --network testnet
```

### Paso 3: Compilar todos los contratos

```powershell
cd contracts
cargo build --target wasm32-unknown-unknown --release
```

**Problema**: Esto compilará todos los contratos como una sola biblioteca. 
Para desplegarlos individualmente, necesitamos compilar cada uno por separado.

### Solución: Compilar cada contrato individualmente

Como los contratos están en archivos separados pero compilan juntos, tenemos dos opciones:

#### Opción A: Modificar lib.rs temporalmente (Manual)

Para cada contrato, edita `contracts/src/lib.rs` temporalmente:

**Para Identity Registry:**
1. Edita `contracts/src/lib.rs` y reemplázalo con solo:
```rust
#![no_std]
pub mod identity_registry;
```

2. Compila:
```powershell
cd contracts
cargo build --target wasm32-unknown-unknown --release
```

3. Despliega:
```powershell
soroban contract deploy --wasm target/wasm32-unknown-unknown/release/loanet_contract.wasm --source loanet-key --network testnet
```

4. **GUARDA EL CONTRACT ID** que aparezca

5. Repite para cada contrato (credit_scoring, lending_pool, loan_manager, mock_usdc)

#### Opción B: Usar el script automatizado

Ejecuta el script `deploy-all-contracts.ps1` que creé:

```powershell
.\deploy-all-contracts.ps1
```

Este script automáticamente:
- Compila cada contrato por separado
- Lo despliega
- Genera el archivo .env con los Contract IDs

### Paso 4: Crear archivo .env

Crea un archivo `.env` en la raíz del proyecto con:

```env
VITE_STELLAR_NETWORK=testnet

# Reemplaza los valores con los Contract IDs que obtuviste
VITE_IDENTITY_REGISTRY_CONTRACT=<TU_CONTRACT_ID>
VITE_CREDIT_SCORING_CONTRACT=<TU_CONTRACT_ID>
VITE_LENDING_POOL_CONTRACT=<TU_CONTRACT_ID>
VITE_LOAN_MANAGER_CONTRACT=<TU_CONTRACT_ID>
VITE_MOCK_USDC_CONTRACT=<TU_CONTRACT_ID>
```

### Paso 5: Inicializar contratos

Después de desplegar, inicializa cada contrato:

```powershell
# Reemplaza <CONTRACT_ID> y <TU_ADDRESS> con tus valores

# Identity Registry
soroban contract invoke --id <IDENTITY_REGISTRY_CONTRACT_ID> --source loanet-key --network testnet -- initialize --owner <TU_ADDRESS>

# Credit Scoring
soroban contract invoke --id <CREDIT_SCORING_CONTRACT_ID> --source loanet-key --network testnet -- initialize --owner <TU_ADDRESS>

# Lending Pool
soroban contract invoke --id <LENDING_POOL_CONTRACT_ID> --source loanet-key --network testnet -- initialize --owner <TU_ADDRESS>

# Mock USDC
soroban contract invoke --id <MOCK_USDC_CONTRACT_ID> --source loanet-key --network testnet -- initialize --admin <TU_ADDRESS>

# Loan Manager (necesita los IDs de los otros contratos)
soroban contract invoke --id <LOAN_MANAGER_CONTRACT_ID> --source loanet-key --network testnet -- initialize --owner <TU_ADDRESS> --credit_scoring <CREDIT_SCORING_CONTRACT_ID> --lending_pool <LENDING_POOL_CONTRACT_ID> --token <MOCK_USDC_CONTRACT_ID>
```

### Paso 6: Verificar

Reinicia el servidor de desarrollo:

```powershell
npm run dev
```

Ahora deberías poder crear identidades sin el error de "contract not configured".
