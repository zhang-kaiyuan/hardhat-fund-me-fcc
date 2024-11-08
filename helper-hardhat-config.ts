// 从下到上的结构嵌套关系
// --------------------- networkConfig ---------------------
export interface networkConfigItem {
    ethUsdPriceFeed?: string
    blockConfirmations?: number
}

export interface networkConfigInfo {
    [key: string]: networkConfigItem
}

export const networkConfig: networkConfigInfo = {
    localhost: {},
    hardhat: {},
    // Price Feed Address, values can be obtained at https://docs.chain.link/data-feeds/price-feeds/addresses
    // Default one is ETH/USD contract on Sepolia
    arbitrumSepolia: {
        ethUsdPriceFeed: "0xd30e2101a97dcbAeBCBC04F14C3f624E67A35165",
        blockConfirmations: 1,
    },
}
// --------------------- networkConfig ---------------------

// --------------------- developmentChains ---------------------
export const developmentChains = ["hardhat", "localhost"]
// --------------------- developmentChains ---------------------
