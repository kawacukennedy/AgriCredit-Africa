// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract Reputation is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    using ECDSAUpgradeable for bytes32;

    struct BorrowerReputation {
        uint256 totalLoans;
        uint256 repaidLoans;
        uint256 defaultedLoans;
        uint256 totalBorrowed; // in wei
        uint256 totalRepaid; // in wei
        uint256 lastRepaymentTime;
        uint256 reputationScore; // 0-1000
        bool isActive;
        uint256 createdAt;
        uint256 updatedAt;
    }

    struct LoanRecord {
        address borrower;
        uint256 loanId;
        uint256 amount;
        uint256 repaidAmount;
        uint256 dueDate;
        uint256 repaymentDate;
        bool isRepaid;
        bool isDefaulted;
        uint256 createdAt;
    }

    // Reputation mappings
    mapping(address => BorrowerReputation) public borrowerReputations;
    mapping(bytes32 => LoanRecord) public loanRecords; // loanId => record
    mapping(address => bytes32[]) public borrowerLoans;

    // Reputation parameters
    uint256 public maxReputationScore = 1000;
    uint256 public minReputationScore = 100;
    uint256 public baseReputationScore = 500;

    // Penalty and reward parameters
    uint256 public onTimeRepaymentBonus = 10;
    uint256 public lateRepaymentPenalty = 20;
    uint256 public defaultPenalty = 100;
    uint256 public earlyRepaymentBonus = 5;

    // Time-based bonuses
    uint256 public consistentRepaymentBonus = 5; // per consecutive on-time payment
    uint256 public longTermBorrowerBonus = 25; // for borrowers with 1+ year history

    // Events
    event ReputationUpdated(address indexed borrower, uint256 newScore, string reason);
    event LoanRecorded(bytes32 indexed loanId, address indexed borrower, uint256 amount);
    event RepaymentRecorded(bytes32 indexed loanId, address indexed borrower, uint256 amount, bool onTime);
    event DefaultRecorded(bytes32 indexed loanId, address indexed borrower, uint256 amount);

    function initialize() public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // Record a new loan
    function recordLoan(
        address _borrower,
        bytes32 _loanId,
        uint256 _amount,
        uint256 _dueDate
    ) external onlyOwner {
        require(_borrower != address(0), "Invalid borrower address");
        require(_amount > 0, "Invalid loan amount");
        require(loanRecords[_loanId].borrower == address(0), "Loan already recorded");

        // Initialize borrower reputation if new
        if (!borrowerReputations[_borrower].isActive) {
            borrowerReputations[_borrower] = BorrowerReputation({
                totalLoans: 0,
                repaidLoans: 0,
                defaultedLoans: 0,
                totalBorrowed: 0,
                totalRepaid: 0,
                lastRepaymentTime: 0,
                reputationScore: baseReputationScore,
                isActive: true,
                createdAt: block.timestamp,
                updatedAt: block.timestamp
            });
        }

        // Create loan record
        loanRecords[_loanId] = LoanRecord({
            borrower: _borrower,
            loanId: uint256(_loanId),
            amount: _amount,
            repaidAmount: 0,
            dueDate: _dueDate,
            repaymentDate: 0,
            isRepaid: false,
            isDefaulted: false,
            createdAt: block.timestamp
        });

        // Add to borrower's loan list
        borrowerLoans[_borrower].push(_loanId);

        // Update borrower stats
        borrowerReputations[_borrower].totalLoans += 1;
        borrowerReputations[_borrower].totalBorrowed += _amount;
        borrowerReputations[_borrower].updatedAt = block.timestamp;

        emit LoanRecorded(_loanId, _borrower, _amount);
    }

    // Record a repayment
    function recordRepayment(
        bytes32 _loanId,
        uint256 _repaidAmount,
        bool _onTime
    ) external onlyOwner {
        LoanRecord storage loan = loanRecords[_loanId];
        require(loan.borrower != address(0), "Loan not found");
        require(!loan.isRepaid, "Loan already repaid");
        require(!loan.isDefaulted, "Loan is defaulted");

        address borrower = loan.borrower;
        BorrowerReputation storage reputation = borrowerReputations[borrower];

        // Update loan record
        loan.repaidAmount += _repaidAmount;
        loan.repaymentDate = block.timestamp;

        // Check if fully repaid
        if (loan.repaidAmount >= loan.amount) {
            loan.isRepaid = true;
            reputation.repaidLoans += 1;
            reputation.lastRepaymentTime = block.timestamp;
        }

        reputation.totalRepaid += _repaidAmount;
        reputation.updatedAt = block.timestamp;

        // Update reputation score
        _updateReputationScore(borrower, _onTime, false);

        emit RepaymentRecorded(_loanId, borrower, _repaidAmount, _onTime);
    }

    // Record a default
    function recordDefault(bytes32 _loanId) external onlyOwner {
        LoanRecord storage loan = loanRecords[_loanId];
        require(loan.borrower != address(0), "Loan not found");
        require(!loan.isRepaid, "Loan already repaid");
        require(!loan.isDefaulted, "Loan already defaulted");

        address borrower = loan.borrower;
        BorrowerReputation storage reputation = borrowerReputations[borrower];

        // Update loan record
        loan.isDefaulted = true;
        loan.repaymentDate = block.timestamp;

        // Update borrower stats
        reputation.defaultedLoans += 1;
        reputation.updatedAt = block.timestamp;

        // Update reputation score
        _updateReputationScore(borrower, false, true);

        emit DefaultRecorded(_loanId, borrower, loan.amount);
    }

    // Internal function to update reputation score
    function _updateReputationScore(address _borrower, bool _onTime, bool _isDefault) internal {
        BorrowerReputation storage reputation = borrowerReputations[_borrower];

        int256 scoreChange = 0;

        if (_isDefault) {
            scoreChange -= int256(defaultPenalty);
        } else if (_onTime) {
            scoreChange += int256(onTimeRepaymentBonus);

            // Check for consecutive on-time payments
            if (_isConsecutiveOnTimePayment(_borrower)) {
                scoreChange += int256(consistentRepaymentBonus);
            }

            // Early repayment bonus
            if (loanRecords[borrowerLoans[_borrower][borrowerLoans[_borrower].length - 1]].repaymentDate < loanRecords[borrowerLoans[_borrower][borrowerLoans[_borrower].length - 1]].dueDate) {
                scoreChange += int256(earlyRepaymentBonus);
            }
        } else {
            scoreChange -= int256(lateRepaymentPenalty);
        }

        // Long-term borrower bonus
        if (reputation.createdAt > 0 && block.timestamp - reputation.createdAt > 365 days) {
            scoreChange += int256(longTermBorrowerBonus);
        }

        // Apply score change with bounds
        if (scoreChange > 0) {
            reputation.reputationScore = uint256(int256(reputation.reputationScore) + scoreChange);
            if (reputation.reputationScore > maxReputationScore) {
                reputation.reputationScore = maxReputationScore;
            }
        } else {
            reputation.reputationScore = uint256(int256(reputation.reputationScore) - uint256(-scoreChange));
            if (reputation.reputationScore < minReputationScore) {
                reputation.reputationScore = minReputationScore;
            }
        }

        emit ReputationUpdated(_borrower, reputation.reputationScore, _isDefault ? "default" : (_onTime ? "on-time repayment" : "late repayment"));
    }

    // Check if this is a consecutive on-time payment
    function _isConsecutiveOnTimePayment(address _borrower) internal view returns (bool) {
        bytes32[] memory loans = borrowerLoans[_borrower];
        if (loans.length < 2) return false;

        // Check last two loans
        LoanRecord memory lastLoan = loanRecords[loans[loans.length - 1]];
        LoanRecord memory prevLoan = loanRecords[loans[loans.length - 2]];

        return lastLoan.isRepaid && prevLoan.isRepaid &&
               lastLoan.repaymentDate <= lastLoan.dueDate &&
               prevLoan.repaymentDate <= prevLoan.dueDate;
    }

    // Get borrower reputation
    function getBorrowerReputation(address _borrower) external view returns (
        uint256 totalLoans,
        uint256 repaidLoans,
        uint256 defaultedLoans,
        uint256 reputationScore,
        uint256 repaymentRate
    ) {
        BorrowerReputation memory reputation = borrowerReputations[_borrower];

        uint256 repaymentRate = 0;
        if (reputation.totalLoans > 0) {
            repaymentRate = (reputation.repaidLoans * 10000) / reputation.totalLoans; // Basis points
        }

        return (
            reputation.totalLoans,
            reputation.repaidLoans,
            reputation.defaultedLoans,
            reputation.reputationScore,
            repaymentRate
        );
    }

    // Get loan details
    function getLoanRecord(bytes32 _loanId) external view returns (
        address borrower,
        uint256 amount,
        uint256 repaidAmount,
        uint256 dueDate,
        uint256 repaymentDate,
        bool isRepaid,
        bool isDefaulted
    ) {
        LoanRecord memory loan = loanRecords[_loanId];
        return (
            loan.borrower,
            loan.amount,
            loan.repaidAmount,
            loan.dueDate,
            loan.repaymentDate,
            loan.isRepaid,
            loan.isDefaulted
        );
    }

    // Get borrower's loan history
    function getBorrowerLoans(address _borrower) external view returns (bytes32[] memory) {
        return borrowerLoans[_borrower];
    }

    // Calculate credit score based on reputation
    function calculateCreditScore(address _borrower) external view returns (uint256) {
        BorrowerReputation memory reputation = borrowerReputations[_borrower];

        if (!reputation.isActive) return baseReputationScore;

        // Base score from reputation
        uint256 score = reputation.reputationScore;

        // Adjust based on repayment rate
        uint256 repaymentRate = 0;
        if (reputation.totalLoans > 0) {
            repaymentRate = (reputation.repaidLoans * 100) / reputation.totalLoans;
        }

        if (repaymentRate >= 95) {
            score += 50;
        } else if (repaymentRate >= 85) {
            score += 25;
        } else if (repaymentRate < 70) {
            score -= 50;
        }

        // Adjust based on loan volume (experience)
        if (reputation.totalLoans >= 10) {
            score += 25;
        } else if (reputation.totalLoans >= 5) {
            score += 10;
        }

        // Bound the score
        if (score > maxReputationScore) score = maxReputationScore;
        if (score < minReputationScore) score = minReputationScore;

        return score;
    }

    // Update reputation parameters (governance function)
    function updateParameters(
        uint256 _maxReputationScore,
        uint256 _minReputationScore,
        uint256 _onTimeRepaymentBonus,
        uint256 _lateRepaymentPenalty,
        uint256 _defaultPenalty
    ) external onlyOwner {
        maxReputationScore = _maxReputationScore;
        minReputationScore = _minReputationScore;
        onTimeRepaymentBonus = _onTimeRepaymentBonus;
        lateRepaymentPenalty = _lateRepaymentPenalty;
        defaultPenalty = _defaultPenalty;
    }

    // Batch update reputations (for migration or bulk operations)
    function batchUpdateReputations(
        address[] memory _borrowers,
        uint256[] memory _newScores
    ) external onlyOwner {
        require(_borrowers.length == _newScores.length, "Arrays length mismatch");

        for (uint256 i = 0; i < _borrowers.length; i++) {
            require(_newScores[i] >= minReputationScore && _newScores[i] <= maxReputationScore, "Invalid score");
            borrowerReputations[_borrowers[i]].reputationScore = _newScores[i];
            borrowerReputations[_borrowers[i]].updatedAt = block.timestamp;

            emit ReputationUpdated(_borrowers[i], _newScores[i], "batch update");
        }
    }
}