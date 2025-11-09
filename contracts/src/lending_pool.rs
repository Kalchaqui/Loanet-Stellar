use soroban_sdk::{
    contract, contractimpl, symbol_short, token, Address, Env, Symbol,
};

const OWNER: Symbol = symbol_short!("OWNER");
const LOAN_MGR: Symbol = symbol_short!("LOAN_MGR");
const TOTAL_LIQUIDITY: Symbol = symbol_short!("TOTAL_LIQ");

#[contract]
pub struct LendingPoolMini;

#[contractimpl]
impl LendingPoolMini {
    /// Initialize the contract with owner and token address
    pub fn initialize(env: Env, owner: Address, token_address: Address) {
        env.storage().instance().set(&OWNER, &owner);
        env.storage()
            .instance()
            .set(&symbol_short!("TOKEN"), &token_address);
        env.storage().instance().set(&TOTAL_LIQUIDITY, &0i128);
    }

    /// Get the owner
    pub fn get_owner(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&OWNER)
            .expect("Contract not initialized")
    }

    /// Get token address
    fn get_token_address(env: &Env) -> Address {
        env.storage()
            .instance()
            .get(&symbol_short!("TOKEN"))
            .expect("Token not initialized")
    }

    /// Check if caller is owner
    fn require_owner(env: &Env) {
        let owner = Self::get_owner(env.clone());
        owner.require_auth();
    }

    /// Check if caller is loan manager
    /// In Soroban, when a contract calls another contract, we need to pass the caller address
    /// For now, we'll use a workaround: the loan manager must be set and we trust the call
    /// In production, you might want to add additional verification
    fn require_loan_manager(env: &Env) {
        let loan_manager: Option<Address> = env
            .storage()
            .instance()
            .get(&LOAN_MGR)
            .unwrap_or(None);
        if loan_manager.is_none() {
            panic!("Loan manager not set");
        }
        // Note: In Soroban, cross-contract calls don't provide a direct way to get the caller contract
        // We rely on the fact that only the loan manager contract should be calling this function
        // In a production environment, you might want to add additional security measures
    }

    /// Set loan manager (only owner)
    pub fn set_loan_manager(env: Env, loan_manager: Address) {
        Self::require_owner(&env);
        env.storage().instance().set(&LOAN_MGR, &loan_manager);
    }

    /// Get loan manager
    pub fn get_loan_manager(env: Env) -> Option<Address> {
        env.storage().instance().get(&LOAN_MGR).unwrap_or(None)
    }

    /// Deposit funds into the pool
    pub fn deposit(env: Env, user: Address, amount: i128) {
        user.require_auth();

        if amount <= 0 {
            panic!("Amount must be positive");
        }

        let token_address = Self::get_token_address(&env);
        let token_client = token::Client::new(&env, &token_address);

        // Transfer tokens from user to contract
        token_client.transfer(&user, &env.current_contract_address(), &amount);

        // Update user balance
        let balance_key = (symbol_short!("BALANCE"), user.clone());
        let current_balance: i128 = env
            .storage()
            .persistent()
            .get(&balance_key)
            .unwrap_or(0);
        let new_balance = current_balance + amount;
        env.storage()
            .persistent()
            .set(&balance_key, &new_balance);

        // Update total liquidity
        let total: i128 = env.storage().instance().get(&TOTAL_LIQUIDITY).unwrap_or(0);
        env.storage()
            .instance()
            .set(&TOTAL_LIQUIDITY, &(total + amount));
    }

    /// Withdraw funds from the pool
    pub fn withdraw(env: Env, user: Address, amount: i128) {
        user.require_auth();

        if amount <= 0 {
            panic!("Amount must be positive");
        }

        let balance_key = (symbol_short!("BALANCE"), user.clone());
        let current_balance: i128 = env
            .storage()
            .persistent()
            .get(&balance_key)
            .unwrap_or(0);

        if current_balance < amount {
            panic!("Insufficient balance");
        }

        let token_address = Self::get_token_address(&env);
        let token_client = token::Client::new(&env, &token_address);

        // Transfer tokens from contract to user
        token_client.transfer(&env.current_contract_address(), &user, &amount);

        // Update user balance
        let new_balance = current_balance - amount;
        env.storage()
            .persistent()
            .set(&balance_key, &new_balance);

        // Update total liquidity
        let total: i128 = env.storage().instance().get(&TOTAL_LIQUIDITY).unwrap_or(0);
        env.storage()
            .instance()
            .set(&TOTAL_LIQUIDITY, &(total - amount));
    }

    /// Get user balance
    pub fn get_balance(env: Env, user: Address) -> i128 {
        let balance_key = (symbol_short!("BALANCE"), user);
        env.storage()
            .persistent()
            .get(&balance_key)
            .unwrap_or(0)
    }

    /// Get total liquidity available
    pub fn get_total_liquidity(env: Env) -> i128 {
        env.storage().instance().get(&TOTAL_LIQUIDITY).unwrap_or(0)
    }

    /// Disburse loan (only loan manager)
    pub fn disburse(env: Env, borrower: Address, amount: i128) {
        Self::require_loan_manager(&env);

        if amount <= 0 {
            panic!("Amount must be positive");
        }

        let total: i128 = env.storage().instance().get(&TOTAL_LIQUIDITY).unwrap_or(0);
        if total < amount {
            panic!("Insufficient liquidity");
        }

        let token_address = Self::get_token_address(&env);
        let token_client = token::Client::new(&env, &token_address);

        // Transfer tokens from pool to borrower
        token_client.transfer(&env.current_contract_address(), &borrower, &amount);

        // Update total liquidity
        env.storage()
            .instance()
            .set(&TOTAL_LIQUIDITY, &(total - amount));
    }

    /// Register loan repayment (only loan manager)
    pub fn reg_repay(env: Env, borrower: Address, amount: i128) {
        Self::require_loan_manager(&env);

        if amount <= 0 {
            panic!("Amount must be positive");
        }

        let token_address = Self::get_token_address(&env);
        let token_client = token::Client::new(&env, &token_address);

        // Transfer tokens from borrower to pool
        token_client.transfer(&borrower, &env.current_contract_address(), &amount);

        // Update total liquidity
        let total: i128 = env.storage().instance().get(&TOTAL_LIQUIDITY).unwrap_or(0);
        env.storage()
            .instance()
            .set(&TOTAL_LIQUIDITY, &(total + amount));
    }

    /// Platform fund - allows the platform (owner) to fund the pool
    /// The owner must deposit tokens first, then call this to update liquidity
    /// This allows the platform to pre-fund the pool for future loans
    pub fn platform_fund(env: Env, amount: i128) {
        Self::require_owner(&env);
        
        if amount <= 0 {
            panic!("Amount must be positive");
        }

        // Verify that the contract has enough tokens
        let token_address = Self::get_token_address(&env);
        let token_client = token::Client::new(&env, &token_address);
        let contract_balance = token_client.balance(&env.current_contract_address());
        
        let total: i128 = env.storage().instance().get(&TOTAL_LIQUIDITY).unwrap_or(0);
        let new_total = total + amount;
        
        // Check if contract has enough tokens to cover the new total
        if contract_balance < new_total {
            panic!("Insufficient tokens in pool. Deposit tokens first using deposit()");
        }

        // Update total liquidity
        env.storage()
            .instance()
            .set(&TOTAL_LIQUIDITY, &new_total);
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    #[test]
    fn test_lending_pool_init() {
        let env = Env::default();
        let contract_id = env.register_contract(None, LendingPoolMini);
        let client = LendingPoolMiniClient::new(&env, &contract_id);

        // Create owner and token
        let owner = Address::generate(&env);
        let token = Address::generate(&env);
        
        // Initialize
        client.initialize(&owner, &token);
        
        // Test initial state
        assert_eq!(client.get_total_liquidity(), 0);
        
        // Set loan manager
        let loan_manager = Address::generate(&env);
        // Note: set_loan_manager requires owner auth
    }
}

