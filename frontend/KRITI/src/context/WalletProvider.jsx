// src/context/WalletProvider.js
import React, { createContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

export const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
	const [account, setAccount] = useState(null);
	const [provider, setProvider] = useState(null);
	const [signer, setSigner] = useState(null);
	const [userLocation, setUserLocation] = useState({ lat: null, lng: null });
	const [userGeohash, setUserGeohash] = useState(null);

	useEffect(() => {
		const checkConnection = async () => {
			if (typeof window.ethereum !== 'undefined') {
				try {
					const web3Provider = new ethers.providers.Web3Provider(
						window.ethereum
					);
					const accounts = await web3Provider.listAccounts();
					if (accounts.length > 0) {
						setProvider(web3Provider);
						setAccount(accounts[0]);
						setSigner(web3Provider.getSigner());
						// 1) If an account is found, get location from the browser
						await fetchUserLocation(accounts[0]);
					}
				} catch (error) {
					console.error('Error checking wallet connection:', error);
				}
			}
		};
		checkConnection();
	}, []);

	// Connect wallet manually
	const connectWallet = async () => {
		if (typeof window.ethereum !== 'undefined') {
			try {
				const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
				await window.ethereum.request({ method: 'eth_requestAccounts' });
				const signer = web3Provider.getSigner();
				const address = await signer.getAddress();

				setProvider(web3Provider);
				setAccount(address);
				setSigner(signer);

				console.log('Connected account:', address);

				// Once connected, fetch location
				await fetchUserLocation(address);
			} catch (error) {
				console.error('Error connecting wallet:', error);
			}
		} else {
			alert('MetaMask is not installed. Please install MetaMask!');
		}
	};

	const fetchUserLocation = async (address) => {
		if (!('geolocation' in navigator)) {
			console.error('Geolocation not available in browser.');
			return;
		}

		return new Promise((resolve, reject) => {
			navigator.geolocation.getCurrentPosition(
				async (position) => {
					const lat = position.coords.latitude;
					const lng = position.coords.longitude;
					setUserLocation({ lat, lng });
					console.log('Browser location:', lat, lng);

					// 2) Call the backend to login/register the user
					if (address) {
						try {
							const userData = await registerOrLoginUser(address, lat, lng);

							// The server should return a user object with geohash
							if (userData && userData.geohash) {
								setUserGeohash(userData.geohash);
							} else {
								console.warn('No geohash returned from backend:', userData);
							}
						} catch (error) {
							console.error('Error registering/logging in user:', error);
						}
					}

					resolve();
				},
				(error) => {
					console.error('Error retrieving geolocation:', error);
					reject(error);
				}
			);
		});
	};

	const registerOrLoginUser = async (walletAddress, latitude, longitude) => {
		const response = await fetch('http://localhost:4000/api/users/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ walletAddress, latitude, longitude }),
		});
		if (!response.ok) {
			throw new Error(
				`Backend error: ${response.status} ${response.statusText}`
			);
		}
		return response.json(); // returns user object: { _id, walletAddress, latitude, longitude, geohash }
	};

	return (
		<WalletContext.Provider
			value={{
				account,
				provider,
				signer,
				connectWallet,
				userLocation,
				userGeohash, // the geohash from server
			}}
		>
			{children}
		</WalletContext.Provider>
	);
};
