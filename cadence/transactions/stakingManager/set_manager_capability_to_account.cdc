import sFlowStakingManager from 0xsFlowStakingManager

transaction(address: Address) {

    prepare(admin: AuthAccount) {

        let managerAccount = getAccount(address)
            
        let capabilityReceiver = managerAccount.getCapability
            <&sFlowStakingManager.Instance{sFlowStakingManager.InstanceInterface}>
            (/public/sFlowStakingManager_Instance)!
            .borrow() ?? panic("Could not borrow capability receiver reference")

        let managerCapacity = admin
            .getCapability<&sFlowStakingManager.Manager>(/private/sFlowStakingManager)!

        capabilityReceiver.setCapability(cap: managerCapacity)
    }
}
