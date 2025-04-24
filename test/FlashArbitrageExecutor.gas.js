// test/gas/FlashArbitrageExecutor.gas.js
const { expect } = require('chai');
const { ethers } = require('hardhat');
const { gasReporter } = require('hardhat-gas-reporter');

describe('FlashArbitrageExecutor Gas Costs', function () {
    it('should measure deployment gas', async function () {
        const factory = await ethers.getContractFactory('FlashArbitrageExecutor');
        const deploymentGas = await factory.deploy(
            flashLoanProvider.address,
            dexRouter.address,
            flashbots.address
        ).then(tx => tx.deployTransaction.gasLimit);
        
        console.log(`Deployment gas cost: ${deploymentGas}`);
        expect(deploymentGas).to.be.below(3000000); // Adjust based on actual costs
    });

    it('should measure transaction gas costs', async function () {
        const commitment = ethers.utils.randomBytes(32);
        const deadline = (await ethers.provider.getBlockNumber()) + 100;
        
        // Measure commitArbitrage gas
        const commitTx = await executor.commitArbitrage(commitment, deadline);
        const commitGas = await commitTx.gasLimit;
        
        // Measure initiateArbitrage gas
        const initiateTx = await executor.initiateArbitrage(
            ethers.utils.parseEther('1.0'),
            [token.address, token.address],
            ethers.utils.parseEther('1.1'),
            commitment,
            deadline
        );
        const initiateGas = await initiateTx.gasLimit;
        
        console.log(`Commit gas cost: ${commitGas}`);
        console.log(`Initiate gas cost: ${initiateGas}`);
    });
});