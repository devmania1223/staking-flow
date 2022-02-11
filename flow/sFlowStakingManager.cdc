import sFlowToken2 from 0x44886dbbf20e893c
import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868
import FlowStakingCollection from 0x95e019a17d0e23d7
import FlowIDTableStaking from 0x9eca2b38b18b5dfe
import FlowServiceAccount from 0x8c5303eaa26202d6
import LockedTokens from 0x95e019a17d0e23d7

pub contract sFlowStakingManager13 {

    /// Unstaking Request List
    access(contract) var unstakeList: [{String: AnyStruct}]
    access(contract) var nodeID: String
    access(contract) var delegatorID: UInt32
    access(contract) var prevNodeID: String
    access(contract) var prevDelegatorID: UInt32

    pub fun getCurrentUnstakeAmount(userAddress: Address) : UFix64 {
        var requestedUnstakeAmount:UFix64 = 0.0
        for unstakeTicket in sFlowStakingManager13.unstakeList {
            let tempAddress : AnyStruct = unstakeTicket["address"]!
            let accountAddress : Address = tempAddress as! Address
            let accountStaker = getAccount(accountAddress)
            let tempAmount : AnyStruct = unstakeTicket["amount"]!
            let amount : UFix64 = tempAmount as! UFix64

            if(userAddress == accountAddress){
                requestedUnstakeAmount = requestedUnstakeAmount + amount
            }
        }
        return requestedUnstakeAmount
    }

    pub fun getCurrentPoolAmount() : UFix64{
        let vaultRef = self.account
            .getCapability(/public/flowTokenBalance)
            .borrow<&FlowToken.Vault{FungibleToken.Balance}>()
            ?? panic("Could not borrow Balance reference to the Vault")
    
        return vaultRef.balance
    }

    pub fun getDelegatorInfo() : FlowIDTableStaking.DelegatorInfo{
        let delegatingInfo = FlowStakingCollection.getAllDelegatorInfo(address: self.account.address);
        if delegatingInfo.length == 0 {
            panic("No Delegating Information")
        }
        for info in delegatingInfo {
            if (info.nodeID == self.nodeID && info.id == self.delegatorID){
                return info
            }
        }
        panic("No Delegating Information")
    }

    pub fun getPrevDelegatorInfo() : FlowIDTableStaking.DelegatorInfo{
        if(self.prevNodeID == "") {
            panic("No Prev Delegating Information")
        }

        let delegatingInfo = FlowStakingCollection.getAllDelegatorInfo(address: self.account.address);
        if delegatingInfo.length == 0 {
            panic("No Prev Delegating Information")
        }
        for info in delegatingInfo {
            if (info.nodeID == self.prevNodeID && info.id == self.prevDelegatorID)
            {
                return info
            }
        }
        panic("No Prev Delegating Information")
    }

    pub fun getCurrentPrice() : UFix64{
        let amountInPool = self.getCurrentPoolAmount()

        let delegatingInfo = self.getDelegatorInfo()

        let amountInStaking = delegatingInfo.tokensCommitted +
            delegatingInfo.tokensStaked +
            delegatingInfo.tokensUnstaking +
            delegatingInfo.tokensRewarded +
            delegatingInfo.tokensUnstaked;

        return (amountInPool + amountInStaking)/sFlowToken2.totalSupply
    }

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

    pub fun createInstance() : @Instance {
        return <- create Instance()
    }

    pub resource interface setManagerCapability {
        pub fun setCapability(cap: Capability<&Manager>)
        pub fun setNewDelegator(nodeID: String, delegatorID: UInt32)
    }

    pub resource interface InstanceInterface {
        pub fun setNewDelegator(nodeID: String, delegatorID: UInt32)
        pub fun manageCollection()
    }

    pub resource Instance : InstanceInterface, setManagerCapability {
        access(self) var managerCapability: Capability<&Manager>?
        
        init() {
            self.managerCapability = nil
        }

        pub fun setCapability(cap: Capability<&Manager>) {
            pre {
                cap.borrow() != nil: "Invalid manager capability"
            }
            self.managerCapability = cap
        }

        pub fun setNewDelegator(nodeID: String, delegatorID: UInt32){
            pre {
                self.managerCapability != nil: 
                    "Cannot manage staking until the manger capability not set"
            }
            
            let managerRef = self.managerCapability!.borrow()!

            managerRef.setNewDelegator(nodeID: nodeID, delegatorID: delegatorID)
        }

        pub fun manageCollection(){
            pre {
                self.managerCapability != nil: 
                    "Cannot manage staking until the manger capability not set"
            }
            
            let managerRef = self.managerCapability!.borrow()!

            managerRef.manageCollection()
        }
    }

    pub resource Manager {
        init() {
            
        }

        pub fun setNewDelegator(nodeID: String, delegatorID: UInt32){
            if(nodeID == sFlowStakingManager13.nodeID){
                panic("Node id is same")
            }

            sFlowStakingManager13.prevNodeID = sFlowStakingManager13.nodeID
            sFlowStakingManager13.prevDelegatorID = sFlowStakingManager13.delegatorID
            sFlowStakingManager13.nodeID = nodeID
            sFlowStakingManager13.delegatorID = delegatorID
        }

        pub fun manageCollection(){
            var requiredStakedAmount:UFix64 = 0.0
            var index = 0
            for unstakeTicket in sFlowStakingManager13.unstakeList {
                let tempAddress : AnyStruct = unstakeTicket["address"]!
                let accountAddress : Address = tempAddress as! Address
                let accountStaker = getAccount(accountAddress)
                let tempAmount : AnyStruct = unstakeTicket["amount"]!
                let amount : UFix64 = tempAmount as! UFix64

                let requiredFlow = amount * sFlowStakingManager13.getCurrentPrice();
                if (sFlowStakingManager13.getCurrentPoolAmount() > requiredFlow + 10.0)
                {
                    let providerRef =  sFlowStakingManager13.account
                        .borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
                        ?? panic("Could not borrow provider reference to the provider's Vault")

                    // Deposit the withdrawn tokens in the provider's receiver
                    let sentVault: @FungibleToken.Vault <- providerRef.withdraw(amount: requiredFlow)

                    let receiverRef =  accountStaker
                        .getCapability(/public/flowTokenReceiver)
                        .borrow<&{FungibleToken.Receiver}>()
                        ?? panic("Could not borrow receiver reference to the recipient's Vault")
                    receiverRef.deposit(from: <-sentVault)

                    let managersFlowToken2Vault =  sFlowStakingManager13.account
                        .borrow<&sFlowToken2.Vault>(from: /storage/sFlowToken2Vault)
                        ?? panic("Could not borrow provider reference to the provider's Vault")

                    // Deposit the withdrawn tokens in the provider's receiver
                    let burningVault: @FungibleToken.Vault <- managersFlowToken2Vault.withdraw(amount: amount)

                    let managersFlowToken2BurnerVault =  sFlowStakingManager13.account
                        .borrow<&sFlowToken2.Burner>(from: /storage/sFlowToken2Burner)
                        ?? panic("Could not borrow provider reference to the provider's Vault")

                    managersFlowToken2BurnerVault.burnTokens(from: <- burningVault)

                    sFlowStakingManager13.unstakeList.remove(at: index)
                    continue
                }
                requiredStakedAmount = requiredStakedAmount + requiredFlow
                index = index + 1
            }

            var bStakeNew : Bool = true

            if( requiredStakedAmount > 0.0 ){
                requiredStakedAmount = requiredStakedAmount + 10.1 - sFlowStakingManager13.getCurrentPoolAmount()
                let delegatingInfo = sFlowStakingManager13.getDelegatorInfo()
                if( delegatingInfo.tokensUnstaked > 0.0 ) {
                    let stakingCollectionRef: &FlowStakingCollection.StakingCollection = sFlowStakingManager13.account.borrow<&FlowStakingCollection.StakingCollection>(from: FlowStakingCollection.StakingCollectionStoragePath)
                        ?? panic("Could not borrow ref to StakingCollection")
                    var amount: UFix64 = 0.0
                    if(delegatingInfo.tokensUnstaked >= requiredStakedAmount)
                    {
                        amount = requiredStakedAmount                    
                    } else {
                        amount = delegatingInfo.tokensUnstaked
                    }
                    stakingCollectionRef.withdrawUnstakedTokens(nodeID: sFlowStakingManager13.nodeID, delegatorID: sFlowStakingManager13.delegatorID, amount: amount)
                    requiredStakedAmount = requiredStakedAmount - amount
                    bStakeNew = false
                }
            }

            if( requiredStakedAmount > 0.0 ){
                let delegatingInfo = sFlowStakingManager13.getDelegatorInfo()
                if( delegatingInfo.tokensRewarded > 0.0 ) {
                    let stakingCollectionRef: &FlowStakingCollection.StakingCollection = sFlowStakingManager13.account.borrow<&FlowStakingCollection.StakingCollection>(from: FlowStakingCollection.StakingCollectionStoragePath)
                        ?? panic("Could not borrow ref to StakingCollection")
                    var amount: UFix64 = 0.0
                    if(delegatingInfo.tokensRewarded >= requiredStakedAmount)
                    {
                        amount = requiredStakedAmount                    
                    } else {
                        amount = delegatingInfo.tokensRewarded
                    }
                    stakingCollectionRef.withdrawRewardedTokens(nodeID: sFlowStakingManager13.nodeID, delegatorID: sFlowStakingManager13.delegatorID, amount: amount)
                    requiredStakedAmount = requiredStakedAmount - amount
                    bStakeNew = false
                }
            }

            if( requiredStakedAmount > 0.0 ){
                let delegatingInfo = sFlowStakingManager13.getDelegatorInfo()
                if( delegatingInfo.tokensCommitted > 0.0 ) {
                    let stakingCollectionRef: &FlowStakingCollection.StakingCollection = sFlowStakingManager13.account.borrow<&FlowStakingCollection.StakingCollection>(from: FlowStakingCollection.StakingCollectionStoragePath)
                        ?? panic("Could not borrow ref to StakingCollection")
                    var amount: UFix64 = 0.0
                    if(delegatingInfo.tokensCommitted >= requiredStakedAmount)
                    {
                        amount = requiredStakedAmount                    
                    } else {
                        amount = delegatingInfo.tokensCommitted
                    }
                    stakingCollectionRef.requestUnstaking(nodeID: sFlowStakingManager13.nodeID, delegatorID: sFlowStakingManager13.delegatorID, amount: amount)
                    requiredStakedAmount = requiredStakedAmount - amount
                    bStakeNew = false
                }
            }

            if( requiredStakedAmount > 0.0 ){
                let delegatingInfo = sFlowStakingManager13.getDelegatorInfo()
                if(delegatingInfo.tokensUnstaking + delegatingInfo.tokensRequestedToUnstake < requiredStakedAmount){
                    let amount: UFix64 = requiredStakedAmount - delegatingInfo.tokensUnstaking - delegatingInfo.tokensRequestedToUnstake

                    let stakingCollectionRef: &FlowStakingCollection.StakingCollection = sFlowStakingManager13.account.borrow<&FlowStakingCollection.StakingCollection>(from: FlowStakingCollection.StakingCollectionStoragePath)
                        ?? panic("Could not borrow ref to StakingCollection")
                    stakingCollectionRef.requestUnstaking(nodeID: sFlowStakingManager13.nodeID, delegatorID: sFlowStakingManager13.delegatorID, amount: amount)
                    bStakeNew = false
                }
            }

            if( requiredStakedAmount < 0.1 && bStakeNew ){
                let delegatingInfo = sFlowStakingManager13.getDelegatorInfo()
                let stakingCollectionRef: &FlowStakingCollection.StakingCollection = sFlowStakingManager13.account.borrow<&FlowStakingCollection.StakingCollection>(from: FlowStakingCollection.StakingCollectionStoragePath)
                    ?? panic("Could not borrow ref to StakingCollection")
                stakingCollectionRef.stakeUnstakedTokens(nodeID: sFlowStakingManager13.nodeID, delegatorID: sFlowStakingManager13.delegatorID, amount: delegatingInfo.tokensUnstaked)
                stakingCollectionRef.stakeRewardedTokens(nodeID: sFlowStakingManager13.nodeID, delegatorID: sFlowStakingManager13.delegatorID, amount: delegatingInfo.tokensRewarded)

                if(sFlowStakingManager13.getCurrentPoolAmount() > 10.1){
                    stakingCollectionRef.stakeNewTokens(nodeID: sFlowStakingManager13.nodeID, delegatorID: sFlowStakingManager13.delegatorID, amount: (sFlowStakingManager13.getCurrentPoolAmount() - 10.1))
                }
            }

            if(sFlowStakingManager13.prevNodeID != "") {
                let delegatingInfo = sFlowStakingManager13.getPrevDelegatorInfo()
                let stakingCollectionRef: &FlowStakingCollection.StakingCollection = sFlowStakingManager13.account.borrow<&FlowStakingCollection.StakingCollection>(from: FlowStakingCollection.StakingCollectionStoragePath)
                    ?? panic("Could not borrow ref to StakingCollection")
                if(delegatingInfo.tokensCommitted > 0.0 || delegatingInfo.tokensStaked > 0.0){
                    stakingCollectionRef.requestUnstaking(nodeID: sFlowStakingManager13.prevNodeID, delegatorID: sFlowStakingManager13.prevDelegatorID, amount: delegatingInfo.tokensCommitted + delegatingInfo.tokensStaked)
                }
                if(delegatingInfo.tokensRewarded > 0.0){
                   stakingCollectionRef.withdrawRewardedTokens(nodeID: sFlowStakingManager13.prevNodeID, delegatorID: sFlowStakingManager13.prevDelegatorID, amount: delegatingInfo.tokensRewarded)
                }
                if(delegatingInfo.tokensUnstaked > 0.0){
                    stakingCollectionRef.withdrawUnstakedTokens(nodeID: sFlowStakingManager13.prevNodeID, delegatorID: sFlowStakingManager13.prevDelegatorID, amount: delegatingInfo.tokensUnstaked)
                }
                if(delegatingInfo.tokensCommitted == 0.0 &&
                delegatingInfo.tokensStaked == 0.0 &&
                delegatingInfo.tokensUnstaking == 0.0 &&
                delegatingInfo.tokensRewarded == 0.0 &&
                delegatingInfo.tokensUnstaked == 0.0) {
                    sFlowStakingManager13.prevNodeID = ""
                    sFlowStakingManager13.prevDelegatorID = 0
                }
            }
        }
    }

    init() {
        self.unstakeList = []

                /// create a single admin collection and store it
        self.account.save(<-create Manager(), to: /storage/sFlowStakingManager13)
        
        self.account.link<&sFlowStakingManager13.Manager>(
            /private/sFlowStakingManager13,
            target: /storage/sFlowStakingManager13
        ) ?? panic("Could not get a capability to the manager")

        self.nodeID = "4d617820576f6c74657200ff6e729e24d35ee1aa0a76bc05746f8c99879e8eaf"
        self.delegatorID = 1
        self.prevNodeID = ""
        self.prevDelegatorID = 0
    }
}