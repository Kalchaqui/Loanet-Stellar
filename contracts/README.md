# Contratos de Loanet - Documentación

Este proyecto contiene 5 contratos inteligentes para el sistema de préstamos descentralizado Loanet.

## Estructura de Contratos

### 0. MockUSDC (`mock_usdc.rs`)
Token mock para pruebas que simula USDC con 6 decimales.

**Funciones principales:**
- `initialize(admin, name, symbol, decimals)` - Inicializa el token y crea 1 millón de tokens para el admin
- `mint(to, amount)` - Mintea tokens (solo admin, para pruebas)
- `burn(from, amount)` - Quema tokens (solo admin)
- `transfer(from, to, amount)` - Transfiere tokens entre usuarios
- `balance(address)` - Obtiene balance de una dirección
- `approve(from, spender, amount)` - Aprueba gasto
- `transfer_from(spender, from, to, amount)` - Transfiere usando allowance
- `faucet(to)` - Cualquier usuario puede obtener tokens de prueba (1000 tokens)
- `total_supply()` - Obtiene suministro total

**Uso:**
- Desplegar primero para usar en `LendingPoolMini` y `LoanManagerMicro`
- Al inicializar, automáticamente crea 1 millón de tokens (1,000,000 * 10^decimals) y los asigna al admin
- Cualquier usuario puede llamar `faucet()` para obtener 1000 tokens de prueba
- El admin puede mintear tokens libremente para pruebas
- Compatible con la interfaz estándar de tokens de Soroban

## Estructura de Contratos

### 1. IdentityRegistry (`identity_registry.rs`)
Sistema de identidades digitales verificadas on-chain.

**Funciones principales:**
- `initialize(owner)` - Inicializa el contrato con un owner
- `create_identity(user, ipfs_hash)` - Crea una identidad con hash IPFS
- `verify_user(user, verification_level)` - Verifica usuario (solo owner)
- `get_identity(user)` - Obtiene información de identidad
- `get_verification_level(user)` - Obtiene nivel de verificación (0-3)
- `is_verified(user)` - Verifica si usuario está verificado
- `get_total_users()` - Obtiene total de usuarios registrados

### 2. CreditScoringMini (`credit_scoring.rs`)
Sistema de puntaje crediticio on-chain.

**Funciones principales:**
- `initialize(owner)` - Inicializa el contrato con un owner
- `initialize_user(user)` - Inicializa score para un usuario (300 puntos)
- `get_score_value(user)` - Obtiene el score del usuario
- `get_max_loan_amount(user)` - Obtiene monto máximo de préstamo
- `is_blacklisted(user)` - Verifica si usuario está en lista negra
- `reward_user(user, points)` - Recompensa puntos (solo owner)
- `penalize_user(user, points)` - Penaliza puntos (solo owner)
- `transfer_ownership(new_owner)` - Transfiere ownership (solo owner)

**Lógica:**
- Score inicial: 300 puntos
- Ratio: 1 punto = 100 unidades de préstamo máximo
- Si score baja a 0, usuario queda blacklisted

### 3. LendingPoolMini (`lending_pool.rs`)
Pool de liquidez con stablecoin.

**Funciones principales:**
- `initialize(owner, token_address)` - Inicializa con owner y token
- `deposit(user, amount)` - Deposita fondos al pool
- `withdraw(user, amount)` - Retira fondos del pool
- `get_balance(user)` - Obtiene balance del usuario
- `get_total_liquidity()` - Obtiene liquidez total disponible
- `set_loan_manager(loan_manager)` - Asigna loan manager (solo owner)
- `disburse_loan(borrower, amount)` - Desembolsa préstamo (solo loan manager)
- `register_repayment(borrower, amount)` - Registra pago (solo loan manager)

### 4. LoanManagerMicro (`loan_manager.rs`)
Gestor de micropréstamos que conecta los otros contratos.

**Funciones principales:**
- `initialize(credit_scoring, lending_pool, token_address, default_interest_rate)` - Inicializa con contratos relacionados
- `request_loan(borrower, amount, num_payments)` - Solicita un préstamo
- `pay_installment(borrower, loan_id)` - Paga una cuota del préstamo
- `get_loan(loan_id)` - Obtiene información del préstamo
- `get_loan_id(borrower)` - Obtiene loan ID de un prestatario

**Lógica:**
- Verifica blacklist antes de aprobar préstamo
- Verifica límite máximo de crédito
- Calcula intereses según tasa configurada
- Soporta 1-12 pagos
- Al completar pago, recompensa 10 puntos en credit scoring

## Compilación

Cada contrato debe compilarse por separado. Puedes crear un workspace de Cargo o compilar cada uno individualmente.

### Opción 1: Compilar cada contrato por separado

Crea un `Cargo.toml` específico para cada contrato o usa el mismo y cambia el nombre del paquete.

### Opción 2: Usar un workspace

Crea un `Cargo.toml` en la raíz con:

```toml
[workspace]
members = [
    "identity_registry",
    "credit_scoring", 
    "lending_pool",
    "loan_manager"
]
```

## Orden de Despliegue

1. **MockUSDC** - Desplegar primero (token para pruebas)
2. **IdentityRegistry** - Desplegar segundo
3. **CreditScoringMini** - Desplegar tercero
4. **LendingPoolMini** - Desplegar cuarto (necesita token address del MockUSDC)
5. **LoanManagerMicro** - Desplegar último (necesita los otros 4 contratos)

### Pasos de inicialización:

1. **MockUSDC**: 
   ```rust
   initialize(admin, "Mock USDC", "USDC", 6)
   ```

2. **IdentityRegistry**:
   ```rust
   initialize(owner)
   ```

3. **CreditScoringMini**:
   ```rust
   initialize(owner)
   ```

4. **LendingPoolMini**:
   ```rust
   initialize(owner, mock_usdc_address)
   ```

5. **LoanManagerMicro**:
   ```rust
   initialize(credit_scoring_address, lending_pool_address, mock_usdc_address, 500)
   // 500 = 5% de interés por defecto (en basis points)
   ```

## Interacción entre Contratos

- `LoanManagerMicro` llama a `CreditScoringMini` para verificar blacklist y límites
- `LoanManagerMicro` llama a `LendingPoolMini` para desembolsar y registrar pagos
- Al completar préstamo, `LoanManagerMicro` recompensa en `CreditScoringMini`

## Notas Importantes

- Todos los contratos usan `Address` para identificar usuarios
- Los montos se manejan en `i128` (Stellar/Soroban usa i128 para balances)
- Los intereses se manejan en basis points (100 = 1%)
- Cada contrato debe inicializarse antes de usar
- **MockUSDC** es solo para desarrollo/pruebas. En producción, usa el token contract estándar de Soroban o un token real

## Mock Token vs Token Real

**¿Por qué usar MockUSDC?**
- ✅ Permite mintear tokens libremente para pruebas
- ✅ No requiere configuración compleja
- ✅ Ideal para desarrollo local y testnet
- ❌ No debe usarse en producción

**Para producción:**
- Usa el Stellar Token Contract estándar de Soroban
- O integra con tokens reales de Stellar (ej: USDC emitido en Stellar)

