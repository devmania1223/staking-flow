import FlowService from "./flowService.js"
import * as fcl from "@onflow/fcl";
import "./config.js";

const manager = new FlowService.FlowService("0x44886dbbf20e893c", "784bf71b737be0b49652030fcaa78369a60df6fbed57d5e0fbef57aa631e3ec8" , 0);

const stakingCollectionSettedup = true;

const getBalance = async () => {
    const balance = await fcl.query({
        cadence: `
        // This script reads the balance field of an account's FlowToken Balance

        import FungibleToken from 0xFungibleToken
        import FlowToken from 0xFlowToken
        
        pub fun main(account: Address): UFix64 {
        
            let vaultRef = getAccount(account)
                .getCapability(/public/flowTokenBalance)
                .borrow<&FlowToken.Vault{FungibleToken.Balance}>()
                ?? panic("Could not borrow Balance reference to the Vault")
        
            return vaultRef.balance
        }
        `,
        args: (arg, t) => [arg("0x44886dbbf20e893c", t.Address)]
    })

    return balance;
}


const getAllDelegatorInfo = async () => {
    const info = await fcl.query({
        cadence: `
        import FlowStakingCollection from 0xFlowStakingCollection
        import FlowIDTableStaking from 0xFlowIDTableStaking
        
        /// Gets an array of all the delegator metadata for delegators stored in the staking collection
        
        pub fun main(address: Address): [FlowIDTableStaking.DelegatorInfo] {
            return FlowStakingCollection.getAllDelegatorInfo(address: address)
        }
        `,
        args: (arg, t) => [arg("0x44886dbbf20e893c", t.Address)]
    })

    return info;
}

const getNodeInfo = async (nodeID) => {
    const info = await fcl.query({
        cadence: `
        import FlowIDTableStaking from 0xFlowIDTableStaking

        // This script gets all the info about a node and returns it
        
        pub fun main(nodeID: String): FlowIDTableStaking.NodeInfo {
            return FlowIDTableStaking.NodeInfo(nodeID: nodeID)
        }
        `,
        args: (arg, t) => [arg(nodeID, t.String)]
    })

    return info;
}

const getApprovedNodes = async () => {
    const info = await fcl.query({
        cadence: `
        import FlowIDTableStaking from 0xFlowIDTableStaking

        // This script returns the current approved list
        
        pub fun main(): [String] {
            return FlowIDTableStaking.getApprovedList()
        }
        `
    })

    return info;
}

const setupStakeCollection = async() => {
    const account = await manager.getAccount("0x44886dbbf20e893c");
    const signer = manager.authorizeMinter(account);

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

const registerDelegator = async(nodeID, amount) => {
    const account = await manager.getAccount("0x44886dbbf20e893c");
    const signer = manager.authorizeMinter(account);

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

const stakeNewTokens = async(nodeID, delegatorID, amount) => {
    const account = await manager.getAccount("0x44886dbbf20e893c");
    const signer = manager.authorizeMinter(account);

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

const manageCollection = async() => {
    const account = await manager.getAccount("0x44886dbbf20e893c");
    const signer = manager.authorizeMinter(account);

    const transactionId = await fcl.mutate({
        cadence: `
            import sFlowStakingManager9 from 0xsFlowStakingManager9

            transaction() {
                let account: AuthAccount
                prepare(account: AuthAccount) {
                    self.account = account
                }
      
                execute {
                    sFlowStakingManager9.manageCollection()
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

if(!stakingCollectionSettedup){
    await setupStakeCollection();
    await registerDelegator("4d617820576f6c74657200ff6e729e24d35ee1aa0a76bc05746f8c99879e8eaf", "500.0");
}
// getApprovedNodes().then((info) => {
//     for(let i=0; i<info.length; i++)
//     {
//         getNodeInfo(info[i]).then((info) => {console.log(info)});
//     }
// });

const managing = async () => {
    let info = await getAllDelegatorInfo();
    console.log(info);

    let balance = await getBalance();
    console.log(balance);

    // if(balance >= 10.0)
    // {
    //     let newAmount = balance-10.0;
    //     await stakeNewTokens("4d617820576f6c74657200ff6e729e24d35ee1aa0a76bc05746f8c99879e8eaf", 1, newAmount.toString());
    //     console.log("updated", balance);
    // }
    await manageCollection();
    setTimeout(managing, 5000);
}

setTimeout(managing, 5000);