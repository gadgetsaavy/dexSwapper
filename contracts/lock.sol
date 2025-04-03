// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Lock {

    address public owner;
    uint256 public unlockTime;
    uint256 public lockedAmount;

    event Locked(address indexed sender, uint256 amount, uint256 unlockTime);
    event Unlocked(address indexed sender, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "You are not the owner");
        _;
    }

    modifier lockNotExpired() {
        require(block.timestamp < unlockTime, "Lock has expired");
        _;
    }

    modifier lockExpired() {
        require(block.timestamp >= unlockTime, "Lock is still active");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Lock ether in the contract for a specified period
    function lock(uint256 _unlockTime) external payable {
        require(msg.value > 0, "No ether sent");
        require(_unlockTime > block.timestamp, "Unlock time must be in the future");

        lockedAmount += msg.value;
        unlockTime = _unlockTime;

        emit Locked(msg.sender, msg.value, _unlockTime);
    }

    // Unlock the ether after the lock period has passed
    function unlock() external onlyOwner lockExpired {
        uint256 amount = lockedAmount;
        lockedAmount = 0;

        payable(owner).transfer(amount);
        emit Unlocked(msg.sender, amount);
    }

    // View the current balance of the contract
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
