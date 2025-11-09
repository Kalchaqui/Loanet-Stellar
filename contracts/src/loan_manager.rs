use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol, IntoVal,
};

#[derive(Clone)]
#[contracttype]
pub struct Loan {
    pub borrower: Address,
    pub amount: i128,
    pub total_amount: i128, // amount + interest
    pub interest_rate: i128, // in basis points (100 = 1%)
    pub num_payments: u32,
    pub paid_payments: u32,
    pub payment_amount: i128,
    pub created_at: i128, // Changed from u64 to i128 for Soroban compatibility
    pub status: i32, // Changed from LoanStatus enum to i32 for Soroban compatibility
}

#[derive(Clone, Copy, PartialEq)]
#[repr(u8)]
pub enum LoanStatus {
    Active = 0,
    Repaid = 1,
    Defaulted = 2,
}

const CREDIT_SCORING: Symbol = symbol_short!("CREDIT_SC");
const TOKEN: Symbol = symbol_short!("TOKEN");
const INTEREST_RATE: Symbol = symbol_short!("INT_RATE"); // Default interest rate in basis points

#[contract]
pub struct LoanManagerMicro;

#[contractimpl]
impl LoanManagerMicro {
    /// Initialize the contract with dependencies
    pub fn initialize(
        env: Env,
        credit_scoring: Address,
        token_address: Address,
        default_interest_rate: i128,
    ) {
        env.storage().instance().set(&CREDIT_SCORING, &credit_scoring);
        env.storage().instance().set(&TOKEN, &token_address);
        env.storage()
            .instance()
            .set(&INTEREST_RATE, &default_interest_rate);
    }

    /// Get credit scoring contract address
    fn get_credit_scoring(env: &Env) -> Address {
        env.storage()
            .instance()
            .get(&CREDIT_SCORING)
            .expect("Credit scoring not initialized")
    }

    /// Get token address
    fn get_token_address(env: &Env) -> Address {
        env.storage()
            .instance()
            .get(&TOKEN)
            .expect("Token not initialized")
    }

    /// Request a loan
    pub fn request_loan(
        env: Env,
        borrower: Address,
        amount: i128,
        num_payments: u32,
    ) -> u32 {
        borrower.require_auth();

        if amount <= 0 {
            panic!("Amount must be positive");
        }

        if num_payments == 0 || num_payments > 12 {
            panic!("Invalid number of payments");
        }

        // Verify contract is initialized
        if !env.storage().instance().has(&CREDIT_SCORING) {
            panic!("Contract not initialized. Credit scoring address not set.");
        }

        // Check if user is blacklisted
        let credit_scoring_addr = Self::get_credit_scoring(&env);
        let is_blacklisted: bool = env
            .invoke_contract(
                &credit_scoring_addr,
                &symbol_short!("is_blk"), // Shortened to fit 9 char limit
                soroban_sdk::vec![&env, borrower.clone().into_val(&env)],
            );
        
        if is_blacklisted {
            panic!("User is blacklisted");
        }
        
        // Check max loan amount
        let max_loan = Self::get_max_loan_amount(env.clone(), borrower.clone());
        if max_loan == 0 {
            panic!("User has no credit score. Please initialize your credit score first.");
        }
        if amount > max_loan {
            panic!("Amount exceeds maximum loan limit");
        }

        // Calculate interest
        let interest_rate: i128 = env
            .storage()
            .instance()
            .get(&INTEREST_RATE)
            .unwrap_or(500); // Default 5%

        let interest = (amount * interest_rate) / 10000;
        let total_amount = amount + interest;
        
        // Calculate payment amount - ensure we don't lose precision
        // If num_payments is 1, payment_amount = total_amount
        let payment_amount = if num_payments == 1 {
            total_amount
        } else {
            total_amount / (num_payments as i128)
        };

        // Generate loan ID first
        let loan_id = Self::get_next_loan_id(env.clone());
        Self::increment_loan_id(env.clone());

        // Mint tokens directly to borrower BEFORE storing the loan
        // If minting fails, we don't want to store an invalid loan
        Self::mint_loan_tokens(&env, borrower.clone(), amount);

        // Create loan
        let loan = Loan {
            borrower: borrower.clone(),
            amount,
            total_amount,
            interest_rate,
            num_payments,
            paid_payments: 0,
            payment_amount,
            created_at: env.ledger().timestamp() as i128,
            status: LoanStatus::Active as i32,
        };

        // Store loan after successful minting
        let loan_key = (symbol_short!("LOAN"), loan_id);
        env.storage()
            .persistent()
            .set(&loan_key, &loan);
        let borrower_key = (symbol_short!("BORROWER"), borrower.clone());
        env.storage()
            .persistent()
            .set(&borrower_key, &loan_id);

        loan_id
    }

    /// Helper to get max loan amount from credit scoring
    fn get_max_loan_amount(env: Env, user: Address) -> i128 {
        let credit_scoring_addr = Self::get_credit_scoring(&env);
        
        // Get max loan amount (this will return 0 if user has no score)
        let max_amount: i128 = env
            .invoke_contract(
                &credit_scoring_addr,
                &symbol_short!("max_loan"), // Shortened to fit 9 char limit
                soroban_sdk::vec![&env, user.into_val(&env)],
            );
        
        max_amount
    }

    /// Helper to mint loan tokens directly to borrower
    fn mint_loan_tokens(env: &Env, borrower: Address, amount: i128) {
        let token_address = Self::get_token_address(env);
        
        // Verify token contract is initialized
        // We can't directly check, but the invoke will fail if not initialized
        
        env.invoke_contract::<()>(
            &token_address,
            &symbol_short!("mint_loan"), // Shortened to fit 9 char limit
            soroban_sdk::vec![env, borrower.into_val(env), amount.into_val(env)],
        );
    }

    /// Pay a loan installment
    pub fn pay_installment(env: Env, borrower: Address, loan_id: u32) {
        borrower.require_auth();

        let loan_key = (symbol_short!("LOAN"), loan_id);
        let mut loan: Loan = env
            .storage()
            .persistent()
            .get(&loan_key)
            .expect("Loan not found");

        if loan.borrower != borrower {
            panic!("Not your loan");
        }

        if loan.status != LoanStatus::Active as i32 {
            panic!("Loan is not active");
        }

        if loan.paid_payments >= loan.num_payments {
            panic!("Loan already fully paid");
        }

        // Transfer payment from borrower
        let token_address = Self::get_token_address(&env);
        let token_client = soroban_sdk::token::Client::new(&env, &token_address);
        token_client.transfer(
            &borrower,
            &env.current_contract_address(),
            &loan.payment_amount,
        );

        // Tokens are already in the contract from the transfer above
        // No need to register repayment in pool (pool removed)

        // Update loan
        loan.paid_payments += 1;

        // Check if fully paid
        if loan.paid_payments >= loan.num_payments {
            loan.status = LoanStatus::Repaid as i32;
            // Reward user in credit scoring
            Self::reward_user(env.clone(), borrower.clone());
        }

        env.storage()
            .persistent()
            .set(&loan_key, &loan);
    }

    /// Helper to reward user in credit scoring
    fn reward_user(env: Env, user: Address) {
        let credit_scoring_addr = Self::get_credit_scoring(&env);
        // Reward with 10 points for successful loan repayment
        env.invoke_contract::<()>(
            &credit_scoring_addr,
            &symbol_short!("reward"), // Shortened to fit 9 char limit
            soroban_sdk::vec![&env, user.into_val(&env), 10i128.into_val(&env)],
        );
    }

    /// Get loan information
    pub fn get_loan(env: Env, loan_id: u32) -> Loan {
        let loan_key = (symbol_short!("LOAN"), loan_id);
        env.storage()
            .persistent()
            .get(&loan_key)
            .expect("Loan not found")
    }

    /// Get loan ID for a borrower
    pub fn get_loan_id(env: Env, borrower: Address) -> Option<u32> {
        let borrower_key = (symbol_short!("BORROWER"), borrower);
        env.storage()
            .persistent()
            .get(&borrower_key)
            .unwrap_or(None)
    }

    /// Get next loan ID
    fn get_next_loan_id(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&symbol_short!("LOAN_ID"))
            .unwrap_or(0)
    }

    /// Increment loan ID
    fn increment_loan_id(env: Env) {
        let current: u32 = Self::get_next_loan_id(env.clone());
        env.storage().instance().set(&symbol_short!("LOAN_ID"), &(current + 1));
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    #[test]
    fn test_loan_manager_init() {
        let env = Env::default();
        let contract_id = env.register_contract(None, LoanManagerMicro);
        let client = LoanManagerMicroClient::new(&env, &contract_id);

        // Create addresses
        let credit_scoring = Address::generate(&env);
        let token = Address::generate(&env);
        
        // Initialize (lending_pool was removed from the system)
        client.initialize(&credit_scoring, &token, &500);
    }
}

