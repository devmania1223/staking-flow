import sFlowToken from 0xsFlowToken
import FungibleToken from 0xFungibleToken

// This script reads the Vault balances of two accounts.
pub fun main(accountAddress: Address) : Bool {
    // Get the accounts' public account objects
    let account = getAccount(accountAddress)

    let accountRef = account
    .getCapability(/public/sFlowTokenReceiver)
    .borrow<&{FungibleToken.Receiver}>()

    if accountRef == nil {
        return false
    }
    return true
}
