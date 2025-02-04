const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const ngeohash = require('ngeohash');

// 1) Create an Express app
const app = express();
app.use(cors());
app.use(express.json()); // parse JSON bodies

// 2) Connect to MongoDB
mongoose
	.connect('mongodb+srv://ayush11:ayush111005@kritiweb3.1ycdx.mongodb.net/', {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => console.log('MongoDB Connected'))
	.catch((err) => console.error('MongoDB Connection Error:', err));

// 3) Define the User schema and model
const userSchema = new mongoose.Schema({
	walletAddress: { type: String, unique: true, required: true },
	latitude: { type: Number, required: true },
	longitude: { type: Number, required: true },
	geohash: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// 4) Create a route to register/login a user by wallet address
app.post('/api/users/login', async (req, res) => {
	try {
		const { walletAddress, latitude, longitude } = req.body;

		if (!walletAddress || latitude == null || longitude == null) {
			return res
				.status(400)
				.json({
					error: 'walletAddress, latitude, and longitude are required.',
				});
		}

		let user = await User.findOne({ walletAddress });

		// If user doesn't exist, create a new one
		if (!user) {
			const userGeohash = ngeohash.encode(latitude, longitude);

			user = new User({
				walletAddress,
				latitude,
				longitude,
				geohash: userGeohash,
			});

			await user.save();
			console.log('New user created:', user);
		} else {
			console.log('User found (login):', user);
		}

		return res.json(user);
	} catch (error) {
		console.error('Error in /api/users/login:', error);
		return res.status(500).json({ error: 'Internal server error' });
	}
});

// 5) Create a route to retrieve user info by wallet address
app.get('/api/users/:walletAddress', async (req, res) => {
	try {
		const { walletAddress } = req.params;
		const user = await User.findOne({ walletAddress });

		if (!user) {
			return res.status(404).json({ error: 'User not found.' });
		}
		return res.json(user);
	} catch (error) {
		console.error('Error in GET /api/users/:walletAddress:', error);
		return res.status(500).json({ error: 'Internal server error' });
	}
});

// 6) Start the server
const PORT = 4000;
app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
