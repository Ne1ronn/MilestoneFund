# MilestoneFund

Decentralized crowdfunding application with milestone-based fund release and ERC-20 reward tokens.  
Built for educational purposes on Ethereum test network.

---

## Project Overview

MilestoneFund is a decentralized application (DApp) that allows users to create crowdfunding campaigns divided into milestones.  
Funds are not released immediately — ETH is stored in the smart contract and released step by step after milestone confirmation by the campaign creator.

The project operates exclusively on the Sepolia Ethereum test network and uses only free test ETH and test tokens.

---

## Features

- Create crowdfunding campaigns with predefined milestones
- Contribute test ETH to active campaigns
- Secure storage of ETH in smart contract
- Milestone confirmation by campaign creator
- Gradual release of funds per milestone
- Automatic minting of ERC-20 reward tokens
- MetaMask wallet integration

---

## Technology Stack

- Solidity
- Hardhat
- Ethers.js
- HTML / JavaScript
- MetaMask
- Ethereum Sepolia Testnet

---

## Smart Contracts

### Crowdfunding.sol
Responsible for:
- campaign creation
- milestone management
- contribution tracking
- ETH storage and release
- reward token distribution

### RewardToken.sol
- ERC-20 token based on OpenZeppelin
- Minting restricted to Crowdfunding contract
- Educational token with no real monetary value

---

## Deployment Information

Network: **Sepolia Testnet**

Crowdfunding contract address:  
`0x138546d24c67A74b6e75E8113a62744aC8b39b28`

RewardToken contract address:  
Retrieved dynamically from Crowdfunding contract

---

## How to Run the Project

1. Install MetaMask browser extension
2. Switch MetaMask network to Sepolia
3. Obtain test ETH from a Sepolia faucet
4. Open `index.html` in a browser
5. Click **Connect MetaMask**
6. Create a campaign or contribute test ETH

---

## MetaMask Integration

The application:
- requests wallet access via MetaMask
- verifies active Ethereum network
- signs and sends transactions through MetaMask
- displays ETH and reward token balances

---

## Educational Purpose

This project is developed solely for educational purposes as part of the Blockchain 1 course.  
It does not use real cryptocurrency and is not intended for production use.

---

## Group

Students: Yesset Kozhakhmet, Iskander Ismagulov, Nuraly Zhandossov 
Course: Blockchain 1
