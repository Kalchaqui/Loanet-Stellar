#![cfg(test)]
use super::{Counter, CounterClient};
use soroban_sdk::{symbol_short, Env};

#[test]
fn test() {
    let env = Env::default();
    let contract_id = env.register_contract(None, Counter);
    let client = CounterClient::new(&env, &contract_id);

    client.initialize(&0);
    assert_eq!(client.get_value(), 0);

    client.increment();
    assert_eq!(client.get_value(), 1);

    client.increment();
    assert_eq!(client.get_value(), 2);

    client.decrement();
    assert_eq!(client.get_value(), 1);

    client.reset();
    assert_eq!(client.get_value(), 0);
}

