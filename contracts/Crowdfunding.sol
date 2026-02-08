// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RewardToken.sol";

contract Crowdfunding {
    struct Campaign {
        address creator;
        uint256 deadline;
        uint256 totalRaised;
        bool finalized;
    }

    Campaign[] public campaigns;

    // campaignId => user => ETH contributed
    mapping(uint256 => mapping(address => uint256)) public contributions;

    RewardToken public rewardToken;

    uint256 public constant REWARD_RATE = 100; // 1 ETH = 100 RWT

    event CampaignCreated(uint256 indexed id, address indexed creator, uint256 deadline);
    event Contributed(uint256 indexed id, address indexed contributor, uint256 amount);
    event Finalized(uint256 indexed id);

    constructor(address _rewardToken) {
        rewardToken = RewardToken(_rewardToken);
    }

    function createCampaign(uint256 _deadline) external {
        require(_deadline > block.timestamp, "Deadline must be in future");

        campaigns.push(
            Campaign({
                creator: msg.sender,
                deadline: _deadline,
                totalRaised: 0,
                finalized: false
            })
        );

        emit CampaignCreated(campaigns.length - 1, msg.sender, _deadline);
    }

    function contribute(uint256 campaignId) external payable {
        require(campaignId < campaigns.length, "Invalid campaign");
        Campaign storage c = campaigns[campaignId];

        require(block.timestamp < c.deadline, "Campaign ended");
        require(!c.finalized, "Finalized");
        require(msg.value > 0, "Zero contribution");

        contributions[campaignId][msg.sender] += msg.value;
        c.totalRaised += msg.value;

        // mint reward tokens
        uint256 rewardAmount = (msg.value * REWARD_RATE) / 1 ether;
        rewardToken.mint(msg.sender, rewardAmount);

        emit Contributed(campaignId, msg.sender, msg.value);
    }

    function finalize(uint256 campaignId) external {
        require(campaignId < campaigns.length, "Invalid campaign");
        Campaign storage c = campaigns[campaignId];

        require(block.timestamp >= c.deadline, "Not ended yet");
        require(!c.finalized, "Already finalized");

        c.finalized = true;

        emit Finalized(campaignId);
    }

    function getCampaignCount() external view returns (uint256) {
        return campaigns.length;
    }
}
