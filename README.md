# Loanet

Una aplicación descentralizada (dApp) construida con Scaffold Stellar que demuestra los tres componentes clave:

## Componentes

### 1. Contrato Inteligente Desplegado
- Contrato escrito en Rust compilado a WebAssembly
- Ubicación: `contracts/`
- Funcionalidad: Contador simple con operaciones increment/decrement

### 2. Frontend Funcional
- Construido con TypeScript + React + Vite
- Interfaz moderna y responsiva
- Ubicación: `src/`

### 3. Integración Stellar Wallet Kit
- Integración completa con Stellar Wallet Kit
- Soporte para múltiples wallets del ecosistema Stellar
- Conexión y firma de transacciones

## Instalación

### Prerrequisitos

- Node.js 18+ y npm
- Rust y Cargo
- Stellar CLI (soroban-cli)

### Pasos de Instalación

1. Instalar dependencias del frontend:
```bash
npm install
```

2. Compilar el contrato inteligente:
```bash
npm run contract:build
```

3. Desplegar el contrato (requiere secret key):
```bash
npm run contract:deploy
```

4. Configurar variables de entorno:
   - Copia `.env.example` a `.env`
   - Actualiza `VITE_CONTRACT_ID` con tu contract ID desplegado

5. Iniciar el servidor de desarrollo:
```bash
npm run dev
```

## Estructura del Proyecto

```
.
├── contracts/          # Contratos inteligentes en Rust
│   ├── src/
│   │   ├── lib.rs      # Contrato principal
│   │   └── test.rs     # Tests del contrato
│   └── Cargo.toml      # Configuración de Rust
├── src/                # Frontend React + TypeScript
│   ├── components/     # Componentes de UI
│   ├── contracts/      # Lógica de interacción con contratos
│   ├── hooks/          # React hooks personalizados
│   ├── App.tsx         # Componente principal
│   └── main.tsx        # Punto de entrada
├── package.json        # Dependencias del frontend
├── vite.config.ts      # Configuración de Vite
└── tsconfig.json       # Configuración de TypeScript
```

## Uso

1. Conecta tu wallet usando el botón de conexión
2. Interactúa con el contrato usando los botones de increment/decrement
3. Observa el estado del contador en tiempo real

## Desarrollo

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye para producción
- `npm run contract:build` - Compila el contrato inteligente
- `npm run lint` - Ejecuta el linter

## Licencia

MIT

