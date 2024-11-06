import { getNamedAccounts, ethers } from "hardhat"
import { FundMe, FundMe__factory, MockV3Aggregator } from "../typechain-types"

// 开一个node 然后 yarn hardhat run scripts/fund.ts --network localhost
async function main() {
    const deployer = (await getNamedAccounts())[0]
	const fundMe: FundMe = await ethers.getContract("FundMe", deployer)
	console.log("withdraw started")
	const response = await fundMe.withdraw()
	await response.wait()
    console.log("withdraw finished")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })