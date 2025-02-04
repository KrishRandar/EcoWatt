// EnergyToken deployed at:             0x5FbDB2315678afecb367f032d93F642f64180aa3
// EnergyTrading deployed at:           0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
// CCToken deployed at:                 0x59b670e9fA9D0A427751Af201D676719a970857b
// CarbonCreditMarketplace deployed at: 0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1

const { ethers } = require('hardhat');

async function main() {
	// Get deployer & accounts
	const [deployer, ...accounts] = await ethers.getSigners();
	console.log('Deploying contracts with the account:', deployer.address);

	// =========================
	// Energy Trading Contracts
	// =========================
	console.log('\n== Deploying Energy Trading Contracts ==');

	// 1. Deploy EnergyToken (ENT)
	const EnergyToken = await ethers.getContractFactory('EnergyToken');
	const energyToken = await EnergyToken.deploy();
	await energyToken.deployed();
	console.log('EnergyToken deployed at:', energyToken.address);

	// 2. Deploy EnergyTrading with the token address
	const EnergyTrading = await ethers.getContractFactory('EnergyTradingMarket');
	const energyTrading = await EnergyTrading.deploy(energyToken.address);
	await energyTrading.deployed();
	console.log('EnergyTrading deployed at:', energyTrading.address);

	// 3. Distribute initial EnergyToken supply (in wei) to all available accounts
	const initialENTAmount = ethers.BigNumber.from('10000'); // 10,000 wei per account
	for (let i = 0; i < accounts.length; i++) {
		if (!accounts[i]) continue;
		const recipient = accounts[i].address;
		const tx = await energyToken.transfer(recipient, initialENTAmount);
		await tx.wait();
		console.log(
			`Transferred ${initialENTAmount.toString()} wei of EnergyToken to ${recipient}`
		);
	}
	console.log('Energy Trading Contracts deployed and tokens distributed.');

	// ============================
	// Carbon Credit Contracts
	// ============================
	console.log('\n== Deploying Carbon Credit Contracts ==');

	// 4. Deploy CCToken with an initial supply (in wei)
	const initialSupply = ethers.BigNumber.from('10000000'); // 10,000 wei of CC Tokens
	const CCToken = await ethers.getContractFactory('CCToken');
	const ccToken = await CCToken.deploy(initialSupply);
	await ccToken.deployed();
	console.log('CCToken deployed at:', ccToken.address);

	// 5. Deploy CarbonCreditMarketplace (or AuctionDApp) with the token address and minimum bid price
	const minBidPricePerToken = ethers.BigNumber.from('100'); // 100 wei per token isko 1 se 100 liya hai
	const CarbonCreditMarketplace = await ethers.getContractFactory(
		'AuctionDApp'
	);
	const carbonCreditMarketplace = await CarbonCreditMarketplace.deploy(
		ccToken.address,
		minBidPricePerToken
	);
	await carbonCreditMarketplace.deployed();
	console.log(
		'CarbonCreditMarketplace deployed at:',
		carbonCreditMarketplace.address
	);

	// 6. Distribute initial CC tokens to the first 20 accounts
	const initialCCAmount = ethers.BigNumber.from('10000'); // 10000 wei of CC tokens per account
	for (let i = 0; i < 20; i++) {
		if (!accounts[i]) break;
		const recipient = accounts[i].address;
		const tx = await ccToken.transfer(recipient, initialCCAmount);
		await tx.wait();
		console.log(
			`Transferred ${initialCCAmount.toString()} wei of CC tokens to ${recipient}`
		);
	}
	console.log('Carbon Credit Contracts deployed and tokens distributed.');

	console.log('\n✅ All contracts deployed successfully!');
}

// Run the deployment script with proper error handling
main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error('❌ Error in deployment:', error);
		process.exit(1);
	});
