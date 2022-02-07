import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import { useState, useEffect } from "react";
import "../flow/config";
import * as fcl from "@onflow/fcl";

export default function Home() {

  const [user, setUser] = useState({loggedIn: null})
  const [currentPrice, setCurrentPrice] = useState()
  const [currentFlowBalance, setCurrentFlowBalance] = useState()
  const [currentsFlowBalance, setCurrentsFlowBalance] = useState()
  const [stakeAmount, setStakeAmount] = useState()
  const updateStakeAmount = (event) => {
    setStakeAmount(event.target.value)
  }

  const initAccount = async () => {
    console.log("entered");
    const transactionId = await fcl.mutate({
      cadence: `
        import sFlow16 from 0xsFlow16
        import FungibleToken from 0xFungibleToken

        transaction {
          prepare(account: AuthAccount) {
            // Only initialize the account if it hasn't already been initialized
            if account
            .getCapability(/public/sFlow16UnStaker)
            .borrow<&{sFlow16.UnStaker}>() == nil {
              // Store the vault in the account storage
              account.save<@sFlow16.Vault>(<-sFlow16.createEmptyVault(), to: /storage/sFlow16Vault)
          
              log("Empty Vault stored")
          
              // Create a public Receiver capability to the Vault
              let ReceiverRef1 = account.link<&sFlow16.Vault{FungibleToken.Receiver}>(/public/sFlow16Receiver, target: /storage/sFlow16Vault)

              // Create a public Balance capability to the Vault
              let BalanceRef = account.link<&sFlow16.Vault{FungibleToken.Balance}>(/public/sFlow16Balance, target: /storage/sFlow16Vault)

              // Create a public Staker capability to the Vault
              let StakerRef = account.link<&sFlow16.Vault{sFlow16.Staker}>(/public/sFlow16Staker, target: /storage/sFlow16Vault)

              // Create a public UnStaker capability to the Vault
              let UnStakerRef = account.link<&sFlow16.Vault{sFlow16.UnStaker}>(/public/sFlow16UnStaker, target: /storage/sFlow16Vault)

              // Create a public RequestUnstake capability to the Vault
              let RequestUnstakeRef = account.link<&sFlow16.Vault{sFlow16.RequestUnstake}>(/public/sFlow16RequestUnstake, target: /storage/sFlow16Vault)

              // Create a public Unstaked capability to the Vault
              let UnstakedRef = account.link<&sFlow16.Vault{sFlow16.Unstaked}>(/public/sFlow16Unstaked, target: /storage/sFlow16Vault)

              log("References created")            }
          }
        }
      `,
      payer: fcl.authz,
      proposer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 9999
      })
    const transaction = await fcl.tx(transactionId).onceSealed()
    console.log(transaction)
  }

  const stake = async () => {
    const transactionId = await fcl.mutate({
      cadence: `
        import sFlow16 from 0xsFlow16
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
      
              // Get a reference to the recipient's Staker
              let stakerRef =  self.account
                  .getCapability(/public/sFlow16Staker)
                  .borrow<&{sFlow16.Staker}>()
            ?? panic("Could not borrow staker reference to the recipient's Vault")
      
              // Deposit the withdrawn tokens in the recipient's receiver
              stakerRef.stake(deposit: <-self.sentVault)
          }
        }`,
      args: (arg, t) => [arg(stakeAmount, t.UFix64)],
      payer: fcl.authz,
      proposer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 9999
      })
    const transaction = await fcl.tx(transactionId).onceSealed()
    console.log(transaction)
  }

  const unstake = async () => {
    const transactionId = await fcl.mutate({
      cadence: `
        import sFlow16 from 0xsFlow16
        import FungibleToken from 0xFungibleToken
        import FlowToken from 0xFlowToken

        transaction(amount: UFix64) {
          
          var account: AuthAccount
          prepare(signer: AuthAccount) {
            self.account = signer
          }
      
          execute {
              // Get a reference to the recipient's unStaker
              let stakerRef =  self.account
                  .getCapability(/public/sFlow16UnStaker)
                  .borrow<&{sFlow16.UnStaker}>()
              ?? panic("Could not borrow unstaker reference to the recipient's Vault")
      
              // Deposit the withdrawn tokens in the recipient's receiver
              stakerRef.unStake(accountAddress: self.account.address, amount: amount)
          }
        }`,
      args: (arg, t) => [arg(stakeAmount, t.UFix64)],
      payer: fcl.authz,
      proposer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 9999
      })
    const transaction = await fcl.tx(transactionId).onceSealed()
    console.log(transaction)
  }

  const accountInitialzed = async () => {
    var response = await fcl.query({
        cadence : `
        import sFlow16 from 0xsFlow16
        import FungibleToken from 0xFungibleToken

        // This script reads the Vault balances of two accounts.
        pub fun main(accountAddress: Address) : Bool {
            // Get the accounts' public account objects
            let account = getAccount(accountAddress)

            let accountRef = account
            .getCapability(/public/sFlow16UnStaker)
            .borrow<&{sFlow16.UnStaker}>()

            if accountRef == nil {
              return false
            }
            return true
        }
        `,args: (arg, t) => [arg(user.addr, t.Address)]
      },)
      return response;
  }

  const getCurrentPrice = async () => {
    var response = await fcl.query({
        cadence : `
        import sFlow16 from 0xsFlow16

        // This script reads the Vault balances of two accounts.
        pub fun main() : UFix64 {
            let price = sFlow16.getCurrentPrice()
            return price
        }
        `
      },)
      return response;
  }

  const getFlowBalance = async () => {
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
        args: (arg, t) => [arg(user.addr, t.Address)]
    })
    return balance;
  }

  const getsFlowBalance = async () => {
    const balance = await fcl.query({
        cadence: `
        // This script reads the balance field of an account's FlowToken Balance

        import FungibleToken from 0xFungibleToken
        import sFlow16 from 0xsFlow16
        
        pub fun main(account: Address): UFix64 {
        
            let vaultRef = getAccount(account)
                .getCapability(/public/sFlow16Balance)
                .borrow<&sFlow16.Vault{FungibleToken.Balance}>()
                ?? panic("Could not borrow Balance reference to the Vault")
        
            return vaultRef.balance
        }
        `,
        args: (arg, t) => [arg(user.addr, t.Address)]
    })
    return balance;
  }

  setInterval(async () => {
    setCurrentPrice(await getCurrentPrice())
    if(user && user.loggedIn){
      let inited = await accountInitialzed();
      if(inited){
        setCurrentFlowBalance(await getFlowBalance())
        setCurrentsFlowBalance(await getsFlowBalance())
      }
    }
  }, 5000);

  useEffect(() => {
    fcl.currentUser.subscribe(setUser)
  }, [])

  useEffect(async () => {
    if(user && user.loggedIn){
      let inited = await accountInitialzed();
      console.log(inited);
      if(!inited)
        initAccount();
    }
  }, [user])

  const AuthedState = () => {
    return (
      <div>
        <div>Address: {user?.addr ?? "No Address"}</div>
        <button onClick={fcl.unauthenticate}>Log Out</button>
      </div>
    )
  }

  const UnauthenticatedState = () => {
    return (
      <div>
        <button onClick={fcl.logIn}>Log In</button>
        <button onClick={fcl.signUp}>Sign Up</button>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Flow staking with sFlow</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        {user.loggedIn
        ? <AuthedState />
        : <UnauthenticatedState />
        }
        <input value={stakeAmount || ''} onChange={updateStakeAmount} className="" placeholder="Stake Amount" />
        <div>CurrentPrice: {currentPrice}</div>
        <div>FlowBalance: {currentFlowBalance}</div>
        <div>sFlowBalance: {currentsFlowBalance}</div>
        <button onClick={stake} className="">Stake</button>
        <button onClick={unstake} className="">UnStake</button>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  )
}
