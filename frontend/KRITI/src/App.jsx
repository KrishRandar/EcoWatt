// Updated App.jsx
import React from "react";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { WalletProvider } from './context/WalletProvider';
import Navbar from './components/Navbar';  // Add this import
import Home from './pages/home';
import CC from './pages/CC';
import Ptop from './pages/Ptop';
import Address from './pages/Address';
import Footer from "./components/Footer";

function App() {
  return (
    <WalletProvider>
      <Router>
        <div className="App">
          <Navbar />  
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/peer-to-peer" element={<Ptop />} />
            <Route path="/carbon-credits" element={<CC />} />
            <Route path="/address" element={<Address />} />
          </Routes>
          <Footer/>
        </div>
      </Router>
    </WalletProvider>
  );
}

export default App;