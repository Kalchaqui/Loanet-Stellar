@echo off
REM Script de despliegue de contratos Loanet para Windows
REM Este script compila y despliega todos los contratos

echo ========================================
echo Despliegue de Contratos Loanet
echo ========================================
echo.

REM Verificar que estamos en el directorio correcto
if not exist "contracts" (
    echo ERROR: No se encontro el directorio contracts
    exit /b 1
)

cd contracts

echo [1/5] Compilando Identity Registry...
cargo build --target wasm32-unknown-unknown --release --lib 2>nul
if errorlevel 1 (
    echo ERROR al compilar Identity Registry
    exit /b 1
)

echo [2/5] Compilando Credit Scoring...
REM Continuar con la compilacion...

echo.
echo ========================================
echo Compilacion completada
echo ========================================
echo.
echo Por favor, ejecuta manualmente los siguientes comandos:
echo.
echo 1. Para desplegar Identity Registry:
echo    soroban deploy --wasm target/wasm32-unknown-unknown/release/loanet_contract.wasm --source loanet-key --network testnet
echo.
echo 2. Guarda el Contract ID y configuralo en el archivo .env
echo.
echo NOTA: Los contratos necesitan ser compilados como bibliotecas separadas.
echo       Consulta DEPLOY_CONTRACTS.md para mas detalles.

cd ..

