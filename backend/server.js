const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const ngeohash = require('ngeohash');
const axios = require('axios');
const fs = require('fs');
const { execSync } = require('child_process');

const path = require('path');
const ESP32address = '192.168.1.100';
// Route to get battery status from the IoT device (ESP32)

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

const ZK_PATH = path.resolve(__dirname, 'zk-energy-market');
const inputJsonPath = path.join(ZK_PATH, 'input.json');
const witnessJsonPath = path.join(ZK_PATH, 'witness.json');

app.post('/generate-witness', async (req, res) => {
	const { buyAmount } = req.body;

	if (!buyAmount || parseFloat(buyAmount) <= 0) {
		return res.status(400).json({ error: 'Invalid buy amount.' });
	}

	try {
		// 1️⃣ Write input.json inside zk-energy-market
		const inputData = JSON.stringify({ a: buyAmount, b: 0, c: 10000 }, null, 2);
		fs.writeFileSync(inputJsonPath, inputData);

		console.log('🔹 Running Witness Generation in WSL...');

		
		try {
			const command = `
                cd "${ZK_PATH.replace(/\\/g, '\\\\')}" &&
                node circuit_js/generate_witness.js circuit_js/circuit.wasm input.json witness.wtns &&
                snarkjs wtns export json witness.wtns witness.json
            `;
			execSync(`sudo bash -c "${command}"`, { stdio: 'inherit' });
		} catch (cmdError) {
			console.error('❌ Error running WSL commands:', cmdError);
			return res.status(500).json({ error: 'WSL command execution failed.' });
		}

		// 3️⃣ Check if `witness.json` exists
		if (!fs.existsSync(witnessJsonPath)) {
			console.error('❌ witness.json was not generated!');
			return res
				.status(500)
				.json({ error: 'witness.json not found after execution.' });
		}

		// 4️⃣ Read witness.json
		const valread = execSync(`sudo bash jq '.[1]' ${witnessJsonPath}`)
			.toString()
			.trim();
		console.log(`✅ Witness Value: ${valread}`);

		return res.json({ witnessValue: parseInt(valread) });
	} catch (error) {
		console.error('❌ Error generating witness:', error);
		return res.status(500).json({ error: 'Witness generation failed.' });
	}
});

app.get('/battery-status/:deviceId', async (req, res) => {
	const deviceId = req.params.deviceId;

	// Send a GET request to the ESP32 device
	try {
		const response = await axios.get(`http://${ESP32address}/get-battery`);

		// Send the battery data back to the client
		res.json({
			deviceId: deviceId,
			batteryStatus: response.data,
		});
	} catch (error) {
		console.error('Error fetching battery status:', error);
		res
			.status(500)
			.json({ message: 'Error fetching battery status from device' });
	}
});

// 4) Create a route to register/login a user by wallet address
app.post('/api/users/login', async (req, res) => {
	try {
		const { walletAddress, latitude, longitude } = req.body;

		if (!walletAddress || latitude == null || longitude == null) {
			return res.status(400).json({
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
