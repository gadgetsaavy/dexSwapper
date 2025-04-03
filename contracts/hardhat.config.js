// hardhat.config.js

require("@nomiclabs/hardhat-waffle"); // Import the Waffle plugin for testing and smart contract interaction

module.exports = {
  solidity: "0.8.0", // Set the Solidity version. Change it based on your contract's version
  networks: {
    hardhat: {
      chainId: 1337, // Default chainId for local Hardhat Network
    },
    // You can add more network configurations like Rinkeby, Mainnet, etc.
    // Example for Rinkeby:
    // rinkeby: {
    //   url: `https://rinkeby.infura.io/v3/YOUR_INFURA_PROJECT_ID`,
    //   accounts: [`0x${YOUR_PRIVATE_KEY}`]
    // }
  },
  // Add any other configurations you need for plugins, compilers, etc.
  paths: {
    sources: "./contracts", // Path to your contract files
    tests: "./test",        // Path to your test files
    cache: "./cache",       // Path to cache
    artifacts: "./artifacts" // Path to the compiled contract artifacts
  }
};
