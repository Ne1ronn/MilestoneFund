const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH");

  // CrowdfundingMilestones(tokenName, tokenSymbol)
  const Crowdfunding = await hre.ethers.getContractFactory("CrowdfundingMilestones");

  const crowdfunding = await Crowdfunding.deploy("Milestone Reward", "MSR");
  await crowdfunding.waitForDeployment();

  const crowdfundingAddress = await crowdfunding.getAddress();
  console.log("Crowdfunding deployed:", crowdfundingAddress);

  // token address stored inside crowdfunding
  const tokenAddress = await crowdfunding.rewardToken();
  console.log("RewardToken deployed:", tokenAddress);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
