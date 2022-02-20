import sFlowToken from 0xsFlowToken
import sFlowStakingManager from 0xsFlowStakingManager
import FungibleToken from 0xFungibleToken
import FlowToken from 0xFlowToken

transaction(amount: UFix64) {

    // The Vault resource that holds the tokens that are being transferred
    let sentVault: @FungibleToken.Vault
    let account: AuthAccount
    prepare(signer: AuthAccount) {

        // Get a reference to the signer's stored vault
        let vaultRef = signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
    ?? panic("Could not borrow reference to the owner's Vault!")

        // Withdraw tokens from the signer's stored vault
        self.sentVault <- vaultRef.withdraw(amount: amount)

        self.account = signer
    }

    execute {
        // Deposit the withdrawn tokens in the recipient's receiver
        let sFlowVault <- sFlowStakingManager.stake(from: <-self.sentVault)

        let vaultRef = self.account.borrow<&sFlowToken.Vault>(from: /storage/sFlowTokenVault)
        ?? panic("Could not borrow reference to the owner's Vault!")
        vaultRef.deposit(from: <- sFlowVault)
    }
}
