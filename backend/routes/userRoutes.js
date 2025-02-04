const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { distanceFromGeohashes } = require('../utils/distanceUtils');
const User = require('../models/User');

router.post('/users/register', userController.registerUser);
router.post('/users/login', userController.loginUser);
router.put('/users/location', userController.updateLocation);
router.get('/users/:walletAddress', userController.getUserByWallet);

// Example endpoint to calculate final price based on distance
router.post('/calculate-price', async (req, res) => {
	try {
		const { buyerAddress, sellerAddress, basePrice } = req.body;
		if (!buyerAddress || !sellerAddress || !basePrice) {
			return res.status(400).json({ message: 'Missing fields.' });
		}

		const buyer = await User.findOne({ walletAddress: buyerAddress });
		const seller = await User.findOne({ walletAddress: sellerAddress });
		if (!buyer || !seller) {
			return res.status(404).json({ message: 'Buyer or Seller not found.' });
		}

		// Distance in km
		const distanceKm = distanceFromGeohashes(buyer.geohash, seller.geohash);

		// For illustration: each km adds 0.0001 ETH as a transfer fee
		const distanceFeePerKm = 0.0001;
		const distanceFee = distanceKm * distanceFeePerKm;

		// Convert basePrice (string) to number
		const numericBasePrice =
			typeof basePrice === 'string' ? parseFloat(basePrice) : basePrice;

		const finalPrice = numericBasePrice + distanceFee;

		return res.status(200).json({
			basePrice: numericBasePrice,
			distanceKm: distanceKm.toFixed(2),
			distanceFee: distanceFee.toFixed(6),
			finalPrice: finalPrice.toFixed(6),
			message: 'Calculated price successfully',
		});
	} catch (error) {
		console.error('Error calculating price:', error);
		return res.status(500).json({ message: 'Server error.' });
	}
});

module.exports = router;
