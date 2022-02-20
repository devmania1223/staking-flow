import sFlowStakingManager from 0xsFlowStakingManager

// This script reads the Vault balances of two accounts.
pub fun main(address: Address) : UFix64 {
    let amount = sFlowStakingManager.getCurrentUnstakeAmount(userAddress: address)
    return amount
}
