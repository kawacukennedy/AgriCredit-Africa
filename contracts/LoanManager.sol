// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IdentityRegistry.sol";

contract LoanManager is Ownable {
    struct Loan {
        uint256 id;
        address borrower;
        uint256 amount;
        uint256 interestRate; // in basis points (e.g., 850 = 8.5%)
        uint256 duration; // in seconds
        uint256 startTime;
        uint256 repaidAmount;
        bool isActive;
        bool isRepaid;
    }

    IdentityRegistry public identityRegistry;
    IERC20 public stableToken; // e.g., USDT, cUSD

    mapping(uint256 => Loan) public loans;
    mapping(address => uint256[]) public userLoans;
    uint256 public nextLoanId = 1;

    event LoanCreated(uint256 indexed loanId, address indexed borrower, uint256 amount);
    event LoanRepaid(uint256 indexed loanId, uint256 amount);
    event LoanDefaulted(uint256 indexed loanId);

    constructor(address _identityRegistry, address _stableToken) Ownable(msg.sender) {
        identityRegistry = IdentityRegistry(_identityRegistry);
        stableToken = IERC20(_stableToken);
    }

    function createLoan(
        address _borrower,
        uint256 _amount,
        uint256 _interestRate,
        uint256 _duration
    ) external onlyOwner returns (uint256) {
        require(identityRegistry.isIdentityVerified(_borrower), "Borrower not verified");
        require(_amount > 0, "Amount must be > 0");
        require(_interestRate > 0 && _interestRate <= 2000, "Invalid interest rate"); // Max 20%

        uint256 loanId = nextLoanId++;
        loans[loanId] = Loan({
            id: loanId,
            borrower: _borrower,
            amount: _amount,
            interestRate: _interestRate,
            duration: _duration,
            startTime: block.timestamp,
            repaidAmount: 0,
            isActive: true,
            isRepaid: false
        });

        userLoans[_borrower].push(loanId);

        // Transfer tokens to borrower
        require(stableToken.transfer(_borrower, _amount), "Transfer failed");

        emit LoanCreated(loanId, _borrower, _amount);
        return loanId;
    }

    function repayLoan(uint256 _loanId, uint256 _amount) external {
        Loan storage loan = loans[_loanId];
        require(loan.isActive, "Loan not active");
        require(msg.sender == loan.borrower, "Not the borrower");

        loan.repaidAmount += _amount;

        uint256 totalOwed = calculateTotalOwed(_loanId);
        if (loan.repaidAmount >= totalOwed) {
            loan.isRepaid = true;
            loan.isActive = false;
            emit LoanRepaid(_loanId, loan.repaidAmount);
        }

        // Transfer repayment to contract (assuming contract holds funds)
        require(stableToken.transferFrom(msg.sender, address(this), _amount), "Transfer failed");
    }

    function calculateTotalOwed(uint256 _loanId) public view returns (uint256) {
        Loan memory loan = loans[_loanId];
        uint256 interest = (loan.amount * loan.interestRate * loan.duration) / (365 days * 10000);
        return loan.amount + interest;
    }

    function getLoan(uint256 _loanId) external view returns (Loan memory) {
        return loans[_loanId];
    }

    function getUserLoans(address _user) external view returns (uint256[] memory) {
        return userLoans[_user];
    }

    // Function to check if loan is defaulted (for external calls)
    function isLoanDefaulted(uint256 _loanId) external view returns (bool) {
        Loan memory loan = loans[_loanId];
        return loan.isActive && (block.timestamp > loan.startTime + loan.duration) && !loan.isRepaid;
    }
}