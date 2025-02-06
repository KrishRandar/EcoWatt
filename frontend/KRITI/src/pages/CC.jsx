import React, { useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { WalletContext } from '../context/WalletProvider';
import ccTokenAbi from '../abis/CCToken.json';
import ccMarketAbi from '../abis/AuctionDApp.json';
import './CC.css';

const CC_TOKEN_ADDRESS = '0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1';
const CC_MARKET_ADDRESS = '0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44';

const CC = () => {
	const { provider, signer, account } = useContext(WalletContext);
	const [ccToken, setCcToken] = useState(null);
	const [ccMarket, setCcMarket] = useState(null);
	const [auctions, setAuctions] = useState([]);
	const [newAuction, setNewAuction] = useState({
		amount: '',
		basePrice: '',
		duration: '',
	});
	const [bidAmounts, setBidAmounts] = useState({});
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [tokenBalance, setTokenBalance] = useState('0');

	useEffect(() => {
		if (signer) {
			setCcToken(new ethers.Contract(CC_TOKEN_ADDRESS, ccTokenAbi, signer));
			setCcMarket(new ethers.Contract(CC_MARKET_ADDRESS, ccMarketAbi, signer));
		}
	}, [signer]);

	// Load token balance
	const loadTokenBalance = async () => {
		if (ccToken && account) {
			try {
				const balance = await ccToken.balanceOf(account);
				setTokenBalance(balance.toString());
			} catch (err) {
				console.error('Error loading token balance:', err);
			}
		}
	};

	const loadAuctions = async () => {
		if (!ccMarket) return;
		try {
			setLoading(true);
			const [auctionIds, auctionData] = await ccMarket.getActiveAuctions();
			const formattedAuctions = auctionIds.map((id, index) => ({
				id: id.toString(),
				tokenAmount: auctionData[index].tokenAmount.toString(),
				basePrice: auctionData[index].basePrice.toString(),
				highestBid: auctionData[index].highestBid.toString(),
				endTime: auctionData[index].endTime.toString(),
				seller: auctionData[index].seller,
				highestBidder: auctionData[index].highestBidder,
				isFinalized: auctionData[index].isFinalized,
			}));
			setAuctions(formattedAuctions);
		} catch (err) {
			console.error('Error fetching auctions:', err);
			setError('Failed to load auctions');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (ccMarket && ccToken) {
			loadAuctions();
			loadTokenBalance();
			const interval = setInterval(() => {
				loadAuctions();
				loadTokenBalance();
			}, 30000);
			return () => clearInterval(interval);
		}
	}, [ccMarket, ccToken, account]);

	const handleAuctionInput = (e) => {
		const { name, value } = e.target;
		setNewAuction((prev) => ({ ...prev, [name]: value }));
	};

	const createAuction = async () => {
		if (!newAuction.amount || !newAuction.basePrice || !newAuction.duration) {
			setError('All fields are required');
			return;
		}

		try {
			setLoading(true);
			setError('');

			// Convert the amount and basePrice inputs to BigNumber
			const amount = ethers.BigNumber.from(newAuction.amount);
			const basePrice = ethers.BigNumber.from(newAuction.basePrice);
			const duration = parseInt(newAuction.duration) * 86400;

			// Validate that the basePrice is greater than the token amount being auctioned.
			if (basePrice.lte(amount)) {
				alert('Base Price must be greater than the token amount offered.');
				setLoading(false);
				return;
			}

			// Approve tokens for the auction before creating it.
			const approveTx = await ccToken.approve(CC_MARKET_ADDRESS, amount);
			await approveTx.wait();

			// Create the auction.
			const tx = await ccMarket.createAuction(amount, basePrice, duration);
			await tx.wait();

			setNewAuction({ amount: '', basePrice: '', duration: '' });
			loadAuctions();
			loadTokenBalance();
		} catch (err) {
			console.error('Error creating auction:', err);
			setError(err.message || 'Failed to create auction');
		} finally {
			setLoading(false);
		}
	};

	const placeBid = async (auctionId) => {
		if (!bidAmounts[auctionId]) {
			setError('Please enter a bid amount');
			return;
		}

		try {
			setLoading(true);
			setError('');
			const bidValue = ethers.BigNumber.from(bidAmounts[auctionId]);

			// Find the corresponding auction.
			const auction = auctions.find((a) => a.id === auctionId);
			if (!auction) {
				alert('Auction not found');
				setLoading(false);
				return;
			}

			// Convert the auction's highest bid and base price to BigNumber.
			const currentHighestBid = ethers.BigNumber.from(auction.highestBid);
			const auctionBasePrice = ethers.BigNumber.from(auction.basePrice);

			// Validate that the bid is greater than both the current highest bid and the auction's base price.
			if (bidValue.lte(currentHighestBid) || bidValue.lte(auctionBasePrice)) {
				alert(
					'Your bid must be greater than both the current highest bid and the base price.'
				);
				setLoading(false);
				return;
			}

			// Place the bid.
			const tx = await ccMarket.placeBid(auctionId, { value: bidValue * 1.01 }); //ye abhi kiya hain 1.01
			await tx.wait();

			setBidAmounts((prev) => ({ ...prev, [auctionId]: '' }));
			loadAuctions();
		} catch (err) {
			console.error('Error placing bid:', err);
			setError(err.message || 'Failed to place bid');
		} finally {
			setLoading(false);
		}
	};

	const handleBidInput = (auctionId, value) => {
		setBidAmounts((prev) => ({ ...prev, [auctionId]: value }));
	};

	const finalizeAuction = async (auctionId) => {
		try {
			setLoading(true);
			setError('');
			const tx = await ccMarket.finalizeAuction(auctionId);
			await tx.wait();
			loadAuctions();
			loadTokenBalance();
		} catch (err) {
			console.error('Error finalizing auction:', err);
			setError(err.message || 'Failed to finalize auction');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='cc-container'>
			{loading && <div className='cc-loading'>Loading...</div>}

			<div className='cc-content'>
				<div className='cc-section'>
					<h2>Create New Auction</h2>
					<div className='cc-balance'>
						Your Token Balance: {tokenBalance} CC
					</div>
					<div className='cc-form-group'>
						<input
							type='text'
							name='amount'
							placeholder='Amount (wei)'
							value={newAuction.amount}
							onChange={handleAuctionInput}
						/>
						<input
							type='text'
							name='basePrice'
							placeholder='Base Price (wei)'
							value={newAuction.basePrice}
							onChange={handleAuctionInput}
						/>
						<input
							type='number'
							name='duration'
							placeholder='Duration (days)'
							value={newAuction.duration}
							onChange={handleAuctionInput}
						/>
						<button
							className='cc-primary-button'
							onClick={createAuction}
							disabled={loading}
						>
							Create Auction
						</button>
					</div>
				</div>

				<div className='cc-section'>
					<h2>Active Auctions</h2>
					<table className='cc-auction-table'>
						<thead>
							<tr>
								<th>ID</th>
								<th>Amount (wei)</th>
								<th>Base Price (wei)</th>
								<th>Highest Bid (wei)</th>
								<th>End Time</th>
								<th>Bid</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{auctions.map((auction) => (
								<tr key={auction.id}>
									<td>{auction.id}</td>
									<td>{auction.tokenAmount}</td>
									<td>{auction.basePrice}</td>
									<td>{auction.highestBid}</td>
									<td>{new Date(auction.endTime * 1000).toLocaleString()}</td>
									<td>
										<input
											type='text'
											placeholder='Bid Amount (wei)'
											value={bidAmounts[auction.id] || ''}
											onChange={(e) =>
												handleBidInput(auction.id, e.target.value)
											}
										/>
										<button
											className='cc-primary-button'
											onClick={() => placeBid(auction.id)}
											disabled={loading || auction.isFinalized}
										>
											Bid
										</button>
									</td>
									<td>
										{auction.seller.toLowerCase() === account?.toLowerCase() &&
											!auction.isFinalized && (
												<button
													className='cc-danger-button'
													onClick={() => finalizeAuction(auction.id)}
													disabled={loading}
												>
													Finalize
												</button>
											)}
										{auction.isFinalized && (
											<span className='cc-finalized-tag'>Finalized</span>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{error && <div className='cc-error-message'>{error}</div>}
			</div>
		</div>
	);
};

export default CC;
