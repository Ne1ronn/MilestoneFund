const CHAIN = {
  sepolia: { chainIdHex: "0xaa36a7", name: "Sepolia" },
  holesky: { chainIdHex: "0x4268", name: "Holesky" },
};

const $ = (id) => document.getElementById(id);

const out = (msg) => { $("out").textContent = String(msg); };
const setStatus = (msg, ok = true) => {
  $("status").innerHTML = `<span class="${ok ? "ok" : "bad"}">${msg}</span>`;
};

let provider = null;
let signer = null;
let user = null;

let crowdfunding = null;
let token = null;

const CROWDFUNDING_ABI = [
  "function rewardToken() view returns (address)",
  "function campaignsCount() view returns (uint256)",
  "function milestonesCount(uint256) view returns (uint256)",
  "function createCampaign(string title,uint256 goal,uint256 durationSeconds,uint256[] milestoneAmounts) returns (uint256)",
  "function contribute(uint256 campaignId) payable",
  "function closeMilestone(uint256 campaignId,uint256 milestoneIndex)",
  "function claimReward(uint256 campaignId)",
  "function finalize(uint256 campaignId)",
];

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
];

function loadSavedAddress() {
  const saved = localStorage.getItem("crowdfunding_address");
  if (saved) $("crowdfundingAddr").value = saved;
  const net = localStorage.getItem("target_network");
  if (net && CHAIN[net]) $("networkSelect").value = net;
}

function saveAddress() {
  const addr = $("crowdfundingAddr").value.trim();
  localStorage.setItem("crowdfunding_address", addr);
  setStatus("Saved contract address");
}

function saveNetwork() {
  localStorage.setItem("target_network", $("networkSelect").value);
}

async function ensureWallet() {
  if (!window.ethereum) {
    setStatus("MetaMask not found", false);
    throw new Error("MetaMask not found");
  }
  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  user = await signer.getAddress();
  $("wallet").textContent = user;
}

async function ensureCorrectNetwork() {
  const targetKey = $("networkSelect").value;
  const target = CHAIN[targetKey];
  if (!target) throw new Error("Unknown network");

  const net = await provider.getNetwork();
  const chainIdHex = "0x" + net.chainId.toString(16);

  $("network").textContent = `${net.name || "unknown"} (chainId ${net.chainId})`;

  if (chainIdHex.toLowerCase() !== target.chainIdHex.toLowerCase()) {
    setStatus(`Wrong network. Switch MetaMask to ${target.name}.`, false);
    throw new Error("Wrong network");
  }
  setStatus(`Connected to ${target.name}`);
}

function buildContracts() {
  const addr = $("crowdfundingAddr").value.trim();
  if (!ethers.isAddress(addr)) {
    setStatus("Invalid Crowdfunding address", false);
    throw new Error("Invalid address");
  }
  crowdfunding = new ethers.Contract(addr, CROWDFUNDING_ABI, signer);
}

async function refreshBalances() {
  if (!provider || !user) return;

  const eth = await provider.getBalance(user);
  $("ethBal").textContent = ethers.formatEther(eth);

  if (crowdfunding) {
    const tokenAddr = await crowdfunding.rewardToken();
    $("tokenAddr").textContent = tokenAddr;

    token = new ethers.Contract(tokenAddr, ERC20_ABI, provider);
    const [bal, sym, dec] = await Promise.all([
      token.balanceOf(user),
      token.symbol().catch(() => "TOKEN"),
      token.decimals().catch(() => 18),
    ]);

    $("tokenBal").textContent = `${ethers.formatUnits(bal, dec)} ${sym}`;
  }
}

function parseEthListToWeiArray(csv) {
  const parts = csv.split(",").map(s => s.trim()).filter(Boolean);
  if (parts.length === 0) throw new Error("No milestones");
  return parts.map((p) => ethers.parseEther(p));
}

async function connect() {
  try {
    saveNetwork();
    await ensureWallet();
    await ensureCorrectNetwork();

    buildContracts();
    await refreshBalances();
    out("Ready.");
  } catch (e) {
    out(e);
  }
}

async function createCampaign() {
  try {
    if (!crowdfunding) throw new Error("Connect first");

    const title = $("title").value.trim();
    const goalEth = $("goalEth").value.trim();
    const durationSec = $("durationSec").value.trim();
    const msCsv = $("milestones").value.trim();

    if (!title) throw new Error("Title empty");
    const goalWei = ethers.parseEther(goalEth);
    const dur = BigInt(durationSec);
    const ms = parseEthListToWeiArray(msCsv);

    setStatus("Sending tx...");
    const tx = await crowdfunding.createCampaign(title, goalWei, dur, ms);
    out(`createCampaign tx: ${tx.hash}`);
    await tx.wait();
    setStatus("Campaign created ✅");
    await refreshBalances();
  } catch (e) {
    setStatus("Create failed", false);
    out(e);
  }
}

async function donate() {
  try {
    if (!crowdfunding) throw new Error("Connect first");

    const id = BigInt($("campaignId").value.trim());
    const amountEth = $("donateEth").value.trim();
    const value = ethers.parseEther(amountEth);

    setStatus("Sending tx...");
    const tx = await crowdfunding.contribute(id, { value });
    out(`contribute tx: ${tx.hash}`);
    await tx.wait();
    setStatus("Donation sent ✅");
    await refreshBalances();
  } catch (e) {
    setStatus("Donate failed", false);
    out(e);
  }
}

async function closeMilestone() {
  try {
    if (!crowdfunding) throw new Error("Connect first");

    const id = BigInt($("campaignId").value.trim());
    const idx = BigInt($("milestoneIndex").value.trim());

    setStatus("Sending tx...");
    const tx = await crowdfunding.closeMilestone(id, idx);
    out(`closeMilestone tx: ${tx.hash}`);
    await tx.wait();
    setStatus("Milestone closed ✅");
    await refreshBalances();
  } catch (e) {
    setStatus("Close milestone failed", false);
    out(e);
  }
}

async function claim() {
  try {
    if (!crowdfunding) throw new Error("Connect first");

    const id = BigInt($("campaignId").value.trim());

    setStatus("Sending tx...");
    const tx = await crowdfunding.claimReward(id);
    out(`claimReward tx: ${tx.hash}`);
    await tx.wait();
    setStatus("Reward claimed ✅");
    await refreshBalances();
  } catch (e) {
    setStatus("Claim failed", false);
    out(e);
  }
}

async function finalize() {
  try {
    if (!crowdfunding) throw new Error("Connect first");

    const id = BigInt($("campaignId").value.trim());

    setStatus("Sending tx...");
    const tx = await crowdfunding.finalize(id);
    out(`finalize tx: ${tx.hash}`);
    await tx.wait();
    setStatus("Finalized ✅");
    await refreshBalances();
  } catch (e) {
    setStatus("Finalize failed", false);
    out(e);
  }
}

async function refreshInfo() {
  try {
    if (!crowdfunding) throw new Error("Connect first");
    await refreshBalances();
    const count = await crowdfunding.campaignsCount();
    out(`campaignsCount: ${count.toString()}`);
    setStatus("Refreshed ✅");
  } catch (e) {
    setStatus("Refresh failed", false);
    out(e);
  }
}

function wireEthereumEvents() {
  if (!window.ethereum) return;
  window.ethereum.on("accountsChanged", () => connect());
  window.ethereum.on("chainChanged", () => connect());
}

$("connectBtn").onclick = connect;
$("saveAddrBtn").onclick = saveAddress;
$("networkSelect").onchange = saveNetwork;
$("createBtn").onclick = createCampaign;
$("donateBtn").onclick = donate;
$("closeMilestoneBtn").onclick = closeMilestone;
$("claimBtn").onclick = claim;
$("finalizeBtn").onclick = finalize;
$("refreshBtn").onclick = refreshInfo;

loadSavedAddress();
wireEthereumEvents();
