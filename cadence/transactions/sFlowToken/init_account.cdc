import sFlowToken from 0xsFlowToken
import FungibleToken from 0xFungibleToken

transaction {
    prepare(account: AuthAccount) {
    // Only initialize the account if it hasn't already been initialized
    if account
    .getCapability(/public/sFlowTokenReceiver)
    .borrow<&{FungibleToken.Receiver}>() == nil {
        // Store the vault in the account storage
        account.save<@sFlowToken.Vault>(<-sFlowToken.createEmptyVault(), to: /storage/sFlowTokenVault)
    
        log("Empty Vault stored")
    
        // Create a public Receiver capability to the Vault
        let ReceiverRef1 = account.link<&sFlowToken.Vault{FungibleToken.Receiver}>(/public/sFlowTokenReceiver, target: /storage/sFlowTokenVault)

        // Create a public Balance capability to the Vault
        let BalanceRef = account.link<&sFlowToken.Vault{FungibleToken.Balance}>(/public/sFlowTokenBalance, target: /storage/sFlowTokenVault)

        log("References created")            }
    }
}
