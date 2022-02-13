import FlowService from "./flowService.js"
import "./config.js";
import * as scripts from "./scripts.js"
import * as transactions from "./transactions.js"

const sleep = async (time) => {
    return new Promise((resolve, reject) => {
         setTimeout(() => {
             resolve(true);
         }, time);
    })
}

const adminAccad = "0x44886dbbf20e893c"
const adminAccke = "784bf71b737be0b49652030fcaa78369a60df6fbed57d5e0fbef57aa631e3ec8"
const admin = new FlowService.FlowService(adminAccad, adminAccke , 0);
const adminAccount = await admin.getAccount(adminAccad);
const adminSigner = admin.authorizeMinter(adminAccount);

const managerAccad = "0xe62fecb1ff22b768"
const managerAccke = "dd25736b4e8e7bfcc82b970b94e67c9ce02a53f94f8d2d298983bb4de64f6f6d"
const manager = new FlowService.FlowService(managerAccad, managerAccke , 0);
const managerAccount = await manager.getAccount(managerAccad);
const managerSigner = manager.authorizeMinter(managerAccount);

const user1Accad = "0xeb021f6fca6e58a4"
const user1Accke = "0c7057cee32b201433c15eca8c9e6875c01a21acb69c9359e5f1fe58d7b95074"
const user1 = new FlowService.FlowService(user1Accad, user1Accke , 0);
const user1Account = await user1.getAccount(user1Accad);
const user1Signer = user1.authorizeMinter(user1Account);

const user2Accad = "0x044f942b17112652"
const user2Accke = "0784a48dcc0d0a38bab7b1fcfc7349d6bdcbed0c1f72cd0e93315b5ddc12b42d"
const user2 = new FlowService.FlowService(user2Accad, user2Accke , 0);
const user2Account = await user2.getAccount(user2Accad);
const user2Signer = user2.authorizeMinter(user2Account);

// await transactions.setupManagerAccount(managerSigner);
// await transactions.setManagerCapabilityToAccount(adminSigner, managerAccad);

if(!await scripts.accountInitialzed(user1Accad)){
    await transactions.initAccount(user1Signer);
}

if(!await scripts.accountInitialzed(user2Accad)){
    await transactions.initAccount(user2Signer);
}

console.log("Flow in Platform Pool: ", await scripts.getFlowBalance(adminAccad));
console.log("Flow in Staking Collection: ", await scripts.getAllDelegatorInfo(adminAccad));

console.log("Current sFlow Price: ", await scripts.getCurrentPrice());
console.log("Flow Balance of user1: ", await scripts.getFlowBalance(user1Accad));
console.log("sFlow Balance of user1: ", await scripts.getsFlowBalance(user1Accad));

console.log("User1 staking 50.0 Flow to platform...");
await transactions.stake(user1Signer, "50.0");

console.log("Current sFlow Price: ", await scripts.getCurrentPrice());
console.log("Flow Balance of user1: ", await scripts.getFlowBalance(user1Accad));
console.log("sFlow Balance of user1: ", await scripts.getsFlowBalance(user1Accad));

console.log("User1 unstaking 10.0 sFlow to platform...");
await transactions.unstake(user1Signer, "10.0");

console.log("Current sFlow Price: ", await scripts.getCurrentPrice());
console.log("Flow Balance of user1: ", await scripts.getFlowBalance(user1Accad));
console.log("sFlow Balance of user1: ", await scripts.getsFlowBalance(user1Accad));

for(let i=0; i<4; i++){
    await sleep(10000);
    console.log("Current sFlow Price: ", await scripts.getCurrentPrice());
    console.log("Flow Balance of user1: ", await scripts.getFlowBalance(user1Accad));
    console.log("sFlow Balance of user1: ", await scripts.getsFlowBalance(user1Accad));
}
