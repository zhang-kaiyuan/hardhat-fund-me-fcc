import { deployments, ethers, network } from "hardhat"
import {
    FundMe,
    FundMe__factory,
    MockV3Aggregator,
} from "../../typechain-types"
import { assert, expect } from "chai"
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"
import { ContractTransactionReceipt } from "ethers"
import { developmentChains } from "../../helper-hardhat-config"

// staging 部署后所有事情是否顺利运行
// unit 单元测试
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async () => {
          let fundMe: FundMe
          let deployer: SignerWithAddress
          let mockV3Aggregator: MockV3Aggregator
          const SEND_VALUE: bigint = ethers.parseEther("0.001") //  = 1ETH

          // beforeEach() 每个it之前都会执行
          beforeEach(async () => {
              // const accounts = await ethers.getSigners()
              // const accountZero = accounts[0]

              // 部署合约 用deploy
              // fixture允许运行deploy文件夹 并使用tags
              // 这个tag到底是干啥的 为deploy文件做标签的 这行就是执行带all标签的文件
              // 除此以外 也可以用 hardhat deploy --tags xxx
              await deployments.fixture(["all"])
              deployer = (await ethers.getSigners())[0]
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract("MockV3Aggregator")
          })

          describe("constructor", async () => {
              it("constructor correct", async () => {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, await mockV3Aggregator.getAddress())
              })
          })
          // 逐行测试时注意require
          describe("fund", async () => {
              it("fail if don`t send enough ETH", async () => {
                  // expect 底层是waffle 但是用chai导入
				  await expect(fundMe.fund()).to.be.revertedWithCustomError(
                      fundMe,
                      "FundMe__NeedSpendMoreETH"
                  )
              })
              // 注意引号 yarn hardhat test --network hardhat --grep "amount funded"
              it("updated the amount funded data structure", async () => {
                  await fundMe.fund({ value: SEND_VALUE })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), SEND_VALUE.toString())
              })
              it("Adds funder to array of funders", async () => {
                  await fundMe.fund({ value: SEND_VALUE })
                  const funder = await fundMe.getFunder(0)
                  assert.equal(funder, await deployer.getAddress())
              })
          })
          describe("withdraw", async () => {
              beforeEach(async () => {
                  await fundMe.fund({ value: SEND_VALUE })
              })
              it("withdraw ETH from a single founder", async () => {
                  // arrange act assert 一种写测试的思路
                  // Arrange

                  // runner 定义与网络合同交互的对象
                  // provider 只读的交互对象
                  // singer 可写的交互对象
                  const startingFundMeBalance =
                      await fundMe.runner!.provider!.getBalance(
                          fundMe.getAddress()
                      )
                  const startingDeployerBalance =
                      await fundMe.runner!.provider!.getBalance(deployer)
                  // 也可以用 ethers.provider.getBalance
                  console.log(
                      `startingFundMeBalance: ${startingFundMeBalance}, startingDeployerBalance:${startingDeployerBalance}`
                  )
                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const receipt: ContractTransactionReceipt =
                      (await transactionResponse.wait())!
                  const { fee } = receipt
                  const endingFundMeBalance =
                      await fundMe.runner!.provider!.getBalance(
                          fundMe.getAddress()
                      )
                  const endingDeployerBalance =
                      await fundMe.runner!.provider!.getBalance(deployer)
                  console.log(
                      `endingFundMeBalance: ${endingFundMeBalance}, endingDeployerBalance:${endingDeployerBalance}, gasCost:${fee}`
                  )
                  // Assert
                  assert.equal(endingFundMeBalance.toString(), "0")
                  assert.equal(
                      (
                          startingFundMeBalance + startingDeployerBalance
                      ).toString(),
                      (endingDeployerBalance + fee).toString()
                  )
              })

              it("allow us to withdraw with multiple funders", async () => {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 0; i < accounts.length; i++) {
                      let fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: SEND_VALUE })
                  }
                  const startingFundMeBalance =
                      await fundMe.runner!.provider!.getBalance(
                          fundMe.getAddress()
                      )
                  const startingDeployerBalance =
                      await fundMe.runner!.provider!.getBalance(deployer)

                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const receipt: ContractTransactionReceipt =
                      (await transactionResponse.wait())!
                  const { fee } = receipt
                  const endingFundMeBalance =
                      await fundMe.runner!.provider!.getBalance(
                          fundMe.getAddress()
                      )
                  const endingDeployerBalance =
                      await fundMe.runner!.provider!.getBalance(deployer)

                  // Assert
                  assert.equal(endingFundMeBalance.toString(), "0")
                  assert.equal(
                      (
                          startingFundMeBalance + startingDeployerBalance
                      ).toString(),
                      (endingDeployerBalance + fee).toString()
                  )

                  // 确认重置账户
                  await expect(fundMe.getFunder(0)).to.be.rejected

                  for (let i = 0; i < 5; i++) {
                      assert(
                          (
                              await fundMe.getAddressToAmountFunded(
                                  accounts[i].getAddress()
                              )
                          ).toString,
                          "0"
                      )
                  }
              })

              it("cheaper withdraw", async () => {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 0; i < accounts.length; i++) {
                      let fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: SEND_VALUE })
                  }
                  const startingFundMeBalance =
                      await fundMe.runner!.provider!.getBalance(
                          fundMe.getAddress()
                      )
                  const startingDeployerBalance =
                      await fundMe.runner!.provider!.getBalance(deployer)

                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const receipt: ContractTransactionReceipt =
                      (await transactionResponse.wait())!
                  const { fee } = receipt
                  const endingFundMeBalance =
                      await fundMe.runner!.provider!.getBalance(
                          fundMe.getAddress()
                      )
                  const endingDeployerBalance =
                      await fundMe.runner!.provider!.getBalance(deployer)

                  // Assert
                  assert.equal(endingFundMeBalance.toString(), "0")
                  assert.equal(
                      (
                          startingFundMeBalance + startingDeployerBalance
                      ).toString(),
                      (endingDeployerBalance + fee).toString()
                  )

                  // 确认重置账户
                  await expect(fundMe.getFunder(0)).to.be.rejected

                  for (let i = 0; i < 5; i++) {
                      assert(
                          (
                              await fundMe.getAddressToAmountFunded(
                                  accounts[i].getAddress()
                              )
                          ).toString,
                          "0"
                      )
                  }
              })

              it("only allow owner to withdraw", async () => {
                  const attacker = (await ethers.getSigners())[1]
                  const attackerContract = fundMe.connect(attacker)
                  await expect(
                      attackerContract.withdraw()
                  ).to.be.revertedWithCustomError(
                      attackerContract,
                      "FundMe__NotOwner"
                  )
              })
          })
      })
