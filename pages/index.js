import Head from 'next/head'
import Image from 'next/image'
import { useState, useEffect } from "react";
import * as fcl from "@onflow/fcl";

import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';

import { styled } from '@mui/system';
import { useSwitch } from '@mui/base/SwitchUnstyled';
import { ThemeProvider, createTheme} from '@mui/material/styles';

import MUISwitch from './components/StakingSwitch';
import "../flow/config";

const theme = createTheme({
  typography: {
    fontFamily: [
      'Arial, sans-serif', 
    ].join(','),
  },
});

export default function Home() {

  const [user, setUser] = useState({loggedIn: null})
  const [currentPrice, setCurrentPrice] = useState()
  const [currentFlowBalance, setCurrentFlowBalance] = useState()
  const [currentsFlowBalance, setCurrentsFlowBalance] = useState()
  const [stakeAmount, setStakeAmount] = useState()
  const [currentMode, setCurrentMode] = useState()

  const updateStakeAmount = (event) => {
    setStakeAmount(event.target.value)
  }

  const AuthedState = () => {
    return (
      <div>
        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
          <Typography variant="h6" component="div" sx={{ my: 2, color: 'white', display: 'block' }} >
            Address: {user?.addr ?? "No Address"}
          </Typography>
          <Button color="inherit" onClick={fcl.unauthenticate} sx={{ my: 2, color: 'white', display: 'block' }} >Log Out</Button>
        </Box>
      </div>
    )
  }

  const UnauthenticatedState = () => {
    return (
      <div>
        <Button color="inherit" onClick={fcl.logIn}>Log In</Button>
        <Button color="inherit" onClick={fcl.signUp}>Sign Up</Button>
      </div>
    )
  }

  const Copyright = (props) => {
    return (
      <Typography variant="body2" color="text.secondary" align="center" {...props}>
        {'Copyright © '}
        <Link color="inherit" href="https://mui.com/">
          Your Website
        </Link>{' '}
        {new Date().getFullYear()}
        {'.'}
      </Typography>
    );
  }
  
  const footers = [
    {
      title: 'Company',
      description: ['Team', 'History', 'Contact us', 'Locations'],
    },
    {
      title: 'Features',
      description: [
        'Cool stuff',
        'Random feature',
        'Team feature',
        'Developer stuff',
        'Another one',
      ],
    },
    {
      title: 'Resources',
      description: ['Resource', 'Resource name', 'Another resource', 'Final resource'],
    },
    {
      title: 'Legal',
      description: ['Privacy policy', 'Terms of use'],
    },
  ];

  const initAccount = async () => {
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
        import sFlowToken2 from 0xsFlowToken2
        import sFlowStakingManager13 from 0xsFlowStakingManager13
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
              let sFlowVault <- sFlowStakingManager13.stake(from: <-self.sentVault)

              let vaultRef = self.account.borrow<&sFlowToken2.Vault>(from: /storage/sFlowToken2Vault)
              ?? panic("Could not borrow reference to the owner's Vault!")
              vaultRef.deposit(from: <- sFlowVault)
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
        import sFlowToken2 from 0xsFlowToken2
        import sFlowStakingManager13 from 0xsFlowStakingManager13
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
              sFlowStakingManager13.unstake(accountAddress: self.account.address, from: <-sFlowVault)
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
        import sFlowToken2 from 0xsFlowToken2
        import FungibleToken from 0xFungibleToken

        // This script reads the Vault balances of two accounts.
        pub fun main(accountAddress: Address) : Bool {
            // Get the accounts' public account objects
            let account = getAccount(accountAddress)

            let accountRef = account
            .getCapability(/public/sFlowToken2Receiver)
            .borrow<&{FungibleToken.Receiver}>()

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
        import sFlowStakingManager13 from 0xsFlowStakingManager13

        // This script reads the Vault balances of two accounts.
        pub fun main() : UFix64 {
            let price = sFlowStakingManager13.getCurrentPrice()
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
        import sFlowToken2 from 0xsFlowToken2
        
        pub fun main(account: Address): UFix64 {
        
            let vaultRef = getAccount(account)
                .getCapability(/public/sFlowToken2Balance)
                .borrow<&sFlowToken2.Vault{FungibleToken.Balance}>()
                ?? panic("Could not borrow Balance reference to the Vault")
        
            return vaultRef.balance
        }
        `,
        args: (arg, t) => [arg(user.addr, t.Address)]
    })
    return balance;
  }

  const switchMode = (event) => {
    setCurrentMode(event.target.checked)
  }

  const submit = () => {
    if(!currentMode)
      stake();
    else
      unstake();
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
  }, 10000);

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

  return (
    <div>
      <ThemeProvider theme={theme}>
        <Head>
          <title>Flow staking with sFlow</title>
          <meta name="description" content="Flow Staking App" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <Container>
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                sFlow Staking
              </Typography>
              {user.loggedIn
              ? <AuthedState />
              : <UnauthenticatedState />
              }
            </Toolbar>
          </AppBar>
        </Container>

        <main>
          <Box
            sx={{
              pt: 4,
              pb: 0,
            }}
          >
            <Container maxWidth="sm">
              <Typography
                component="h1"
                variant="h2"
                align="center"
                color="text.primary"
                gutterBottom
              >
                Stake Flow
              </Typography>
              <Typography variant="h5" align="center" color="text.secondary" paragraph>
                Stake Flow and receive sFlow while staking
              </Typography>

              <Stack
                sx={{ pt: 4 }}
                direction="row"
                spacing={2}
                justifyContent="center"
              >
                <MUISwitch onChange={switchMode} />
              </Stack>
            </Container>
            <Container component="main" maxWidth="sm" sx={{ mb: 4 }}>
            <Paper variant="outlined" sx={{ my: { xs: 3, md: 6 }, p: { xs: 2, md: 3 } }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField fullWidth value={stakeAmount || ''} label="Amount" color="secondary" onChange={updateStakeAmount} focused />
                </Grid>
                <Grid item xs={12}>
                  <Typography>CurrentPrice: {currentPrice}</Typography>
                  <Divider></Divider>
                </Grid>
                <Grid item xs={12}>
                  <Typography>FlowBalance: {currentFlowBalance}</Typography>
                  <Divider></Divider>
                </Grid>
                <Grid item xs={12}>
                  <Typography>sFlowBalance: {currentsFlowBalance}</Typography>
                  <Divider></Divider>
                </Grid>
                <Grid item xs={12}>
                  <Button fullWidth onClick={submit} className="">{!currentMode ? "Stake" : "Unstake"}</Button>
                </Grid>
              </Grid>
            </Paper>
          </Container>
        </Box>
        </main>

        <footer>
          <Container
            maxWidth="md"
            component="footer"
            sx={{
              borderTop: (theme) => `1px solid ${theme.palette.divider}`,
              mt: 8,
              py: [3, 6],
            }}
          >
            <Grid container spacing={4} justifyContent="space-evenly">
              {footers.map((footer) => (
                <Grid item xs={6} sm={3} key={footer.title}>
                  <Typography variant="h6" color="text.primary" gutterBottom>
                    {footer.title}
                  </Typography>
                  <ul>
                    {footer.description.map((item) => (
                      <li key={item}>
                        <Link href="#" variant="subtitle1" color="text.secondary">
                          {item}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Grid>
              ))}
            </Grid>
            <Copyright sx={{ mt: 5 }} />
          </Container>
        </footer>
      </ThemeProvider>
    </div>
  )
}
