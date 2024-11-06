import { ethers, network } from "hardhat"
import { developmentChains } from "../../helper-hardhat-config"
import { FundMe } from "../../typechain-types"
import { assert } from "chai"

// staging 假设部署在链上 所以不需要部署操作
// 1. 先部署 yarn hardhat deploy --network xxx
// 2. 执行此脚本
developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async () => {
          let fundMe: FundMe

          let deployer
          const SEND_VALUE = ethers.parseEther("0.001")

          beforeEach(async () => {
              deployer = (await ethers.getSigners())[0]
              // 根据deployer 找到准确的地址
              fundMe = await ethers.getContract("FundMe", deployer)
          })

		it("allow people to fund and withdraw", async () => {
			  console.log(await fundMe.getPriceFeed())
              console.log(await fundMe.getAddress())

              await fundMe.fund({ value: SEND_VALUE })
              await fundMe.withdraw()
              const endingFundMeBalance =
                  await fundMe.runner!.provider!.getBalance(fundMe.getAddress())
              assert.equal(endingFundMeBalance.toString(), "0")
          })
      })
