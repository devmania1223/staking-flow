import path from "path"
import { config } from "@onflow/config";
import { fileURLToPath } from 'url';
import { init, emulator, deployContractByName, getContractAddress , getAccountAddress, getTemplate, sendTransaction, mintFlow, executeScript } from "flow-js-testing";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const main = async () => {
  const basePath = path.resolve(__dirname, "../cadence");
  const port = 8080;

  await init(basePath, { port });
  await emulator.start(port);

  const FungibleTokenAddress = "0xee82856bf20e2aa6";
  const FlowTokenAddress = "0x0ae53cb6e3f42a79";
  const FlowStorageFeesAddress = "0xf8d6e0586b0a20c7";

  const FlowFeesName = "FlowFees";
  const FlowFeesAddress = await getAccountAddress("FlowFees");
  const FlowFeesAddressMap = {};
  const FlowFeesArgs = [];
  await deployContractByName({ to: FlowFeesAddress, name: FlowFeesName, addressMap: FlowFeesAddressMap });
  const FlowFeesContractAddress = await getContractAddress(FlowFeesName);
  console.log(FlowFeesName + " deployed in ", FlowFeesContractAddress );

  const FlowContractAuditsName = "FlowContractAudits";
  const FlowContractAuditsAddress = await getAccountAddress("FlowContractAudits");
  const FlowContractAuditsAddressMap = {};
  const FlowContractAuditsArgs = [];
  await deployContractByName({ to: FlowContractAuditsAddress, name: FlowContractAuditsName, addressMap: FlowContractAuditsAddressMap });
  const FlowContractAuditsContractAddress = await getContractAddress(FlowContractAuditsName);
  console.log(FlowContractAuditsName + " deployed in ", FlowContractAuditsContractAddress );

  const FlowIDTableStakingName = "FlowIDTableStaking";
  const FlowIDTableStakingAddress = await getAccountAddress("FlowIDTableStaking");
  const FlowIDTableStakingAddressMap = {};
  const FlowIDTableStakingArgs = [1250000.0, 0.08];
  await deployContractByName({ to: FlowIDTableStakingAddress, name: FlowIDTableStakingName, addressMap: FlowIDTableStakingAddressMap, args: FlowIDTableStakingArgs });
  const FlowIDTableStakingContractAddress = await getContractAddress(FlowIDTableStakingName);
  console.log(FlowIDTableStakingName + " deployed in ", FlowIDTableStakingContractAddress );

  const FlowServiceAccountName = "FlowServiceAccount";
  const FlowServiceAccountAddress = await getAccountAddress("FlowServiceAccount");
  const FlowServiceAccountAddressMap = {};
  const FlowServiceAccountArgs = [];
  await deployContractByName({ to: FlowServiceAccountAddress, name: FlowServiceAccountName, addressMap: FlowServiceAccountAddressMap, args: FlowServiceAccountArgs });
  const FlowServiceAccountContractAddress = await getContractAddress(FlowServiceAccountName);
  console.log(FlowServiceAccountName + " deployed in ", FlowServiceAccountContractAddress );

  const StakingProxyName = "StakingProxy";
  const StakingProxyAddress = await getAccountAddress("StakingProxy");
  const StakingProxyAddressMap = {};
  const StakingProxyArgs = [];
  await deployContractByName({ to: StakingProxyAddress, name: StakingProxyName, addressMap: StakingProxyAddressMap, args: StakingProxyArgs });
  const StakingProxyContractAddress = await getContractAddress(StakingProxyName);
  console.log(StakingProxyName + " deployed in ", StakingProxyContractAddress );

  const LockedTokensName = "LockedTokens";
  const LockedTokensAddress = await getAccountAddress("LockedTokens");
  const LockedTokensAddressMap = {FlowToken: FlowTokenAddress, FungibleToken: FungibleTokenAddress, FlowIDTableStaking: FlowIDTableStakingAddress, FlowStorageFees: FlowStorageFeesAddress, StakingProxy: StakingProxyAddress};
  const LockedTokensArgs = [];
  await deployContractByName({ to: LockedTokensAddress, name: LockedTokensName, addressMap: LockedTokensAddressMap, args: LockedTokensArgs });
  const LockedTokensContractAddress = await getContractAddress(LockedTokensName);
  console.log(LockedTokensName + " deployed in ", LockedTokensContractAddress );

  const FlowClusterQCName = "FlowClusterQC";
  const FlowClusterQCAddress = await getAccountAddress("FlowClusterQC");
  const FlowClusterQCAddressMap = {};
  const FlowClusterQCArgs = [];
  await deployContractByName({ to: FlowClusterQCAddress, name: FlowClusterQCName, addressMap: FlowClusterQCAddressMap, args: FlowClusterQCArgs });
  const FlowClusterQCContractAddress = await getContractAddress(FlowClusterQCName);
  console.log(FlowClusterQCName + " deployed in ", FlowClusterQCContractAddress );

  const FlowDKGName = "FlowDKG";
  const FlowDKGAddress = await getAccountAddress("FlowDKG");
  const FlowDKGAddressMap = {};
  const FlowDKGArgs = [];
  await deployContractByName({ to: FlowDKGAddress, name: FlowDKGName, addressMap: FlowDKGAddressMap, args: FlowDKGArgs });
  const FlowDKGContractAddress = await getContractAddress(FlowDKGName);
  console.log(FlowDKGName + " deployed in ", FlowDKGContractAddress );

  await mintFlow(FlowIDTableStakingAddress, "100.0");

  const FlowEpochName = "FlowEpoch";
  // const FlowEpochAddress = await getAccountAddress("FlowEpoch");
  const FlowEpochAddress = FlowIDTableStakingAddress;
  const FlowEpochAddressMap = {FlowToken: FlowTokenAddress, FungibleToken: FungibleTokenAddress, FlowIDTableStaking: FlowIDTableStakingAddress, FlowFees: FlowFeesAddress, FlowDKG: FlowDKGAddress, FlowClusterQC: FlowClusterQCAddress};
  const FlowEpochArgs = [0, 70, 50, 2, 2, 0.00093871, "lolsoRandom"];
  await deployContractByName({ to: FlowEpochAddress, name: FlowEpochName, addressMap: FlowEpochAddressMap, args: FlowEpochArgs });
  const FlowEpochContractAddress = await getContractAddress(FlowEpochName);
  console.log(FlowEpochName + " deployed in ", FlowEpochContractAddress );

  const FlowStakingCollectionName = "FlowStakingCollection";
  const FlowStakingCollectionAddress = LockedTokensAddress;
  await mintFlow(FlowStakingCollectionAddress, "10000.0");
  const FlowStakingCollectionAddressMap = {FungibleToken: FungibleTokenAddress, FlowToken: FlowTokenAddress, FlowIDTableStaking: FlowIDTableStakingAddress, LockedTokens: LockedTokensAddress, FlowStorageFees: FlowStorageFeesAddress, FlowClusterQC: FlowClusterQCAddress, FlowDKG: FlowDKGAddress, FlowEpoch: FlowEpochAddress};
  const FlowStakingCollectionArgs = [];
  await deployContractByName({ to: FlowStakingCollectionAddress, name: FlowStakingCollectionName, addressMap: FlowStakingCollectionAddressMap, args: FlowStakingCollectionArgs });
  const FlowStakingCollectionContractAddress = await getContractAddress(FlowStakingCollectionName);
  console.log(FlowStakingCollectionName + " deployed in ", FlowStakingCollectionContractAddress );

  const sFlowTokenName = "sFlowToken";
  const sFlowTokenAddress = await getAccountAddress("sFlowToken");
  await mintFlow(sFlowTokenAddress, "1000.0");

  var txCode = await getTemplate("./transactions/stakingCollection/setup_staking_collection.cdc",
    {FlowIDTableStaking: FlowIDTableStakingAddress, LockedTokens: LockedTokensAddress, FlowStakingCollection: FlowStakingCollectionAddress});
  var [tx, error] = await sendTransaction({code: txCode, signers: [sFlowTokenAddress]});
  console.log("FlowStakingCollection is set up");

  txCode = await getTemplate("./transactions/stakingCollection/register_delegator.cdc",
  {FlowStakingCollection: FlowStakingCollectionAddress});
  [tx, error] = await sendTransaction({code: txCode, signers: [sFlowTokenAddress], args: ["First_Node", 500.0]});
  console.log("Delegation to " + "First_Node" + "is Registered with " + 500.0 + "Flows" );

  txCode = await getTemplate("./transactions/stakingCollection/scripts/get_all_delegator_info.cdc",
  {FlowStakingCollection: FlowStakingCollectionAddress, FlowIDTableStaking: FlowIDTableStakingAddress});
  [tx, error] = await executeScript({code: txCode, args: [sFlowTokenAddress]});
  console.log("Current Delegating Info is", { tx });

  const sFlowTokenAddressMap = {FlowStakingCollection: FlowStakingCollectionAddress};
  const sFlowTokenArgs = [];
  await deployContractByName({ to: sFlowTokenAddress, name: sFlowTokenName, addressMap: sFlowTokenAddressMap, args: sFlowTokenArgs });
  const sFlowTokenContractAddress = await getContractAddress(sFlowTokenName);
  console.log(sFlowTokenName + " deployed in ", sFlowTokenContractAddress );

  const sFlowStakingManagerName = "sFlowStakingManager";
  const sFlowStakingManagerAddress = sFlowTokenAddress;
  const sFlowStakingManagerAddressMap = {sFlowToken: sFlowTokenAddress, FlowStakingCollection: FlowStakingCollectionAddress, FlowIDTableStaking: FlowIDTableStakingAddress, };
  const sFlowStakingManagerArgs = ["First_Node", 1];
  await deployContractByName({ to: sFlowStakingManagerAddress, name: sFlowStakingManagerName, addressMap: sFlowStakingManagerAddressMap, args: sFlowStakingManagerArgs });
  const sFlowStakingManagerContractAddress = await getContractAddress(sFlowStakingManagerName);
  console.log(sFlowStakingManagerName + " deployed in ", sFlowStakingManagerContractAddress );

  const managerAddress = await getAccountAddress("manager");
  txCode = await getTemplate("./transactions/stakingManager/setup_manager_account.cdc",
  {sFlowStakingManager: sFlowStakingManagerAddress});
  [tx, error] = await sendTransaction({code: txCode, signers: [managerAddress]});
  console.log("Manager Account is set up");

  txCode = await getTemplate("./transactions/stakingManager/set_manager_capability_to_account.cdc",
  {sFlowStakingManager: sFlowStakingManagerAddress});
  [tx, error] = await sendTransaction({code: txCode, signers: [sFlowStakingManagerAddress], args: [managerAddress]});
  console.log("Give Admin Capability to Manager Account")

  console.log("Contracts Initialized Successfullly!");

  const user1Address = await getAccountAddress("user1");
  await mintFlow(user1Address, "1000.0");
  const user2Address = await getAccountAddress("user2");

  txCode = await getTemplate("./transactions/sFlowToken/scripts/account_initialized.cdc",
  {sFlowToken: sFlowTokenAddress});
  [tx, error] = await executeScript({code: txCode, args: [user1Address]});
  if(tx == false){
    console.log("user1's sFlowToken account is not initialized and so initializing it now...")
    txCode = await getTemplate("./transactions/sFlowToken/init_account.cdc",
    {sFlowToken: sFlowTokenAddress});
    [tx, error] = await sendTransaction({code: txCode, signers: [user1Address], args: []});
    console.log("user1's sFlowToken account is initialized");
  }

  txCode = await getTemplate("./transactions/sFlowToken/scripts/account_initialized.cdc",
  {sFlowToken: sFlowTokenAddress});
  [tx, error] = await executeScript({code: txCode, args: [user2Address]});
  if(tx == false){
    console.log("user2's sFlowToken account is not initialized and so initializing it now...")
    txCode = await getTemplate("./transactions/sFlowToken/init_account.cdc",
    {sFlowToken: sFlowTokenAddress});
    [tx, error] = await sendTransaction({code: txCode, signers: [user2Address], args: []});
    console.log("user2's account is initialized");
  }
  
  txCode = await getTemplate("./transactions/stakingCollection/scripts/get_all_delegator_info.cdc",
  {FlowStakingCollection: FlowStakingCollectionAddress, FlowIDTableStaking: FlowIDTableStakingAddress});
  [tx, error] = await executeScript({code: txCode, args: [sFlowTokenAddress]});
  console.log("Current Delegating Info is", { tx });
  txCode = await getTemplate("./transactions/flowToken/scripts/get_balance.cdc",
  {});
  [tx, error] = await executeScript({code: txCode, args: [sFlowStakingManagerAddress]});
  console.log("Current Pool balance is " + tx)

  txCode = await getTemplate("./transactions/idTableStaking/admin/start_staking.cdc",
  {FlowIDTableStaking: FlowIDTableStakingAddress});
  [tx, error] = await sendTransaction({code: txCode, signers: [FlowIDTableStakingAddress], args: []});
  console.log("Staking Auction Started");

  txCode = await getTemplate("./transactions/stakingManager/stake.cdc",
  {sFlowToken: sFlowTokenAddress, sFlowStakingManager: sFlowStakingManagerAddress});
  [tx, error] = await sendTransaction({code: txCode, signers: [user1Address], args: [100.0]});
  console.log("user1 staked 100 Flow to the platform")

  txCode = await getTemplate("./transactions/flowToken/scripts/get_balance.cdc",
  {});
  [tx, error] = await executeScript({code: txCode, args: [user1Address]});
  console.log("user1's Flow balance is " + tx)

  txCode = await getTemplate("./transactions/sFlowToken/scripts/get_sFlow_balance.cdc",
  {sFlowToken: sFlowTokenAddress});
  [tx, error] = await executeScript({code: txCode, args: [user1Address]});
  console.log("user1's sFlow balance is " + tx)

  txCode = await getTemplate("./transactions/stakingCollection/scripts/get_all_delegator_info.cdc",
  {FlowStakingCollection: FlowStakingCollectionAddress, FlowIDTableStaking: FlowIDTableStakingAddress});
  [tx, error] = await executeScript({code: txCode, args: [sFlowTokenAddress]});
  console.log("Current Delegating Info is", { tx });
  txCode = await getTemplate("./transactions/flowToken/scripts/get_balance.cdc",
  {});
  [tx, error] = await executeScript({code: txCode, args: [sFlowStakingManagerAddress]});
  console.log("Current Pool balance is " + tx)

  txCode = await getTemplate("./transactions/stakingManager/stake.cdc",
  {sFlowToken: sFlowTokenAddress, sFlowStakingManager: sFlowStakingManagerAddress});
  [tx, error] = await sendTransaction({code: txCode, signers: [user2Address], args: [100.0]});
  console.log("user2 staking 100 Flow to the platform and failed cause there is no Flow with this error", {error})

  txCode = await getTemplate("./transactions/stakingCollection/scripts/get_all_delegator_info.cdc",
  {FlowStakingCollection: FlowStakingCollectionAddress, FlowIDTableStaking: FlowIDTableStakingAddress});
  [tx, error] = await executeScript({code: txCode, args: [sFlowTokenAddress]});
  console.log("Current Delegating Info is", { tx });
  txCode = await getTemplate("./transactions/flowToken/scripts/get_balance.cdc",
  {});
  [tx, error] = await executeScript({code: txCode, args: [sFlowStakingManagerAddress]});
  console.log("Current Pool balance is " + tx)

  await emulator.stop();
};

main();