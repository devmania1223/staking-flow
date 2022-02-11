import FlowService from "./flowService.js"
import * as fcl from "@onflow/fcl";
import "./config.js";

const accad = "0xe62fecb1ff22b768"
const accke = "dd25736b4e8e7bfcc82b970b94e67c9ce02a53f94f8d2d298983bb4de64f6f6d"
const manager = new FlowService.FlowService(accad, accke , 0);

const getBalance = async () => {
    const balance = await fcl.query({
        cadence: `
        // This script reads the balance field of an account's FlowToken Balance

        import FungibleToken from 0xFungibleToken
        import FlowToken from 0xFlowToken
        
        pub fun main(account: Address): UFix64 {
        
            let vaultRef = getAccount(0xsFlowStakingManager13)
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

const manageCollection = async() => {
    const account = await manager.getAccount(accad);
    const signer = manager.authorizeMinter(account);

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

const setupManagerAccount = async() => {
    const account = await manager.getAccount(accad);
    const signer = manager.authorizeMinter(account);

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

// await setupManagerAccount()

const managing = async () => {
    let info = await getAllDelegatorInfo();
    console.log(info);

    let balance = await getBalance();
    console.log(balance);

    try{
        await manageCollection();
    } catch (error) {
        console.log(error)
    }
    setTimeout(managing, 5000);
}

setTimeout(managing, 5000);