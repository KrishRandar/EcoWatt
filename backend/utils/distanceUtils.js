const ngeohash = require('ngeohash');

/**
 * Haversine formula to calculate distance in km between two lat/long points.
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
	const toRad = (x) => (x * Math.PI) / 180;
	const R = 6371; // Earth radius in km

	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
	const c = 2 * Math.asin(Math.sqrt(a));
	return R * c;
}

/**
 * Calculate distance in km from two geohashes
 */
function distanceFromGeohashes(geohash1, geohash2) {
	const { latitude: lat1, longitude: lon1 } = ngeohash.decode(geohash1);
	const { latitude: lat2, longitude: lon2 } = ngeohash.decode(geohash2);
	return haversineDistance(lat1, lon1, lat2, lon2);
}

module.exports = {
	distanceFromGeohashes,
};
