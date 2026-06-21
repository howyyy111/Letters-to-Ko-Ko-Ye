const { ethers } = require('hardhat');
require('dotenv').config();

const CONTRACT_ABI = [
  "function owner() external view returns (address)",
  "function transferOwnership(address newOwner) external",
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)"
];

async function main() {
  const NEW_OWNER = process.env.NEW_OWNER_ADDRESS;
  const CONTRACT = process.env.CONTRACT_ADDRESS;

  if (!NEW_OWNER || !ethers.isAddress(NEW_OWNER)) {
    throw new Error('Set NEW_OWNER_ADDRESS in your .env file');
  }
  if (!CONTRACT || !ethers.isAddress(CONTRACT)) {
    throw new Error('Set CONTRACT_ADDRESS in your .env file');
  }

  const [signer] = await ethers.getSigners();
  console.log('\n─────────────────────────────────────────');
  console.log('  Transfer Ownership');
  console.log('─────────────────────────────────────────');
  console.log('Signer (current owner):', signer.address);
  console.log('New owner             :', NEW_OWNER);
  console.log('Contract              :', CONTRACT);

  const contract = new ethers.Contract(CONTRACT, CONTRACT_ABI, signer);

  const currentOwner = await contract.owner();
  console.log('\nOn-chain owner currently:', currentOwner);

  if (currentOwner.toLowerCase() !== signer.address.toLowerCase()) {
    throw new Error(`Signer ${signer.address} is not the current owner (${currentOwner}). Wrong DEPLOYER_PRIVATE_KEY?`);
  }

  console.log('\nSending transferOwnership transaction...');
  const tx = await contract.transferOwnership(NEW_OWNER);
  console.log('Tx hash:', tx.hash);
  await tx.wait();

  const newOwner = await contract.owner();
  console.log('\n✅ Ownership transferred!');
  console.log('New on-chain owner:', newOwner);
  console.log('Etherscan:', `https://sepolia.etherscan.io/tx/${tx.hash}`);
  console.log('─────────────────────────────────────────\n');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
