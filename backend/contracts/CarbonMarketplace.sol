// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./CCToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AuctionDApp is Ownable {
    CCToken public cctoken;
    uint256 public minBidPricePerToken;

    struct Auction {
        address seller;
        uint256 tokenAmount;
        uint256 basePrice;
        uint256 startTime;
        uint256 endTime;
        address highestBidder;
        uint256 highestBid;
        bool isFinalized;
    }

    uint256 public auctionIdCounter;
    mapping(uint256 => Auction) public auctions;

    event AuctionCreated(uint256 indexed auctionId, address indexed seller, uint256 tokenAmount, uint256 basePrice, uint256 endTime);
    event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 bidAmount);
    event AuctionFinalized(uint256 indexed auctionId, address indexed seller, address indexed winner, uint256 amount);
    event AuctionCancelled(uint256 indexed auctionId);

    constructor(address _cctokenAddress, uint256 _minBidPricePerToken){
        cctoken = CCToken(_cctokenAddress);
        minBidPricePerToken = _minBidPricePerToken;
    }

    function createAuction(uint256 _tokenAmount, uint256 _basePrice, uint256 _duration) external {
        require(_duration > 0, "Duration must be positive");
        require(_tokenAmount > 0, "Token amount must be positive");
        require(_basePrice >= minBidPricePerToken * _tokenAmount, "Base price must be >= minimum bid price * token amount");

        require(cctoken.transferFrom(msg.sender, address(this), _tokenAmount), "Token transfer failed");

        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + _duration;

        auctionIdCounter++;
        auctions[auctionIdCounter] = Auction({
            seller: msg.sender,
            tokenAmount: _tokenAmount,
            basePrice: _basePrice,
            startTime: startTime,
            endTime: endTime,
            highestBidder: address(0),
            highestBid: 0,
            isFinalized: false
        });

        emit AuctionCreated(auctionIdCounter, msg.sender, _tokenAmount, _basePrice, endTime);
    }

    function placeBid(uint256 _auctionId) external payable {
        Auction storage auction = auctions[_auctionId];
        require(block.timestamp <= auction.endTime, "Auction has ended");
        require(!auction.isFinalized, "Auction is finalized");
        require(msg.value >= (auction.basePrice*101)/100, "Bid must exceed base price");//msg.value is 1.01x if bid is x
        require(msg.value > (auction.highestBid*101)/100, "Bid must be higher than current highest");

        if (auction.highestBidder != address(0)) {
            payable(auction.highestBidder).transfer((auction.highestBid*101)/100);//returning 1.01x
        }

        auction.highestBidder = msg.sender;
        auction.highestBid = (msg.value*100)/101;//highest bid contains the value of bid x but msg.value also contains commission from bidder

        emit BidPlaced(_auctionId, msg.sender, (msg.value*100)/101);
    }

    function finalizeAuction(uint256 _auctionId) external {
        Auction storage auction = auctions[_auctionId];
        require(msg.sender == auction.seller, "Only seller can finalize");
        require(!auction.isFinalized, "Already finalized");

        auction.isFinalized = true;

        if (auction.highestBidder != address(0)) {
            payable(auction.seller).transfer((auction.highestBid*98)/100);//Cutting 2%commission from seller
            cctoken.transfer(auction.highestBidder, auction.tokenAmount);
        } else {
            cctoken.transfer(auction.seller, auction.tokenAmount);
        }

        emit AuctionFinalized(_auctionId, auction.seller, auction.highestBidder, auction.highestBid);
    }

    function cancelAuction(uint256 _auctionId) external {
        Auction storage auction = auctions[_auctionId];
        require(msg.sender == auction.seller, "Only seller can cancel"); //ye abhi add kiya, ekbar check karna hain, github pe add karna hain
        require(block.timestamp > auction.endTime, "Auction not ended yet");
        require(!auction.isFinalized, "Auction already finalized");

        auction.isFinalized = true;

        cctoken.transfer(auction.seller, auction.tokenAmount);

        if (auction.highestBidder != address(0)){
            payable(auction.highestBidder).transfer((auction.highestBid*101)/100);
        }

        emit AuctionCancelled(_auctionId);
    }

    // Function to check and finalize expired auctions
    function checkAndFinalizeExpiredAuctions(uint256 _auctionId) external {
        Auction storage auction = auctions[_auctionId];
        require(block.timestamp > auction.endTime, "Auction not ended yet");
        require(!auction.isFinalized, "Auction already finalized");

        auction.isFinalized = true;

        if (auction.highestBidder != address(0)) {
            payable(auction.seller).transfer((auction.highestBid*98)/100);
            cctoken.transfer(auction.highestBidder, auction.tokenAmount);
        } else {
            cctoken.transfer(auction.seller, auction.tokenAmount);
        }

        emit AuctionFinalized(_auctionId, auction.seller, auction.highestBidder, auction.highestBid);
    }

    // Function to get all active auctions
    function getActiveAuctions() external view returns (uint256[] memory, Auction[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= auctionIdCounter; i++) {
            if (!auctions[i].isFinalized && block.timestamp <= auctions[i].endTime) {
                count++;
            }
        }

        uint256[] memory auctionIds = new uint256[](count);
        Auction[] memory activeAuctions = new Auction[](count);
        uint256 index = 0;

        for (uint256 i = 1; i <= auctionIdCounter; i++) {
            if (!auctions[i].isFinalized && block.timestamp <= auctions[i].endTime) {
                auctionIds[index] = i;
                activeAuctions[index] = auctions[i];
                index++;
            }
        }

        return (auctionIds, activeAuctions);
    }

    // Function to get active auctions created by a specific seller
    function getAuctionsBySeller(address seller) external view returns (uint256[] memory, Auction[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= auctionIdCounter; i++) {
            if (auctions[i].seller == seller && block.timestamp <= auctions[i].endTime && !auctions[i].isFinalized) {
                count++;
            }
        }

        uint256[] memory auctionIds = new uint256[](count);
        Auction[] memory sellerAuctions = new Auction[](count);
        uint256 index = 0;

        for (uint256 i = 1; i <= auctionIdCounter; i++) {
            if (auctions[i].seller == seller && block.timestamp <= auctions[i].endTime && !auctions[i].isFinalized) {
                auctionIds[index] = i;
                sellerAuctions[index] = auctions[i];
                index++;
            }
        }

        return (auctionIds, sellerAuctions);
    } //uhuhii

    // Function to get auctions where a specific buyer is the highest bidder
    function getAuctionsByHighestBidder(address bidder) external view returns (uint256[] memory, Auction[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= auctionIdCounter; i++) {
            if (auctions[i].highestBidder == bidder && block.timestamp <= auctions[i].endTime && !auctions[i].isFinalized) {
                count++;
            }
        }

        uint256[] memory auctionIds = new uint256[](count);
        Auction[] memory bidderAuctions = new Auction[](count);
        uint256 index = 0;

        for (uint256 i = 1; i <= auctionIdCounter; i++) {
            if (auctions[i].highestBidder == bidder && block.timestamp <= auctions[i].endTime && !auctions[i].isFinalized) {
                auctionIds[index] = i;
                bidderAuctions[index] = auctions[i];
                index++;
            }
        }
        
        return (auctionIds, bidderAuctions);//commit
    }
}