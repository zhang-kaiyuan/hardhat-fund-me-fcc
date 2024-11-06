import { network, ethers, deployments, getNamedAccounts } from "hardhat"
import { developmentChains } from "../helper-hardhat-config"
import verify from "../utils/verify"

const storage = async () => {
    if (
        developmentChains.includes(network.name)
    ) {
        const { deploy, log } = deployments
        const { deployer } = await getNamedAccounts()

        log("----------------------------------------------------")
        log("Deploying FunWithStorage and waiting for confirmations...")
        const funWithStorage = await deploy("FunWithStorage", {
            from: deployer,
            args: [],
            log: true,
            // we need to wait if on a live network so we can verify properly
            waitConfirmations: 1,
        })
        await verify(funWithStorage.address, [])
        log("Logging storage...")
        for (let i = 0; i < 10; i++) {
            log(
                `Location ${i}: ${await ethers.provider.getStorage(
                    funWithStorage.address,
                    i
                )}`
            )
        }
    }

    // You can use this to trace!
    // const trace = await network.provider.send("debug_traceTransaction", [
    //     funWithStorage.transactionHash,
    // ])
    // for (structLog in trace.structLogs) {
    //     if (trace.structLogs[structLog].op == "SSTORE") {
    //         console.log(trace.structLogs[structLog])
    //     }
    // }
    // const firstelementLocation = ethers.utils.keccak256(
    //     "0x0000000000000000000000000000000000000000000000000000000000000002"
    // )
    // const arrayElement = await ethers.provider.getStorageAt(
    //     funWithStorage.address,
    //     firstelementLocation
    // )
    // log(`Location ${firstelementLocation}: ${arrayElement}`)

    // Can you write a function that finds the storage slot of the arrays and mappings?
    // And then find the data in those slots?
}

export default storage
storage.tags = ["storage"]
