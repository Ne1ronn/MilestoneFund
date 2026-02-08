const SEPOLIA_CHAIN_ID = 11155111;
const CROWDFUNDING_ADDRESS =
    ethers.getAddress("0x138546d24c67A74b6e75E8113a62744aC8b39b28");

const CROWDFUNDING_ABI = [
  "function rewardToken() view returns (address)",
  "function getCampaignCount() view returns (uint256)",
  "function createCampaign(uint256[] _milestones, uint256 _deadline)",
  "function contribute(uint256 campaignId) payable",
  "function confirmMilestone(uint256 campaignId)"
];

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

const $ = (id) => document.getElementById(id);

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = value;
}

function getVal(id) {
  const el = $(id);
  return el ? el.value : "";
}

let provider, signer, userAddress;
let crowdfunding, token;

async function ensureSepolia() {
  const net = await provider.getNetwork();
  if (Number(net.chainId) !== SEPOLIA_CHAIN_ID) {
    throw new Error("Switch MetaMask to Sepolia");
  }
}

async function refreshUI() {
  const ethBal = await provider.getBalance(userAddress);

  const tokenAddr = await crowdfunding.connect(provider).rewardToken();
  token = new ethers.Contract(tokenAddr, ERC20_ABI, provider);

  const [raw, dec, sym] = await Promise.all([
    token.balanceOf(userAddress),
    token.decimals().catch(() => 18),
    token.symbol().catch(() => "RWT")
  ]);

  setText("wallet", userAddress);
  setText("ethBal", ethers.formatEther(ethBal));
  setText("tokenBal", `${ethers.formatUnits(raw, dec)} ${sym}`);
}

async function connect() {
  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  await ensureSepolia();
  signer = await provider.getSigner();
  userAddress = await signer.getAddress();

  await ensureSepolia();

  crowdfunding = new ethers.Contract(
      CROWDFUNDING_ADDRESS,
      CROWDFUNDING_ABI,
      signer
  );

  await refreshUI();
}

async function createCampaignFromUI() {
  try {
    const durationSec = Number(getVal("durationSec"));
    const milestonesRaw = getVal("milestones");

    const milestones = milestonesRaw
        .split(",")
        .map(v => ethers.parseEther(v.trim()));

    const deadline =
        Math.floor(Date.now() / 1000) + durationSec;

    const tx = await crowdfunding.createCampaign(milestones, deadline);
    await tx.wait();

    alert("Campaign created");
  } catch (e) {
    alert("Transaction reverted");
  }
}

async function donateFromUI() {
  try {
    const campaignId = Number(getVal("campaignId"));
    const eth = getVal("donateEth");

    const tx = await crowdfunding.contribute(campaignId, {
      value: ethers.parseEther(eth)
    });
    await tx.wait();

    alert("Donation sent");
  } catch (e) {
    alert("Transaction reverted");
  }
}

async function confirmMilestoneFromUI() {
  try {
    const campaignId = Number(getVal("campaignId"));

    const tx = await crowdfunding.confirmMilestone(campaignId);
    await tx.wait();

    alert("Milestone confirmed");
  } catch (e) {
    alert("Transaction reverted");
  }
}

function wire() {
  $("connectBtn")?.addEventListener("click", connect);
  $("createBtn")?.addEventListener("click", createCampaignFromUI);
  $("donateBtn")?.addEventListener("click", donateFromUI);
  $("confirmBtn")?.addEventListener("click", confirmMilestoneFromUI);

  if (window.ethereum) {
    window.ethereum.on("accountsChanged", connect);
    window.ethereum.on("chainChanged", connect);
  }
}

wire();
