use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol};

#[derive(Clone)]
#[contracttype]
pub struct CreditScore {
    pub score: i128,
    pub max_loan_amount: i128,
    pub blacklisted: bool,
}

const OWNER: Symbol = symbol_short!("OWNER");
const INITIAL_SCORE: i128 = 300;
// Ratio: 1000 USDC (1,000,000,000 smallest units with 6 decimals) / 300 score = 3,333,333
// This means: 1 score point = 3,333,333 smallest units = 3.333333 USDC
// So 300 score = 1,000,000,000 smallest units = 1000 USDC
const SCORE_TO_AMOUNT_RATIO: i128 = 3_333_333;

#[contract]
pub struct CreditScoringMini;

#[contractimpl]
impl CreditScoringMini {
    /// Initialize the contract with an owner
    pub fn initialize(env: Env, owner: Address) {
        env.storage().instance().set(&OWNER, &owner);
    }

    /// Get the owner of the contract
    pub fn get_owner(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&OWNER)
            .expect("Contract not initialized")
    }

    /// Check if caller is owner
    fn require_owner(env: &Env) {
        let owner = Self::get_owner(env.clone());
        owner.require_auth();
    }

    /// Initialize credit score for a new user
    /// Note: The platform (owner) must deposit funds into the lending pool separately
    /// This function only initializes the credit score
    pub fn initialize_user(env: Env, user: Address) {
        if Self::has_score(env.clone(), user.clone()) {
            panic!("User already has a credit score");
        }

        let max_loan_amount = INITIAL_SCORE * SCORE_TO_AMOUNT_RATIO;

        let score = CreditScore {
            score: INITIAL_SCORE,
            max_loan_amount,
            blacklisted: false,
        };

        let score_key = (symbol_short!("SCORE"), user.clone());
        env.storage()
            .persistent()
            .set(&score_key, &score);
    }

    /// Check if user has a credit score
    pub fn has_score(env: Env, user: Address) -> bool {
        let score_key = (symbol_short!("SCORE"), user);
        env.storage()
            .persistent()
            .has(&score_key)
    }

    /// Get credit score
    fn get_score_internal(env: &Env, user: &Address) -> CreditScore {
        let score_key = (symbol_short!("SCORE"), user.clone());
        env.storage()
            .persistent()
            .get(&score_key)
            .expect("Credit score not found")
    }

    /// Get credit score (public)
    pub fn get_score(env: Env, user: Address) -> CreditScore {
        Self::get_score_internal(&env, &user)
    }

    /// Get score value
    pub fn get_score_value(env: Env, user: Address) -> i128 {
        let score = Self::get_score(env, user);
        score.score
    }

    /// Get max loan amount
    /// Returns 0 if user has no score (not initialized)
    pub fn max_loan(env: Env, user: Address) -> i128 {
        if !Self::has_score(env.clone(), user.clone()) {
            return 0;
        }
        let score = Self::get_score(env, user);
        score.max_loan_amount
    }

    /// Check if user is blacklisted
    pub fn is_blk(env: Env, user: Address) -> bool {
        if !Self::has_score(env.clone(), user.clone()) {
            return false;
        }
        let score = Self::get_score(env, user);
        score.blacklisted
    }

    /// Reward user (increase score)
    pub fn reward(env: Env, user: Address, points: i128) {
        Self::require_owner(&env);

        if points <= 0 {
            panic!("Points must be positive");
        }

        let mut score = Self::get_score_internal(&env, &user);
        score.score += points;
        score.max_loan_amount = score.score * SCORE_TO_AMOUNT_RATIO;

        let score_key = (symbol_short!("SCORE"), user.clone());
        env.storage()
            .persistent()
            .set(&score_key, &score);
    }

    /// Penalize user (decrease score and potentially blacklist)
    pub fn penalize_user(env: Env, user: Address, points: i128) {
        Self::require_owner(&env);

        if points <= 0 {
            panic!("Points must be positive");
        }

        let mut score = Self::get_score_internal(&env, &user);
        score.score -= points;

        // Blacklist if score goes below 0
        if score.score < 0 {
            score.score = 0;
            score.blacklisted = true;
        }

        score.max_loan_amount = score.score * SCORE_TO_AMOUNT_RATIO;

        let score_key = (symbol_short!("SCORE"), user.clone());
        env.storage()
            .persistent()
            .set(&score_key, &score);
    }

    /// Transfer ownership of the contract
    pub fn transfer_ownership(env: Env, new_owner: Address) {
        Self::require_owner(&env);
        env.storage().instance().set(&OWNER, &new_owner);
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    #[test]
    fn test_credit_scoring() {
        let env = Env::default();
        let contract_id = env.register_contract(None, CreditScoringMini);
        let client = CreditScoringMiniClient::new(&env, &contract_id);

        // Create owner
        let owner = Address::generate(&env);
        
        // Initialize
        client.initialize(&owner);
        
        // Initialize user
        let user = Address::generate(&env);
        client.initialize_user(&user);
        
        assert_eq!(client.get_score_value(&user), 300);
        assert_eq!(client.max_loan(&user), 30000);
        assert_eq!(client.is_blk(&user), false);
        
        // Note: reward_user and penalize_user require owner auth
        // In real test, you'd need to set owner as invoker
    }
}

