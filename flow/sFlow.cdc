import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868
import FlowStakingCollection from 0x95e019a17d0e23d7
import FlowIDTableStaking from 0x9eca2b38b18b5dfe
import FlowServiceAccount from 0x8c5303eaa26202d6
import LockedTokens from 0x95e019a17d0e23d7

pub contract sFlow16: FungibleToken {

    /// Total supply of sFlow16s in existence
    pub var totalSupply: UFix64
    pub var unstakeList: [Address]

    /// TokensInitialized
    ///
    /// The event that is emitted when the contract is created
    pub event TokensInitialized(initialSupply: UFix64)

    /// TokensWithdrawn
    ///
    /// The event that is emitted when tokens are withdrawn from a Vault
    pub event TokensWithdrawn(amount: UFix64, from: Address?)

    /// TokensDeposited
    ///
    /// The event that is emitted when tokens are deposited to a Vault
    pub event TokensDeposited(amount: UFix64, to: Address?)

    /// TokensMinted
    ///
    /// The event that is emitted when new tokens are minted
    pub event TokensMinted(amount: UFix64)

    /// TokensBurned
    ///
    /// The event that is emitted when tokens are destroyed
    pub event TokensBurned(amount: UFix64)

    /// MinterCreated
    ///
    /// The event that is emitted when a new minter resource is created
    pub event MinterCreated(allowedAmount: UFix64)

    /// BurnerCreated
    ///
    /// The event that is emitted when a new burner resource is created
    pub event BurnerCreated()

    pub resource interface Staker {
        pub fun stake(deposit: @FungibleToken.Vault)
    }

    pub resource interface UnStaker {
        pub fun unStake(accountAddress: Address, amount: UFix64)
    }

    pub resource interface RequestUnstake {
        pub var requestUnstake: UFix64
    }

    pub resource interface Unstaked {
        pub fun unStaked(accountAddress: Address)
    }

    /// Vault
    ///
    /// Each user stores an instance of only the Vault in their storage
    /// The functions in the Vault and governed by the pre and post conditions
    /// in FungibleToken when they are called.
    /// The checks happen at runtime whenever a function is called.
    ///
    /// Resources can only be created in the context of the contract that they
    /// are defined in, so there is no way for a malicious user to create Vaults
    /// out of thin air. A special Minter resource needs to be defined to mint
    /// new tokens.
    ///

    pub resource Vault: FungibleToken.Provider, FungibleToken.Receiver, FungibleToken.Balance, Staker, UnStaker, RequestUnstake, Unstaked {

        /// The total balance of this vault
        pub var balance: UFix64
        pub var requestUnstake: UFix64

        // initialize the balance at resource creation time
        init(balance: UFix64) {
            self.balance = balance
            self.requestUnstake = 0.0
        }

        /// stake
        pub fun stake(deposit: @FungibleToken.Vault) {
            let currentPrice: UFix64 = sFlow16.getCurrentPrice()
            let addAmount: UFix64 = deposit.balance / currentPrice
            self.balance = self.balance + addAmount
            sFlow16.totalSupply = sFlow16.totalSupply + addAmount

            let receiverRef =  sFlow16.account
                .getCapability(/public/flowTokenReceiver)
                .borrow<&{FungibleToken.Receiver}>()
                ?? panic("Could not borrow receiver reference to the recipient's Vault")

            // Deposit the withdrawn tokens in the recipient's receiver
            receiverRef.deposit(from: <-deposit)
        }

        /// unStake
        pub fun unStake(accountAddress: Address, amount: UFix64) /* : @FungibleToken.Vault*/{
            self.requestUnstake = self.requestUnstake + amount
            if(self.requestUnstake > self.balance){
                self.requestUnstake = self.balance
            }

            if(sFlow16.unstakeList.contains(accountAddress) == false){
                sFlow16.unstakeList.append(accountAddress);
            }
            // // Get a reference to the signer's stored vault
            // let vaultRef = sFlow16.account.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
		    // 	?? panic("Could not borrow reference to the owner's Vault!")

            // return <- vaultRef.withdraw(amount: amount)
        }

        pub fun unStaked(accountAddress: Address) /* : @FungibleToken.Vault*/{
            var index: Int = 0
            while index < sFlow16.unstakeList.length {
                if(sFlow16.unstakeList[index] == accountAddress){
                    sFlow16.unstakeList.remove(at: index)
                    break
                }
                index = index + 1
            }
            self.balance = self.balance - self.requestUnstake
            sFlow16.totalSupply = sFlow16.totalSupply - self.requestUnstake
            self.requestUnstake = 0.0
        }

        /// withdraw
        ///
        /// Function that takes an amount as an argument
        /// and withdraws that amount from the Vault.
        ///
        /// It creates a new temporary Vault that is used to hold
        /// the money that is being transferred. It returns the newly
        /// created Vault to the context that called so it can be deposited
        /// elsewhere.
        ///
        pub fun withdraw(amount: UFix64): @FungibleToken.Vault {
            self.balance = self.balance - amount
            emit TokensWithdrawn(amount: amount, from: self.owner?.address)
            return <-create Vault(balance: amount)
        }

        /// deposit
        ///
        /// Function that takes a Vault object as an argument and adds
        /// its balance to the balance of the owners Vault.
        ///
        /// It is allowed to destroy the sent Vault because the Vault
        /// was a temporary holder of the tokens. The Vault's balance has
        /// been consumed and therefore can be destroyed.
        ///
        pub fun deposit(from: @FungibleToken.Vault) {
            let vault <- from as! @sFlow16.Vault
            self.balance = self.balance + vault.balance
            emit TokensDeposited(amount: vault.balance, to: self.owner?.address)
            vault.balance = 0.0
            destroy vault
        }

        destroy() {
            sFlow16.totalSupply = sFlow16.totalSupply - self.balance
        }
    }

    /// createEmptyVault
    ///
    /// Function that creates a new Vault with a balance of zero
    /// and returns it to the calling context. A user must call this function
    /// and store the returned Vault in their storage in order to allow their
    /// account to be able to receive deposits of this token type.
    ///
    pub fun createEmptyVault(): @Vault {
        return <-create Vault(balance: 0.0)
    }

    pub resource Administrator {

        /// createNewMinter
        ///
        /// Function that creates and returns a new minter resource
        ///
        pub fun createNewMinter(allowedAmount: UFix64): @Minter {
            emit MinterCreated(allowedAmount: allowedAmount)
            return <-create Minter(allowedAmount: allowedAmount)
        }

        /// createNewBurner
        ///
        /// Function that creates and returns a new burner resource
        ///
        pub fun createNewBurner(): @Burner {
            emit BurnerCreated()
            return <-create Burner()
        }
    }

    /// Minter
    ///
    /// Resource object that token admin accounts can hold to mint new tokens.
    ///
    pub resource Minter {

        /// The amount of tokens that the minter is allowed to mint
        pub var allowedAmount: UFix64

        /// mintTokens
        ///
        /// Function that mints new tokens, adds them to the total supply,
        /// and returns them to the calling context.
        ///
        pub fun mintTokens(amount: UFix64): @sFlow16.Vault {
            pre {
                amount > 0.0: "Amount minted must be greater than zero"
                amount <= self.allowedAmount: "Amount minted must be less than the allowed amount"
            }
            sFlow16.totalSupply = sFlow16.totalSupply + amount
            self.allowedAmount = self.allowedAmount - amount
            emit TokensMinted(amount: amount)
            return <-create Vault(balance: amount)
        }

        init(allowedAmount: UFix64) {
            self.allowedAmount = allowedAmount
        }
    }

    /// Burner
    ///
    /// Resource object that token admin accounts can hold to burn tokens.
    ///
    pub resource Burner {

        /// burnTokens
        ///
        /// Function that destroys a Vault instance, effectively burning the tokens.
        ///
        /// Note: the burned tokens are automatically subtracted from the
        /// total supply in the Vault destructor.
        ///
        pub fun burnTokens(from: @FungibleToken.Vault) {
            let vault <- from as! @sFlow16.Vault
            let amount = vault.balance
            destroy vault
            emit TokensBurned(amount: amount)
        }
    }

    init() {
        self.totalSupply = 1000.0
        self.unstakeList = []

        // Create the Vault with the total supply of tokens and save it in storage
        //
        let vault <- create Vault(balance: self.totalSupply)
        self.account.save(<-vault, to: /storage/sFlow16Vault)

        // Create a public capability to the stored Vault that only exposes
        // the `deposit` method through the `Receiver` interface
        //
        self.account.link<&{FungibleToken.Receiver}>(
            /public/sFlow16Receiver,
            target: /storage/sFlow16Vault
        )

        // Create a public capability to the stored Vault that only exposes
        // the `balance` field through the `Balance` interface
        //
        self.account.link<&sFlow16.Vault{FungibleToken.Balance}>(
            /public/sFlow16Balance,
            target: /storage/sFlow16Vault
        )

        self.account.link<&sFlow16.Vault{sFlow16.Staker}>(
            /public/sFlow16Staker,
            target: /storage/sFlow16Vault
        )

        let admin <- create Administrator()
        self.account.save(<-admin, to: /storage/sFlow16Admin)

        // Emit an event that shows that the contract was initialized
        //
        emit TokensInitialized(initialSupply: self.totalSupply)
    }

    pub fun getCurrentPoolAmount() : UFix64{
        let vaultRef = sFlow16.account
            .getCapability(/public/flowTokenBalance)
            .borrow<&FlowToken.Vault{FungibleToken.Balance}>()
            ?? panic("Could not borrow Balance reference to the Vault")
    
        return vaultRef.balance
    }

    pub fun getDelegatorInfo() : [FlowIDTableStaking.DelegatorInfo]{
        let delegatingInfo = FlowStakingCollection.getAllDelegatorInfo(address: sFlow16.account.address);
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

        return (amountInPool + amountInStaking)/self.totalSupply
    }

    pub fun manageCollection(){
        var requiredStakedAmount:UFix64 = 0.0
        for accountAddress in self.unstakeList {
            let accountStaker = getAccount(accountAddress)

            // Create a public RequestUnstake capability to the Vault
            let RequestUnstakeRef = accountStaker
                    .getCapability(/public/sFlow16RequestUnstake)
                    .borrow<&{sFlow16.RequestUnstake}>()
                    ?? panic("Could not borrow receiver reference to the recipient's Vault")
            let requiredFlow = RequestUnstakeRef.requestUnstake * self.getCurrentPrice();
            if (self.getCurrentPoolAmount() > requiredFlow + 10.1)
            {
                let providerRef =  sFlow16.account
                    .borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
                    ?? panic("Could not borrow provider reference to the provider's Vault")

                // Deposit the withdrawn tokens in the provider's receiver
                let sentVault: @FungibleToken.Vault <- providerRef.withdraw(amount: requiredFlow)

                let receiverRef =  accountStaker
                    .getCapability(/public/flowTokenReceiver)
                    .borrow<&{FungibleToken.Receiver}>()
                    ?? panic("Could not borrow receiver reference to the recipient's Vault")

                receiverRef.deposit(from: <-sentVault)

                let unstakedRef =  accountStaker
                    .getCapability(/public/sFlow16Unstaked)
                    .borrow<&{sFlow16.Unstaked}>()
                    ?? panic("Could not borrow provider reference to the provider's Vault")
                unstakedRef.unStaked(accountAddress: accountAddress);
            } else {
                requiredStakedAmount = requiredStakedAmount + requiredFlow
            }
        }

        if( requiredStakedAmount > 0.0 ){
            requiredStakedAmount = requiredStakedAmount + 10.1 - self.getCurrentPoolAmount() 
            let delegatingInfo = self.getDelegatorInfo()
            if( delegatingInfo[0].tokensUnstaked > 0.0 ) {
                let stakingCollectionRef: &FlowStakingCollection.StakingCollection = sFlow16.account.borrow<&FlowStakingCollection.StakingCollection>(from: FlowStakingCollection.StakingCollectionStoragePath)
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
                let stakingCollectionRef: &FlowStakingCollection.StakingCollection = sFlow16.account.borrow<&FlowStakingCollection.StakingCollection>(from: FlowStakingCollection.StakingCollectionStoragePath)
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

            let stakingCollectionRef: &FlowStakingCollection.StakingCollection = sFlow16.account.borrow<&FlowStakingCollection.StakingCollection>(from: FlowStakingCollection.StakingCollectionStoragePath)
                ?? panic("Could not borrow ref to StakingCollection")
            stakingCollectionRef.requestUnstaking(nodeID: "4d617820576f6c74657200ff6e729e24d35ee1aa0a76bc05746f8c99879e8eaf", delegatorID: 1, amount: amount)
        }

        if( requiredStakedAmount < 0.1){
            let delegatingInfo = self.getDelegatorInfo()
            let stakingCollectionRef: &FlowStakingCollection.StakingCollection = sFlow16.account.borrow<&FlowStakingCollection.StakingCollection>(from: FlowStakingCollection.StakingCollectionStoragePath)
                ?? panic("Could not borrow ref to StakingCollection")
            stakingCollectionRef.stakeUnstakedTokens(nodeID: "4d617820576f6c74657200ff6e729e24d35ee1aa0a76bc05746f8c99879e8eaf", delegatorID: 1, amount: delegatingInfo[0].tokensUnstaked)
            stakingCollectionRef.stakeRewardedTokens(nodeID: "4d617820576f6c74657200ff6e729e24d35ee1aa0a76bc05746f8c99879e8eaf", delegatorID: 1, amount: delegatingInfo[0].tokensRewarded)

            if(self.getCurrentPoolAmount() > 10.1){
                stakingCollectionRef.stakeNewTokens(nodeID: "4d617820576f6c74657200ff6e729e24d35ee1aa0a76bc05746f8c99879e8eaf", delegatorID: 1, amount: (self.getCurrentPoolAmount() - 10.1))
            }
        }
    }
}