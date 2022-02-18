import Head from 'next/head'
import Image from 'next/image'
import { useState, useEffect } from "react";

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
import * as fcl from "@onflow/fcl";
import "../flow/config";
import * as scripts from "./api/scripts.js"
import * as transactions from "./api/transactions.js"

const theme = createTheme({
  palette: {
    primary:{
      main: '#d0d0d0',
    }
  },
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
          <Button color="inherit" variant="outlined" sx={{ my: 2, display: 'block' }} >{user?.addr ?? "No Address"}</Button>
          <Button color="inherit" variant="contained" onClick={fcl.unauthenticate} sx={{ my: 2, display: 'block' }}  style={{marginLeft: "10px"}} >Log Out</Button>
        </Box>
      </div>
    )
  }

  const UnauthenticatedState = () => {
    return (
      <div>
        <Button color="inherit" variant="outlined" onClick={fcl.logIn}>Log In</Button>
        <Button color="inherit" variant="contained" onClick={fcl.signUp} style={{marginLeft: "10px"}}>Sign Up</Button>
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

  const switchMode = (event) => {
    setCurrentMode(event.target.checked)
  }

  const submit = () => {
    if(!currentMode)
      transactions.stake(fcl.authz, stakeAmount);
    else
      transactions.unstake(fcl.authz, stakeAmount);
  }

  setInterval(async () => {
    setCurrentPrice(await scripts.getCurrentPrice())
    if(user && user.loggedIn){
      let inited = await scripts.accountInitialzed(user.addr);
      if(inited){
        setCurrentFlowBalance(await scripts.getFlowBalance(user.addr))
        setCurrentsFlowBalance(await scripts.getsFlowBalance(user.addr))
      }
    }
  }, 10000);

  useEffect(() => {
    fcl.currentUser.subscribe(setUser)
  }, [])

  useEffect(async () => {
    if(user && user.loggedIn){
      let inited = await scripts.accountInitialzed(user.addr);
      console.log(inited);
      if(!inited)
        await transactions.initAccount(fcl.authz);
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

          <AppBar position="static">
            <Container>
              <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} style={{fontWeight: 900, textTransform: "uppercase"}}>
                  Flow Staking
                </Typography>
                {user.loggedIn
                ? <AuthedState />
                : <UnauthenticatedState />
                }
              </Toolbar>
            </Container>
          </AppBar>

        <main>
          <Box sx={{ pt: 4, pb: 0 }}>
            <Container maxWidth="sm">
              <Typography
                component="h1"
                variant="h4"
                align="center"
                gutterBottom
                style={{fontWeight: "900", color: "#333"}}
              >
                Stake Flow
              </Typography>
              <Typography variant="subtitle1" align="center" color="text.secondary" paragraph>
                Stake Flow and receive sFlow while staking
              </Typography>

            </Container>
            <Container component="main" maxWidth="sm" sx={{ mb: 4 }}>
              <Stack
                direction="row"
                spacing={2}
                justifyContent="center"
              >
                <MUISwitch onChange={switchMode} />
              </Stack>
              <Paper variant="outlined" sx={{ my: { xs: 1, md: 2 }, p: { xs: 2, md: 3 } }}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField fullWidth value={stakeAmount || ''} label="Amount" color="secondary" onChange={updateStakeAmount} focused />
                  </Grid>
                  <Grid item xs={12}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      spacing={2}
                    >
                      <Typography style={{fontSize: "14px"}}>CurrentPrice:
                      </Typography>
                      <Typography style={{fontSize: "16px", fontWeight: 600}}>{currentPrice}
                      </Typography>
                    </Stack>
                    <Divider></Divider>
                  </Grid>
                  <Grid item xs={12}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      spacing={2}
                    >
                      <Typography style={{fontSize: "14px"}}>FlowBalance:
                      </Typography>
                      <Typography style={{fontSize: "16px", fontWeight: 600}}>{currentFlowBalance}
                      </Typography>
                    </Stack>
                    <Divider></Divider>
                  </Grid>
                  <Grid item xs={12}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      spacing={2}
                    >
                      <Typography style={{fontSize: "14px"}}>sFlowBalance:
                      </Typography>
                      <Typography style={{fontSize: "16px", fontWeight: 600}}>{currentsFlowBalance}
                      </Typography>
                    </Stack>
                    <Divider></Divider>
                  </Grid>
                  <Grid item xs={12}>
                    <Button color="inherit" variant="outlined" fullWidth onClick={submit} style={{fontSize: "16px", fontWeight: 600}}>{!currentMode ? "Stake" : "Unstake"}</Button>
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
