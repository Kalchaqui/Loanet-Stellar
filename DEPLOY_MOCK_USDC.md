# Desplegar MockUSDC Contract

El contrato ha sido compilado exitosamente. Ahora necesitas desplegarlo e inicializarlo.

## Pasos para desplegar:

1. **Desplegar el contrato:**
   ```powershell
   cd contracts
   soroban contract deploy --wasm target/wasm32v1-none/release/loanet_contract.wasm --source YOUR_SECRET_KEY
   ```

2. **Copiar el nuevo Contract ID** que se muestra después del despliegue.

3. **Inicializar el contrato** (necesario antes de usar):
   ```powershell
   soroban contract invoke --id CONTRACT_ID --source YOUR_SECRET_KEY -- initialize --admin YOUR_WALLET_ADDRESS --name "Mock USDC" --symbol "USDC" --decimals 6
   ```
   
   Reemplaza:
   - `CONTRACT_ID` con el ID del contrato desplegado
   - `YOUR_WALLET_ADDRESS` con tu dirección de wallet (ej: GAQGVX77PX3UAQCJKXFAYDRFHRCPLTNGMMNEUCENZ525SBW4EYWGRGNK)
   - `YOUR_SECRET_KEY` con tu secret key

4. **Actualizar el archivo `.env`** con el nuevo Contract ID:
   ```
   VITE_MOCK_USDC_CONTRACT=CONTRACT_ID_AQUI
   ```

5. **Reiniciar el servidor de desarrollo** para que cargue el nuevo Contract ID.

## Nota importante:

El contrato debe ser inicializado antes de poder usar la función `faucet`. La inicialización:
- Crea 1 millón de tokens y los asigna al admin
- Configura el nombre, símbolo y decimales del token
- El admin puede usar `mint` para crear más tokens si es necesario

