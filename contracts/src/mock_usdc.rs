use soroban_sdk::{
    contract, contractimpl, symbol_short, Address, Env, Symbol, String,
};

const ADMIN: Symbol = symbol_short!("ADMIN");
const NAME: Symbol = symbol_short!("NAME");
const SYMBOL: Symbol = symbol_short!("SYMBOL");
const DECIMALS: Symbol = symbol_short!("DECIMALS");

#[contract]
pub struct MockUSDC;

#[contractimpl]
impl MockUSDC {
    /// Initialize the mock token
    /// Creates 1 million tokens (1,000,000 * 10^decimals) and assigns them to the admin
    pub fn initialize(
        env: Env,
        admin: Address,
        name: String,
        symbol: String,
        decimals: u32,
    ) {
        if env.storage().instance().has(&ADMIN) {
            panic!("Already initialized");
        }
        
        env.storage().instance().set(&ADMIN, &admin);
        env.storage().instance().set(&NAME, &name);
        env.storage().instance().set(&SYMBOL, &symbol);
        env.storage().instance().set(&DECIMALS, &decimals);
        
        // Mint 1 million tokens to admin (1,000,000 * 10^decimals)
        let initial_supply = 1_000_000i128 * 10i128.pow(decimals);
        let balance_key = (symbol_short!("BALANCE"), admin.clone());
        env.storage()
            .persistent()
            .set(&balance_key, &initial_supply);
        env.storage()
            .instance()
            .set(&symbol_short!("TOTAL"), &initial_supply);
    }

    /// Get the admin
    fn get_admin(env: &Env) -> Address {
        env.storage()
            .instance()
            .get(&ADMIN)
            .expect("Not initialized")
    }

    /// Check if caller is admin
    fn require_admin(env: &Env) {
        let admin = Self::get_admin(env);
        admin.require_auth();
    }

    /// Get token name
    pub fn name(env: Env) -> String {
        env.storage()
            .instance()
            .get(&NAME)
            .expect("Not initialized")
    }

    /// Get token symbol
    pub fn symbol(env: Env) -> String {
        env.storage()
            .instance()
            .get(&SYMBOL)
            .expect("Not initialized")
    }

    /// Get token decimals
    pub fn decimals(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DECIMALS)
            .expect("Not initialized")
    }

    /// Get balance of an address
    pub fn balance(env: Env, address: Address) -> i128 {
        let balance_key = (symbol_short!("BALANCE"), address);
        env.storage()
            .persistent()
            .get(&balance_key)
            .unwrap_or(0)
    }

    /// Mint tokens (only admin, for testing purposes)
    pub fn mint(env: Env, to: Address, amount: i128) {
        Self::require_admin(&env);

        if amount <= 0 {
            panic!("Amount must be positive");
        }

        let balance_key = (symbol_short!("BALANCE"), to.clone());
        let current_balance: i128 = env
            .storage()
            .persistent()
            .get(&balance_key)
            .unwrap_or(0);

        let new_balance = current_balance + amount;
        env.storage()
            .persistent()
            .set(&balance_key, &new_balance);

        // Update total supply
        let total_supply: i128 = env
            .storage()
            .instance()
            .get(&symbol_short!("TOTAL"))
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&symbol_short!("TOTAL"), &(total_supply + amount));
    }

    /// Mint tokens for loan (can be called by authorized loan manager)
    /// This allows the loan manager to mint tokens directly when issuing loans
    pub fn mint_loan(env: Env, to: Address, amount: i128) {
        // Check if caller is authorized loan manager
        // For now, we'll allow any contract to call this (in production, add authorization)
        // This simulates the platform minting tokens for approved loans
        
        if amount <= 0 {
            panic!("mint_loan: Amount must be positive, got {}", amount);
        }

        // Verify contract is initialized
        if !env.storage().instance().has(&ADMIN) {
            panic!("mint_loan: MockUSDC contract not initialized. Please initialize the contract first.");
        }

        let balance_key = (symbol_short!("BALANCE"), to.clone());
        let current_balance: i128 = env
            .storage()
            .persistent()
            .get(&balance_key)
            .unwrap_or(0);

        // Check for overflow
        let new_balance = current_balance
            .checked_add(amount)
            .expect("mint_loan: Balance overflow");

        env.storage()
            .persistent()
            .set(&balance_key, &new_balance);

        // Update total supply
        let total_supply: i128 = env
            .storage()
            .instance()
            .get(&symbol_short!("TOTAL"))
            .unwrap_or(0);
        
        let new_total_supply = total_supply
            .checked_add(amount)
            .expect("mint_loan: Total supply overflow");
        
        env.storage()
            .instance()
            .set(&symbol_short!("TOTAL"), &new_total_supply);
    }

    /// Burn tokens (only admin, for testing purposes)
    pub fn burn(env: Env, from: Address, amount: i128) {
        Self::require_admin(&env);

        if amount <= 0 {
            panic!("Amount must be positive");
        }

        let balance_key = (symbol_short!("BALANCE"), from.clone());
        let current_balance: i128 = env
            .storage()
            .persistent()
            .get(&balance_key)
            .unwrap_or(0);

        if current_balance < amount {
            panic!("Insufficient balance");
        }

        let new_balance = current_balance - amount;
        env.storage()
            .persistent()
            .set(&balance_key, &new_balance);

        // Update total supply
        let total_supply: i128 = env
            .storage()
            .instance()
            .get(&symbol_short!("TOTAL"))
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&symbol_short!("TOTAL"), &(total_supply - amount));
    }

    /// Transfer tokens
    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();

        if amount <= 0 {
            panic!("Amount must be positive");
        }

        let from_balance_key = (symbol_short!("BALANCE"), from.clone());
        let to_balance_key = (symbol_short!("BALANCE"), to.clone());
        
        let from_balance: i128 = env
            .storage()
            .persistent()
            .get(&from_balance_key)
            .unwrap_or(0);

        if from_balance < amount {
            panic!("Insufficient balance");
        }

        let to_balance: i128 = env
            .storage()
            .persistent()
            .get(&to_balance_key)
            .unwrap_or(0);

        env.storage()
            .persistent()
            .set(&from_balance_key, &(from_balance - amount));
        env.storage()
            .persistent()
            .set(&to_balance_key, &(to_balance + amount));
    }

    /// Get total supply
    pub fn total_supply(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&symbol_short!("TOTAL"))
            .unwrap_or(0)
    }

    /// Approve spending (for compatibility with token interface)
    pub fn approve(env: Env, from: Address, spender: Address, amount: i128) {
        from.require_auth();

        if amount < 0 {
            panic!("Amount cannot be negative");
        }

        let allowance_key = (symbol_short!("ALLOWANCE"), (from, spender));
        env.storage()
            .persistent()
            .set(&allowance_key, &amount);
    }

    /// Get allowance
    pub fn allowance(env: Env, from: Address, spender: Address) -> i128 {
        let allowance_key = (symbol_short!("ALLOWANCE"), (from, spender));
        env.storage()
            .persistent()
            .get(&allowance_key)
            .unwrap_or(0)
    }

    /// Transfer from (using allowance)
    pub fn transfer_from(
        env: Env,
        spender: Address,
        from: Address,
        to: Address,
        amount: i128,
    ) {
        spender.require_auth();

        if amount <= 0 {
            panic!("Amount must be positive");
        }

        // Check allowance
        let allowance_key = (symbol_short!("ALLOWANCE"), (from.clone(), spender.clone()));
        let allowance_amount: i128 = env
            .storage()
            .persistent()
            .get(&allowance_key)
            .unwrap_or(0);

        if allowance_amount < amount {
            panic!("Insufficient allowance");
        }

        // Check balance
        let from_balance_key = (symbol_short!("BALANCE"), from.clone());
        let to_balance_key = (symbol_short!("BALANCE"), to.clone());
        
        let from_balance: i128 = env
            .storage()
            .persistent()
            .get(&from_balance_key)
            .unwrap_or(0);

        if from_balance < amount {
            panic!("Insufficient balance");
        }

        // Update balances
        let to_balance: i128 = env
            .storage()
            .persistent()
            .get(&to_balance_key)
            .unwrap_or(0);

        env.storage()
            .persistent()
            .set(&from_balance_key, &(from_balance - amount));
        env.storage()
            .persistent()
            .set(&to_balance_key, &(to_balance + amount));

        // Update allowance
        env.storage()
            .persistent()
            .set(&allowance_key, &(allowance_amount - amount));
    }

    /// Faucet function - allows any user to get test tokens
    /// Mints a fixed amount (1000 tokens with decimals) to the caller
    pub fn faucet(env: Env, to: Address) {
        let decimals: u32 = env
            .storage()
            .instance()
            .get(&DECIMALS)
            .expect("Not initialized");
        
        // Faucet amount: 1000 tokens (1000 * 10^decimals)
        let faucet_amount = 1_000i128 * 10i128.pow(decimals);
        
        let balance_key = (symbol_short!("BALANCE"), to.clone());
        let current_balance: i128 = env
            .storage()
            .persistent()
            .get(&balance_key)
            .unwrap_or(0);

        let new_balance = current_balance + faucet_amount;
        env.storage()
            .persistent()
            .set(&balance_key, &new_balance);

        // Update total supply
        let total_supply: i128 = env
            .storage()
            .instance()
            .get(&symbol_short!("TOTAL"))
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&symbol_short!("TOTAL"), &(total_supply + faucet_amount));
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{String, testutils::Address as _};

    #[test]
    fn test_mock_usdc() {
        let env = Env::default();
        let contract_id = env.register_contract(None, MockUSDC);
        let client = MockUSDCClient::new(&env, &contract_id);

        // Create admin
        let admin = Address::generate(&env);
        
        // Initialize
        client.initialize(
            &admin,
            &String::from_str(&env, "Mock USDC"),
            &String::from_str(&env, "USDC"),
            &6u32,
        );
        
        assert_eq!(client.name(), String::from_str(&env, "Mock USDC"));
        assert_eq!(client.symbol(), String::from_str(&env, "USDC"));
        assert_eq!(client.decimals(), 6);
        
        // Check that admin received 1 million tokens
        let decimals = 6u32;
        let expected_supply = 1_000_000i128 * 10i128.pow(decimals);
        assert_eq!(client.total_supply(), expected_supply);
        assert_eq!(client.balance(&admin), expected_supply);
        
        // Test faucet
        let user = Address::generate(&env);
        client.faucet(&user);
        let faucet_amount = 1_000i128 * 10i128.pow(decimals);
        assert_eq!(client.balance(&user), faucet_amount);
    }
}

