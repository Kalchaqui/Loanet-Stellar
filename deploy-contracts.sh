#!/bin/bash
# Script de despliegue de contratos Loanet para Linux/Mac
# Este script compila y despliega todos los contratos

echo "========================================"
echo "Despliegue de Contratos Loanet"
echo "========================================"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -d "contracts" ]; then
    echo "ERROR: No se encontró el directorio contracts"
    exit 1
fi

cd contracts

echo "[1/5] Compilando contratos..."
cargo build --target wasm32-unknown-unknown --release

if [ $? -ne 0 ]; then
    echo "ERROR al compilar contratos"
    exit 1
fi

echo ""
echo "========================================"
echo "Compilación completada"
echo "========================================"
echo ""
echo "Los WASM files están en: target/wasm32-unknown-unknown/release/"
echo ""
echo "Para desplegar, ejecuta manualmente:"
echo "soroban deploy --wasm target/wasm32-unknown-unknown/release/<contract>.wasm --source loanet-key --network testnet"
echo ""
echo "NOTA: Necesitas configurar cada contrato como biblioteca separada."
echo "      Consulta DEPLOY_CONTRACTS.md para más detalles."

cd ..

