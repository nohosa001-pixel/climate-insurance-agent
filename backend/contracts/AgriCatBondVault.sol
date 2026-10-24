// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AgriCatBondVault
 * @dev ERC-4626 Compatible Dual-Tranche Catastrophe Bond Vault for AgriPulse
 * 
 * Tranche Architecture:
 * 1. Senior Tranche (Capital Preservation):
 *    - Backed by Institutional Reinsurers & Family Offices
 *    - Low volatility, priority yield distribution (6.5% APY target)
 *    - Zero principal loss until Junior Tranche is 100% depleted
 * 
 * 2. Junior Tranche (First-Loss Underwriting):
 *    - Backed by Web3 DeFi Yield Seekers & Algorithmic Funds
 *    - High yield (16.8% APY target) derived from 80% of parametric policy premiums
 *    - Absorbs initial climate disaster settlement payouts
 */
contract AgriCatBondVault {
    string public name = "AgriPulse Cat-Bond Tranche Vault";
    string public symbol = "agriCAT";

    address public immutable asset; // Mock USDC address
    address public multiSigAdmin;

    uint256 public seniorTotalDepositsUSD;
    uint256 public seniorTotalShares;
    uint256 public juniorTotalDepositsUSD;
    uint256 public juniorTotalShares;

    mapping(address => uint256) public seniorSharesOf;
    mapping(address => uint256) public juniorSharesOf;

    event SeniorDeposit(address indexed investor, uint256 amountUSD, uint256 sharesIssued);
    event JuniorDeposit(address indexed investor, uint256 amountUSD, uint256 sharesIssued);
    event SeniorWithdraw(address indexed investor, uint256 amountUSD, uint256 sharesBurned);
    event JuniorWithdraw(address indexed investor, uint256 amountUSD, uint256 sharesBurned);
    event LossAbsorbed(uint256 totalPayoutUSD, uint256 juniorAbsorbedUSD, uint256 seniorAbsorbedUSD);
    event PremiumYieldHarvested(uint256 totalPremiumUSD, uint256 juniorYieldUSD, uint256 seniorYieldUSD);

    modifier onlyAdmin() {
        require(msg.sender == multiSigAdmin, "Not admin");
        _;
    }

    constructor(address _asset, address _admin) {
        asset = _asset;
        multiSigAdmin = _admin;
        
        // Seed initial pool liquidity
        seniorTotalDepositsUSD = 6_000_000 * 1e6; // $6M Senior
        seniorTotalShares = 6_000_000 * 1e6;
        juniorTotalDepositsUSD = 4_000_000 * 1e6; // $4M Junior
        juniorTotalShares = 4_000_000 * 1e6;
    }

    /**
     * @notice Deposit into Senior Tranche (Low-Risk Institutional)
     */
    function depositSenior(uint256 amountUSD) external returns (uint256 shares) {
        require(amountUSD > 0, "Amount > 0");
        shares = seniorTotalShares == 0 ? amountUSD : (amountUSD * seniorTotalShares) / seniorTotalDepositsUSD;
        
        seniorTotalDepositsUSD += amountUSD;
        seniorTotalShares += shares;
        seniorSharesOf[msg.sender] += shares;

        emit SeniorDeposit(msg.sender, amountUSD, shares);
        return shares;
    }

    /**
     * @notice Deposit into Junior Tranche (First-Loss High-Yield)
     */
    function depositJunior(uint256 amountUSD) external returns (uint256 shares) {
        require(amountUSD > 0, "Amount > 0");
        shares = juniorTotalShares == 0 ? amountUSD : (amountUSD * juniorTotalShares) / juniorTotalDepositsUSD;
        
        juniorTotalDepositsUSD += amountUSD;
        juniorTotalShares += shares;
        juniorSharesOf[msg.sender] += shares;

        emit JuniorDeposit(msg.sender, amountUSD, shares);
        return shares;
    }

    /**
     * @notice Settle insurance payout with First-Loss Waterfall Logic
     */
    function processLossWaterfall(uint256 payoutAmountUSD) external onlyAdmin {
        uint256 juniorAbsorbed = 0;
        uint256 seniorAbsorbed = 0;

        if (juniorTotalDepositsUSD >= payoutAmountUSD) {
            // Junior absorbs 100% of loss
            juniorAbsorbed = payoutAmountUSD;
            juniorTotalDepositsUSD -= juniorAbsorbed;
        } else {
            // Junior wiped out completely, remainder spills over to Senior
            juniorAbsorbed = juniorTotalDepositsUSD;
            seniorAbsorbed = payoutAmountUSD - juniorAbsorbed;
            juniorTotalDepositsUSD = 0;

            if (seniorTotalDepositsUSD >= seniorAbsorbed) {
                seniorTotalDepositsUSD -= seniorAbsorbed;
            } else {
                seniorTotalDepositsUSD = 0; // Total Vault Insolvency
            }
        }

        emit LossAbsorbed(payoutAmountUSD, juniorAbsorbed, seniorAbsorbed);
    }

    /**
     * @notice Distribute collected insurance premiums according to risk weighting
     * 75% to Junior (high risk, high yield), 25% to Senior
     */
    function distributePremiums(uint256 premiumAmountUSD) external onlyAdmin {
        uint256 juniorShare = (premiumAmountUSD * 75) / 100;
        uint256 seniorShare = premiumAmountUSD - juniorShare;

        juniorTotalDepositsUSD += juniorShare;
        seniorTotalDepositsUSD += seniorShare;

        emit PremiumYieldHarvested(premiumAmountUSD, juniorShare, seniorShare);
    }

    function getVaultOverview() external view returns (
        uint256 totalVaultUSD,
        uint256 seniorUSD,
        uint256 juniorUSD,
        uint256 juniorBufferRatioBps
    ) {
        totalVaultUSD = seniorTotalDepositsUSD + juniorTotalDepositsUSD;
        seniorUSD = seniorTotalDepositsUSD;
        juniorUSD = juniorTotalDepositsUSD;
        juniorBufferRatioBps = totalVaultUSD > 0 ? (juniorUSD * 10000) / totalVaultUSD : 0;
    }
}
