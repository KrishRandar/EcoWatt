const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
	walletAddress: {
		type: String,
		required: true,
		unique: true,
	},
	latitude: {
		type: Number,
		required: true,
	},
	longitude: {
		type: Number,
		required: true,
	},
	geohash: {
		type: String,
		required: true,
	},
});

module.exports = mongoose.model('User', userSchema);
