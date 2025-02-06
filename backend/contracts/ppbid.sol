// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./eToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BiddingContract is Ownable {
    // Reference to your ERC20 token (EnergyToken).
    EnergyToken public etoken;

    /**
     * @notice The minimum bid price per token. This ensures that a user
     *         cannot sell tokens for less than some threshold, if desired.
     */
    uint256 public minBidPricePerToken;

    struct Auction {
        address seller;
        uint256 tokenAmount;
        uint256 basePrice;
        uint256 startTime;
        uint256 endTime;
        address highestBidder;
        uint256 highestBid;   // net amount
        bool isFinalized;
    }

    // Tracks the total number of auctions created so far.
    uint256 public auctionIdCounter;
    //first
    uint256 public dayStart;


    // Maps an auctionId to its Auction struct.
    mapping(uint256 => Auction) public auctions;

    // --- Events ---
    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed seller,
        uint256 tokenAmount,
        uint256 basePrice,
        uint256 endTime
    );
    event BidPlaced(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 bidAmount
    );
    event AuctionFinalized(
        uint256 indexed auctionId,
        address indexed seller,
        address indexed winner,
        uint256 amount
    );
    event AuctionCancelled(uint256 indexed auctionId);

    // /**
    //  * @dev The constructor sets up the reference to the EnergyToken contract,
    //  *      and allows the owner to specify a minBidPricePerToken for initial usage.
    //  */
    constructor(address _cctokenAddress, uint256 _minBidPricePerToken) {
        etoken = EnergyToken(_cctokenAddress);
        minBidPricePerToken = _minBidPricePerToken;
    }

    // /**
    //  * @notice Create a new auction.
    //  *         The seller must approve the contract to transfer `_tokenAmount` on their behalf.
    //  * @param _tokenAmount The number of tokens to put up for auction.
    //  * @param _basePrice The reserve price for the entire `_tokenAmount`.
    //  * @param _duration How long the auction will last, in seconds.
    //  */

        function setDayStart(uint256 _dayStart) external onlyOwner {
        dayStart = _dayStart;
    }

     uint256 constant DAY_END_HOUR = 13 hours;


        function createAuction(uint256 _tokenAmount, uint256 _basePrice) external {
        require(_tokenAmount > 0, "Token amount must be positive");
        require(
            _basePrice >= minBidPricePerToken * _tokenAmount,
            "Base price must be >= minimum"
        );

        // Transfer tokens to contract
        require(
            etoken.transferFrom(msg.sender, address(this), _tokenAmount),
            "Token transfer failed"
        );

        uint256 startTime = block.timestamp;

        // Force the auction to end exactly at 1 PM (dayStart + 13h)
        uint256 endTime = dayStart + DAY_END_HOUR;
        require(
            startTime < endTime,
            "It is past 1 PM; cannot create a new auction today."
        );

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

        emit AuctionCreated(
            auctionIdCounter,
            msg.sender,
            _tokenAmount,
            _basePrice,
            endTime
        );
    }


   


    /**
     * @notice Place a bid on an open auction. The bidder must send enough ETH
     *         to exceed both the basePrice (with a 1% premium) and the current highest bid (also by 1%).
     *         If there was a previous highest bidder, they get their ETH refunded (with a 1% premium).
     * @param _auctionId The ID of the auction.
     */
    function placeBid(uint256 _auctionId) external payable {
        Auction storage auction = auctions[_auctionId];

        require(block.timestamp <= auction.endTime, "Auction has ended");
        require(!auction.isFinalized, "Auction is finalized");

        // Must exceed the base price by 1%.
        uint256 minRequiredBidBase = (auction.basePrice * 101) / 100;
        require(msg.value >= minRequiredBidBase, "Bid not 1% above base price");

        // Must exceed the *previous* highest bid by 1%, i.e.:
        //   newBid  >  (previousHighestBid * 101) / 100
        uint256 minRequiredBidHigh = (auction.highestBid * 101) / 100;
        require(msg.value > minRequiredBidHigh, "Bid not 1% above previous highest");

        // If there was a highest bidder already, refund them:
        // We return (auction.highestBid * 101)/100 so they get their original plus 1% premium.
        if (auction.highestBidder != address(0)) {
            payable(auction.highestBidder).transfer(
                (auction.highestBid * 101) / 100
            );
        }

        // The net “highestBid” is stored as (msg.value * 100)/101,
        // because (msg.value) includes the 1% premium from the bidder.
        // We effectively isolate the “actual” bid from the total paid.
        auction.highestBidder = msg.sender;
        auction.highestBid = (msg.value * 100) / 101;

        emit BidPlaced(_auctionId, msg.sender, auction.highestBid);
    }

    /**
     * @notice Finalize the auction once it’s ended. Only the seller can do so.
     *         The highest bidder pays 2% commission out of the final settlement:
     *          - The seller receives 98% of the highestBid.
     *          - The highestBidder receives the tokens.
     *         If there was no highest bidder, tokens return to the seller.
     * @param _auctionId The ID of the auction to finalize.
     */
    function finalizeAuction(uint256 _auctionId) external {
        Auction storage auction = auctions[_auctionId];
        require(msg.sender == auction.seller, "Only seller can finalize");
        require(!auction.isFinalized, "Already finalized");

        // Mark as finalized
        auction.isFinalized = true;

        // If we have a winner, pay the seller and give tokens to the buyer.
        if (auction.highestBidder != address(0)) {
            // 2% commission from the seller’s proceeds.
            // Seller receives 98% of highestBid
            uint256 sellerProceeds = (auction.highestBid * 98) / 100;
            payable(auction.seller).transfer(sellerProceeds);

            // Transfer tokens to highest bidder
            etoken.transfer(auction.highestBidder, auction.tokenAmount);
        } else {
            // No bidder? Return tokens to seller
            etoken.transfer(auction.seller, auction.tokenAmount);
        }

        emit AuctionFinalized(
            _auctionId,
            auction.seller,
            auction.highestBidder,
            auction.highestBid
        );
    }

    /**
     * @notice Cancel an auction after it ended with no successful manual finalization,
     *         or if you want to forcibly end it. Only the seller can do so.
     *         If there was a highest bidder, refund them their net highestBid + 1% premium.
     * @param _auctionId The ID of the auction to cancel.
     */
    function cancelAuction(uint256 _auctionId) external {
        Auction storage auction = auctions[_auctionId];
        require(msg.sender == auction.seller, "Only seller can cancel");
        require(block.timestamp > auction.endTime, "Auction not ended yet");
        require(!auction.isFinalized, "Auction already finalized");

        auction.isFinalized = true;

        // Return tokens to the seller
        etoken.transfer(auction.seller, auction.tokenAmount);

        // If there was a highest bidder, refund them
        if (auction.highestBidder != address(0)) {
            uint256 refundAmt = (auction.highestBid * 101) / 100;
            payable(auction.highestBidder).transfer(refundAmt);
        }

        emit AuctionCancelled(_auctionId);
    }

    /**
     * @notice A convenience function that checks if an auction is expired (time > endTime) and not finalized,
     *         then finalizes it automatically.
     * @param _auctionId The ID of the auction to check/finalize.
     */
    function checkAndFinalizeExpiredAuctions(uint256 _auctionId) external {
        Auction storage auction = auctions[_auctionId];
        require(block.timestamp > auction.endTime, "Auction not ended yet");
        require(!auction.isFinalized, "Already finalized");

        auction.isFinalized = true;
        // If we have a winner, pay the seller and give tokens to the buyer
        if (auction.highestBidder != address(0)) {
            uint256 sellerProceeds = (auction.highestBid * 98) / 100;
            payable(auction.seller).transfer(sellerProceeds);

            etoken.transfer(auction.highestBidder, auction.tokenAmount);
        } else {
            // No bidder? Return tokens to the seller
            etoken.transfer(auction.seller, auction.tokenAmount);
        }

        emit AuctionFinalized(
            _auctionId,
            auction.seller,
            auction.highestBidder,
            auction.highestBid
        );
    }

    /**
     * @notice Retrieve all currently active auctions (not finalized and not ended).
     * @return auctionIds An array of active auction IDs
     * @return activeAuctions An array of `Auction` structs matching those IDs
     */
    function getActiveAuctions()
        external
        view
        returns (uint256[] memory, Auction[] memory)
    {
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

    /**
     * @notice Retrieve all currently active auctions created by a specific seller.
     * @param seller The address of the seller
     * @return auctionIds An array of auction IDs
     * @return sellerAuctions An array of Auction structs
     */
    function getAuctionsBySeller(address seller)
        external
        view
        returns (uint256[] memory, Auction[] memory)
    {
        uint256 count = 0;
        for (uint256 i = 1; i <= auctionIdCounter; i++) {
            // Auction belongs to the seller, has not ended, not finalized
            if (
                auctions[i].seller == seller &&
                block.timestamp <= auctions[i].endTime &&
                !auctions[i].isFinalized
            ) {
                count++;
            }
        }

        uint256[] memory auctionIds = new uint256[](count);
        Auction[] memory sellerAuctions = new Auction[](count);
        uint256 index = 0;

        for (uint256 i = 1; i <= auctionIdCounter; i++) {
            if (
                auctions[i].seller == seller &&
                block.timestamp <= auctions[i].endTime &&
                !auctions[i].isFinalized
            ) {
                auctionIds[index] = i;
                sellerAuctions[index] = auctions[i];
                index++;
            }
        }
        return (auctionIds, sellerAuctions);
    }

    /**
     * @notice Retrieve auctions where a given address is the highest bidder
     *         (still active).
     * @param bidder The address of the bidder
     * @return auctionIds An array of auction IDs
     * @return bidderAuctions An array of Auction structs
     */
    function getAuctionsByHighestBidder(address bidder)
        external
        view
        returns (uint256[] memory, Auction[] memory)
    {
        uint256 count = 0;
        for (uint256 i = 1; i <= auctionIdCounter; i++) {
            if (
                auctions[i].highestBidder == bidder &&
                block.timestamp <= auctions[i].endTime &&
                !auctions[i].isFinalized
            ) {
                count++;
            }
        }

        uint256[] memory auctionIds = new uint256[](count);
        Auction[] memory bidderAuctions = new Auction[](count);
        uint256 index = 0;

        for (uint256 i = 1; i <= auctionIdCounter; i++) {
            if (
                auctions[i].highestBidder == bidder &&
                block.timestamp <= auctions[i].endTime &&
                !auctions[i].isFinalized
            ) {
                auctionIds[index] = i;
                bidderAuctions[index] = auctions[i];
                index++;
            }
        }
        return (auctionIds, bidderAuctions);
    }
}
