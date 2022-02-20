import sFlowStakingManager from 0xsFlowStakingManager

// This script reads the Vault balances of two accounts.
pub fun main() : UFix64 {
    let price = sFlowStakingManager.getCurrentPrice()
    return price
}
