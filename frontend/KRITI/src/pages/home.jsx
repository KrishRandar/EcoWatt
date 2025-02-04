import React from 'react';
import './Home.css';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRightLong, faCodeBranch, faChartLine } from '@fortawesome/free-solid-svg-icons';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function Home() {
  return (
    <div className="home-container">
      

      <main className="hero-main">
        <div className="hero-content">
          <h1 className="hero-heading">
            A Smarter Marketplace for Energy & Carbon <span className="highlight-text">Trading</span>.
          </h1>
          <p className="hero-subtext">
            Easily trade energy with peers and earn carbon credits in a system designed for fairness, efficiency, and sustainability.
          </p>
        </div>

        <div className="cards-container">
          <div className="card">
            <div className="card-content">
              <div className="card-header">
                <FontAwesomeIcon icon={faCodeBranch} className="card-icon" />
                <h2 className="card-title">Peer-to-Peer</h2>
              </div>
              <p className="card-description">
                Discover our latest innovations in clean energy.
              </p>
              <Link to="/peer-to-peer" className="card-button">
                <span className="button-text">Buy & Sell</span>
                <div className="button-icon">
                  <FontAwesomeIcon icon={faArrowRightLong} />
                </div>
              </Link>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="card-header">
                <FontAwesomeIcon icon={faChartLine} className="card-icon" />
                <h2 className="card-title">Carbon Credit</h2>
              </div>
              <p className="card-description">
                Discover our latest innovations in clean energy.
              </p>
              <Link to="/carbon-credits" className="card-button">
                <span className="button-text">Trade Credits</span>
                <div className="button-icon">
                  <FontAwesomeIcon icon={faArrowRightLong} />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>

      
    </div>
  );
}

export default Home;