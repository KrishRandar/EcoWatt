// // components/Navbar.jsx

// import React, { useContext } from 'react';
// import { Link } from 'react-router-dom';
// import { WalletContext } from '../context/WalletProvider';

// const Navbar = () => {
//   const { account, connectWallet } = useContext(WalletContext);

//   return (
//     <nav className="bg-gray-800 text-white p-4">
//       <div className="container mx-auto flex justify-between items-center">
//         <Link to="/" className="text-xl font-bold text--400 hover:text-green-300">
//           GreenChain
//         </Link>
//         <div className="flex items-center gap-4">
//           <Link to="/peer-to-peer" className="text-blue-400 hover:text-blue-300">P2P Trading</Link>
//           <Link to="/carbon-credits" className="text-yellow-400 hover:text-yellow-300">Carbon Credits</Link>
//           <button 
//             onClick={connectWallet}
//             className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg transition-colors"
//           >
//             {account 
//               ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}` 
//               : "Connect Wallet"
//             }
//           </button>
//         </div>
//       </div>
//     </nav>
//   );
// };
// //hello
// export default Navbar;
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