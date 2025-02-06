// src/components/EnergyPortal.js
import React from 'react';
import Ptop from './Ptop.jsx'; // The code that should show before 10 AM & after 1 PM
import PtopBid from './Ptopbid.jsx'; // The code that should show during 10 AM - 1 PM

const EnergyPortal = () => {
	// Check the current local hour
	const now = new Date();
	const hour = now.getHours();

	// If hour < 10 or hour >= 13, render Ptop.
	// Otherwise (10 <= hour < 13), render PtopBid.
	//set here for ptop or ptopbid
	const isOffPeak = hour < 10 || hour >= 13;
	 // const isOffPeak = false;

	return <div>{isOffPeak ? <Ptop /> : <PtopBid />}</div>;
};

export default EnergyPortal;
