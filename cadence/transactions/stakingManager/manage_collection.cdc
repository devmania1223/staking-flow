import sFlowStakingManager from 0xsFlowStakingManager

transaction() {
    let account: AuthAccount
    prepare(account: AuthAccount) {
        self.account = account
    }

    execute {
        sFlowStakingManager.manageCollection()
    }
}
