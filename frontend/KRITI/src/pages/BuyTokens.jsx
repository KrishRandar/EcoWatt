import { useState } from "react";
import { ethers } from "ethers";
import tokenABI from "../../contracts/energyToken" ;
import './BuyTokens.css' ;
const BuyTokens = () => {
    const [ethAmount, setEthAmount] = useState("");
    const [userAddress, setUserAddress] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    const [tokenPrice, setTokenPrice] = useState(null);

    // Contract Details (Replace with your deployed contract address)
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    // const contractABI = [
    //     {
    //         "inputs": [],
    //         "name": "buyTokens",
    //         "outputs": [],
    //         "stateMutability": "payable",
    //         "type": "function"
    //     },
    //     {
    //         "inputs": [],
    //         "name": "TOKEN_PRICE",
    //         "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    //         "stateMutability": "view",
    //         "type": "function"
    //     }
    // ];

    // Connect to MetaMask
    const connectWallet = async () => {
        if (!window.ethereum) {
            alert("Please install MetaMask!");
            return;
        }

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            setUserAddress(address);
            setIsConnected(true);

            // Fetch token price
            const contract = new ethers.Contract(contractAddress, tokenABI, signer);
            const price = await contract.TOKEN_PRICE();
            setTokenPrice(Number(price));

        } catch (error) {
            console.error("Connection failed:", error);
            alert("Failed to connect wallet");
        }
    };

    // Buy Tokens Function
    const buyTokens = async () => {
        if (!ethAmount || ethAmount <= 0) {
            alert("Please enter a valid ETH amount.");
            return;
        }

        if (!window.ethereum) {
            alert("MetaMask not detected!");
            return;
        }

        try {
            setLoading(true);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(contractAddress, tokenABI, signer);

            const ethInWei = ethers.parseEther(ethAmount.toString());
            const tx = await contract.buyTokens({ value: ethInWei });

            console.log("Transaction sent:", tx);
            await tx.wait(); // Wait for confirmation
            alert(`Transaction confirmed! You have bought ${ethAmount * tokenPrice} ENT`);
            setEthAmount(""); // Reset input
        } catch (error) {
            console.error("Transaction failed:", error);
            alert("Transaction failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
            <h2 className="text-2xl font-bold mb-4">Buy EnergyToken (ENT)</h2>

            {isConnected ? (
                <div className="p-6 border rounded-lg bg-white shadow-md w-96">
                    <p className="text-sm text-gray-600 mb-2">
                        Connected Wallet: <span className="font-bold">{userAddress}</span>
                    </p>

                    {tokenPrice && (
                        <p className="text-sm text-gray-500 mb-4">
                            1 ETH = {tokenPrice} ENT
                        </p>
                    )}

                    <input
                        type="number"
                        placeholder="Enter ETH amount"
                        value={ethAmount}
                        onChange={(e) => setEthAmount(e.target.value)}
                        className="border p-2 rounded w-full mb-4 text-center"
                    />

                    <button
                        onClick={buyTokens}
                        className={`w-full p-2 text-white font-bold rounded ${
                            loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
                        }`}
                        disabled={loading}
                    >
                        {loading ? "Processing..." : "Buy ENT"}
                    </button>
                </div>
            ) : (
                <button
                    onClick={connectWallet}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                    Connect Wallet
                </button>
            )}
        </div>
    );
};

export default BuyTokens;
