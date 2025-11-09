# 🚀 Loanet - Decentralized Lending System

<div align="center">

![STELLAR](https://img.shields.io/badge/STELLAR-7D00FF?style=for-the-badge&logo=stellar&logoColor=white)
![RUST](https://img.shields.io/badge/RUST-000000?style=for-the-badge&logo=rust&logoColor=white)
![REACT](https://img.shields.io/badge/REACT-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TYPESCRIPT](https://img.shields.io/badge/TYPESCRIPT-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![SOROBAN](https://img.shields.io/badge/SOROBAN-7D00FF?style=for-the-badge&logo=stellar&logoColor=white)

A modern decentralized application (dApp) for peer-to-peer lending built on the Stellar network with Soroban smart contracts.

[Features](#-main-features) • [Technologies](#-technologies) • [Installation](#-installation) • [Usage](#-usage)

</div>

---

## 📋 Description

Loanet is a decentralized lending platform created to demonstrate the power of Stellar blockchain and Soroban smart contracts. The application implements a complete lending system with digital identity verification, credit scoring, and automated loan management. Users can register their identity, obtain a credit score, request loans based on their creditworthiness, and manage repayments—all secured by blockchain technology.

The platform stores sensitive personal data off-chain on IPFS (InterPlanetary File System) while maintaining only cryptographic hashes on-chain, ensuring privacy and reducing storage costs. Smart contracts handle all lending logic, credit scoring, and payment processing automatically.

---

## ✨ Main Features

### 👥 Digital Identity System
- **Verified Identity Registration**: Users register with their personal information and ID documents
- **IPFS Storage**: All sensitive data stored off-chain on IPFS for privacy and cost efficiency
- **On-Chain Verification**: Only cryptographic hashes (CIDs) stored on blockchain
- **Unique Wallet Binding**: Each wallet address is uniquely linked to an ID number

### 📊 Credit Scoring System
- **On-Chain Credit Score**: Transparent and immutable credit scoring stored on blockchain
- **Initial Score**: New users receive 300 points upon initialization
- **Dynamic Scoring**: Score increases with successful loan repayments
- **Maximum Loan Calculation**: Loan limits automatically calculated based on credit score
- **Blacklist Management**: Users can be blacklisted for defaulting

### 💰 Loan Management
- **Automated Loan Issuance**: Loans automatically minted to borrowers upon approval
- **Flexible Payment Plans**: Choose from 1, 3, 6, or 12 monthly installments
- **Interest Calculation**: Configurable interest rates applied automatically
- **Payment Tracking**: Real-time tracking of paid installments and remaining balance
- **Early Payment Support**: Users can pay installments before due dates

### 🪙 Mock USDC Token
- **Test Token Faucet**: Get test USDC tokens for development and testing
- **Token Tracking**: Separate tracking of faucet tokens vs. loan tokens
- **Full ERC-20 Compatibility**: Standard token operations (transfer, approve, etc.)

### 🔐 Security
- **Smart Contract Auditing**: Contracts written in Rust with best practices
- **Secure Arithmetic**: Safe math operations to prevent overflow/underflow
- **Comprehensive Validations**: Extensive input validation and error handling
- **Wallet Integration**: Secure transaction signing via Stellar Wallet Kit

### 🎨 Modern Interface
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark Theme**: Modern dark theme with gradient accents
- **Real-Time Updates**: Live balance and loan status updates
- **User-Friendly**: Intuitive UI with clear feedback and error messages

### 🔗 Wallet Integration
- **Multi-Wallet Support**: Compatible with Freighter, xBull, Albedo, and Rabet
- **Stellar Wallet Kit**: Seamless integration via Stellar Wallets Kit
- **Transaction Signing**: Secure transaction signing directly from wallet
- **Network Support**: Testnet and Mainnet support

### ⚡ Optimized Transactions
- **Soroban RPC**: Optimized transaction submission via Soroban RPC server
- **Robust Error Handling**: Comprehensive error messages and recovery
- **Transaction Simulation**: Pre-flight transaction simulation for better UX
- **Confirmation Tracking**: Real-time transaction status updates

---

## 🛠 Technologies

### Smart Contracts
- **Rust**: Smart contracts written in Rust for performance and safety
- **Soroban SDK**: Stellar's smart contract platform SDK
- **WebAssembly**: Contracts compiled to WASM for execution

### Frontend
- **React**: Modern UI framework with hooks and context
- **TypeScript**: Type-safe JavaScript for better development experience
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework (if used)

### Blockchain
- **Stellar Network**: Fast, low-cost blockchain for payments
- **Soroban**: Smart contract platform on Stellar
- **IPFS**: Decentralized storage for off-chain data

### Tools & Libraries
- **Stellar Wallet Kit**: Multi-wallet integration library
- **Stellar SDK**: JavaScript SDK for Stellar network
- **Soroban CLI**: Command-line tools for contract deployment

---

## 📦 Installation

### Prerequisites

- **Node.js** 18+ and npm
- **Rust** and Cargo (latest stable version)
- **Soroban CLI** (for contract deployment)
- **Git** (for cloning the repository)

### Step 1: Clone the Repository

```bash
git clone https://github.com/Kalchaqui/Loanet-Stellar.git
cd Loanet-Stellar
```

### Step 2: Install Frontend Dependencies

```bash
npm install
```

### Step 3: Build Smart Contracts

```bash
cd contracts
cargo build --target wasm32-unknown-unknown --release
cd ..
```

### Step 4: Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_STELLAR_NETWORK=testnet
VITE_IDENTITY_REGISTRY_CONTRACT=<YOUR_IDENTITY_REGISTRY_CONTRACT_ID>
VITE_CREDIT_SCORING_CONTRACT=<YOUR_CREDIT_SCORING_CONTRACT_ID>
VITE_MOCK_USDC_CONTRACT=<YOUR_MOCK_USDC_CONTRACT_ID>
VITE_LOAN_MANAGER_CONTRACT=<YOUR_LOAN_MANAGER_CONTRACT_ID>
```

### Step 5: Deploy Smart Contracts

Follow the deployment guide in `DEPLOY_CONTRACTS.md` to deploy all contracts to the Stellar testnet.

---

## 🚀 Usage

### Starting the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Connecting Your Wallet

1. Install a Stellar wallet extension (e.g., [Freighter](https://freighter.app))
2. Click "Connect Wallet" in the application
3. Select your preferred wallet from the modal
4. Approve the connection request

### Registering Your Identity

1. Click "Register" in the Digital Identity section
2. Fill in all required personal information
3. Upload front and back images of your ID
4. Submit the form (data will be uploaded to IPFS)
5. Sign the transaction in your wallet

### Initializing Credit Score

1. Navigate to the Credit Score section
2. Click "Initialize Score"
3. Sign the transaction in your wallet
4. You'll receive 300 credit points (allowing loans up to $1000 USDC)

### Getting Test Tokens

1. Go to the Mock USDC section
2. Click "Get 1000 USDC"
3. Sign the transaction in your wallet
4. Your balance will update automatically

### Requesting a Loan

1. Navigate to "My Loan" section
2. Enter the loan amount (up to your credit limit)
3. Select the number of payments (1, 3, 6, or 12)
4. Click "Request Loan"
5. Sign the transaction in your wallet
6. Tokens will be minted directly to your wallet

### Paying Installments

1. In the "My Loan" section, view your active loan
2. Click "Pay Installment Now"
3. Sign the transaction in your wallet
4. Your payment will be recorded and credit score may increase

---

## 📁 Project Structure

```
Loanet-Stellar/
├── contracts/              # Smart contracts (Rust)
│   ├── src/
│   │   ├── identity_registry.rs
│   │   ├── credit_scoring.rs
│   │   ├── mock_usdc.rs
│   │   └── loan_manager.rs
│   └── Cargo.toml
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── hooks/             # Custom React hooks
│   ├── contexts/           # React contexts
│   ├── utils/              # Utility functions
│   └── App.tsx
├── public/                 # Static assets
├── .env                    # Environment variables
└── package.json
```

---

## 🔧 Smart Contracts

### IdentityRegistry
Manages user digital identities with IPFS storage for sensitive data.

**Key Functions:**
- `create_identity`: Register a new identity with IPFS CID
- `get_identity`: Retrieve identity information
- `has_identity`: Check if wallet has registered identity
- `verify_user`: Verify user identity (admin only)

### CreditScoringMini
Handles credit scoring and loan limit calculations.

**Key Functions:**
- `initialize_user`: Initialize credit score (300 points)
- `get_score`: Get user's credit score
- `max_loan`: Get maximum loan amount for user
- `reward`: Increase credit score (admin only)
- `penalize_user`: Decrease credit score (admin only)

### MockUSDC
Test token for development and testing.

**Key Functions:**
- `faucet`: Get 1000 test USDC tokens
- `mint_loan`: Mint tokens for approved loans
- `transfer`: Transfer tokens between addresses
- `balance`: Get token balance

### LoanManagerMicro
Manages loan lifecycle from request to repayment.

**Key Functions:**
- `request_loan`: Request a new loan
- `pay_installment`: Pay a loan installment
- `get_loan`: Get loan information
- `get_loan_id`: Get active loan ID for borrower

---

## 🧪 Testing

### Running Frontend Tests

```bash
npm test
```

### Testing Smart Contracts

```bash
cd contracts
cargo test
```

---

## 📝 Deployment

See `DEPLOY_CONTRACTS.md` for detailed deployment instructions.

### Quick Deploy Commands

```bash
# Build contract
cargo build --target wasm32-unknown-unknown --release

# Deploy contract
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/loanet_contract.wasm \
  --source loanet-key \
  --network testnet

# Initialize contract
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source loanet-key \
  --network testnet \
  -- initialize --owner <YOUR_ADDRESS>
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- Stellar Development Foundation for the amazing blockchain platform
- Soroban team for the smart contract platform
- Stellar Wallet Kit developers for wallet integration
- IPFS team for decentralized storage solutions

---

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

<div align="center">

**Built with ❤️ on Stellar**

[⬆ Back to Top](#-loanet---decentralized-lending-system)

</div>
