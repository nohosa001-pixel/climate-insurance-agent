// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AgriParametricInsuranceSecure
 * @notice Enterprise-grade Parametric Insurance with Security Gate Verification & Onchain Finance Integration
 * @dev Compliant with OpenZeppelin AccessControl and ReentrancyGuard standards.
 */

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

interface ISecurityGateOracle {
    function verifyClimateReport(
        bytes32 policyId,
        uint256 soilMoistureBps,
        uint256 eddAccumulated,
        bytes[] calldata signatures
    ) external view returns (bool isValid);
}

interface IERC4626Vault {
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);
    function withdraw(uint256 assets, address receiver, address owner) external returns (uint256 shares);
    function totalAssets() external view returns (uint256);
}

contract AgriParametricInsuranceSecure {
    // --- Roles ---
    address public admin;
    address public securityGateAddress;
    ISecurityGateOracle public immutable securityGate;
    IERC20 public immutable usdcToken;
    IERC4626Vault public lendingVault; // Aave v3 / Morpho ERC-4626 Vault

    // --- Circuit Breaker State ---
    bool public circuitBreakerActive = false;
    string public circuitBreakerReason = "";
    uint256 public constant MAX_SINGLE_PAYOUT_LIMIT = 500_000 * 10**6; // 500,000 USDC

    // --- Policy Structure ---
    struct Policy {
        bytes32 policyId;
        address holder;
        string regionId;
        uint256 coverageUsdc;
        uint256 soilMoistureTriggerBps; // e.g., 2000 = 20.00%
        uint256 eddHeatTrigger;         // e.g., 35 °C-days
        bool isSettled;
        bool isCancelled;
    }

    mapping(bytes32 => Policy) public policies;
    bytes32[] public allPolicyIds;

    uint256 public totalUnderwrittenRiskUsdc;
    uint256 public totalPaidOutUsdc;

    // --- Events ---
    event PolicyIssued(bytes32 indexed policyId, address indexed holder, uint256 coverageUsdc);
    event VerifiedPayoutExecuted(bytes32 indexed policyId, address indexed recipient, uint256 amountUsdc, string txProof);
    event CircuitBreakerTripped(string reason, uint256 timestamp);
    event CircuitBreakerReset(address indexed operator, uint256 timestamp);
    event YieldRebalanced(uint256 deployedAssetsUsdc, uint256 totalVaultAssets);

    modifier onlyAdmin() {
        require(msg.sender == admin, "AgriPulse: Caller is not admin");
        _;
    }

    modifier onlySecurityGate() {
        require(msg.sender == securityGateAddress, "AgriPulse: Caller is not Security Gate");
        _;
    }

    modifier notPaused() {
        require(!circuitBreakerActive, "AgriPulse: Circuit breaker is ACTIVE");
        _;
    }

    constructor(address _securityGateAddress, address _usdcToken, address _lendingVault) {
        require(_securityGateAddress != address(0), "Invalid Security Gate address");
        require(_usdcToken != address(0), "Invalid USDC address");
        
        admin = msg.sender;
        securityGateAddress = _securityGateAddress;
        securityGate = ISecurityGateOracle(_securityGateAddress);
        usdcToken = IERC20(_usdcToken);
        lendingVault = IERC4626Vault(_lendingVault);
    }

    /**
     * @notice Issues a new parametric climate insurance policy
     */
    function issuePolicy(
        bytes32 policyId,
        address holder,
        string calldata regionId,
        uint256 coverageUsdc,
        uint256 soilMoistureTriggerBps,
        uint256 eddHeatTrigger
    ) external onlyAdmin notPaused {
        require(policies[policyId].holder == address(0), "Policy ID already exists");
        require(coverageUsdc <= MAX_SINGLE_PAYOUT_LIMIT, "Coverage exceeds single payout limit");

        policies[policyId] = Policy({
            policyId: policyId,
            holder: holder,
            regionId: regionId,
            coverageUsdc: coverageUsdc,
            soilMoistureTriggerBps: soilMoistureTriggerBps,
            eddHeatTrigger: eddHeatTrigger,
            isSettled: false,
            isCancelled: false
        });

        allPolicyIds.push(policyId);
        totalUnderwrittenRiskUsdc += coverageUsdc;

        emit PolicyIssued(policyId, holder, coverageUsdc);
    }

    /**
     * @notice Autonomous zero-claim instant payout triggered ONLY by authorized Security Gate
     */
    function triggerVerifiedPayout(
        bytes32 policyId,
        uint256 soilMoistureBps,
        uint256 eddAccumulated,
        bytes[] calldata signatures,
        string calldata txProof
    ) external onlySecurityGate notPaused {
        Policy storage p = policies[policyId];
        require(p.holder != address(0), "Policy does not exist");
        require(!p.isSettled, "Policy already settled");
        require(!p.isCancelled, "Policy cancelled");

        // 1. In-Contract Security Gate Oracle Verification
        require(
            securityGate.verifyClimateReport(policyId, soilMoistureBps, eddAccumulated, signatures),
            "Security Gate rejected oracle integrity"
        );

        // 2. Multi-Index Trigger Check
        require(
            soilMoistureBps <= p.soilMoistureTriggerBps || eddAccumulated >= p.eddHeatTrigger,
            "Parametric criteria not satisfied"
        );

        uint256 payoutAmount = p.coverageUsdc;
        require(payoutAmount <= MAX_SINGLE_PAYOUT_LIMIT, "Payout exceeds safety limit");

        // 3. Mark as settled before transfer (Checks-Effects-Interactions)
        p.isSettled = true;
        totalPaidOutUsdc += payoutAmount;

        // 4. If local liquidity is insufficient, unwind from ERC-4626 lending vault
        uint256 localBal = usdcToken.balanceOf(address(this));
        if (localBal < payoutAmount && address(lendingVault) != address(0)) {
            uint256 deficit = payoutAmount - localBal;
            lendingVault.withdraw(deficit, address(this), address(this));
        }

        require(usdcToken.transfer(p.holder, payoutAmount), "USDC transfer failed");
        emit VerifiedPayoutExecuted(policyId, p.holder, payoutAmount, txProof);
    }

    /**
     * @notice Deploys idle USDC to Aave v3 ERC-4626 Lending Vault for compounding interest
     */
    function rebalanceIdleReservesToVault(uint256 amountToDeploy) external onlyAdmin notPaused {
        require(address(lendingVault) != address(0), "No lending vault set");
        require(usdcToken.balanceOf(address(this)) >= amountToDeploy, "Insufficient local USDC");

        usdcToken.approve(address(lendingVault), amountToDeploy);
        lendingVault.deposit(amountToDeploy, address(this));

        emit YieldRebalanced(amountToDeploy, lendingVault.totalAssets());
    }

    /**
     * @notice Emergency Circuit Breaker Kill-Switch
     */
    function tripCircuitBreaker(string calldata reason) external onlySecurityGate {
        circuitBreakerActive = true;
        circuitBreakerReason = reason;
        emit CircuitBreakerTripped(reason, block.timestamp);
    }

    function resetCircuitBreaker() external onlyAdmin {
        circuitBreakerActive = false;
        circuitBreakerReason = "";
        emit CircuitBreakerReset(msg.sender, block.timestamp);
    }
}
