import pkg from '@onflow/fcl';
const { config } = pkg;

config({
  "accessNode.api": "https://access-testnet.onflow.org", // Mainnet: "https://access-mainnet-beta.onflow.org"
  "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn", // Mainnet: "https://fcl-discovery.onflow.org/authn"
  "0xsFlowToken2": "0x44886dbbf20e893c", // The account address where the smart contract lives
  "0xsFlowStakingManager7": "0x44886dbbf20e893c", // The account address where the smart contract lives
  "0xFlowToken": "0x7e60df042a9c0868",
  "0xFungibleToken": "0x9a0766d93b6608b7",
  "0xFlowStakingCollection": "0x95e019a17d0e23d7",
  "0xFlowIDTableStaking": "0x9eca2b38b18b5dfe",
  "0xFlowServiceAccount": "0x8c5303eaa26202d6",
  "0xLockedTokens": "0x95e019a17d0e23d7",

})