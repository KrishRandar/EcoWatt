// Updated App.jsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { WalletProvider } from './context/WalletProvider';
import Navbar from './components/Navbar'; // Add this import
import Home from './pages/Home';
import CC from './pages/CC';
import Ptop from './pages/Ptop';
import Address from './pages/Address';
import EnergyPortal from './pages/EnergyPortal';

function App() {
	return (
		<WalletProvider>
			<Router>
				<div className='App'>
					<Navbar /> {/* Add the Navbar component here */}
					<Routes>
						<Route path='/' element={<Home />} />
						<Route path='/peer-to-peer' element={<EnergyPortal />} />
						<Route path='/carbon-credits' element={<CC />} />
						<Route path='/address' element={<Address />} />
					</Routes>
				</div>
			</Router>
		</WalletProvider>
	);
}

export default App;
