import FungibleToken from 0xFungibleToken
import sFlowToken from 0xsFlowToken

pub fun main(account: Address): UFix64 {

    let vaultRef = getAccount(account)
        .getCapability(/public/sFlowTokenBalance)
        .borrow<&sFlowToken.Vault{FungibleToken.Balance}>()
        ?? panic("Could not borrow Balance reference to the Vault")

    return vaultRef.balance
}
