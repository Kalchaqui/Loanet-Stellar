# Guía de Despliegue

Esta guía te ayudará a desplegar tu dApp Stellar completa con todos los componentes requeridos.

## Prerrequisitos

### 1. Instalar Rust y Cargo
```bash
# Windows (PowerShell)
Invoke-WebRequest -Uri https://win.rustup.rs/x86_64 -OutFile rustup-init.exe
.\rustup-init.exe

# macOS/Linux
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### 2. Instalar Stellar CLI (Soroban CLI)
```bash
cargo install --locked soroban-cli
```

### 3. Instalar Node.js y npm
- Descarga Node.js desde https://nodejs.org/
- Versión recomendada: Node.js 18 o superior

## Pasos de Despliegue

### Paso 1: Instalar Dependencias del Frontend
```bash
npm install
```

### Paso 2: Compilar el Contrato Inteligente
```bash
npm run contract:build
```

Esto compilará el contrato Rust a WebAssembly en `contracts/target/wasm32-unknown-unknown/release/stellar_counter.wasm`

### Paso 3: Configurar Cuenta de Stellar Testnet

1. Crea una cuenta de prueba en Stellar Testnet:
```bash
soroban keys generate --network testnet --global test-key
```

2. Obtén fondos de prueba:
```bash
soroban keys fund --network testnet test-key
```

### Paso 4: Desplegar el Contrato

```bash
soroban deploy \
  --wasm contracts/target/wasm32-unknown-unknown/release/stellar_counter.wasm \
  --source test-key \
  --network testnet
```

**IMPORTANTE**: Guarda el Contract ID que se muestra después del despliegue.

### Paso 5: Inicializar el Contrato

```bash
soroban invoke \
  --id CONTRACT_ID_AQUI \
  --source test-key \
  --network testnet \
  -- initialize \
  --value 0
```

### Paso 6: Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_STELLAR_NETWORK=testnet
VITE_CONTRACT_ID=CONTRACT_ID_AQUI
```

Reemplaza `CONTRACT_ID_AQUI` con el Contract ID obtenido en el Paso 4.

### Paso 7: Iniciar el Frontend

```bash
npm run dev
```

El frontend estará disponible en `http://localhost:3000`

## Verificación de Componentes

### ✅ Contrato Inteligente Desplegado
- ✅ Contrato escrito en Rust
- ✅ Compilado a WebAssembly (WASM)
- ✅ Desplegado en Stellar Testnet
- ✅ Contract ID configurado en variables de entorno

### ✅ Frontend Funcional
- ✅ Construido con TypeScript + React + Vite
- ✅ Interfaz de usuario moderna y responsiva
- ✅ Componentes modulares y reutilizables

### ✅ Integración Stellar Wallet Kit
- ✅ Stellar Wallet Kit instalado y configurado
- ✅ Botón de conexión de wallet funcional
- ✅ Soporte para múltiples wallets del ecosistema Stellar
- ✅ Firma de transacciones integrada

## Interacción con el Contrato

Una vez que el frontend esté corriendo:

1. **Conecta tu Wallet**: Haz clic en "Conectar Wallet" y selecciona tu wallet preferida
2. **Incrementar**: Incrementa el contador en 1
3. **Decrementar**: Decrementa el contador en 1
4. **Resetear**: Vuelve el contador a 0
5. **Actualizar**: Refresca el valor actual del contador

## Solución de Problemas

### El contrato no se compila
- Verifica que Rust esté instalado: `rustc --version`
- Verifica que el target wasm32 esté instalado: `rustup target add wasm32-unknown-unknown`

### El frontend no se inicia
- Verifica que Node.js esté instalado: `node --version`
- Elimina `node_modules` y reinstala: `rm -rf node_modules && npm install`

### La wallet no se conecta
- Verifica que la red configurada coincida con tu wallet
- Asegúrate de tener una wallet Stellar instalada (Freighter, etc.)

### Error al interactuar con el contrato
- Verifica que el Contract ID en `.env` sea correcto
- Verifica que el contrato esté desplegado y inicializado
- Revisa la consola del navegador para mensajes de error detallados

## Recursos Adicionales

- [Documentación de Stellar](https://developers.stellar.org/)
- [Stellar Wallet Kit](https://stellarwalletskit.dev/)
- [Soroban CLI](https://soroban.stellar.org/docs/getting-started/setup)
- [Documentación de Scaffold Stellar](https://developers.stellar.org/es/docs/tools/developer-tools/scaffold-stellar)

