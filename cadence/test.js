import path from "path"
import { config } from "@onflow/config";
import { fileURLToPath } from 'url';
import { init, emulator, deployContractByName, getContractAddress , getAccountAddress } from "flow-js-testing";

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

  const FlowEpochName = "FlowEpoch";
  const FlowEpochAddress = await getAccountAddress("FlowEpoch");
  const FlowEpochAddressMap = {FlowToken: FlowTokenAddress, FungibleToken: FungibleTokenAddress, FlowIDTableStaking: FlowIDTableStakingAddress, FlowFees: FlowFeesAddress, FlowDKG: FlowDKGAddress, FlowClusterQC: FlowClusterQCAddress};
  const FlowEpochArgs = [0, 70, 50, 2, 2, 0.00093871, "lolsoRandom",
    [],
    [],
    []];
  const result = await deployContractByName({ to: FlowEpochAddress, name: FlowEpochName, addressMap: FlowEpochAddressMap, args: FlowEpochArgs });
  console.log(result);
  const FlowEpochContractAddress = await getContractAddress(FlowEpochName);
  console.log(FlowEpochName + " deployed in ", FlowEpochContractAddress );

  await emulator.stop();
};

main();