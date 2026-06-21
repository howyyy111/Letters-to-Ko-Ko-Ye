const { ethers, run } = require('hardhat');
const fs = require('fs');
const path = require('path');

const CONFIRMATIONS = 5;
const SHARED_OUTPUT = path.join(__dirname, '../../shared/contract.json');

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('\n─────────────────────────────────────────');
  console.log('  Letters to Ko Ko Ye — Deploying');
  console.log('─────────────────────────────────────────');
  console.log('Deployer :', deployer.address);
  console.log('Network  :', (await ethers.provider.getNetwork()).name);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('Balance  :', ethers.formatEther(balance), 'ETH');

  if (balance === 0n) {
    throw new Error('Deployer wallet has no ETH. Fund it with Sepolia ETH first.');
  }

  console.log('\nDeploying LettersToKoKoYe...');
  const Factory = await ethers.getContractFactory('LettersToKoKoYe');
  const contract = await Factory.deploy();

  console.log('Tx hash  :', contract.deploymentTransaction().hash);
  console.log(`Waiting for ${CONFIRMATIONS} confirmations...`);

  await contract.deploymentTransaction().wait(CONFIRMATIONS);

  const contractAddress = await contract.getAddress();

  console.log('\n✅ Contract deployed!');
  console.log('Address  :', contractAddress);
  console.log('Etherscan:', `https://sepolia.etherscan.io/address/${contractAddress}`);

  // Save ABI + address to shared/contract.json for backend and frontend to consume
  const artifactPath = path.join(
    __dirname,
    '../artifacts/contracts/LettersToKoKoYe.sol/LettersToKoKoYe.json'
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

  const output = {
    address: contractAddress,
    network: 'sepolia',
    chainId: 11155111,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    abi: artifact.abi,
  };

  fs.mkdirSync(path.dirname(SHARED_OUTPUT), { recursive: true });
  fs.writeFileSync(SHARED_OUTPUT, JSON.stringify(output, null, 2));
  console.log('\nSaved to :', SHARED_OUTPUT);

  // Verify on Etherscan — constructor has no args so verification is straightforward
  console.log('\nVerifying on Etherscan...');
  try {
    await run('verify:verify', {
      address: contractAddress,
      constructorArguments: [],
    });
    console.log('✅ Verified on Etherscan');
  } catch (err) {
    if (err.message.includes('Already Verified')) {
      console.log('✅ Already verified on Etherscan');
    } else {
      console.warn('⚠️  Etherscan verification failed:', err.message);
      console.warn('   You can verify manually later with:');
      console.warn(`   npx hardhat verify --network sepolia ${contractAddress}`);
    }
  }

  console.log('\n─────────────────────────────────────────');
  console.log('  Next steps');
  console.log('─────────────────────────────────────────');
  console.log(`1. Add to backend/.env:   CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`2. Add to frontend/.env:  VITE_CONTRACT_ADDRESS=${contractAddress}`);
  console.log('3. Fund the sponsor wallet with Sepolia ETH (0.1 ETH recommended)');
  console.log('4. When ready, call transferOwnership() to give Ko Ko Ye full control');
  console.log('─────────────────────────────────────────\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
