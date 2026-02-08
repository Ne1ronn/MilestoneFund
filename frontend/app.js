/* global ethers */

// ====== CONFIG ======
const SEPOLIA_CHAIN_ID = 11155111;
const CROWDFUNDING_ADDRESS = "0x2D945E7b35263036A0abeFd5b9E5d44F0b6A62Ff";

const CROWDFUNDING_ABI = [
  "function rewardToken() view returns (address)",
  "function getCampaignCount() view returns (uint256)",
  "function createCampaign(uint256 _deadline)",
  "function contribute(uint256 campaignId) payable",
  "function finalize(uint256 campaignId)"
];

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

// ====== DOM HELPERS ======
const $ = (id) => document.getElementById(id);

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = value;
}

function getVal(id) {
  const el = $(id);
  return el ? el.value : "";
}

// ====== STATE ======
let provider, signer, userAddress;
let crowdfunding, token;

// ====== NETWORK CHECK ======
async function ensureSepolia() {
  const net = await provider.getNetwork();
  const chainId = Number(net.chainId);
  if (chainId !== SEPOLIA_CHAIN_ID) {
    throw new Error(`Wrong network (chainId=${chainId}). Switch MetaMask to Sepolia.`);
  }
}

// ====== REFRESH UI ======
async function refreshUI() {
  if (!provider || !userAddress || !crowdfunding) return;

  const ethBal = await provider.getBalance(userAddress);

  const tokenAddr = await crowdfunding.rewardToken();
  token = new ethers.Contract(tokenAddr, ERC20_ABI, provider);

  const [raw, dec, sym] = await Promise.all([
    token.balanceOf(userAddress),
    token.decimals().catch(() => 18),
    token.symbol().catch(() => "TOKEN")
  ]);

  setText("wallet", userAddress);
  setText("ethBal", ethers.formatEther(ethBal));
  setText("tokenBal", `${ethers.formatUnits(raw, dec)} ${sym}`);
}

// ====== CONNECT ======
async function connect() {
  try {
    if (!window.ethereum) {
      alert("MetaMask not found");
      return;
    }
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    userAddress = await signer.getAddress();

    await ensureSepolia();

    crowdfunding = new ethers.Contract(CROWDFUNDING_ADDRESS, CROWDFUNDING_ABI, signer);
    await refreshUI();

    try {
      const n = await crowdfunding.getCampaignCount();
      console.log("Campaigns:", n.toString());
    } catch {}

  } catch (e) {
    console.error(e);
    alert(e?.message || "Connect failed");
  }
}

// ====== ACTIONS (как у сокомандника) ======
async function createCampaignFromUI() {
  try {
    if (!crowdfunding) throw new Error("Connect wallet first");

    const durationSec = Number(getVal("durationSec") || "0");
    if (!durationSec || durationSec < 60) throw new Error("Duration must be >= 60 seconds");

    const now = Math.floor(Date.now() / 1000);
    const deadline = now + durationSec;

    const tx = await crowdfunding.createCampaign(deadline);
    await tx.wait();

    alert("Campaign created");
    await refreshUI();

  } catch (e) {
    console.error(e);
    alert("Create campaign failed");
  }
}

async function donateFromUI() {
  try {
    if (!crowdfunding) throw new Error("Connect wallet first");

    const campaignId = Number(getVal("campaignId") || "0");
    const eth = (getVal("donateEth") || "").trim();
    if (!eth) throw new Error("Enter ETH amount");

    const tx = await crowdfunding.contribute(campaignId, {
      value: ethers.parseEther(eth)
    });
    await tx.wait();

    alert("Donation sent");
    await refreshUI();

  } catch (e) {
    console.error(e);
    alert("Donate failed");
  }
}

async function finalizeFromUI() {
  try {
    if (!crowdfunding) throw new Error("Connect wallet first");

    const campaignId = Number(getVal("campaignId") || "0");
    const tx = await crowdfunding.finalize(campaignId);
    await tx.wait();

    alert("Finalized");
    await refreshUI();

  } catch (e) {
    console.error(e);
    alert("Finalize failed");
  }
}

// ====== WIRE BUTTONS ======
function wire() {
  $("connectBtn")?.addEventListener("click", connect);
  $("createBtn")?.addEventListener("click", createCampaignFromUI);
  $("donateBtn")?.addEventListener("click", donateFromUI);
  $("finalizeBtn")?.addEventListener("click", finalizeFromUI);

  if (window.ethereum) {
    window.ethereum.on("accountsChanged", () => connect());
    window.ethereum.on("chainChanged", () => connect());
  }
}

wire();
