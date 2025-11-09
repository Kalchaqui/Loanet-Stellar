# 📖 Guía SIMPLE - Paso 2 explicado

## ¿Qué es el Paso 2?

El Paso 2 es **compilar y desplegar cada contrato uno por uno**.

### ¿Por qué hacerlo uno por uno?

Porque cada contrato necesita su propio Contract ID en Stellar, y para obtenerlo necesitamos compilarlos y desplegarlos por separado.

---

## 🎯 Lo que vamos a hacer (resumen simple):

Para cada contrato repetimos estos 3 pasos:
1. **Editar** `lib.rs` → cambiar qué contrato compilar
2. **Compilar** → crear el archivo .wasm
3. **Desplegar** → subirlo a Stellar y obtener el Contract ID

---

## 📝 INSTRUCCIONES PASO A PASO

### CONTRATO 1: Identity Registry

#### 1️⃣ Editar lib.rs

1. Abre el archivo `contracts\src\lib.rs` en tu editor
2. **Borra TODO** lo que hay dentro
3. **Escribe esto** (o copia y pega):

```
#![no_std]
pub mod identity_registry;
```

4. **Guarda** el archivo (Ctrl+S)

#### 2️⃣ Compilar

1. Abre PowerShell
2. Ve a la carpeta contracts:
   ```
   cd C:\Users\Kalcha\Desktop\Loanet\contracts
   ```

3. Ejecuta este comando:
   ```
   cargo build --target wasm32-unknown-unknown --release
   ```

4. ⏳ Espera a que termine (puede tardar 1-3 minutos)
   - Si ves errores, avísame y te ayudo

#### 3️⃣ Desplegar

Cuando termine de compilar, ejecuta:

```
soroban contract deploy --wasm target/wasm32-unknown-unknown/release/loanet_contract.wasm --source loanet-key --network testnet
```

#### 4️⃣ Guardar Contract ID

Verás algo como:
```
Contract ID: CA3V5K2J5Q4XW7Z8Y9N0P1Q2R3S4T5U6V7W8X9Y0Z1A2B3C4D5E6F7
```

**COPIA ese número y guárdalo en un archivo de texto temporal**

---

### CONTRATO 2: Credit Scoring

**Repite los mismos pasos**, pero:

1. En `lib.rs` escribe:
```
#![no_std]
pub mod credit_scoring;
```

2. Compila y despliega (mismos comandos)
3. Guarda el Contract ID

---

### CONTRATO 3: Lending Pool

1. En `lib.rs` escribe:
```
#![no_std]
pub mod lending_pool;
```

2. Compila y despliega
3. Guarda el Contract ID

---

### CONTRATO 4: Loan Manager

1. En `lib.rs` escribe:
```
#![no_std]
pub mod loan_manager;
```

2. Compila y despliega
3. Guarda el Contract ID

---

### CONTRATO 5: Mock USDC

1. En `lib.rs` escribe:
```
#![no_std]
pub mod mock_usdc;
```

2. Compila y despliega
3. Guarda el Contract ID

---

## ✅ Al final tendrás 5 Contract IDs

Cuando tengas los 5 Contract IDs, los pondremos en el archivo `.env`

---

## 💡 ¿Prefieres que lo haga automáticamente?

Si prefieres, puedo crear un script que haga todo esto automáticamente sin que tengas que editar `lib.rs` manualmente cada vez.

¿Quieres que cree el script automatizado o prefieres hacerlo manualmente paso a paso?
