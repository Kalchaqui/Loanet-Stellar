# Redesplegar IdentityRegistry Contract

El contrato ha sido corregido y compilado exitosamente. Ahora necesitas redesplegarlo.

## Pasos para redesplegar:

1. **Desplegar el nuevo contrato:**
   ```powershell
   cd contracts
   soroban contract deploy --wasm target/wasm32v1-none/release/loanet_contract.wasm --source YOUR_SECRET_KEY
   ```

2. **Copiar el nuevo Contract ID** que se muestra después del despliegue.

3. **Actualizar el archivo `.env`** con el nuevo Contract ID:
   ```
   VITE_IDENTITY_REGISTRY_CONTRACT=NUEVO_CONTRACT_ID_AQUI
   ```

4. **Inicializar el contrato** (opcional, pero recomendado):
   ```powershell
   soroban contract invoke --id NUEVO_CONTRACT_ID --source YOUR_SECRET_KEY -- initialize --owner YOUR_WALLET_ADDRESS
   ```

5. **Reiniciar el servidor de desarrollo** para que cargue el nuevo Contract ID.

## Nota importante:

El contrato ahora puede funcionar **sin inicialización** para crear identidades, pero es recomendable inicializarlo para tener control del owner y poder verificar usuarios.

