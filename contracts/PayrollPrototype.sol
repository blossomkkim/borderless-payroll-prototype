// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20Minimal {
    function transfer(address to, uint256 amount) external returns (bool);

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);

    function balanceOf(address account) external view returns (uint256);
}

contract PayrollPrototype {
    address public owner;
    IERC20Minimal public paymentToken;

    struct Worker {
        address wallet;
        uint256 amount;
        bool active;
    }

    Worker[] public workers;

    mapping(address => bool) public registered;

    constructor(address token) {
        owner = msg.sender;
        paymentToken = IERC20Minimal(token);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    function addWorker(
        address wallet,
        uint256 amount
    ) external onlyOwner {
        require(wallet != address(0), "bad wallet");
        require(!registered[wallet], "already added");

        workers.push(
            Worker({
                wallet: wallet,
                amount: amount,
                active: true
            })
        );

        registered[wallet] = true;
    }

    function updateAmount(
        uint256 workerId,
        uint256 newAmount
    ) external onlyOwner {
        require(workerId < workers.length, "worker missing");

        workers[workerId].amount = newAmount;
    }

    function disableWorker(
        uint256 workerId
    ) external onlyOwner {
        require(workerId < workers.length, "worker missing");

        workers[workerId].active = false;
    }

    function fund(uint256 amount) external onlyOwner {
        require(
            paymentToken.transferFrom(
                msg.sender,
                address(this),
                amount
            ),
            "fund failed"
        );
    }

    function payWorker(uint256 workerId) external onlyOwner {
        Worker memory worker = workers[workerId];

        require(worker.active, "worker inactive");

        require(
            paymentToken.transfer(
                worker.wallet,
                worker.amount
            ),
            "payment failed"
        );
    }

    function contractBalance()
        external
        view
        returns (uint256)
    {
        return paymentToken.balanceOf(address(this));
    }

    function workerCount()
        external
        view
        returns (uint256)
    {
        return workers.length;
    }
}
