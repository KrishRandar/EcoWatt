// // src/components/Ptop.js
import React, { useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import ngeohash from 'ngeohash'; // <--- ADDED for decoding geohashes
import { WalletContext } from '../context/WalletProvider';
import energyContractABI from '../abis/EnergyTrading';
import tokenABI from '../abis/EnergyToken';
import './ptop.css';
import axios from 'axios';

const TOKEN_CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const ENERGY_CONTRACT_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

const Ptop = () => {
    const { account, provider, signer, userGeohash } = useContext(WalletContext);
    const [sellOrders, setSellOrders] = useState([]);
    const [sellQuantity, setSellQuantity] = useState('');
    const [sellPrice, setSellPrice] = useState('');
    // REMOVED: sellGeohash input
    const [loading, setLoading] = useState(false);
    const [userBalance, setUserBalance] = useState('0');
    const [buyAmounts, setBuyAmounts] = useState({});
    const [buyOrderAmount, setBuyOrderAmount] = useState('');
    const [buyOrderPrice, setBuyOrderPrice] = useState('');

    // In your code, you had isPeakHours logic. We'll keep it:
    const checkIsPeakHours = () => {
        const now = new Date();
        const hours = now.getHours();
        // For demonstration, we keep your original check:
       // return !(hours >= 10 || hours === 0);
       return false ;
    };
    const [isPeakHours, setIsPeakHours] = useState(checkIsPeakHours());

    useEffect(() => {
        // Update peak hours every minute
        const interval = setInterval(() => {
            setIsPeakHours(checkIsPeakHours());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (account) {
            fetchSellOrders();
            fetchUserBalance();
        }
    }, [account]);

    const getEnergyContract = () => {
        if (!signer) return null;
        return new ethers.Contract(
            ENERGY_CONTRACT_ADDRESS,
            energyContractABI,
            signer
        );
    };

    const getTokenContract = () => {
        if (!signer) return null;
        return new ethers.Contract(TOKEN_CONTRACT_ADDRESS, tokenABI, signer);
    };

    const fetchUserBalance = async () => {
        try {
            const tokenContract = getTokenContract();
            if (!tokenContract) return;
            const balance = await tokenContract.balanceOf(account);
            setUserBalance(ethers.utils.formatUnits(balance, 'wei'));
        } catch (error) {
            console.error('Error fetching balance:', error);
        }
    };

    const fetchSellOrders = async () => {
        try {
            const contract = getEnergyContract();
            if (!contract) return;

            const [orders, orderIds] = await contract.getListOfSellOrders();
            const formattedOrders = orders
                .map((order, index) => ({
                    id: orderIds[index].toString(),
                    seller: order.seller,
                    quantity: order.amount.toString(),
                    remaining: order.remaining.toString(),
                    price: ethers.utils.formatUnits(order.pricePerUnit, 'wei'),
                    active: order.active,
                    geohash: order.geohash, // We'll use this to decode lat/lng
                }))
                .filter((order) => order.active);

            setSellOrders(formattedOrders);
        } catch (error) {
            console.error('Error fetching sell orders:', error);
        }
    };

    // Create sell order with user's geohash from the backend
    const createSellOrder = async (e) => {
        e.preventDefault();
        if (!sellQuantity || !sellPrice) return;

        // We rely on userGeohash from context
        if (!userGeohash) {
            alert(
                'Unable to create sell order without your geohash. Are you logged in?'
            );
            return;
        }

        setLoading(true);
        try {
            const contract = getEnergyContract();
            const tokenContract = getTokenContract();
            if (!contract || !tokenContract) return;

            const amount = ethers.utils.parseUnits(sellQuantity, 'wei');
            const pricePerUnit = ethers.utils.parseUnits(sellPrice, 'wei');

            // 1) Approve tokens
            const approveTx = await tokenContract.approve(
                ENERGY_CONTRACT_ADDRESS,
                amount
            );
            await approveTx.wait();

            // 2) Create sell order
            const tx = await contract.CreateSellOrder(
                amount,
                pricePerUnit,
                userGeohash
            );
            await tx.wait();

            alert('Sell Order Created Successfully!');
            fetchSellOrders();
            fetchUserBalance();
            setSellQuantity('');
            setSellPrice('');
        } catch (error) {
            console.error('Error creating sell order:', error);
            alert('Error creating sell order. Check console for details.');
        } finally {
            setLoading(false);
        }
    };

    const cancelSellOrder = async (orderId) => {
        setLoading(true);
        try {
            const contract = getEnergyContract();
            if (!contract) return;
            const tx = await contract.cancelSellOrder(orderId);
            await tx.wait();
            alert('Sell Order Cancelled Successfully!');
            fetchSellOrders();
            fetchUserBalance();
        } catch (error) {
            console.error('Error cancelling sell order:', error);
            alert('Error cancelling sell order. Check console for details.');
        } finally {
            setLoading(false);
        }
    };

    // Distance Calculation (Haversine formula in kilometers)
    const calculateDistanceKm = (geohashA, geohashB) => {
    	if (!geohashA || !geohashB) return 0;
    	const { latitude: latA, longitude: lonA } = ngeohash.decode(geohashA);
    	const { latitude: latB, longitude: lonB } = ngeohash.decode(geohashB);

    	const R = 6371; // Earth's radius in km
    	const dLat = ((latB - latA) * Math.PI) / 180;
    	const dLon = ((lonB - lonA) * Math.PI) / 180;
    	const a =
    		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    		Math.cos((latA * Math.PI) / 180) *
    			Math.cos((latB * Math.PI) / 180) *
    			Math.sin(dLon / 2) *
    			Math.sin(dLon / 2);
    	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    	const distance = R * c;
    	return distance;
    };

    // // Get the distance-based fee in ETH (arbitrary logic, for demonstration)
    // const getDistanceFee = (distanceKm) => {
    // 	// For example: 0.0001 ETH per km
    // 	const feePerKm = 0.0001;
    // 	return distanceKm * feePerKm;
    // };
    // helpers/calculateNetPriceAndFee.js
    //const geohash = require('geohash'); // Use geohash library for distance calculation (you can replace with your library if needed)

    // const calculateNetPriceAndFee = (buyerGeohash, sellerGeohash, pricePerUnit) => {
    //     // Calculate the distance between buyer and seller using geohash
    //     if (!buyerGeohash || !sellerGeohash || pricePerUnit == null) {
    //         console.error("Invalid parameters passed to calculateNetPriceAndFee");
    //         return { netPricePerUnit: 0, feePerUnit: 0 };
    //     }
    //     const distance = calculateDistanceKm(buyerGeohash, sellerGeohash);
        
    //     // Assume the transfer fee is proportional to the distance
    //     const transferFee = distance * 0.01; // Fee per unit distance, adjust as needed

    //     // Calculate commission (1% of price per unit)
    //     const commission = pricePerUnit * 0.01;

    //     // Calculate net price per unit
    //     const netPricePerUnit = pricePerUnit + commission + transferFee;

    //     // Fee per unit (difference between net price and base price)
    //     const feePerUnit = netPricePerUnit - pricePerUnit;

    //     return { netPricePerUnit, feePerUnit };
    // };
    const calculateNetPriceAndFee = (buyerGeohash, sellerGeohash, pricePerUnit) => {
        if (!buyerGeohash || !sellerGeohash || pricePerUnit == null || isNaN(pricePerUnit)) {
            console.error("❌ Invalid parameters passed to calculateNetPriceAndFee");
            return { totalCostEthperunit: 0, totfeeperunit: 0 };
        }
    
        const distance = calculateDistanceKm(buyerGeohash, sellerGeohash);
    
        const transferFee = Math.floor(distance * 0.01); // Fee per unit distance
        const commission = Math.floor(pricePerUnit * 0.20); // 1% commission
    
        const totalCostEthperunit = pricePerUnit + commission + transferFee;
        const totfeeperunit = totalCostEthperunit - pricePerUnit;
    
        console.log("✅ totalCostEthperunit =", totalCostEthperunit);
        console.log("✅ totfeeperunit =", totfeeperunit);
    
        return { totalCostEthperunit, totfeeperunit };
    };
    
    // This function triggers the buy flow in NON-peak hours
    const executeTrade = async (orderId) => {
        const buyAmount = buyAmounts[orderId];
        if (!buyAmount || parseFloat(buyAmount) <= 0) {
            alert('Please enter a valid amount to buy.');
            return;
        }
        let witnessValue;
        try {
            const response = await axios.post(
                'http://localhost:4000/generate-witness',
                { buyAmount }
            );
            witnessValue = response.data.witnessValue;

            console.log(`Received Witness Value: ${witnessValue}`);

            if (witnessValue === 1) {
                alert('Capacity exceeded. Cannot proceed with trade.');
                return;
            }
        } catch (error) {
            console.error('Error fetching witness value:', error);
            alert('Error generating witness. Please try again.');
            return;
        }
        setLoading(true);
        try {
            const contract = getEnergyContract();
            if (!contract) return;

            // Retrieve the complete order from the contract to get pricePerUnit & geohash
            const order = await contract.sellOrders(orderId);
            const orderGeohash = order.geohash;
            const orderPriceWei = order.pricePerUnit;

            // Convert the user’s buyAmount to Wei
            const amount = ethers.utils.parseUnits(buyAmount, 'wei');

            // Convert orderPriceWei from BigNumber to a numeric string for calculation
            const orderPriceEthString = ethers.utils.formatUnits(
                orderPriceWei,
                'wei'
            );
            const orderPriceEth = parseFloat(orderPriceEthString);

            // 1) Calculate distance-based fee
            // let distanceFeeEth = 0;
            // if (userGeohash && orderGeohash) {
            // 	const distanceKm = calculateDistanceKm(userGeohash, orderGeohash);
            // 	distanceFeeEth = getDistanceFee(distanceKm);
            // }

            // 2) Base cost = (price per kWh * quantity).
            //    Price is in ETH, amount is in kWh. So baseCost = orderPriceEth * buyAmount
            // const baseCost = orderPriceEth * parseFloat(buyAmount);

            // // 3) We'll also keep your "fixed fee" of 0.01 ETH
            // //    So total = baseCost + 0.01 + distanceFeeEth
            // const fixedFee = 0.01;
            // const [totalCostEthperunit, totfeeperunit] = calculateNetPriceAndFee(userGeohash, orderGeohash, orderPriceEth);
            console.log(userGeohash, orderGeohash, orderPriceEth);
            //if (userGeohash && orderGeohash) {
                //console.log(userGeohash, orderGeohash, orderPriceEth);
                const result = calculateNetPriceAndFee(userGeohash, orderGeohash, orderPriceEth);
                if (!result || typeof result !== "object") {
                    console.error("❌ calculateNetPriceAndFee returned invalid result:", result);
                }
                const { totalCostEthperunit, totfeeperunit } = result;
                if (isNaN(totalCostEthperunit) || isNaN(totfeeperunit)) {
                    console.error("❌ totalCostEthperunit or totfeeperunit is NaN");
                }
                
            console.log("Debug: totalCostEthperunit =", totalCostEthperunit);
            console.log("Debug: totfeeperunit =", totfeeperunit);

            const totalCostEth = Math.ceil(totalCostEthperunit * parseFloat(buyAmount));
            console.log(totalCostEth);
            const totfee = Math.ceil(totfeeperunit * parseFloat(buyAmount));
            // // Convert totalCostEth to Wei for the value param
            console.log(totfee);
            const totalCostWei = ethers.utils.parseEther(totalCostEth.toString());

            // A simplified example of how you'd call executeTrade with your fee
            // NOTE: Your smart contract method signature might need to change
            // if you want to incorporate a dynamic distance fee.
            const feeAmount = ethers.utils.parseEther(
                (totfee).toString()
            );
        
            const tx = await contract.executeTrade(orderId, amount, feeAmount, {
                value: totalCostWei,
            });
            await tx.wait();

            alert('Trade Executed Successfully!');
            fetchSellOrders();
            fetchUserBalance();
            setBuyAmounts((prev) => ({ ...prev, [orderId]: '' }));
        
        } catch (error) {
            console.error('Error executing trade:', error);
            alert('Error executing trade. Please check console for details.');
        } finally {
            setLoading(false);
        }
    };

    // This function is for the buy order during peak hours
    const handleBuyOrderSubmit = (e) => {
        e.preventDefault();
        alert('Buy order functionality for peak hours is not implemented yet.');
    };

    const handleBuyAmountChange = (orderId, value) => {
        setBuyAmounts((prev) => ({ ...prev, [orderId]: value }));
    };
    // function calculateDistanceKm(buyerGeohash, sellerGeohash) {
    //     if (!buyerGeohash || !sellerGeohash) {
    //         return 0;
    //     }
    //     // Returns distance in kilometers between two geohash strings
    //     return geohash.distance(buyerGeohash, sellerGeohash);
    // }

    function getDistanceFee(distanceKm) {
        // Example: 0.01 ETH per km
        return distanceKm * 0.01;
    }
    return (
        <div className='energy-trading'>
            <header className='balance-display'>
                <h3>Your Balance: {userBalance} ENT</h3>
            </header>

            <div className='main-content'>
                <div className='trade-section'>
                    <h2>SELL ENERGY</h2>
                    <form onSubmit={createSellOrder} className='order-form'>
                        <input
                            type='number'
                            placeholder='QUANTITY (kWh)'
                            value={sellQuantity}
                            onChange={(e) => setSellQuantity(e.target.value)}
                            disabled={loading}
                            required
                        />
                        <input
                            type='number'
                            placeholder='PRICE/UNIT (ETH)'
                            value={sellPrice}
                            onChange={(e) => setSellPrice(e.target.value)}
                            disabled={loading}
                            required
                        />
                        {/* No geohash input, we rely on the userGeohash from context */}
                        <button type='submit' disabled={loading}>
                            {loading ? 'PROCESSING...' : 'CONFIRM ORDER'}
                        </button>
                    </form>
                </div>

                {isPeakHours && (
                    <div className='trade-section'>
                        <h2>BUY ENERGY</h2>
                        <form onSubmit={handleBuyOrderSubmit} className='order-form'>
                            <input
                                type='number'
                                placeholder='AMOUNT TO BUY (kWh)'
                                value={buyOrderAmount}
                                onChange={(e) => setBuyOrderAmount(e.target.value)}
                                disabled={loading}
                                required
                            />
                            <input
                                type='number'
                                placeholder='PRICE WILLING TO PAY (ETH)'
                                value={buyOrderPrice}
                                onChange={(e) => setBuyOrderPrice(e.target.value)}
                                disabled={loading}
                                required
                            />
                            <button type='submit' disabled={loading}>
                                {loading ? 'PROCESSING...' : 'PLACE BUY ORDER'}
                            </button>
                        </form>
                    </div>
                )}

                <div className='orders-container'>
                    <h3>MY SELL ORDERS</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>QUANTITY</th>
                                <th>REMAINING</th>
                                <th>PRICE</th>
                                <th>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sellOrders
                                .filter((order) => order.seller === account)
                                .map((order) => (
                                    <tr key={order.id}>
                                        <td>{order.quantity} kWh</td>
                                        <td>{order.remaining} kWh</td>
                                        <td>{order.price} ETH</td>
                                        <td>
                                            <button
                                                onClick={() => cancelSellOrder(order.id)}
                                                disabled={loading}
                                            >
                                                {loading ? 'PROCESSING...' : 'CANCEL'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>

                    <h3>AVAILABLE SELL ORDERS</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>SELLER</th>
                                <th>REMAINING</th>
                                <th>PRICE PER UNIT</th>
                                <th>TRANSFER FEE/unit</th>
                                {!isPeakHours && (
                                    <>
                                        <th>BUY AMOUNT</th>
                                        <th>ACTION</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {sellOrders
                                .filter((order) => order.seller !== account)
                                .map((order) => {
                                    let distanceKm = 0;
                                    let distanceFeeEth = 0;

                                    // 3️⃣ Use the two functions above
                                    if (userGeohash && order.geohash) {
                                        distanceKm = calculateDistanceKm(userGeohash, order.geohash);
                                        distanceFeeEth = getDistanceFee(distanceKm);
                                    }

                                    return (
                                        <tr key={order.id}>
                                            <td>
                                                {order.seller.slice(0, 6)}...
                                                {order.seller.slice(-4)}
                                            </td>
                                            <td>{order.remaining} kWh</td>
                                            <td>{order.price} ETH</td>
                                            {!isPeakHours && (
                                                <>
                                                    <td>
                                                        {distanceFeeEth.toFixed(6)} ETH
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            placeholder="Enter amount"
                                                            value={buyAmounts[order.id] || ''}
                                                            onChange={(e) =>
                                                                handleBuyAmountChange(order.id, e.target.value)
                                                            }
                                                            min="0"
                                                        />
                                                    </td>
                                                    <td>
                                                        <button
                                                            onClick={() => executeTrade(order.id)}
                                                            disabled={loading || !buyAmounts[order.id]}
                                                        >
                                                            {loading ? 'PROCESSING...' : 'BUY'}
                                                        </button>
                                                        {/* {distanceKm > 0 && (
                                                            <div style={{ fontSize: '0.8em', marginTop: '4px' }}>
                                                               
                                                            </div>
                                                        )} */}
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Ptop;