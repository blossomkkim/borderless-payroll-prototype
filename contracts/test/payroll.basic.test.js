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

    struct PaymentRecord {
        uint256 workerId;
        uint256 amount;
        uint256 paidAt;
        bytes32 reference;
        uint256 period;
    }

    Worker[] public workers;
    PaymentRecord[] public payments;

    mapping(address => bool) public registered;

    event WorkerAdded(
        uint256 workerId,
        address wallet
    );

    event WorkerStatusChanged(
        uint256 workerId,
        bool active
    );

    event WorkerPaid(
        uint256 workerId,
        address wallet,
        uint256 amount,
        bytes32 reference,
        uint256 period
    );

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

        emit WorkerAdded(
            workers.length - 1,
            wallet
        );
    }

    function updateAmount(
        uint256 workerId,
        uint256 newAmount
    ) external onlyOwner {
        require(workerId < workers.length, "worker missing");

        workers[workerId].amount = newAmount;
    }

    function setWorkerStatus(
        uint256 workerId,
        bool active
    ) external onlyOwner {
        require(workerId < workers.length, "worker missing");

        workers[workerId].active = active;

        emit WorkerStatusChanged(
            workerId,
            active
        );
    }

    function fund(
        uint256 amount
    ) external onlyOwner {
        require(
            paymentToken.transferFrom(
                msg.sender,
                address(this),
                amount
            ),
            "fund failed"
        );
    }

    function payWorker(
        uint256 workerId,
        bytes32 reference,
        uint256 period
    ) external onlyOwner {
        require(workerId < workers.length, "worker missing");

        Worker memory worker = workers[workerId];

        require(worker.active, "worker inactive");

        require(
            paymentToken.transfer(
                worker.wallet,
                worker.amount
            ),
            "payment failed"
        );

        payments.push(
            PaymentRecord({
                workerId: workerId,
                amount: worker.amount,
                paidAt: block.timestamp,
                reference: reference,
                period: period
            })
        );

        emit WorkerPaid(
            workerId,
            worker.wallet,
            worker.amount,
            reference,
            period
        );
    }

    function payAll(
        bytes32 reference,
        uint256 period
    ) external onlyOwner {

        for (uint256 i = 0; i < workers.length; i++) {

            Worker memory worker = workers[i];

            if (!worker.active) {
                continue;
            }

            require(
                paymentToken.transfer(
                    worker.wallet,
                    worker.amount
                ),
                "payment failed"
            );

            payments.push(
                PaymentRecord({
                    workerId: i,
                    amount: worker.amount,
                    paidAt: block.timestamp,
                    reference: reference,
                    period: period
                })
            );

            emit WorkerPaid(
                i,
                worker.wallet,
                worker.amount,
                reference,
                period
            );
        }
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

    function paymentCount()
        external
        view
        returns (uint256)
    {
        return payments.length;
    }
}