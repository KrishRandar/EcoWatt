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
    uint256 public orderCounter;
    uint256 public tradeCounter;
    uint256 public bidCounter;
    uint256 public dayStart;
    uint256 public dailyBuyingLimit;
    uint256 public lastDaySellOrderId;

    struct SellOrder {
        address seller;
        uint256 amount;
        uint256 remaining;
        uint256 pricePerUnit;
        bool active;
        bool cancelled;
        string geohash;
    }

    struct EnergyTrade {
        address seller;
        address buyer;
        uint256 orderId;
        uint256 amount;
        uint256 price;
        uint256 fee;
    }

    struct Bid {
        uint256 bidId;
        uint256 orderId;
        address buyer;
        uint256 amount;
        uint256 bidPrice;
        uint256 fee;
        bool active;
    }

    mapping(uint256 => SellOrder) public sellOrders;
    mapping(uint256 => EnergyTrade) public trades;
    mapping(uint256 => Bid) public bids;
    mapping(uint256 => uint256[]) public orderBids;
    mapping(address => uint256) public buyerDailyPurchase;

    event SellOrderCreated(uint256 indexed orderId, address indexed seller, uint256 amount, uint256 pricePerUnit, string geohash);
    event SellOrderCancelled(uint256 indexed orderId);
    event TradeExecuted(uint256 indexed tradeId, uint256 indexed orderId, address indexed buyer, uint256 amount, uint256 fee);
    event BidPlaced(uint256 indexed bidId, uint256 indexed orderId, address indexed buyer, uint256 amount, uint256 bidPrice, uint256 fee);
    event BidAccepted(uint256 indexed bidId, uint256 indexed orderId, address indexed buyer, uint256 amount, uint256 bidPrice, uint256 fee);
    event BidCancelled(uint256 indexed bidId);

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
        dayStart = block.timestamp;
        dailyBuyingLimit = 1000 * (10 ** 18);
    }

    function setDayStart(uint256 _dayStart) external onlyOwner {
        dayStart = _dayStart;
    }

    function setDailyBuyingLimit(uint256 _limit) external onlyOwner {
        dailyBuyingLimit = _limit;
    }

    function setLastDaySellOrderId(uint256 _lastDaySellOrderId) external onlyOwner {
        lastDaySellOrderId = _lastDaySellOrderId;
    }

    function getCurrentPhase() public view returns (uint8) {
        uint256 timeElapsed = block.timestamp - dayStart;
        if (timeElapsed < 10 hours) return 0;
        if (timeElapsed < 13 hours) return 1;
        return 2;
    }

    function createSellOrder(uint256 amount, uint256 pricePerUnitInWei, string calldata geohash) external {
        require(entToken.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        sellOrders[orderCounter] = SellOrder(msg.sender, amount, amount, pricePerUnitInWei, true, false, geohash);
        emit SellOrderCreated(orderCounter, msg.sender, amount, pricePerUnitInWei, geohash);
        orderCounter++;
    }

    function cancelSellOrder(uint256 orderId) external onlySeller(orderId) {
        SellOrder storage order = sellOrders[orderId];
        require(order.active, "Order not active");
        order.active = false;
        order.cancelled = true;
        require(entToken.transfer(msg.sender, order.remaining), "Refund failed");
        emit SellOrderCancelled(orderId);
    }

    function executeTrade(uint256 orderId, uint256 amount, uint256 fee) external payable nonReentrant {
        SellOrder storage order = sellOrders[orderId];
        require(order.active, "Order not active");
        require(amount > 0 && amount <= order.remaining, "Invalid amount");
        require(msg.sender != order.seller, "Cannot buy from self");
        uint8 phase = getCurrentPhase();
        if (phase == 0) {
            require(buyerDailyPurchase[msg.sender] + amount <= dailyBuyingLimit, "Exceeds daily limit");
        }
        uint256 totalCost = (amount * order.pricePerUnit) + fee;
        require(msg.value >= totalCost, "Insufficient ETH sent");
        order.remaining -= amount;
        if (order.remaining == 0) order.active = false;
        if (phase == 0) buyerDailyPurchase[msg.sender] += amount;
        require(entToken.transfer(msg.sender, amount), "Token transfer failed");
        trades[tradeCounter] = EnergyTrade(order.seller, msg.sender, orderId, amount, order.pricePerUnit, fee);
        emit TradeExecuted(tradeCounter, orderId, msg.sender, amount, fee);
        tradeCounter++;
        payable(order.seller).transfer(amount * order.pricePerUnit);
        payable(owner).transfer(fee);
        if (msg.value > totalCost) payable(msg.sender).transfer(msg.value - totalCost);
    }

    function withdrawFees() external onlyOwner nonReentrant {
        payable(owner).transfer(address(this).balance);
    }

    function getListOfActiveSellOrdersForMe() external view returns (SellOrder[] memory, uint256[] memory) {
        uint256 activeCount;
        for (uint256 i = lastDaySellOrderId; i < orderCounter; i++) {
            if (sellOrders[i].active && sellOrders[i].seller == msg.sender) activeCount++;
        }
        SellOrder[] memory activeOrders = new SellOrder[](activeCount);
        uint256[] memory orderIds = new uint256[](activeCount);
        uint256 index;
        for (uint256 i = lastDaySellOrderId; i < orderCounter; i++) {
            if (sellOrders[i].active && sellOrders[i].seller == msg.sender) {
                activeOrders[index] = sellOrders[i];
                orderIds[index] = i;
                index++;
            }
        }
        return (activeOrders, orderIds);
    }

    function getListOfSellOrders() external view returns (SellOrder[] memory, uint256[] memory) {
        uint256 totalCount = orderCounter - lastDaySellOrderId;
        SellOrder[] memory orders = new SellOrder[](totalCount);
        uint256[] memory orderIds = new uint256[](totalCount);
        for (uint256 i = lastDaySellOrderId; i < orderCounter; i++) {
            orders[i - lastDaySellOrderId] = sellOrders[i];
            orderIds[i - lastDaySellOrderId] = i;
        }
        return (orders, orderIds);
    }
}