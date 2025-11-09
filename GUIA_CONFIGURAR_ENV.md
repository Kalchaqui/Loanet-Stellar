# Guía: Configurar VITE_IDENTITY_REGISTRY_CONTRACT

## Paso 1: Verificar que tienes las herramientas necesarias

Abre PowerShell y ejecuta:

```powershell
# Verificar Rust
rustc --version

# Verificar Soroban CLI
soroban --version
```

Si falta Soroban CLI, instálalo:
```powershell
cargo install --locked soroban-cli
```

---

## Paso 2: Configurar una cuenta Stellar para testnet

```powershell
# Generar una clave para testnet (si no tienes una)
soroban keys generate --network testnet --global loanet-key

# Obtener fondos de prueba (necesarios para desplegar)
soroban keys fund --network testnet loanet-key

# Ver tu dirección Stellar (GUARDA ESTA DIRECCIÓN - la necesitarás)
soroban keys address loanet-key --network testnet
```

**Ejemplo de salida:**
```
GAVOBY...3LLLB5
```

**⚠️ IMPORTANTE:** Guarda esta dirección, la necesitarás para inicializar el contrato.

---

## Paso 3: Compilar el contrato Identity Registry

```powershell
# Ir al directorio de contratos
cd contracts

# Verificar que lib.rs tiene el módulo correcto
# Debe tener solo:
# #![no_std]
# pub mod identity_registry;

# Compilar el contrato
cargo build --target wasm32-unknown-unknown --release
```

**Ubicación del archivo compilado:**
```
contracts/target/wasm32-unknown-unknown/release/loanet_contract.wasm
```

---

## Paso 4: Desplegar el contrato en testnet

```powershell
# Desde el directorio contracts/
soroban contract deploy `
  --wasm target/wasm32-unknown-unknown/release/loanet_contract.wasm `
  --source loanet-key `
  --network testnet
```

**Ejemplo de salida:**
```
Contract deployed with ID: CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
```

**⚠️ IMPORTANTE:** Copia este Contract ID, lo necesitarás para el `.env`

---

## Paso 5: Inicializar el contrato

```powershell
# Reemplaza <CONTRACT_ID> con el ID que obtuviste
# Reemplaza <TU_ADDRESS> con tu dirección Stellar del Paso 2

soroban contract invoke `
  --id <CONTRACT_ID> `
  --source loanet-key `
  --network testnet `
  -- initialize `
  --owner <TU_ADDRESS>
```

**Ejemplo:**
```powershell
soroban contract invoke `
  --id CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA `
  --source loanet-key `
  --network testnet `
  -- initialize `
  --owner GAVOBY...3LLLB5
```

Si todo sale bien, no verás ningún error.

---

## Paso 6: Crear el archivo .env

En la **raíz del proyecto** (donde está `package.json`), crea un archivo llamado `.env`:

```env
VITE_STELLAR_NETWORK=testnet

# Contract IDs (reemplaza con tus valores reales)
VITE_IDENTITY_REGISTRY_CONTRACT=CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
VITE_CREDIT_SCORING_CONTRACT=
VITE_LENDING_POOL_CONTRACT=
VITE_LOAN_MANAGER_CONTRACT=
VITE_MOCK_USDC_CONTRACT=
```

**⚠️ IMPORTANTE:**
- Reemplaza `CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA` con el Contract ID real que obtuviste en el Paso 4
- Los otros contratos puedes dejarlos vacíos por ahora si solo quieres probar Identity Registry

---

## Paso 7: Reiniciar el servidor de desarrollo

```powershell
# Detén el servidor si está corriendo (Ctrl+C)
# Luego reinícialo
npm run dev
```

---

## Paso 8: Verificar que funciona

1. Abre la aplicación en el navegador
2. Conecta tu wallet
3. Haz clic en "Registrarse"
4. El banner de advertencia debería desaparecer
5. Deberías poder completar el formulario y crear una identidad

---

## Resumen rápido (comandos en orden)

```powershell
# 1. Generar clave (si no tienes)
soroban keys generate --network testnet --global loanet-key
soroban keys fund --network testnet loanet-key
soroban keys address loanet-key --network testnet  # Guarda esta dirección

# 2. Compilar
cd contracts
cargo build --target wasm32-unknown-unknown --release

# 3. Desplegar (guarda el Contract ID)
soroban contract deploy --wasm target/wasm32-unknown-unknown/release/loanet_contract.wasm --source loanet-key --network testnet

# 4. Inicializar (usa tu dirección y el Contract ID)
soroban contract invoke --id <CONTRACT_ID> --source loanet-key --network testnet -- initialize --owner <TU_ADDRESS>

# 5. Crear .env en la raíz con:
# VITE_STELLAR_NETWORK=testnet
# VITE_IDENTITY_REGISTRY_CONTRACT=<TU_CONTRACT_ID>

# 6. Reiniciar servidor
cd ..
npm run dev
```

---

## Solución de problemas

**Error: "can't find crate for `core`"**
- Ejecuta: `rustup target add wasm32-unknown-unknown`

**Error: "soroban: command not found"**
- Instala: `cargo install --locked soroban-cli`

**Error: "insufficient balance"**
- Ejecuta: `soroban keys fund --network testnet loanet-key`

**El banner de advertencia sigue apareciendo**
- Verifica que el archivo `.env` está en la raíz del proyecto (mismo nivel que `package.json`)
- Verifica que el nombre de la variable es exactamente: `VITE_IDENTITY_REGISTRY_CONTRACT`
- Reinicia el servidor de desarrollo después de crear/modificar `.env`

