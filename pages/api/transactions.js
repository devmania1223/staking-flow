import * as fcl from "@onflow/fcl";

export const setupStakeCollection = async(signer) => {
    const transactionId = await fcl.mutate({
      cadence: `
      import FungibleToken from 0xFungibleToken
      import FlowToken from 0xFlowToken
      import FlowIDTableStaking from 0xFlowIDTableStaking
      import LockedTokens from 0xLockedTokens
      import FlowStakingCollection from 0xFlowStakingCollection
      
      /// This transaction sets up an account to use a staking collection
      /// It will work regardless of whether they have a regular account, a two-account locked tokens setup,
      /// or staking objects stored in the unlocked account
      
      transaction {
          prepare(signer: AuthAccount) {
      
              // If there isn't already a staking collection
              if signer.borrow<&FlowStakingCollection.StakingCollection>(from: FlowStakingCollection.StakingCollectionStoragePath) == nil {
      
                  // Create private capabilities for the token holder and unlocked vault
                  let lockedHolder = signer.link<&LockedTokens.TokenHolder>(/private/flowTokenHolder, target: LockedTokens.TokenHolderStoragePath)!
                  let flowToken = signer.link<&FlowToken.Vault>(/private/flowTokenVault, target: /storage/flowTokenVault)!
                  
                  // Create a new Staking Collection and put it in storage
                  if lockedHolder.check() {
                      signer.save(<-FlowStakingCollection.createStakingCollection(unlockedVault: flowToken, tokenHolder: lockedHolder), to: FlowStakingCollection.StakingCollectionStoragePath)
                  } else {
                      signer.save(<-FlowStakingCollection.createStakingCollection(unlockedVault: flowToken, tokenHolder: nil), to: FlowStakingCollection.StakingCollectionStoragePath)
                  }
      
                  // Create a public link to the staking collection
                  signer.link<&FlowStakingCollection.StakingCollection{FlowStakingCollection.StakingCollectionPublic}>(
                      FlowStakingCollection.StakingCollectionPublicPath,
                      target: FlowStakingCollection.StakingCollectionStoragePath
                  )
              }
      
              // borrow a reference to the staking collection
              let collectionRef = signer.borrow<&FlowStakingCollection.StakingCollection>(from: FlowStakingCollection.StakingCollectionStoragePath)
                  ?? panic("Could not borrow staking collection reference")
      
              // If there is a node staker object in the account, put it in the staking collection
              if signer.borrow<&FlowIDTableStaking.NodeStaker>(from: FlowIDTableStaking.NodeStakerStoragePath) != nil {
                  let node <- signer.load<@FlowIDTableStaking.NodeStaker>(from: FlowIDTableStaking.NodeStakerStoragePath)!
                  collectionRef.addNodeObject(<-node, machineAccountInfo: nil)
              }
      
              // If there is a delegator object in the account, put it in the staking collection
              if signer.borrow<&FlowIDTableStaking.NodeDelegator>(from: FlowIDTableStaking.DelegatorStoragePath) != nil {
                  let delegator <- signer.load<@FlowIDTableStaking.NodeDelegator>(from: FlowIDTableStaking.DelegatorStoragePath)!
                  collectionRef.addDelegatorObject(<-delegator)
              }
          }
      }`,
      payer: signer,
      proposer: signer,
      authorizations: [signer],
      limit: 9999
    })
    const transaction = await fcl.tx(transactionId).onceSealed()
    console.log(transaction)
}

export const stakeNewTokens = async(signer, nodeID, delegatorID, amount) => {
    const transactionId = await fcl.mutate({
      cadence: `
      import FlowStakingCollection from 0xFlowStakingCollection

      /// Commits new tokens to stake for the specified node or delegator in the staking collection
      /// The tokens from the locked vault are used first, if it exists
      /// followed by the tokens from the unlocked vault
      
      transaction(nodeID: String, delegatorID: UInt32?, amount: UFix64) {
          
          let stakingCollectionRef: &FlowStakingCollection.StakingCollection
      
          prepare(account: AuthAccount) {
              self.stakingCollectionRef = account.borrow<&FlowStakingCollection.StakingCollection>(from: FlowStakingCollection.StakingCollectionStoragePath)
                  ?? panic("Could not borrow ref to StakingCollection")
          }
      
          execute {
              self.stakingCollectionRef.stakeNewTokens(nodeID: nodeID, delegatorID: delegatorID, amount: amount)
          }
      }`,
      args: (arg, t) => [arg(nodeID, t.String),arg(delegatorID, t.UInt32),arg(amount, t.UFix64)],
      payer: signer,
      proposer: signer,
      authorizations: [signer],
      limit: 9999
    })
    const transaction = await fcl.tx(transactionId).onceSealed()
    console.log(transaction)
}

export const setManagerCapabilityToAccount = async(signer, address) => {
    const transactionId = await fcl.mutate({
        cadence: `
            import sFlowStakingManager14 from 0xsFlowStakingManager14

            transaction(address: Address) {

                prepare(admin: AuthAccount) {
            
                    let managerAccount = getAccount(address)
                        
                    let capabilityReceiver = managerAccount.getCapability
                        <&sFlowStakingManager14.Instance{sFlowStakingManager14.setManagerCapability}>
                        (/public/sFlowStakingManager14_Instance)!
                        .borrow() ?? panic("Could not borrow capability receiver reference")
            
                    let managerCapacity = admin
                        .getCapability<&sFlowStakingManager14.Manager>(/private/sFlowStakingManager14)!
            
                    capabilityReceiver.setCapability(cap: managerCapacity)
                }
            }
        `,
        args: (arg, t) => [arg(address, t.Address)],
        payer: signer,
        proposer: signer,
        authorizations: [signer],
        limit: 9999
    })
    const transaction = await fcl.tx(transactionId).onceSealed()
    console.log(transaction)
}

export const registerDelegator = async(signer, nodeID, amount) => {
    const transactionId = await fcl.mutate({
      cadence: `
      import FlowStakingCollection from 0xFlowStakingCollection

      /// Registers a delegator in the staking collection resource
      /// for the specified nodeID and the amount of tokens to commit
      
      transaction(id: String, amount: UFix64) {
          
          let stakingCollectionRef: &FlowStakingCollection.StakingCollection
      
          prepare(account: AuthAccount) {
              self.stakingCollectionRef = account.borrow<&FlowStakingCollection.StakingCollection>(from: FlowStakingCollection.StakingCollectionStoragePath)
                  ?? panic("Could not borrow ref to StakingCollection")
          }
      
          execute {
              self.stakingCollectionRef.registerDelegator(nodeID: id, amount: amount)      
          }
      }`,
      args: (arg, t) => [arg(nodeID, t.String),arg(amount, t.UFix64)],
      payer: signer,
      proposer: signer,
      authorizations: [signer],
      limit: 9999
    })
    const transaction = await fcl.tx(transactionId).onceSealed()
    console.log(transaction)
}

export const manageCollection = async(signer) => {
    const transactionId = await fcl.mutate({
        cadence: `
            import sFlowStakingManager14 from 0xsFlowStakingManager14

            transaction() {
                let account: AuthAccount
                prepare(account: AuthAccount) {
                    self.account = account
                }
      
                execute {
                    let providerRef : &sFlowStakingManager14.Instance =  self.account
                        .borrow<&sFlowStakingManager14.Instance>(from: /storage/sFlowStakingManager14_Instance)!
                    providerRef.manageCollection()
                }
            }
        `,
      payer: signer,
      proposer: signer,
      authorizations: [signer],
      limit: 9999
    })
    const transaction = await fcl.tx(transactionId).onceSealed()
    console.log(transaction)
}

export const setupManagerAccount = async(signer) => {
    const transactionId = await fcl.mutate({
        cadence: `
            import sFlowStakingManager14 from 0xsFlowStakingManager14

            transaction {
                prepare(account: AuthAccount) {
                    let accountCreator : @sFlowStakingManager14.Instance <- sFlowStakingManager14.createInstance()
                    account.save(
                        <-accountCreator, 
                        to: /storage/sFlowStakingManager14_Instance,
                    )
                    // create new receiver that marks received tokens as unlocked
                    account.link<&sFlowStakingManager14.Instance{sFlowStakingManager14.setManagerCapability}>(
                        /public/sFlowStakingManager14_Instance,
                        target: /storage/sFlowStakingManager14_Instance
                    )
                }
            }
        `,
        payer: signer,
        proposer: signer,
        authorizations: [signer],
        limit: 9999
    })
    const transaction = await fcl.tx(transactionId).onceSealed()
    console.log(transaction)
}


export const unstake = async (signer, stakeAmount) => {
    const transactionId = await fcl.mutate({
      cadence: `
        import sFlowToken2 from 0xsFlowToken2
        import sFlowStakingManager14 from 0xsFlowStakingManager14
        import FungibleToken from 0xFungibleToken
        import FlowToken from 0xFlowToken

        transaction(amount: UFix64) {
          
          var account: AuthAccount
          prepare(signer: AuthAccount) {
            self.account = signer
          }
      
          execute {
              let vaultRef = self.account.borrow<&sFlowToken2.Vault>(from: /storage/sFlowToken2Vault)
              ?? panic("Could not borrow reference to the owner's Vault!")
              let sFlowVault <- vaultRef.withdraw(amount: amount)
    
              // Deposit the withdrawn tokens in the recipient's receiver
              sFlowStakingManager14.unstake(accountAddress: self.account.address, from: <-sFlowVault)
          }
        }`,
    args: (arg, t) => [arg(stakeAmount, t.UFix64)],
    payer: signer,
    proposer: signer,
    authorizations: [signer],
    limit: 9999
    })
    const transaction = await fcl.tx(transactionId).onceSealed()
    console.log(transaction)
}

export const stake = async (signer, stakeAmount) => {
    const transactionId = await fcl.mutate({
      cadence: `
        import sFlowToken2 from 0xsFlowToken2
        import sFlowStakingManager14 from 0xsFlowStakingManager14
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
              let sFlowVault <- sFlowStakingManager14.stake(from: <-self.sentVault)

              let vaultRef = self.account.borrow<&sFlowToken2.Vault>(from: /storage/sFlowToken2Vault)
              ?? panic("Could not borrow reference to the owner's Vault!")
              vaultRef.deposit(from: <- sFlowVault)
          }
        }`,
    args: (arg, t) => [arg(stakeAmount, t.UFix64)],
    payer: signer,
    proposer: signer,
    authorizations: [signer],
    limit: 9999
    })
    const transaction = await fcl.tx(transactionId).onceSealed()
    console.log(transaction)
}

export const initAccount = async (signer) => {
    console.log("entered");
    const transactionId = await fcl.mutate({
      cadence: `
        import sFlowToken2 from 0xsFlowToken2
        import FungibleToken from 0xFungibleToken

        transaction {
          prepare(account: AuthAccount) {
            // Only initialize the account if it hasn't already been initialized
            if account
            .getCapability(/public/sFlowToken2Receiver)
            .borrow<&{FungibleToken.Receiver}>() == nil {
              // Store the vault in the account storage
              account.save<@sFlowToken2.Vault>(<-sFlowToken2.createEmptyVault(), to: /storage/sFlowToken2Vault)
          
              log("Empty Vault stored")
          
              // Create a public Receiver capability to the Vault
              let ReceiverRef1 = account.link<&sFlowToken2.Vault{FungibleToken.Receiver}>(/public/sFlowToken2Receiver, target: /storage/sFlowToken2Vault)

              // Create a public Balance capability to the Vault
              let BalanceRef = account.link<&sFlowToken2.Vault{FungibleToken.Balance}>(/public/sFlowToken2Balance, target: /storage/sFlowToken2Vault)

              log("References created")            }
          }
        }
    `,
    payer: signer,
    proposer: signer,
    authorizations: [signer],
    limit: 9999
    })
    const transaction = await fcl.tx(transactionId).onceSealed()
    console.log(transaction)
}
