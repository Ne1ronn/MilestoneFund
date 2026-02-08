// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RewardToken.sol";

contract Crowdfunding {

    struct Milestone {
        uint256 amount; 
        bool completed;
    }

    struct Campaign {
        address creator;
        uint256 totalRaised;
        uint256 currentMilestone;
        uint256 deadline;
        bool finished;
        Milestone[] milestones;
    }

    Campaign[] public campaigns;

    mapping(uint256 => mapping(address => uint256)) public contributions;

    RewardToken public rewardToken;

    uint256 public constant REWARD_RATE = 100; // 1 ETH = 100 RWT

    event CampaignCreated(uint256 id, address creator, uint256 deadline);
    event Contributed(uint256 id, address contributor, uint256 amount);
    event MilestoneConfirmed(uint256 id, uint256 milestoneIndex);
    event CampaignFinished(uint256 id);

    constructor(address _rewardToken) {
        rewardToken = RewardToken(_rewardToken);
    }

    function createCampaign(
        uint256[] calldata _milestones,
        uint256 _deadline
    ) external {
        require(_milestones.length > 0, "No milestones");
        require(_deadline > block.timestamp, "Bad deadline");

        campaigns.push();
        Campaign storage c = campaigns[campaigns.length - 1];

        c.creator = msg.sender;
        c.currentMilestone = 0;
        c.deadline = _deadline;
        c.finished = false;

        for (uint256 i = 0; i < _milestones.length; i++) {
            require(_milestones[i] > 0, "Zero milestone");
            c.milestones.push(
                Milestone({
                    amount: _milestones[i],
                    completed: false
                })
            );
        }

        emit CampaignCreated(campaigns.length - 1, msg.sender, _deadline);
    }

    function contribute(uint256 campaignId) external payable {
        require(campaignId < campaigns.length, "Invalid campaign");

        Campaign storage c = campaigns[campaignId];

        require(block.timestamp < c.deadline, "Campaign ended");
        require(!c.finished, "Campaign finished");
        require(msg.value > 0, "Zero contribution");

        contributions[campaignId][msg.sender] += msg.value;
        c.totalRaised += msg.value;

        emit Contributed(campaignId, msg.sender, msg.value);
    }

    function confirmMilestone(uint256 campaignId) external {
        require(campaignId < campaigns.length, "Invalid campaign");

        Campaign storage c = campaigns[campaignId];

        require(msg.sender == c.creator, "Not creator");
        require(!c.finished, "Finished");

        uint256 index = c.currentMilestone;
        Milestone storage m = c.milestones[index];

        require(!m.completed, "Already completed");
        require(c.totalRaised >= m.amount, "Not enough funds");

        m.completed = true;
        c.totalRaised -= m.amount;

        // transfer ETH to creator
        payable(c.creator).transfer(m.amount);

        uint256 rewardAmount = (m.amount * REWARD_RATE) / 1 ether;
        rewardToken.mint(c.creator, rewardAmount);

        emit MilestoneConfirmed(campaignId, index);

        c.currentMilestone++;

        if (c.currentMilestone == c.milestones.length) {
            c.finished = true;
            emit CampaignFinished(campaignId);
        }
    }

    function getCampaignCount() external view returns (uint256) {
        return campaigns.length;
    }
}
