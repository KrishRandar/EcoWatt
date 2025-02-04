import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSeedling, faSpinner } from '@fortawesome/free-solid-svg-icons';
import './Footer.css';

const Footer = () => {
    const messages = ["Save Energy", "Carbon Free"];
    
    return (
        <footer className="footer-container">
            {/* <div className="footer-banner">
                {Array(7)
                    .fill(messages)
                    .flat()
                    .map((msg, index) => (
                        <div key={index} className="message-item">
                            <FontAwesomeIcon icon={faSeedling} className="message-icon" />
                            <span>{msg}</span>
                        </div>
                    ))}
                <div className="message-item">
                    <FontAwesomeIcon icon={faSeedling} className="message-icon" />
                    <span>Save</span>
                </div>
            </div> */}

            <div className="footer-copyright">
                <div className="footer-brand">
                    <FontAwesomeIcon icon={faSpinner} className="brand-icon" />
                    <span className="brand-text">EcoWatt</span>
                </div>
                <p className="copyright-text">&copy; 2025 EcoWatt. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;