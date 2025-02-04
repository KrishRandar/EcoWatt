import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { WalletContext } from '../context/WalletProvider';
import './Navbar.css';


const Navbar = () => {
  const { account, connectWallet } = useContext(WalletContext);

  return (
    <nav className="navbar-container">
      <div className="navbar-content">
        <Link to="/" className="navbar-logo">
          Ecowatt
        </Link>
        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/peer-to-peer" className="nav-link">P2P Trading</Link>
          <Link to="/carbon-credits" className="nav-link">Carbon Credits</Link>
          
        </div>
        <button 
            onClick={connectWallet}
            className="wallet-button"
          >
            {account 
              ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}`
              : "Connect Wallet"
            }
          </button>
      </div>
    </nav>
  );
};

export default Navbar;