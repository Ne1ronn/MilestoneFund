// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RewardToken.sol";

contract Crowdfunding {
    struct Milestone {
        uint256 amount;
        bool closed;
    }

    struct Campaign {
        address creator;
        uint256 deadline;
        uint256 totalRaised;
        bool active;
    }

    Campaign[] public campaigns;

    // campaignId => milestones
    mapping(uint256 => Milestone[]) public milestones;

    // campaignId => user => contributed ETH
    mapping(uint256 => mapping(address => uint256)) public contributions;

    RewardToken public rewardToken;

    constructor(address _rewardToken) {
        rewardToken = RewardToken(_rewardToken);
    }

    function createCampaign(
        uint256 _deadline,
        uint256[] calldata _milestoneAmounts
    ) external {
        require(_deadline > block.timestamp, "Deadline must be in future");
        require(_milestoneAmounts.length > 0, "No milestones");

        campaigns.push(
            Campaign({
                creator: msg.sender,
                deadline: _deadline,
                totalRaised: 0,
                active: true
            })
        );

        uint256 campaignId = campaigns.length - 1;

        for (uint256 i = 0; i < _milestoneAmounts.length; i++) {
            require(_milestoneAmounts[i] > 0, "Zero milestone");
            milestones[campaignId].push(
                Milestone({
                    amount: _milestoneAmounts[i],
                    closed: false
                })
            );
        }
    }

    function getCampaignCount() external view returns (uint256) {
        return campaigns.length;
    }

    function getMilestoneCount(uint256 campaignId) external view returns (uint256) {
        return milestones[campaignId].length;
    }

    function contribute(uint256 campaignId) external payable {
        Campaign storage campaign = campaigns[campaignId];

        require(campaign.active, "Campaign not active");
        require(block.timestamp < campaign.deadline, "Campaign ended");
        require(msg.value > 0, "Zero contribution");

        contributions[campaignId][msg.sender] += msg.value;
        campaign.totalRaised += msg.value;
    }

}