// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

// Interfaces remain unchanged
interface IFlashLoanProvider {
    function flashLoan(
        uint256 amount,
        address recipient,
        bytes calldata data
    ) external;
}

interface IDEXRouter {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}

interface IFlashbots {
    function bundle(
        bytes32[2] memory,
        uint256[2] memory,
        bytes memory,
        uint256,
        bytes32
    ) external;
}

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool);
}

contract FlashArbitrageExecutor {
    // State variables (marked as immutable where possible)
    address public immutable owner;
    IFlashLoanProvider public immutable flashLoanProvider;
    IDEXRouter public immutable dexRouter;
    IFlashbots public immutable flashbots;
    
    // Mapping for tracking commitments
    mapping(bytes32 => bool) public commitments;
    
    // Constants
    uint256 public constant COMMITMENT_PERIOD = 100; // Blocks
    uint256 public constant MAX_PATH_LENGTH = 3;
    uint256 public constant DEADLINE_BUFFER = 100; // Block buffer
    
    // Events for better tracking
    event ArbitrageCommitted(bytes32 commitment, uint256 deadline);
    event ArbitrageInitiated(bytes32 commitment, uint256 amount, address[] path);
    event ArbitrageExecuted(address[] path, uint256 profit);
    
    // Constructor
    constructor(
        address _flashLoanProvider,
        address _dexRouter,
        address _flashbots
    ) {
        require(_flashLoanProvider != address(0), "Flash loan provider cannot be zero");
        require(_dexRouter != address(0), "DEX router cannot be zero");
        require(_flashbots != address(0), "Flashbots cannot be zero");
        
        owner = msg.sender;
        flashLoanProvider = IFlashLoanProvider(_flashLoanProvider);
        dexRouter = IDEXRouter(_dexRouter);
        flashbots = IFlashbots(_flashbots);
    }
    
    // Modifier for owner-only functions
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }
    
    // Commit an arbitrage opportunity
    function commitArbitrage(
        bytes32 commitment,
        uint256 deadline
    ) external onlyOwner {
        require(deadline > block.number + COMMITMENT_PERIOD, "Deadline too soon");
        require(!commitments[commitment], "Commitment already exists");
        commitments[commitment] = true;
        emit ArbitrageCommitted(commitment, deadline);
    }
    
    // Initiate an arbitrage operation
    function initiateArbitrage(
        uint256 amount,
        address[] calldata path,
        uint256 minAmountOut,
        bytes32 commitment,
        uint256 deadline
    ) external onlyOwner {
        require(commitments[commitment], "Invalid commitment");
        require(block.number <= deadline, "Commitment expired");
        require(path.length <= MAX_PATH_LENGTH, "Path too long");
        require(path.length >= 2, "Path must have at least 2 addresses");
        
        bytes memory encodedData = abi.encode(path, minAmountOut);
        bytes32 commitmentHash = keccak256(
            abi.encodePacked(commitment, encodedData)
        );
        
        // Execute through Flashbots
        bytes memory bundleData = abi.encodeWithSelector(
            this.executeArbitrage.selector,
            path,
            minAmountOut
        );
        
        bytes32[2] memory bundle;
        uint256[2] memory bundleSig;
        flashbots.bundle(bundle, bundleSig, bundleData, amount, commitmentHash);
        
        emit ArbitrageInitiated(commitment, amount, path);
    }
    
    // Execute the arbitrage
    function executeArbitrage(
        address[] calldata path,
        uint256 minAmountOut
    ) external {
        // Check path length
        require(path.length <= MAX_PATH_LENGTH, "Path too long");
        require(path.length >= 2, "Path must have at least 2 addresses");
        
        // Get initial amount
        uint256 amountIn = IERC20(path[0]).balanceOf(address(this));
        require(amountIn > 0, "Insufficient balance");
        
        // Calculate profit potential before external calls
        uint256[] memory amounts = dexRouter.swapExactTokensForTokens(
            amountIn,
            minAmountOut,
            path,
            address(this),
            block.number + DEADLINE_BUFFER
        );
        
        // Update state before external calls
        uint256 profit = amounts[amounts.length - 1] - amountIn;
        require(profit > 0, "No profit from arbitrage");
        
        // External calls
        require(
            IERC20(path[0]).approve(address(dexRouter), amountIn),
            "Approval failed"
        );
        
        // Repay flash loan
        require(
            IERC20(path[0]).transfer(address(flashLoanProvider), amountIn),
            "Flash loan repayment failed"
        );
        
        emit ArbitrageExecuted(path, profit);
    }
}