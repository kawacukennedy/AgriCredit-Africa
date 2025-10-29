// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MarketplaceEscrow is Ownable {
    enum EscrowStatus { Created, Funded, Delivered, Completed, Cancelled }

    struct Escrow {
        uint256 id;
        address buyer;
        address seller;
        uint256 amount;
        address token;
        EscrowStatus status;
        uint256 createdAt;
        uint256 deliveredAt;
        string deliveryProof; // IPFS hash or IoT data
    }

    mapping(uint256 => Escrow) public escrows;
    uint256 public nextEscrowId = 1;

    event EscrowCreated(uint256 indexed escrowId, address indexed buyer, address indexed seller, uint256 amount);
    event EscrowFunded(uint256 indexed escrowId);
    event DeliveryConfirmed(uint256 indexed escrowId, string proof);
    event EscrowCompleted(uint256 indexed escrowId);
    event EscrowCancelled(uint256 indexed escrowId);

    constructor() Ownable(msg.sender) {}

    function createEscrow(
        address _seller,
        uint256 _amount,
        address _token
    ) external returns (uint256) {
        require(_amount > 0, "Amount must be > 0");

        uint256 escrowId = nextEscrowId++;
        escrows[escrowId] = Escrow({
            id: escrowId,
            buyer: msg.sender,
            seller: _seller,
            amount: _amount,
            token: _token,
            status: EscrowStatus.Created,
            createdAt: block.timestamp,
            deliveredAt: 0,
            deliveryProof: ""
        });

        emit EscrowCreated(escrowId, msg.sender, _seller, _amount);
        return escrowId;
    }

    function fundEscrow(uint256 _escrowId) external {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.Created, "Escrow not in created state");
        require(msg.sender == escrow.buyer, "Only buyer can fund");

        IERC20 token = IERC20(escrow.token);
        require(token.transferFrom(msg.sender, address(this), escrow.amount), "Transfer failed");

        escrow.status = EscrowStatus.Funded;
        emit EscrowFunded(_escrowId);
    }

    function confirmDelivery(uint256 _escrowId, string memory _proof) external onlyOwner {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.Funded, "Escrow not funded");

        escrow.status = EscrowStatus.Delivered;
        escrow.deliveredAt = block.timestamp;
        escrow.deliveryProof = _proof;

        emit DeliveryConfirmed(_escrowId, _proof);
    }

    function completeEscrow(uint256 _escrowId) external {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.Delivered, "Delivery not confirmed");
        require(msg.sender == escrow.seller, "Only seller can complete");

        IERC20 token = IERC20(escrow.token);
        require(token.transfer(escrow.seller, escrow.amount), "Transfer to seller failed");

        escrow.status = EscrowStatus.Completed;
        emit EscrowCompleted(_escrowId);
    }

    function cancelEscrow(uint256 _escrowId) external {
        Escrow storage escrow = escrows[_escrowId];
        require(
            msg.sender == escrow.buyer || msg.sender == escrow.seller || msg.sender == owner(),
            "Not authorized to cancel"
        );
        require(escrow.status != EscrowStatus.Completed, "Cannot cancel completed escrow");

        if (escrow.status == EscrowStatus.Funded) {
            // Refund buyer
            IERC20 token = IERC20(escrow.token);
            require(token.transfer(escrow.buyer, escrow.amount), "Refund failed");
        }

        escrow.status = EscrowStatus.Cancelled;
        emit EscrowCancelled(_escrowId);
    }

    function getEscrow(uint256 _escrowId) external view returns (Escrow memory) {
        return escrows[_escrowId];
    }
}