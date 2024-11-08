// 1. Pragma
// 2. Imports
// 3. Error Codes
// 4. Interfaces, Libraries, Contracts
// 代码风格
// AaaBbb: Struct\ Event \Enum
// aaaBbb: Function\ FunctionArg\ Local and State Variable\ Modifier
// AAA_BBB: Constants
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";
// 用这个可以打印 console.log("FundMe fund function:%s", "test");
error FundMe__NotOwner();
error FundMe__NeedSpendMoreETH();

contract FundMe {
    event PriceFeedResultLog(uint256);

    using PriceConverter for uint256;
    mapping(address => uint256) private s_addressToAmountFunded;
    address[] private s_funders;
    address private i_owner;
    uint256 public constant MINIMUM_USD = 1;
    AggregatorV3Interface private s_priceFeed;

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    /// 存款
    function fund() public payable {
        uint256 priceFeedResult = msg.value.getConversionRate(s_priceFeed);

        emit PriceFeedResultLog(priceFeedResult);

		if (priceFeedResult <= MINIMUM_USD) {
			revert FundMe__NeedSpendMoreETH();
		}

        // 记录
        s_addressToAmountFunded[msg.sender] += msg.value;
        s_funders.push(msg.sender);
    }

    modifier onlyOwner() {
        // require(msg.sender == owner);
        if (msg.sender != i_owner) revert FundMe__NotOwner();
        _;
    }

    /// 提现
    function withdraw() public onlyOwner {
        // 数据清空
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        // 提现
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }

    /// 提现
    function cheaperWithdraw() public onlyOwner {
        // 数据清空
        address[] memory m_funders = s_funders;

        for (
            uint256 funderIndex = 0;
            funderIndex < m_funders.length;
            funderIndex++
        ) {
            address funder = m_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        // 提现
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }

    fallback() external payable {
        fund();
    }

    receive() external payable {
        fund();
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(
        address funder
    ) public view returns (uint256) {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
