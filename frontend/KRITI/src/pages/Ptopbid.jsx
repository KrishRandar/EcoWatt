import React, { useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { WalletContext } from '../context/WalletProvider';
import bidTokenAbi from '../abis/EnergyToken.json';
import p2pBidAbi from '../abis/P2pBidMarket.json';
import './CC.css';

const P2P_BID_TOKEN_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const P2P_MARKET_ADDRESS = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';
const OWNER_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' ;
const PtopBid = () => {
	const { provider, signer, account } = useContext(WalletContext);

	// Contract instances
	const [eToken, setEToken] = useState(null);
	const [biddingMarket, setBiddingMarket] = useState(null);

	// Data from the contract
	const [auctions, setAuctions] = useState([]);

	// Creating a new auction
	const [newAuction, setNewAuction] = useState({
		amount: '', // number of tokens (in wei)
		basePrice: '', // base (reserve) price in wei
	});

	// Bidding / finalizing states
	const [bidAmounts, setBidAmounts] = useState({}); // track user input for each auction's bid
	const [tokenBalance, setTokenBalance] = useState('0');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	// On mount or when signer changes, set up contract instances
	useEffect(() => {
		if (signer) {
			setEToken(
				new ethers.Contract(P2P_BID_TOKEN_ADDRESS, bidTokenAbi, signer)
			);
			setBiddingMarket(
				new ethers.Contract(P2P_MARKET_ADDRESS, p2pBidAbi, signer)
			);
		}
	}, [signer]);


	// Helper function to set dayStart to today's 10 AM
const setDayStartToTenAM = async () => {
	if (!biddingMarket) return;
	try {
	  setLoading(true);
	  setError('');
	  // Create a new Date object for today.
	  const today = new Date();
	  // Set the time to 10:00:00.000 local time.
	  //set start time here
	  today.setHours(10, 0, 0, 0);
	  // Convert the date to a Unix timestamp (seconds)
	  const dayStartTimestamp = Math.floor(today.getTime() / 1000);
  
	  // Call the contract's setDayStart function
	  const tx = await biddingMarket.setDayStart(dayStartTimestamp);
	  await tx.wait();
  
	  alert('Day start successfully set to 10 AM');
	} catch (err) {
	  console.error('Error setting day start:', err);
	  setError(err.message || 'Error setting day start');
	} finally {
	  setLoading(false);
	}
  };
  
	// --- Load Token Balance ---
	const loadTokenBalance = async () => {
		if (eToken && account) {
			try {
				const balance = await eToken.balanceOf(account);
				setTokenBalance(balance.toString());
			} catch (err) {
				console.error('Error loading token balance:', err);
			}
		}
	};

	// --- Load Active Auctions ---
	const loadAuctions = async () => {
		if (!biddingMarket) return;
		try {
			setLoading(true);

			// The contract function getActiveAuctions() returns (uint256[], Auction[]).
			const [auctionIds, auctionData] = await biddingMarket.getActiveAuctions();

			/**
			 * Auction is:
			 * struct Auction {
			 *   address seller;
			 *   uint256 tokenAmount;
			 *   uint256 basePrice;
			 *   uint256 startTime;
			 *   uint256 endTime;
			 *   address highestBidder;
			 *   uint256 highestBid;
			 *   bool isFinalized;
			 * }
			 */
			const formattedAuctions = auctionIds.map((id, index) => ({
				id: id.toString(),
				tokenAmount: auctionData[index].tokenAmount.toString(),
				basePrice: auctionData[index].basePrice.toString(),
				startTime: auctionData[index].startTime.toString(),
				endTime: auctionData[index].endTime.toString(),
				highestBidder: auctionData[index].highestBidder,
				highestBid: auctionData[index].highestBid.toString(),
				seller: auctionData[index].seller,
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

	// Use an interval or repeated effect to auto-refresh the data
	useEffect(() => {
		if (biddingMarket && eToken) {
			loadAuctions();
			loadTokenBalance();

			const interval = setInterval(() => {
				loadAuctions();
				loadTokenBalance();
			}, 30_000);

			return () => clearInterval(interval);
		}
	}, [biddingMarket, eToken, account]);

	// --- Handlers for new auction form ---
	const handleAuctionInput = (e) => {
		const { name, value } = e.target;
		setNewAuction((prev) => ({ ...prev, [name]: value }));
	};

	const createAuction = async () => {
		const { amount, basePrice } = newAuction;
		if (!amount || !basePrice) {
			setError('Amount and Base Price are required');
			return;
		}

		try {
			setLoading(true);
			setError('');

			// Convert to BigNumber
			const tokenAmtBN = ethers.BigNumber.from(amount);
			const basePriceBN = ethers.BigNumber.from(basePrice);

			// Approve tokens for the auction
			const approveTx = await eToken.approve(P2P_MARKET_ADDRESS, tokenAmtBN);
			await approveTx.wait();

			// Call createAuction on the BiddingContract
			// No duration param, since the contract sets endTime = dayStart + 13 hours
			const tx = await biddingMarket.createAuction(tokenAmtBN, basePriceBN);
			await tx.wait();

			// Reset form, reload data
			setNewAuction({ amount: '', basePrice: '' });
			loadAuctions();
			loadTokenBalance();
		} catch (err) {
			console.error('Error creating auction:', err);
			setError(err.message || 'Failed to create auction');
		} finally {
			setLoading(false);
		}
	};

	// --- Placing a bid ---
	const handleBidInput = (auctionId, value) => {
		setBidAmounts((prev) => ({ ...prev, [auctionId]: value }));
	};

	const placeBid = async (auctionId) => {
		if (!bidAmounts[auctionId]) {
			setError('Please enter a bid amount.');
			return;
		}

		try {
			setLoading(true);
			setError('');

			const bidValueBN = ethers.BigNumber.from(bidAmounts[auctionId]);

			// Find the corresponding auction
			const auction = auctions.find((a) => a.id === auctionId);
			if (!auction) {
				alert('Auction not found');
				setLoading(false);
				return;
			}

			// The contract requires the total msg.value to be your net bid plus 1% overhead.
			// The net highestBid stored is (msg.value * 100 / 101).
			// So if you want your net bid to be "bidValueBN", you need to send "bidValueBN * 101 / 100"
			// (but must be careful with integer math). Typically we do a float or BN multiplication.
			const overhead = bidValueBN.mul(101).div(100);

			// The contract also enforces that your msg.value >= basePrice * 101/100
			// and that your msg.value > (current highestBid * 101/100).
			// So we must pass at least overhead in the transaction.
			const tx = await biddingMarket.placeBid(auctionId, {
				value: overhead,
			});
			await tx.wait();

			// Clear the bid input for that auction, reload
			setBidAmounts((prev) => ({ ...prev, [auctionId]: '' }));
			loadAuctions();
		} catch (err) {
			console.error('Error placing bid:', err);
			setError(err.message || 'Failed to place bid');
		} finally {
			setLoading(false);
		}
	};

	// --- Finalize Auction (seller only) ---
	const finalizeAuction = async (auctionId) => {
		try {
			setLoading(true);
			setError('');

			const tx = await biddingMarket.finalizeAuction(auctionId);
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
						Your Token Balance: {tokenBalance} ENT
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
								<th>Token Amount</th>
								<th>Base Price</th>
								<th>Highest Bid</th>
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
			<div>
		{ account && account.toLowerCase() === OWNER_ADDRESS.toLowerCase() && (
			<button
			  className="cc-primary-button"
			  onClick={setDayStartToTenAM}
			  disabled={loading}
			>
			  Set Day Start to provided time
			</button>
		  )}
		  </div>
		</div>
		
		  
	);
};

export default PtopBid;
