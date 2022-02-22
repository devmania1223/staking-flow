import path from "path"
import { config } from "@onflow/config";
import { fileURLToPath } from 'url';
import { init, 
  emulator, 
  deployContractByName, 
  getContractAddress , 
  getAccountAddress, 
  getTemplate, 
  sendTransaction, 
  mintFlow, 
  executeScript,  
} from "flow-js-testing";
import expect from "expect"
import { TestUtils } from "@onflow/fcl";

jest.setTimeout(60000);

describe("Testing Staking Manager", () => {
  // const __filename = fileURLToPath(import.meta.url);
  // const __dirname = path.dirname(__filename);

  const basePath = path.resolve(__dirname, "../cadence");
  const port = 8080;

  const FungibleTokenAddress = "0xee82856bf20e2aa6";
  const FlowTokenAddress = "0x0ae53cb6e3f42a79";
  const FlowStorageFeesAddress = "0xf8d6e0586b0a20c7";

  let FlowFeesAddress,
    FlowContractAuditsAddress,
    FlowIDTableStakingAddress,
    FlowServiceAccountAddress,
    StakingProxyAddress,
    LockedTokensAddress,
    FlowClusterQCAddress,
    FlowDKGAddress,
    FlowEpochAddress,
    FlowStakingCollectionAddress,
    sFlowTokenAddress,
    sFlowStakingManagerAddress,
    managerAddress,
    user1Address,
    user2Address,
    tx,
    error,
    txCode,
    tokensCommitted,
    tokensInPool,
    tokensRewarded,
    tokenPrice
    user1FlowBalance = 0.0,
    user1sFlowBalance = 0.0,
    user2FlowBalance = 0.0,
    user2sFlowBalance = 0.0;

  beforeAll(async () => {
    await init(basePath, { port });
    await emulator.start(port);
  });

  test("Deploying FlowFees Contract", async () => {
    const FlowFeesName = "FlowFees";
    FlowFeesAddress = await getAccountAddress("FlowFees");
    const FlowFeesAddressMap = {};
    const FlowFeesArgs = [];
    [tx, error] = await deployContractByName({ to: FlowFeesAddress, name: FlowFeesName, addressMap: FlowFeesAddressMap });
    const FlowFeesContractAddress = await getContractAddress(FlowFeesName);
    expect(error).toBe(null);
  });

  test("Deploying FlowContractAudits Contract", async () => {
    const FlowContractAuditsName = "FlowContractAudits";
    FlowContractAuditsAddress = await getAccountAddress("FlowContractAudits");
    const FlowContractAuditsAddressMap = {};
    const FlowContractAuditsArgs = [];
    [tx, error] = await deployContractByName({ to: FlowContractAuditsAddress, name: FlowContractAuditsName, addressMap: FlowContractAuditsAddressMap });
    const FlowContractAuditsContractAddress = await getContractAddress(FlowContractAuditsName);
    expect(error).toBe(null);
  });

  test("Deploying FlowIDTableStaking Contract", async () => {
    const FlowIDTableStakingName = "FlowIDTableStaking";
    FlowIDTableStakingAddress = await getAccountAddress("FlowIDTableStaking");
    const FlowIDTableStakingAddressMap = {};
    const FlowIDTableStakingArgs = [1250000.0, 0.08];
    [tx, error] = await deployContractByName({ to: FlowIDTableStakingAddress, name: FlowIDTableStakingName, addressMap: FlowIDTableStakingAddressMap, args: FlowIDTableStakingArgs });
    const FlowIDTableStakingContractAddress = await getContractAddress(FlowIDTableStakingName);
    expect(error).toBe(null);
  });

  test("Deploying FlowServiceAccount Contract", async () => {
    const FlowServiceAccountName = "FlowServiceAccount";
    FlowServiceAccountAddress = await getAccountAddress("FlowServiceAccount");
    const FlowServiceAccountAddressMap = {};
    const FlowServiceAccountArgs = [];
    [tx, error] = await deployContractByName({ to: FlowServiceAccountAddress, name: FlowServiceAccountName, addressMap: FlowServiceAccountAddressMap, args: FlowServiceAccountArgs });
    const FlowServiceAccountContractAddress = await getContractAddress(FlowServiceAccountName);
    expect(error).toBe(null);
  });

  test("Deploying StakingProxy Contract", async () => {
    const StakingProxyName = "StakingProxy";
    StakingProxyAddress = await getAccountAddress("StakingProxy");
    const StakingProxyAddressMap = {};
    const StakingProxyArgs = [];
    [tx, error] = await deployContractByName({ to: StakingProxyAddress, name: StakingProxyName, addressMap: StakingProxyAddressMap, args: StakingProxyArgs });
    const StakingProxyContractAddress = await getContractAddress(StakingProxyName);
    expect(error).toBe(null);
  });

  test("Deploying LockedTokens Contract", async () => {
    const LockedTokensName = "LockedTokens";
    LockedTokensAddress = await getAccountAddress("LockedTokens");
    const LockedTokensAddressMap = {FlowToken: FlowTokenAddress, FungibleToken: FungibleTokenAddress, FlowIDTableStaking: FlowIDTableStakingAddress, FlowStorageFees: FlowStorageFeesAddress, StakingProxy: StakingProxyAddress};
    const LockedTokensArgs = [];
    [tx, error] = await deployContractByName({ to: LockedTokensAddress, name: LockedTokensName, addressMap: LockedTokensAddressMap, args: LockedTokensArgs });
    const LockedTokensContractAddress = await getContractAddress(LockedTokensName);
    expect(error).toBe(null);
  });

  test("Deploying FlowClusterQC Contract", async () => {
    const FlowClusterQCName = "FlowClusterQC";
    FlowClusterQCAddress = await getAccountAddress("FlowClusterQC");
    const FlowClusterQCAddressMap = {};
    const FlowClusterQCArgs = [];
    [tx, error] = await deployContractByName({ to: FlowClusterQCAddress, name: FlowClusterQCName, addressMap: FlowClusterQCAddressMap, args: FlowClusterQCArgs });
    const FlowClusterQCContractAddress = await getContractAddress(FlowClusterQCName);
    expect(error).toBe(null);
  });

  test("Deploying FlowDKG Contract", async () => {
    const FlowDKGName = "FlowDKG";
    FlowDKGAddress = await getAccountAddress("FlowDKG");
    const FlowDKGAddressMap = {};
    const FlowDKGArgs = [];
    [tx, error] = await deployContractByName({ to: FlowDKGAddress, name: FlowDKGName, addressMap: FlowDKGAddressMap, args: FlowDKGArgs });
    const FlowDKGContractAddress = await getContractAddress(FlowDKGName);
    expect(error).toBe(null);
  });

  test("Deploying FlowEpoch Contract", async () => {
    await mintFlow(FlowIDTableStakingAddress, "100.0");

    const FlowEpochName = "FlowEpoch";
    // const FlowEpochAddress = await getAccountAddress("FlowEpoch");
    FlowEpochAddress = FlowIDTableStakingAddress;
    const FlowEpochAddressMap = {FlowToken: FlowTokenAddress, FungibleToken: FungibleTokenAddress, FlowIDTableStaking: FlowIDTableStakingAddress, FlowFees: FlowFeesAddress, FlowDKG: FlowDKGAddress, FlowClusterQC: FlowClusterQCAddress};
    const FlowEpochArgs = [0, 70, 50, 2, 2, 0.00093871, "lolsoRandom"];
    [tx, error] = await deployContractByName({ to: FlowEpochAddress, name: FlowEpochName, addressMap: FlowEpochAddressMap, args: FlowEpochArgs });
    const FlowEpochContractAddress = await getContractAddress(FlowEpochName);
    expect(error).toBe(null);
  });

  test("Deploying FlowStakingCollection Contract", async () => {
    const FlowStakingCollectionName = "FlowStakingCollection";
    FlowStakingCollectionAddress = LockedTokensAddress;
    await mintFlow(FlowStakingCollectionAddress, "10000.0");
    const FlowStakingCollectionAddressMap = {FungibleToken: FungibleTokenAddress, FlowToken: FlowTokenAddress, FlowIDTableStaking: FlowIDTableStakingAddress, LockedTokens: LockedTokensAddress, FlowStorageFees: FlowStorageFeesAddress, FlowClusterQC: FlowClusterQCAddress, FlowDKG: FlowDKGAddress, FlowEpoch: FlowEpochAddress};
    const FlowStakingCollectionArgs = [];
    [tx, error] = await deployContractByName({ to: FlowStakingCollectionAddress, name: FlowStakingCollectionName, addressMap: FlowStakingCollectionAddressMap, args: FlowStakingCollectionArgs });
    const FlowStakingCollectionContractAddress = await getContractAddress(FlowStakingCollectionName);
    expect(error).toBe(null);
  });

  test("Deploying sFlowToken Contract", async () => {
    const sFlowTokenName = "sFlowToken";
    sFlowTokenAddress = await getAccountAddress("sFlowToken");
    await mintFlow(sFlowTokenAddress, "1000.0");
    tokensInPool = 1000.0

    txCode = await getTemplate("./transactions/stakingCollection/setup_staking_collection.cdc",
      {FlowIDTableStaking: FlowIDTableStakingAddress, LockedTokens: LockedTokensAddress, FlowStakingCollection: FlowStakingCollectionAddress});
    [tx, error] = await sendTransaction({code: txCode, signers: [sFlowTokenAddress]});
    expect(error).toBe(null);

    txCode = await getTemplate("./transactions/stakingCollection/register_delegator.cdc",
    {FlowStakingCollection: FlowStakingCollectionAddress});
    [tx, error] = await sendTransaction({code: txCode, signers: [sFlowTokenAddress], args: ["First_Node", 500.0]});
    tokensInPool = 1000.0 - 500.0
    tokensCommitted = 500.0
    expect(error).toBe(null);

    txCode = await getTemplate("./transactions/stakingCollection/scripts/get_all_delegator_info.cdc",
    {FlowStakingCollection: FlowStakingCollectionAddress, FlowIDTableStaking: FlowIDTableStakingAddress});
    [tx, error] = await executeScript({code: txCode, args: [sFlowTokenAddress]});
    expect(Number.parseFloat(tx[0].tokensCommitted)).toBeCloseTo(tokensCommitted, 1);

    const sFlowTokenAddressMap = {FlowStakingCollection: FlowStakingCollectionAddress};
    const sFlowTokenArgs = [];
    [tx, error] = await deployContractByName({ to: sFlowTokenAddress, name: sFlowTokenName, addressMap: sFlowTokenAddressMap, args: sFlowTokenArgs });
    const sFlowTokenContractAddress = await getContractAddress(sFlowTokenName);
    expect(error).toBe(null);
  });

  test("Deploying sFlowStakingManager Contract", async () => {
    const sFlowStakingManagerName = "sFlowStakingManager";
    sFlowStakingManagerAddress = sFlowTokenAddress;
    const sFlowStakingManagerAddressMap = {sFlowToken: sFlowTokenAddress, FlowStakingCollection: FlowStakingCollectionAddress, FlowIDTableStaking: FlowIDTableStakingAddress, };
    const sFlowStakingManagerArgs = ["First_Node", 1];
    [tx, error] = await deployContractByName({ to: sFlowStakingManagerAddress, name: sFlowStakingManagerName, addressMap: sFlowStakingManagerAddressMap, args: sFlowStakingManagerArgs });
    const sFlowStakingManagerContractAddress = await getContractAddress(sFlowStakingManagerName);
    expect(error).toBe(null);
  });

  test("Setup manager account", async () => {
    managerAddress = await getAccountAddress("manager");
    await mintFlow(managerAddress, "1000.0");
    txCode = await getTemplate("./transactions/stakingManager/setup_manager_account.cdc",
    {sFlowStakingManager: sFlowStakingManagerAddress});
    [tx, error] = await sendTransaction({code: txCode, signers: [managerAddress]});
    expect(error).toBe(null);

    txCode = await getTemplate("./transactions/stakingManager/set_manager_capability_to_account.cdc",
    {sFlowStakingManager: sFlowStakingManagerAddress});
    [tx, error] = await sendTransaction({code: txCode, signers: [sFlowStakingManagerAddress], args: [managerAddress]});
    expect(error).toBe(null);
  });

  test("Setup user1 account", async () => {
    user1Address = await getAccountAddress("user1");
    await mintFlow(user1Address, "1000.0");
    user1FlowBalance = 1000.0

    txCode = await getTemplate("./transactions/sFlowToken/scripts/account_initialized.cdc",
    {sFlowToken: sFlowTokenAddress});
    [tx, error] = await executeScript({code: txCode, args: [user1Address]});
    expect(error).toBe(null);
    if(tx == false){
      txCode = await getTemplate("./transactions/sFlowToken/init_account.cdc",
      {sFlowToken: sFlowTokenAddress});
      [tx, error] = await sendTransaction({code: txCode, signers: [user1Address], args: []});
      expect(error).toBe(null);
    }
  });

  test("Setup user2 account", async () => {
    user2Address = await getAccountAddress("user2");
    txCode = await getTemplate("./transactions/sFlowToken/scripts/account_initialized.cdc",
    {sFlowToken: sFlowTokenAddress});

    [tx, error] = await executeScript({code: txCode, args: [user2Address]});
    expect(error).toBe(null);
    if(tx == false){
      txCode = await getTemplate("./transactions/sFlowToken/init_account.cdc",
      {sFlowToken: sFlowTokenAddress});
      [tx, error] = await sendTransaction({code: txCode, signers: [user2Address], args: []});
      expect(error).toBe(null);
    }
  });

  test("Checking Delegation State", async () => {
    txCode = await getTemplate("./transactions/stakingCollection/scripts/get_all_delegator_info.cdc",
    {FlowStakingCollection: FlowStakingCollectionAddress, FlowIDTableStaking: FlowIDTableStakingAddress});
    [tx, error] = await executeScript({code: txCode, args: [sFlowTokenAddress]});
    expect(error).toBe(null);
    expect(Number.parseFloat(tx[0].tokensCommitted)).toBeCloseTo(tokensCommitted, 1);
    txCode = await getTemplate("./transactions/flowToken/scripts/get_balance.cdc",
    {});
    [tx, error] = await executeScript({code: txCode, args: [sFlowStakingManagerAddress]});
    expect(error).toBe(null);
    expect(tx).toBeCloseTo(tokensInPool, 1);
  });

  test("Staring Staking Auction", async () => {
    txCode = await getTemplate("./transactions/idTableStaking/admin/start_staking.cdc",
    {FlowIDTableStaking: FlowIDTableStakingAddress});
    [tx, error] = await sendTransaction({code: txCode, signers: [FlowIDTableStakingAddress], args: []});
    expect(error).toBe(null);
  });

  test("User1 stake 100 Flow and receive 100sFlow", async () => {
    txCode = await getTemplate("./transactions/stakingManager/stake.cdc",
    {sFlowToken: sFlowTokenAddress, sFlowStakingManager: sFlowStakingManagerAddress});
    [tx, error] = await sendTransaction({code: txCode, signers: [user1Address], args: [100.0]});
    expect(error).toBe(null);

    txCode = await getTemplate("./transactions/flowToken/scripts/get_balance.cdc",
    {});
    [tx, error] = await executeScript({code: txCode, args: [user1Address]});
    expect(Number.parseFloat(tx)).toBeCloseTo(1000.0 - 100.0, 1);
    console.log("user1's Flow balance is " + tx)

    txCode = await getTemplate("./transactions/sFlowToken/scripts/get_sFlow_balance.cdc",
    {sFlowToken: sFlowTokenAddress});
    [tx, error] = await executeScript({code: txCode, args: [user1Address]});
    expect(Number.parseFloat(tx)).toBeCloseTo(100.0, 1);
    console.log("user1's sFlow balance is " + tx)

    txCode = await getTemplate("./transactions/stakingCollection/scripts/get_all_delegator_info.cdc",
    {FlowStakingCollection: FlowStakingCollectionAddress, FlowIDTableStaking: FlowIDTableStakingAddress});
    [tx, error] = await executeScript({code: txCode, args: [sFlowTokenAddress]});
    console.log("Current Delegating Info is", { tx });
    txCode = await getTemplate("./transactions/flowToken/scripts/get_balance.cdc",
    {});
    [tx, error] = await executeScript({code: txCode, args: [sFlowStakingManagerAddress]});
    expect(Number.parseFloat(tx)).toBeCloseTo(100.0 + 500.0, 1);
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

    txCode = await getTemplate("./transactions/stakingManager/manage_collection.cdc",
    {sFlowStakingManager: sFlowStakingManagerAddress});
    [tx, error] = await sendTransaction({code: txCode, signers: [managerAddress], args: []});
    console.log("manager managed collection");

    txCode = await getTemplate("./transactions/stakingCollection/scripts/get_all_delegator_info.cdc",
    {FlowStakingCollection: FlowStakingCollectionAddress, FlowIDTableStaking: FlowIDTableStakingAddress});
    [tx, error] = await executeScript({code: txCode, args: [sFlowTokenAddress]});
    expect(Number.parseFloat(tx[0].tokensCommitted)).toBeCloseTo(500.0 + 600.0 - 10.1, 1);
    console.log("Current Delegating Info is", { tx });
    txCode = await getTemplate("./transactions/flowToken/scripts/get_balance.cdc",
    {});
    [tx, error] = await executeScript({code: txCode, args: [sFlowStakingManagerAddress]});
    expect(Number.parseFloat(tx)).toBeCloseTo(10.1, 1);
    console.log("Current Pool balance is " + tx)

    txCode = await getTemplate("./transactions/idTableStaking/admin/end_staking.cdc",
    {FlowIDTableStaking: FlowIDTableStakingAddress});
    [tx, error] = await sendTransaction({code: txCode, signers: [FlowIDTableStakingAddress], args: []});
    console.log("Staking Auction Ended");

    txCode = await getTemplate("./transactions/stakingManager/stake.cdc",
    {sFlowToken: sFlowTokenAddress, sFlowStakingManager: sFlowStakingManagerAddress});
    [tx, error] = await sendTransaction({code: txCode, signers: [user1Address], args: [100.0]});
    console.log("user1 staked 100 Flow to the platform")

    txCode = await getTemplate("./transactions/flowToken/scripts/get_balance.cdc",
    {});
    [tx, error] = await executeScript({code: txCode, args: [user1Address]});
    expect(Number.parseFloat(tx)).toBeCloseTo(900.0 - 100.0, 1);
    console.log("user1's Flow balance is " + tx)

    txCode = await getTemplate("./transactions/sFlowToken/scripts/get_sFlow_balance.cdc",
    {sFlowToken: sFlowTokenAddress});
    [tx, error] = await executeScript({code: txCode, args: [user1Address]});
    expect(Number.parseFloat(tx)).toBeCloseTo(100.0 + 100.0, 1);
    console.log("user1's sFlow balance is " + tx)

    txCode = await getTemplate("./transactions/stakingCollection/scripts/get_all_delegator_info.cdc",
    {FlowStakingCollection: FlowStakingCollectionAddress, FlowIDTableStaking: FlowIDTableStakingAddress});
    [tx, error] = await executeScript({code: txCode, args: [sFlowTokenAddress]});
    console.log("Current Delegating Info is", { tx });
    txCode = await getTemplate("./transactions/flowToken/scripts/get_balance.cdc",
    {});
    [tx, error] = await executeScript({code: txCode, args: [sFlowStakingManagerAddress]});
    expect(Number.parseFloat(tx)).toBeCloseTo(10.1 + 100.0, 1);
    console.log("Current Pool balance is " + tx)

    txCode = await getTemplate("./transactions/stakingManager/manage_collection.cdc",
    {sFlowStakingManager: sFlowStakingManagerAddress});
    [tx, error] = await sendTransaction({code: txCode, signers: [managerAddress], args: []});
    console.log("manager managed collection");

    txCode = await getTemplate("./transactions/stakingCollection/scripts/get_all_delegator_info.cdc",
    {FlowStakingCollection: FlowStakingCollectionAddress, FlowIDTableStaking: FlowIDTableStakingAddress});
    [tx, error] = await executeScript({code: txCode, args: [sFlowTokenAddress]});
    tokensCommitted = tx[0].tokensCommitted;
    console.log("Current Delegating Info is", { tx });
    txCode = await getTemplate("./transactions/flowToken/scripts/get_balance.cdc",
    {});
    [tx, error] = await executeScript({code: txCode, args: [sFlowStakingManagerAddress]});
    tokensInPool = tx;
    console.log("Current Pool balance is " + tx)

    txCode = await getTemplate("./transactions/stakingCollection/process_staking.cdc",
    {FlowStakingCollection: FlowStakingCollectionAddress});
    [tx, error] = await sendTransaction({code: txCode, signers: [sFlowTokenAddress], args: []});
    console.log("Epoch updated delegation info");

    txCode = await getTemplate("./transactions/stakingCollection/scripts/get_all_delegator_info.cdc",
    {FlowStakingCollection: FlowStakingCollectionAddress, FlowIDTableStaking: FlowIDTableStakingAddress});
    [tx, error] = await executeScript({code: txCode, args: [sFlowTokenAddress]});
    expect(Number.parseFloat(tx[0].tokensCommitted)).toBeCloseTo(0.0, 1);
    expect(Number.parseFloat(tx[0].tokensStaked)).toBeCloseTo(Number.parseFloat(tokensCommitted), 1);
    console.log("Current Delegating Info is", { tx });
    txCode = await getTemplate("./transactions/flowToken/scripts/get_balance.cdc",
    {});
    [tx, error] = await executeScript({code: txCode, args: [sFlowStakingManagerAddress]});
    console.log("Current Pool balance is " + tx)

    txCode = await getTemplate("./transactions/stakingManager/scripts/get_current_price.cdc",
    {sFlowStakingManager: sFlowStakingManagerAddress});
    [tx, error] = await executeScript({code: txCode, args: []});
    console.log("Current sFlow Price is", { tx });

    txCode = await getTemplate("./transactions/stakingCollection/give_reward.cdc",
    {FlowStakingCollection: FlowStakingCollectionAddress});
    [tx, error] = await sendTransaction({code: txCode, signers: [sFlowTokenAddress], args: []});
    console.log("Epoch gave reward");

    txCode = await getTemplate("./transactions/stakingCollection/scripts/get_all_delegator_info.cdc",
    {FlowStakingCollection: FlowStakingCollectionAddress, FlowIDTableStaking: FlowIDTableStakingAddress});
    [tx, error] = await executeScript({code: txCode, args: [sFlowTokenAddress]});
    tokensRewarded = tx[0].tokensRewarded;
    console.log("Current Delegating Info is", { tx });

    txCode = await getTemplate("./transactions/stakingManager/scripts/get_current_price.cdc",
    {sFlowStakingManager: sFlowStakingManagerAddress});
    [tx, error] = await executeScript({code: txCode, args: []});
    tokenPrice = tx;
    expect(Number.parseFloat(tx)).toBeCloseTo((Number.parseFloat(tokensCommitted) + Number.parseFloat(tokensInPool) + Number.parseFloat(tokensRewarded)) / (1000.0 + 100.0 + 100.0), 1);
    console.log("Current sFlow Price is", { tx });

    txCode = await getTemplate("./transactions/stakingManager/unstake.cdc",
    {sFlowToken: sFlowTokenAddress, sFlowStakingManager: sFlowStakingManagerAddress});
    [tx, error] = await sendTransaction({code: txCode, signers: [user1Address], args: [30.0]});
    console.log("user1 request to unstake 30.0 sFlow to the platform")

    txCode = await getTemplate("./transactions/stakingManager/scripts/get_requested_unstake_amount.cdc",
    {});
    [tx, error] = await executeScript({code: txCode, args: [user1Address]});
    expect(Number.parseFloat(tx)).toBeCloseTo(30.0, 1);
    console.log("user1's current requested unstake amount is " + tx)

    txCode = await getTemplate("./transactions/flowToken/scripts/get_balance.cdc",
    {});
    [tx, error] = await executeScript({code: txCode, args: [user1Address]});
    expect(Number.parseFloat(tx)).toBeCloseTo(1000.0 - 100.0 - 100.0 , 1);
    console.log("user1's Flow balance is " + tx)

    txCode = await getTemplate("./transactions/sFlowToken/scripts/get_sFlow_balance.cdc",
    {sFlowToken: sFlowTokenAddress});
    [tx, error] = await executeScript({code: txCode, args: [user1Address]});
    expect(Number.parseFloat(tx)).toBeCloseTo(100.0 + 100.0 - 30.0, 1);
    console.log("user1's sFlow balance is " + tx)

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

    await mintFlow(user2Address, "1000.0");
    txCode = await getTemplate("./transactions/stakingManager/stake.cdc",
    {sFlowToken: sFlowTokenAddress, sFlowStakingManager: sFlowStakingManagerAddress});
    [tx, error] = await sendTransaction({code: txCode, signers: [user2Address], args: [70.0]});
    console.log("user2 staked 70.0 Flow to the platform")

    txCode = await getTemplate("./transactions/flowToken/scripts/get_balance.cdc",
    {});
    [tx, error] = await executeScript({code: txCode, args: [user2Address]});
    expect(Number.parseFloat(tx)).toBeCloseTo(1000.0 - 70.0 , 1);
    console.log("user2's Flow balance is " + tx)

    txCode = await getTemplate("./transactions/sFlowToken/scripts/get_sFlow_balance.cdc",
    {sFlowToken: sFlowTokenAddress});
    [tx, error] = await executeScript({code: txCode, args: [user2Address]});
    expect(Number.parseFloat(tx)).toBeCloseTo(70.0/tokenPrice, 1);
    console.log("user2's sFlow balance is " + tx)

    txCode = await getTemplate("./transactions/stakingCollection/scripts/get_all_delegator_info.cdc",
    {FlowStakingCollection: FlowStakingCollectionAddress, FlowIDTableStaking: FlowIDTableStakingAddress});
    [tx, error] = await executeScript({code: txCode, args: [sFlowTokenAddress]});
    console.log("Current Delegating Info is", { tx });
    txCode = await getTemplate("./transactions/flowToken/scripts/get_balance.cdc",
    {});
    [tx, error] = await executeScript({code: txCode, args: [sFlowStakingManagerAddress]});
    console.log("Current Pool balance is " + tx)

    txCode = await getTemplate("./transactions/stakingManager/manage_collection.cdc",
    {sFlowStakingManager: sFlowStakingManagerAddress});
    [tx, error] = await sendTransaction({code: txCode, signers: [managerAddress], args: []});
    console.log("manager managed collection");

    txCode = await getTemplate("./transactions/stakingManager/scripts/get_requested_unstake_amount.cdc",
    {});
    [tx, error] = await executeScript({code: txCode, args: [user1Address]});
    console.log("user1's current requested unstake amount is " + tx)

    txCode = await getTemplate("./transactions/flowToken/scripts/get_balance.cdc",
    {});
    [tx, error] = await executeScript({code: txCode, args: [user1Address]});
    expect(Number.parseFloat(tx)).toBeCloseTo(800.0 + 30.0 * tokenPrice , 1);
    console.log("user1's Flow balance is " + tx)

    txCode = await getTemplate("./transactions/sFlowToken/scripts/get_sFlow_balance.cdc",
    {sFlowToken: sFlowTokenAddress});
    [tx, error] = await executeScript({code: txCode, args: [user1Address]});
    console.log("user1's sFlow balance is " + tx)

    txCode = await getTemplate("./transactions/stakingCollection/scripts/get_all_delegator_info.cdc",
    {FlowStakingCollection: FlowStakingCollectionAddress, FlowIDTableStaking: FlowIDTableStakingAddress});
    [tx, error] = await executeScript({code: txCode, args: [sFlowTokenAddress]});
    expect(Number.parseFloat(tx[0].tokensCommitted)).toBeCloseTo(100.0 + 70.0 + 1089.9 / 10.0 - 30.0 * tokenPrice  , 1);
    console.log("Current Delegating Info is", { tx });
    txCode = await getTemplate("./transactions/flowToken/scripts/get_balance.cdc",
    {});
    [tx, error] = await executeScript({code: txCode, args: [sFlowStakingManagerAddress]});
    console.log("Current Pool balance is " + tx)

    txCode = await getTemplate("./transactions/stakingCollection/register_delegator.cdc",
    {FlowStakingCollection: FlowStakingCollectionAddress});
    [tx, error] = await sendTransaction({code: txCode, signers: [sFlowTokenAddress], args: ["Second_Node", 5.0]});
    console.log("Delegation to " + "Second_Node" + " is Registered with " + 5.0 + "Flows" );

    txCode = await getTemplate("./transactions/stakingCollection/scripts/get_all_delegator_info.cdc",
    {FlowStakingCollection: FlowStakingCollectionAddress, FlowIDTableStaking: FlowIDTableStakingAddress});
    [tx, error] = await executeScript({code: txCode, args: [sFlowTokenAddress]});
    console.log("Current Delegating Info is", { tx });
    txCode = await getTemplate("./transactions/flowToken/scripts/get_balance.cdc",
    {});

    txCode = await getTemplate("./transactions/stakingManager/set_new_delegator.cdc",
    {sFlowStakingManager: sFlowStakingManagerAddress});
    [tx, error] = await sendTransaction({code: txCode, signers: [user1Address], args: ["Second_Node", 2]});
    console.log("user1 attempt to change delegation node and failed with this error", {error});

    txCode = await getTemplate("./transactions/stakingManager/set_new_delegator.cdc",
    {sFlowStakingManager: sFlowStakingManagerAddress});
    [tx, error] = await sendTransaction({code: txCode, signers: [managerAddress], args: ["Second_Node", 2]});
    console.log("manager change delegation node");

    txCode = await getTemplate("./transactions/stakingManager/stake.cdc",
    {sFlowToken: sFlowTokenAddress, sFlowStakingManager: sFlowStakingManagerAddress});
    [tx, error] = await sendTransaction({code: txCode, signers: [user1Address], args: [100.0]});
    console.log("user1 staked 100 Flow to the platform")

    txCode = await getTemplate("./transactions/flowToken/scripts/get_balance.cdc",
    {});
    [tx, error] = await executeScript({code: txCode, args: [user1Address]});
    expect(Number.parseFloat(tx)).toBeCloseTo(832.7 - 100.0, 1);
    console.log("user1's Flow balance is " + tx)

    txCode = await getTemplate("./transactions/sFlowToken/scripts/get_sFlow_balance.cdc",
    {sFlowToken: sFlowTokenAddress});
    [tx, error] = await executeScript({code: txCode, args: [user1Address]});
    expect(Number.parseFloat(tx)).toBeCloseTo(170.0 + 100.0/tokenPrice, 1);
    console.log("user1's sFlow balance is " + tx)

    txCode = await getTemplate("./transactions/stakingCollection/scripts/get_all_delegator_info.cdc",
    {FlowStakingCollection: FlowStakingCollectionAddress, FlowIDTableStaking: FlowIDTableStakingAddress});
    [tx, error] = await executeScript({code: txCode, args: [sFlowTokenAddress]});
    console.log("Current Delegating Info is", { tx });
    txCode = await getTemplate("./transactions/flowToken/scripts/get_balance.cdc",
    {});
    [tx, error] = await executeScript({code: txCode, args: [sFlowStakingManagerAddress]});
    console.log("Current Pool balance is " + tx)

    txCode = await getTemplate("./transactions/stakingManager/manage_collection.cdc",
    {sFlowStakingManager: sFlowStakingManagerAddress});
    [tx, error] = await sendTransaction({code: txCode, signers: [managerAddress], args: []});
    console.log("manager managed collection");

    txCode = await getTemplate("./transactions/stakingCollection/scripts/get_all_delegator_info.cdc",
    {FlowStakingCollection: FlowStakingCollectionAddress, FlowIDTableStaking: FlowIDTableStakingAddress});
    [tx, error] = await executeScript({code: txCode, args: [sFlowTokenAddress]});
    console.log("Current Delegating Info is", { tx });
    txCode = await getTemplate("./transactions/flowToken/scripts/get_balance.cdc",
    {});
    [tx, error] = await executeScript({code: txCode, args: [sFlowStakingManagerAddress]});
    console.log("Current Pool balance is " + tx)

    txCode = await getTemplate("./transactions/idTableStaking/admin/end_staking.cdc",
    {FlowIDTableStaking: FlowIDTableStakingAddress});
    [tx, error] = await sendTransaction({code: txCode, signers: [FlowIDTableStakingAddress], args: []});
    console.log("Staking Auction Ended");

    txCode = await getTemplate("./transactions/stakingCollection/process_staking.cdc",
    {FlowStakingCollection: FlowStakingCollectionAddress});
    [tx, error] = await sendTransaction({code: txCode, signers: [sFlowTokenAddress], args: []});
    console.log("Epoch updated delegation info");

    txCode = await getTemplate("./transactions/stakingCollection/scripts/get_all_delegator_info.cdc",
    {FlowStakingCollection: FlowStakingCollectionAddress, FlowIDTableStaking: FlowIDTableStakingAddress});
    [tx, error] = await executeScript({code: txCode, args: [sFlowTokenAddress]});
    console.log("Current Delegating Info is", { tx });
    txCode = await getTemplate("./transactions/flowToken/scripts/get_balance.cdc",
    {});
    [tx, error] = await executeScript({code: txCode, args: [sFlowStakingManagerAddress]});
    console.log("Current Pool balance is " + tx)

    txCode = await getTemplate("./transactions/stakingCollection/process_staking.cdc",
    {FlowStakingCollection: FlowStakingCollectionAddress});
    [tx, error] = await sendTransaction({code: txCode, signers: [sFlowTokenAddress], args: []});
    console.log("Epoch updated delegation info");

    txCode = await getTemplate("./transactions/stakingCollection/give_reward.cdc",
    {FlowStakingCollection: FlowStakingCollectionAddress});
    [tx, error] = await sendTransaction({code: txCode, signers: [sFlowTokenAddress], args: []});
    console.log("Epoch gave reward");

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

    txCode = await getTemplate("./transactions/stakingManager/manage_collection.cdc",
    {sFlowStakingManager: sFlowStakingManagerAddress});
    [tx, error] = await sendTransaction({code: txCode, signers: [managerAddress], args: []});
    console.log("manager managed collection");

    txCode = await getTemplate("./transactions/stakingCollection/scripts/get_all_delegator_info.cdc",
    {FlowStakingCollection: FlowStakingCollectionAddress, FlowIDTableStaking: FlowIDTableStakingAddress});
    [tx, error] = await executeScript({code: txCode, args: [sFlowTokenAddress]});
    console.log("Current Delegating Info is", { tx });
    txCode = await getTemplate("./transactions/flowToken/scripts/get_balance.cdc",
    {});
    [tx, error] = await executeScript({code: txCode, args: [sFlowStakingManagerAddress]});
    console.log("Current Pool balance is " + tx)

    txCode = await getTemplate("./transactions/stakingManager/manage_collection.cdc",
    {sFlowStakingManager: sFlowStakingManagerAddress});
    [tx, error] = await sendTransaction({code: txCode, signers: [managerAddress], args: []});
    console.log("manager managed collection");

    txCode = await getTemplate("./transactions/stakingCollection/scripts/get_all_delegator_info.cdc",
    {FlowStakingCollection: FlowStakingCollectionAddress, FlowIDTableStaking: FlowIDTableStakingAddress});
    [tx, error] = await executeScript({code: txCode, args: [sFlowTokenAddress]});
    console.log("Current Delegating Info is", { tx });
    txCode = await getTemplate("./transactions/flowToken/scripts/get_balance.cdc",
    {});
    [tx, error] = await executeScript({code: txCode, args: [sFlowStakingManagerAddress]});
    console.log("Current Pool balance is " + tx)

    txCode = await getTemplate("./transactions/stakingManager/manage_collection.cdc",
    {sFlowStakingManager: sFlowStakingManagerAddress});
    [tx, error] = await sendTransaction({code: txCode, signers: [managerAddress], args: []});
    console.log("manager managed collection");

    txCode = await getTemplate("./transactions/stakingCollection/scripts/get_all_delegator_info.cdc",
    {FlowStakingCollection: FlowStakingCollectionAddress, FlowIDTableStaking: FlowIDTableStakingAddress});
    [tx, error] = await executeScript({code: txCode, args: [sFlowTokenAddress]});
    expect(Number.parseFloat(tx[0].tokensCommitted)).toBeCloseTo(0.0, 1);
    expect(Number.parseFloat(tx[0].tokensStaked)).toBeCloseTo(0.0, 1);
    expect(Number.parseFloat(tx[0].tokensUnstaking)).toBeCloseTo(0.0, 1);
    expect(Number.parseFloat(tx[0].tokensRewarded)).toBeCloseTo(0.0, 1);
    expect(Number.parseFloat(tx[0].tokensUnstaked)).toBeCloseTo(0.0, 1);
    console.log("Current Delegating Info is", { tx });
    txCode = await getTemplate("./transactions/flowToken/scripts/get_balance.cdc",
    {});
    [tx, error] = await executeScript({code: txCode, args: [sFlowStakingManagerAddress]});
    console.log("Current Pool balance is " + tx)
  });

  afterAll(async () => {
    await emulator.stop();
  });
});