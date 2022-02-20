import sFlowStakingManager from 0xsFlowStakingManager

transaction {
    prepare(account: AuthAccount) {
        let accountCreator : @sFlowStakingManager.Instance <- sFlowStakingManager.createInstance()
        account.save(
            <-accountCreator, 
            to: /storage/sFlowStakingManager_Instance,
        )
        // create new receiver that marks received tokens as unlocked
        account.link<&sFlowStakingManager.Instance{sFlowStakingManager.InstanceInterface}>(
            /public/sFlowStakingManager_Instance,
            target: /storage/sFlowStakingManager_Instance
        )
    }
}
