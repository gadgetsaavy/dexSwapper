// test/FlashArbitrageExecutor.test.js
const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('FlashArbitrageExecutor', function () {
    let owner;
    let flashLoanProvider;
    let dexRouter;
    let flashbots;
    let executor;
    let token;

    beforeEach(async function () {
        // Deploy mock contracts
        [owner, flashLoanProvider, dexRouter, flashbots] = await ethers.getSigners();
        
        // Deploy mock token
        const Token = await ethers.getContractFactory('MockToken');
        token = await Token.deploy();
        
        // Deploy FlashArbitrageExecutor
        const Executor = await ethers.getContractFactory('FlashArbitrageExecutor');
        executor = await Executor.deploy(
            flashLoanProvider.address,
            dexRouter.address,
            flashbots.address
        );
    });

    describe('Deployment', function () {
        it('should set the correct owner', async function () {
            expect(await executor.owner()).to.equal(owner.address);
        });

        it('should set the correct dependencies', async function () {
            expect(await executor.flashLoanProvider()).to.equal(flashLoanProvider.address);
            expect(await executor.dexRouter()).to.equal(dexRouter.address);
            expect(await executor.flashbots()).to.equal(flashbots.address);
        });
    });

    describe('Commitment', function () {
        it('should allow owner to commit arbitrage', async function () {
            const commitment = ethers.utils.randomBytes(32);
            const deadline = (await ethers.provider.getBlockNumber()) + 100;
            
            await expect(executor.commitArbitrage(commitment, deadline))
                .to.emit(executor, 'ArbitrageCommitted')
                .withArgs(commitment, deadline);
        });

        it('should revert if not owner', async function () {
            const commitment = ethers.utils.randomBytes(32);
            const deadline = (await ethers.provider.getBlockNumber()) + 100;
            
            await expect(
                executor.connect(flashLoanProvider).commitArbitrage(commitment, deadline)
            ).to.be.revertedWith('Not the contract owner');
        });

        it('should revert if deadline too soon', async function () {
            const commitment = ethers.utils.randomBytes(32);
            const deadline = (await ethers.provider.getBlockNumber()) + 50;
            
            await expect(
                executor.commitArbitrage(commitment, deadline)
            ).to.be.revertedWith('Deadline too soon');
        });
    });

    describe('Arbitrage Execution', function () {
        it('should execute arbitrage with valid commitment', async function () {
            const commitment = ethers.utils.randomBytes(32);
            const deadline = (await ethers.provider.getBlockNumber()) + 100;
            const path = [token.address, token.address];
            const amount = ethers.utils.parseEther('1.0');
            const minAmountOut = ethers.utils.parseEther('1.1');

            // Commit first
            await executor.commitArbitrage(commitment, deadline);

            // Execute arbitrage
            await expect(executor.initiateArbitrage(
                amount,
                path,
                minAmountOut,
                commitment,
                deadline
            )).to.emit(executor, 'ArbitrageInitiated');
        });

        it('should revert if commitment expired', async function () {
            const commitment = ethers.utils.randomBytes(32);
            const deadline = (await ethers.provider.getBlockNumber()) - 1;
            const path = [token.address, token.address];
            const amount = ethers.utils.parseEther('1.0');
            const minAmountOut = ethers.utils.parseEther('1.1');

            await executor.commitArbitrage(commitment, deadline);

            await expect(
                executor.initiateArbitrage(
                    amount,
                    path,
                    minAmountOut,
                    commitment,
                    deadline
                )
            ).to.be.revertedWith('Commitment expired');
        });
    });
});