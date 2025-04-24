require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-chai');
require('@nomiclabs/hardhat-gas-reporter');

module.exports = {
    solidity: '0.8.13',
    gasReporter: {
        enabled: true,
        currency: 'USD',
        gasPrice: 21,
        showTimeSpent: true
    }
};