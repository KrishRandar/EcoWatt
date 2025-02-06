// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IERC20Decimals is IERC20 {
    function decimals() external view returns (uint8);
}

contract EnergyTradingMarket is ReentrancyGuard {
    IERC20Decimals public entToken;
    address public owner;
    uint256 public tradeCounter;
    uint256 public orderCounter;
    uint256 public lastDaySellOrderId;

    struct EnergyTrade {
        address seller;
        address buyer;
        uint256 orderId;
        uint256 amount;
        uint256 price;
        uint256 fee;
    }

    struct SellOrder {
        address seller;
        uint256 amount;
        uint256 remaining;
        uint256 pricePerUnit;
        bool active;
        bool cancel;
        string geohash; 
    }
    //hello
    mapping(uint256 => EnergyTrade) public trades;
    mapping(uint256 => SellOrder) public sellOrders;
    mapping(address => uint256) public energyBalance;

    event OrderCreated(uint256 orderId, address seller, uint256 amount, uint256 price, string geohash);
    event OrderCancelled(uint256 orderId);
    event TradeExecuted(uint256 tradeId, uint256 orderId, address buyer, uint256 amount, uint256 fee);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlySeller(uint256 orderId) {
        require(sellOrders[orderId].seller == msg.sender, "Not order owner");
        _;
    }

    constructor(address _entToken) {
        entToken = IERC20Decimals(_entToken);
        owner = msg.sender;
    }

    function setLastDaySellOrderId(uint256 _lastDaySellOrderId) external onlyOwner {
        lastDaySellOrderId = _lastDaySellOrderId;
    }

    function CreateSellOrder(uint256 amount, uint256 pricePerUnitInWei, string calldata geohash) external {
        require(entToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        sellOrders[orderCounter] = SellOrder({
            seller: msg.sender,
            amount: amount,
            remaining: amount,
            pricePerUnit: pricePerUnitInWei,
            active: true,
            cancel: false,
            geohash: geohash 
        });

        emit OrderCreated(orderCounter, msg.sender, amount, pricePerUnitInWei, geohash);
        orderCounter++;
    }


    function cancelSellOrder(uint256 orderId) external onlySeller(orderId) {
        SellOrder storage order = sellOrders[orderId];
        require(order.active, "Order not active");

        order.active = false;
        order.cancel = true;

        // Refund the unsold tokens back to the seller
        require(entToken.transfer(msg.sender, order.remaining), "Refund failed");

        emit OrderCancelled(orderId);
    }


    function executeTrade(uint256 orderId, uint256 amount, uint256 fee) external payable nonReentrant {
        SellOrder storage order = sellOrders[orderId];
        require(order.active, "Order not active");
        require(amount > 0, "Amount must be positive");
        require(amount <= order.remaining, "Amount exceeds order remaining");
        
        address buyer = msg.sender;
        require(buyer != order.seller, "Cannot buy from self");

        uint256 totalCost = (amount * order.pricePerUnit) + fee;
        require(msg.value >= totalCost, "Insufficient WEI sent");

        order.remaining -= amount;
        if (order.remaining == 0) {
            order.active = false;
        }

        require(entToken.transfer(buyer, amount), "Token transfer failed");

        trades[tradeCounter] = EnergyTrade({
            seller: order.seller,
            buyer: buyer,
            orderId: orderId,
            amount: amount,
            price: order.pricePerUnit,
            fee: fee
        });

        emit TradeExecuted(tradeCounter, orderId, buyer, amount, fee);
        tradeCounter++;

        (bool sentToSeller, ) = payable(order.seller).call{value: amount * order.pricePerUnit}("");
        require(sentToSeller, "ETH transfer to seller failed");

        (bool sentToOwner, ) = payable(owner).call{value: fee}("");
        require(sentToOwner, "ETH transfer to owner failed");

        if (msg.value > totalCost) {
            (bool refundSuccess, ) = payable(buyer).call{value: msg.value - totalCost}("");
            require(refundSuccess, "ETH refund failed");
        }
    }

    function getListOfActiveSellOrdersForMe() external view returns (SellOrder[] memory, uint256[] memory) {
        uint256 activeCount = 0;
        
        for (uint256 i = lastDaySellOrderId; i < orderCounter; i++) {
            if (sellOrders[i].active && sellOrders[i].seller == msg.sender) {
                activeCount++;
            }
        }

        SellOrder[] memory activeOrders = new SellOrder[](activeCount);
        uint256[] memory activeOrderIds = new uint256[](activeCount);
        uint256 index = 0;

        for (uint256 i = lastDaySellOrderId; i < orderCounter; i++) {
            if (sellOrders[i].active && sellOrders[i].seller == msg.sender) {
                activeOrders[index] = sellOrders[i];
                activeOrderIds[index] = i;
                index++;
            }
        }
        
        return (activeOrders, activeOrderIds);
    }

    function getListOfSellOrders() external view returns (SellOrder[] memory, uint256[] memory) {
        uint256 totalOrders = orderCounter - lastDaySellOrderId;
        SellOrder[] memory orders = new SellOrder[](totalOrders);
        uint256[] memory orderIds = new uint256[](totalOrders);

        uint256 index = 0;
        for (uint256 i = lastDaySellOrderId; i < orderCounter; i++) {
            orders[index] = sellOrders[i];
            orderIds[index] = i;
            index++;
        }
        return (orders, orderIds);
    }

    function withdrawFees() external onlyOwner nonReentrant {
        payable(owner).transfer(address(this).balance);
    }
}