// test/security/FlashArbitrageExecutor.security.js
const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('FlashArbitrageExecutor Security', function () {
    it('should prevent reentrancy attacks', async function () {
        const [owner, attacker] = await ethers.getSigners();
        const commitment = ethers.utils.randomBytes(32);
        const deadline = (await ethers.provider.getBlockNumber()) + 100;
        
        // Commit arbitrage
        await executor.commitArbitrage(commitment, deadline);
        
        // Attempt reentrancy
        const maliciousContract = await deployContract(
            'MaliciousContract',
            [executor.address, commitment, deadline]
        );
        
        await expect(
            maliciousContract.attack()
        ).to.be.revertedWith('Reentrancy detected');
    });

    it('should validate external calls', async function () {
        const [owner, flashLoanProvider] = await ethers.getSigners();
        const commitment = ethers.utils.randomBytes(32);
        const deadline = (await ethers.provider.getBlockNumber()) + 100;
        
        // Mock flash loan provider to fail
        await flashLoanProvider.mock.flashLoan.reverts();
        
        await expect(
            executor.initiateArbitrage(
                ethers.utils.parseEther('1.0'),
                [token.address, token.address],
                ethers.utils.parseEther('1.1'),
                commitment,
                deadline
            )
        ).to.be.revertedWith('External call failed');
    });
});