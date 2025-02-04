// const User = require('../models/User');
// const ngeohash = require('ngeohash');
// const bcrypt = require('bcrypt');

// // Number of salt rounds for password hashing
// const SALT_ROUNDS = 10;

// /**
//  * REGISTER a new user
//  * Expects: { name, email, password, walletAddress, latitude, longitude }
//  * Automatically computes geohash
//  */
// exports.registerUser = async (req, res) => {
// 	try {
// 		const { name, email, password, walletAddress, latitude, longitude } =
// 			req.body;

// 		// Basic validation
// 		if (
// 			!name ||
// 			!email ||
// 			!password ||
// 			!walletAddress ||
// 			!latitude ||
// 			!longitude
// 		) {
// 			return res.status(400).json({ message: 'All fields are required.' });
// 		}

// 		// Check if user with that email or walletAddress already exists
// 		const existingEmail = await User.findOne({ email });
// 		if (existingEmail) {
// 			return res.status(400).json({ message: 'Email already in use.' });
// 		}

// 		const existingWallet = await User.findOne({ walletAddress });
// 		if (existingWallet) {
// 			return res
// 				.status(400)
// 				.json({ message: 'Wallet address already in use.' });
// 		}

// 		// Hash password
// 		const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
// 		// Compute geohash
// 		const geohash = ngeohash.encode(latitude, longitude);

// 		const newUser = new User({
// 			name,
// 			email,
// 			password: hashedPassword,
// 			walletAddress,
// 			latitude,
// 			longitude,
// 			geohash,
// 		});

// 		await newUser.save();
// 		// Do not return the hashed password to the client
// 		const { password: _, ...userData } = newUser.toObject();

// 		return res.status(201).json({
// 			message: 'User registered successfully.',
// 			user: userData,
// 		});
// 	} catch (error) {
// 		console.error('Error registering user:', error);
// 		return res.status(500).json({ message: 'Server error.' });
// 	}
// };

// /**
//  * LOGIN a user
//  * Expects: { email, password }
//  */
// exports.loginUser = async (req, res) => {
// 	try {
// 		const { email, password } = req.body;

// 		// Basic validation
// 		if (!email || !password) {
// 			return res
// 				.status(400)
// 				.json({ message: 'Email and password are required.' });
// 		}

// 		// Check if user exists by email
// 		const user = await User.findOne({ email });
// 		if (!user) {
// 			return res.status(401).json({ message: 'Invalid credentials.' });
// 		}

// 		// Compare password
// 		const isMatch = await bcrypt.compare(password, user.password);
// 		if (!isMatch) {
// 			return res.status(401).json({ message: 'Invalid credentials.' });
// 		}

// 		// In a real app, generate a JWT or session here
// 		// For demonstration, we just return user data (excluding password)
// 		const { password: _, ...userData } = user.toObject();

// 		return res.status(200).json({
// 			message: 'Login successful.',
// 			user: userData,
// 		});
// 	} catch (error) {
// 		console.error('Error logging in:', error);
// 		return res.status(500).json({ message: 'Server error.' });
// 	}
// };

// /**
//  * UPDATE user location
//  * Expects: { walletAddress, latitude, longitude }
//  * Recomputes geohash
//  */
// exports.updateLocation = async (req, res) => {
// 	try {
// 		const { walletAddress, latitude, longitude } = req.body;

// 		if (!walletAddress || latitude == null || longitude == null) {
// 			return res.status(400).json({ message: 'Missing fields.' });
// 		}

// 		// Compute new geohash
// 		const newGeohash = ngeohash.encode(latitude, longitude);

// 		const updatedUser = await User.findOneAndUpdate(
// 			{ walletAddress },
// 			{ latitude, longitude, geohash: newGeohash },
// 			{ new: true }
// 		);

// 		if (!updatedUser) {
// 			return res.status(404).json({ message: 'User not found.' });
// 		}

// 		const { password, ...userData } = updatedUser.toObject();
// 		return res.status(200).json({
// 			message: 'Location updated successfully.',
// 			user: userData,
// 		});
// 	} catch (error) {
// 		console.error('Error updating location:', error);
// 		return res.status(500).json({ message: 'Server error.' });
// 	}
// };

// /**
//  * GET user by walletAddress
//  */
// exports.getUserByWallet = async (req, res) => {
// 	try {
// 		const { walletAddress } = req.params;
// 		const user = await User.findOne({ walletAddress });
// 		if (!user) {
// 			return res.status(404).json({ message: 'User not found.' });
// 		}
// 		const { password, ...userData } = user.toObject();
// 		return res.status(200).json({ user: userData });
// 	} catch (error) {
// 		console.error('Error retrieving user:', error);
// 		return res.status(500).json({ message: 'Server error.' });
// 	}
// };
