import sFlowStakingManager from 0xsFlowStakingManager

transaction(nodeID: String, delegatorID: UInt32) {

    prepare(admin: AuthAccount) {

        let capabilityReceiver = admin.getCapability
            <&sFlowStakingManager.Instance{sFlowStakingManager.InstanceInterface}>
            (/public/sFlowStakingManager_Instance)!
            .borrow() ?? panic("Could not borrow capability receiver reference")

        capabilityReceiver.setNewDelegator(nodeID: nodeID, delegatorID: delegatorID);
    }
}
