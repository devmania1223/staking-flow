import sFlowToken2 from 0x44886dbbf20e893c
import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868
import FlowStakingCollection from 0x95e019a17d0e23d7
import FlowIDTableStaking from 0x9eca2b38b18b5dfe
import FlowServiceAccount from 0x8c5303eaa26202d6
import LockedTokens from 0x95e019a17d0e23d7

pub contract sFlowStakingManager7 {

    /// Unstaking Request List
    access(contract) var unstakeList: [{String: AnyStruct}]

    pub fun stake(from: @FungibleToken.Vault) : @sFlowToken2.Vault {
        let vault <- from as! @FlowToken.Vault
        let currentPrice: UFix64 = self.getCurrentPrice()
        let amount: UFix64 = vault.balance / currentPrice


        let managerFlowVault =  self.account
            .borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow Manager's Flow Vault")
        managerFlowVault.deposit(from: <-vault)

        let managerMinterVault =  self.account
            .borrow<&sFlowToken2.Minter>(from: /storage/sFlowToken2Minter)
            ?? panic("Could not borrow Manager's Minter Vault")
        return <- managerMinterVault.mintTokens(amount: amount);
    }

    pub fun unstake(accountAddress: Address, from: @FungibleToken.Vault) {
        self.unstakeList.append({"address": accountAddress, "amount": from.balance});
        let managersFlowToken2Vault =  self.account
            .borrow<&sFlowToken2.Vault>(from: /storage/sFlowToken2Vault)
            ?? panic("Could not borrow Manager's Minter Vault")
        managersFlowToken2Vault.deposit(from: <-from)
    }

    init() {
        self.unstakeList = []
    }

    pub fun getCurrentPoolAmount() : UFix64{
        let vaultRef = self.account
            .getCapability(/public/flowTokenBalance)
            .borrow<&FlowToken.Vault{FungibleToken.Balance}>()
            ?? panic("Could not borrow Balance reference to the Vault")
    
        return vaultRef.balance
    }

    pub fun getDelegatorInfo() : [FlowIDTableStaking.DelegatorInfo]{
        let delegatingInfo = FlowStakingCollection.getAllDelegatorInfo(address: self.account.address);
        if delegatingInfo.length == 0 {
            panic("No Delegating Information")
        }
        return delegatingInfo
    }

    pub fun getCurrentPrice() : UFix64{
        let amountInPool = self.getCurrentPoolAmount()

        let delegatingInfo = self.getDelegatorInfo()

        let amountInStaking = delegatingInfo[0].tokensCommitted +
            delegatingInfo[0].tokensStaked +
            delegatingInfo[0].tokensUnstaking +
            delegatingInfo[0].tokensRewarded +
            delegatingInfo[0].tokensUnstaked;

        return (amountInPool + amountInStaking)/sFlowToken2.totalSupply
    }

    pub fun manageCollection(){
        var requiredStakedAmount:UFix64 = 0.0
        var index = 0
        for unstakeTicket in self.unstakeList {
            let tempAddress : AnyStruct = unstakeTicket["address"]!
            let accountAddress : Address = tempAddress as! Address
            let accountStaker = getAccount(accountAddress)
            let tempAmount : AnyStruct = unstakeTicket["amount"]!
            let amount : UFix64 = tempAmount as! UFix64

            let requiredFlow = amount * self.getCurrentPrice();
            if (self.getCurrentPoolAmount() > requiredFlow + 10.1)
            {
                let providerRef =  self.account
                    .borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
                    ?? panic("Could not borrow provider reference to the provider's Vault")

                // Deposit the withdrawn tokens in the provider's receiver
                let sentVault: @FungibleToken.Vault <- providerRef.withdraw(amount: requiredFlow)

                let receiverRef =  accountStaker
                    .getCapability(/public/flowTokenReceiver)
                    .borrow<&{FungibleToken.Receiver}>()
                    ?? panic("Could not borrow receiver reference to the recipient's Vault")
                receiverRef.deposit(from: <-sentVault)

                let managersFlowToken2Vault =  self.account
                    .borrow<&sFlowToken2.Vault>(from: /storage/sFlowToken2Vault)
                    ?? panic("Could not borrow provider reference to the provider's Vault")

                // Deposit the withdrawn tokens in the provider's receiver
                let burningVault: @FungibleToken.Vault <- managersFlowToken2Vault.withdraw(amount: requiredFlow)

                let managersFlowToken2BurnerVault =  self.account
                    .borrow<&sFlowToken2.Burner>(from: /storage/sFlowToken2Burner)
                    ?? panic("Could not borrow provider reference to the provider's Vault")

                managersFlowToken2BurnerVault.burnTokens(from: <- burningVault)

                self.unstakeList.remove(at: index)
                continue
            }
            requiredStakedAmount = requiredStakedAmount + requiredFlow
            index = index + 1
        }

        if( requiredStakedAmount > 0.0 ){
            requiredStakedAmount = requiredStakedAmount + 10.1 - self.getCurrentPoolAmount()
            let delegatingInfo = self.getDelegatorInfo()
            if( delegatingInfo[0].tokensUnstaked > 0.0 ) {
                let stakingCollectionRef: &FlowStakingCollection.StakingCollection = self.account.borrow<&FlowStakingCollection.StakingCollection>(from: FlowStakingCollection.StakingCollectionStoragePath)
                    ?? panic("Could not borrow ref to StakingCollection")
                var amount: UFix64 = 0.0
                if(delegatingInfo[0].tokensUnstaked >= requiredStakedAmount)
                {
                    amount = requiredStakedAmount                    
                } else {
                    amount = delegatingInfo[0].tokensUnstaked
                }
                stakingCollectionRef.withdrawUnstakedTokens(nodeID: "4d617820576f6c74657200ff6e729e24d35ee1aa0a76bc05746f8c99879e8eaf", delegatorID: 1, amount: amount)
                requiredStakedAmount = requiredStakedAmount - amount
            }
        }

        if( requiredStakedAmount > 0.0 ){
            let delegatingInfo = self.getDelegatorInfo()
            if( delegatingInfo[0].tokensRewarded > 0.0 ) {
                let stakingCollectionRef: &FlowStakingCollection.StakingCollection = self.account.borrow<&FlowStakingCollection.StakingCollection>(from: FlowStakingCollection.StakingCollectionStoragePath)
                    ?? panic("Could not borrow ref to StakingCollection")
                var amount: UFix64 = 0.0
                if(delegatingInfo[0].tokensRewarded >= requiredStakedAmount)
                {
                    amount = requiredStakedAmount                    
                } else {
                    amount = delegatingInfo[0].tokensRewarded
                }
                stakingCollectionRef.withdrawRewardedTokens(nodeID: "4d617820576f6c74657200ff6e729e24d35ee1aa0a76bc05746f8c99879e8eaf", delegatorID: 1, amount: amount)
                requiredStakedAmount = requiredStakedAmount - amount
            }
        }

        if( requiredStakedAmount > 0.0 ){
            let delegatingInfo = self.getDelegatorInfo()
            let amount: UFix64 = requiredStakedAmount - delegatingInfo[0].tokensUnstaking

            let stakingCollectionRef: &FlowStakingCollection.StakingCollection = self.account.borrow<&FlowStakingCollection.StakingCollection>(from: FlowStakingCollection.StakingCollectionStoragePath)
                ?? panic("Could not borrow ref to StakingCollection")
            stakingCollectionRef.requestUnstaking(nodeID: "4d617820576f6c74657200ff6e729e24d35ee1aa0a76bc05746f8c99879e8eaf", delegatorID: 1, amount: amount)
        }

        if( requiredStakedAmount < 0.1){
            let delegatingInfo = self.getDelegatorInfo()
            let stakingCollectionRef: &FlowStakingCollection.StakingCollection = self.account.borrow<&FlowStakingCollection.StakingCollection>(from: FlowStakingCollection.StakingCollectionStoragePath)
                ?? panic("Could not borrow ref to StakingCollection")
            stakingCollectionRef.stakeUnstakedTokens(nodeID: "4d617820576f6c74657200ff6e729e24d35ee1aa0a76bc05746f8c99879e8eaf", delegatorID: 1, amount: delegatingInfo[0].tokensUnstaked)
            stakingCollectionRef.stakeRewardedTokens(nodeID: "4d617820576f6c74657200ff6e729e24d35ee1aa0a76bc05746f8c99879e8eaf", delegatorID: 1, amount: delegatingInfo[0].tokensRewarded)

            if(self.getCurrentPoolAmount() > 10.1){
                stakingCollectionRef.stakeNewTokens(nodeID: "4d617820576f6c74657200ff6e729e24d35ee1aa0a76bc05746f8c99879e8eaf", delegatorID: 1, amount: (self.getCurrentPoolAmount() - 10.1))
            }
        }
    }
}