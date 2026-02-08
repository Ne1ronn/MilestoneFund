const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH");

  const RewardToken = await hre.ethers.getContractFactory("RewardToken");
  const rewardToken = await RewardToken.deploy();
  await rewardToken.waitForDeployment();

  const rewardTokenAddress = await rewardToken.getAddress();
  console.log("RewardToken deployed:", rewardTokenAddress);

  const Crowdfunding = await hre.ethers.getContractFactory("Crowdfunding");
  const crowdfunding = await Crowdfunding.deploy(rewardTokenAddress);
  await crowdfunding.waitForDeployment();

  const crowdfundingAddress = await crowdfunding.getAddress();
  console.log("Crowdfunding deployed:", crowdfundingAddress);

  const tx = await rewardToken.transferOwnership(crowdfundingAddress);
  await tx.wait();
  console.log("RewardToken ownership transferred to Crowdfunding");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
