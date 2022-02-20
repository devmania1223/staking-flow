import sFlowToken from 0xsFlowToken
import sFlowStakingManager from 0xsFlowStakingManager
import FungibleToken from 0xFungibleToken
import FlowToken from 0xFlowToken

transaction(amount: UFix64) {
    
    var account: AuthAccount
    prepare(signer: AuthAccount) {
    self.account = signer
    }

    execute {
        let vaultRef = self.account.borrow<&sFlowToken.Vault>(from: /storage/sFlowTokenVault)
        ?? panic("Could not borrow reference to the owner's Vault!")
        let sFlowVault <- vaultRef.withdraw(amount: amount)

        // Deposit the withdrawn tokens in the recipient's receiver
        sFlowStakingManager.unstake(accountAddress: self.account.address, from: <-sFlowVault)
    }
}
