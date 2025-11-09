# Integration Testing Guide

Since unit tests cannot run locally due to a known dependency issue, here's how to test your contracts through integration testing.

## Testing via Frontend

### 1. Identity Registry Testing

1. **Connect Wallet**: Connect your Stellar wallet
2. **Create Identity**: 
   - Enter a DNI
   - Enter an IPFS CID (can be a test value like `QmTest123`)
   - Click "Create Identity"
   - Verify success message

3. **Verify Identity**:
   - Check that "Has Identity" shows `true`
   - Verify the IPFS CID is displayed correctly
   - Check verification level (should be 0 initially)

### 2. Credit Scoring Testing

1. **Initialize Credit Score**:
   - Click "Initialize Credit Score"
   - Verify success message
   - Check that score shows 300
   - Verify max loan amount shows 1000 USDC

2. **Check Score**:
   - Verify score value is 300
   - Verify max loan is calculated correctly (300 * 10 = 3000, but displayed as 1000 USDC due to decimals)

### 3. Mock USDC Testing

1. **Get Faucet Tokens**:
   - Click "Get Faucet Tokens"
   - Verify balance increases by 1000 USDC
   - Check balance display

2. **Check Balance**:
   - Verify balance is displayed correctly
   - Test multiple faucet calls to verify balance tracking

### 4. Loan Manager Testing

1. **Request Loan**:
   - Ensure you have a credit score initialized
   - Enter loan amount (must be ≤ max loan amount)
   - Enter number of payments (1-12)
   - Click "Request Loan"
   - Verify success message
   - Check that tokens are minted to your wallet

2. **View Active Loan**:
   - Verify loan details are displayed:
     - Loan amount
     - Total amount (with interest)
     - Number of payments
     - Paid payments
     - Payment amount
     - Next payment date
     - Status (should be "Active")

3. **Pay Installment**:
   - Click "Pay Installment"
   - Approve the transaction
   - Verify payment count increases
   - Check that balance decreases by payment amount
   - Verify next payment date updates

4. **Complete Loan**:
   - Pay all installments
   - Verify loan status changes to "Paid"
   - Check that loan is removed from active loans

## Test Checklist

- [ ] Identity creation works
- [ ] Credit score initialization works
- [ ] Faucet tokens are received
- [ ] Loan request works within credit limit
- [ ] Loan request fails if amount exceeds credit limit
- [ ] Active loan details are displayed correctly
- [ ] Payment installments work
- [ ] Loan completion works
- [ ] Balance tracking is accurate
- [ ] Error messages are clear and helpful

## Expected Behaviors

### Success Cases
- All transactions complete successfully
- State updates correctly after each operation
- UI reflects the current contract state
- Error messages are user-friendly

### Error Cases
- Loan request exceeds credit limit → Error message
- Payment without active loan → Error message
- Insufficient balance for payment → Error message
- Duplicate identity creation → Error message

## Notes

- All contracts are deployed on Stellar testnet
- You can test with testnet XLM (free from friendbot)
- Transactions are real but on testnet (no real money)
- State persists between sessions (on-chain storage)

