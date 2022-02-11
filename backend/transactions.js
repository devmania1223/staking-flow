import * as fcl from "@onflow/fcl";
import "./config.js";

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

export const setupManagerAccount = async(signer, address) => {
    const transactionId = await fcl.mutate({
        cadence: `
            import sFlowStakingManager13 from 0xsFlowStakingManager13

            transaction(address: Address) {

                prepare(admin: AuthAccount) {
            
                    let managerAccount = getAccount(address)
                        
                    let capabilityReceiver = managerAccount.getCapability
                        <&sFlowStakingManager13.Instance{sFlowStakingManager13.setManagerCapability}>
                        (/public/sFlowStakingManager13_Instance)!
                        .borrow() ?? panic("Could not borrow capability receiver reference")
            
                    let managerCapacity = admin
                        .getCapability<&sFlowStakingManager13.Manager>(/private/sFlowStakingManager13)!
            
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
            import sFlowStakingManager13 from 0xsFlowStakingManager13

            transaction() {
                let account: AuthAccount
                prepare(account: AuthAccount) {
                    self.account = account
                }
      
                execute {
                    let providerRef : &sFlowStakingManager13.Instance =  self.account
                        .borrow<&sFlowStakingManager13.Instance>(from: /storage/sFlowStakingManager13_Instance)!
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
            import sFlowStakingManager13 from 0xsFlowStakingManager13

            transaction {
                prepare(account: AuthAccount) {
                    let accountCreator : @sFlowStakingManager13.Instance <- sFlowStakingManager13.createInstance()
                    account.save(
                        <-accountCreator, 
                        to: /storage/sFlowStakingManager13_Instance,
                    )
                    // create new receiver that marks received tokens as unlocked
                    account.link<&sFlowStakingManager13.Instance{sFlowStakingManager13.setManagerCapability}>(
                        /public/sFlowStakingManager13_Instance,
                        target: /storage/sFlowStakingManager13_Instance
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
