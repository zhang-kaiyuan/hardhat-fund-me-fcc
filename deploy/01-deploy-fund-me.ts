import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import verify from "../utils/verify"
import { networkConfig, developmentChains } from "../helper-hardhat-config"

// yarn hardhat deploy
/*
    -------------- 准备工作 --------------
    执行流程：
    1. 执行00-deploy-mocks.ts
    如果是本地 deploy contracts/test/MockV3Aggregator.sol
    不是本地 不创建

    2. 执行01-deploy-fund-me.ts
    如果是本地 获取MockV3Aggregator 地址
    不是本地 获取配置中的地址
    -------------- 准备工作 --------------

 */

const deployFundMe: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    // 定义变量
    const { getNamedAccounts, deployments, network } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    // 准备工作 根据环境选择不同地址
    let ethUsdPriceFeedAddress: string
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[network.name].ethUsdPriceFeed!
    }

    log("----------------------------------------------------")
    log("Deploying FundMe and waiting for confirmations...")

    // 部署
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: [ethUsdPriceFeedAddress],
        log: true,
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
    })
    log(`FundMe deployed at ${fundMe.address}`)

    // 验证
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, [ethUsdPriceFeedAddress])
    }
}
export default deployFundMe
deployFundMe.tags = ["all", "fundMe"]
