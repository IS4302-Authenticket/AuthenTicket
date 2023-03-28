pragma solidity ^0.5.0;

import "./Tickets/TicketNFT.sol";
import "./Tickets/TicketFactory.sol";
import "./User.sol";

// ticket will have to transfer ownership to market?....

contract ResellMarket{

    TicketNFT ticketNFT;
    TicketFactory ticketFactory;
    User user;

    // mapping of TicketID to the price of the Ticket
    mapping(uint256 => uint256) listedTickets;

    // struct for offer details
    struct ticketOffer {
        address payable offerBidder;
        uint256 offerPrice;
    }

    // Mapping to highest bidder's ticketID for each ticketID
    mapping(uint256 => ticketOffer) ticketHighestBidder;
    
    // Mapping of ticketID to boolean value of whether offer present
    mapping(uint256 => bool) ticketOfferPresent;

    constructor(TicketNFT ticketContract, TicketFactory ticketFactoryContract, User userContract) public {
        ticketNFT = ticketContract;
        ticketFactory = ticketFactoryContract;
        user = userContract;
    }

    // modifier to see if the ticket is used
    modifier ticketResellable(uint256 ticketId){
        require(ticketNFT.getTicketStatus(ticketId) == false, "Ticket is already used. Cannot be listed");
        uint256 ticketCategoryId = ticketNFT.getTicketCategory(ticketId);
        (,,,,,,bool isTicketResellable,) = ticketFactory.getTicketCategory(ticketCategoryId);
        require(isTicketResellable == true, "Ticket category is not resellable, ticket cannot be listed");
        _;
    }

    // modifier to ensure function only callable by owner (which should be an user) 
    modifier ownerOnly(uint256 ticketId){
        address prevOwnerAddress = ticketNFT.getPrevOwner(ticketId);
        require(prevOwnerAddress == msg.sender, "Wrong owner");
        require(user.checkUser(prevOwnerAddress) == true, "User is not a consumer! Cannot list in resell market");
        _;
    }

    // modifier to ensure price listed do not exceed max price
    modifier priceExceed(uint256 ticketId, uint256 price){
        uint256 ticketCategoryId = ticketNFT.getTicketCategory(ticketId);
        (,,,,,uint256 ticketPriceCap,,) = ticketFactory.getTicketCategory(ticketCategoryId);
        require( price <= ticketPriceCap, "Price listing is over price cap!");
        _;
    }

    // modifier to ensure ticket is listed
    modifier isListed(uint256 ticketId){
        require(listedTickets[ticketId] != 0, "Ticket not listed!");
        _;
    }

    //event to list successfully
    event ticketListed(uint256 ticketId);

    //event to unlist successfully
    event ticketUnlisted(uint256 ticketId);

    // // event to buy successfully
    // event ticketBought(uint256 ticketId);

    // event to make offer for ticket (by buyers)
    event offerSubmitted(uint256 ticketId, uint256 offerPrice, address buyerAddress);

    // event to sell ticket to highest offer (by ticket owner)
    event offersSettled(uint256 ticketId, uint256 offerPrice, address buyerAddress);

    // function to list ticket
    function list(uint256 ticketId, uint256 price) public ownerOnly(ticketId) ticketResellable(ticketId) priceExceed(ticketId, price){
        ticketNFT.transferOwnership(ticketId, address(this));
        listedTickets[ticketId] = price;
        emit ticketListed(ticketId);
    }

    // function to unlist ticket
    function unlist(uint ticketId) public ownerOnly(ticketId) isListed(ticketId){
        listedTickets[ticketId] = 0;
        emit ticketUnlisted(ticketId);
    }

    // function to check the price of the ticket
    function checkPrice(uint256 ticketId) public view isListed(ticketId) returns (uint256) {
        return listedTickets[ticketId];
    }

    // function to check the price of the ticket
    function checkHighestBidPrice(uint256 ticketId) public view isListed(ticketId) returns (uint256) {
        require(ticketOfferPresent[ticketId] == true, 'No bids present');
        return ticketHighestBidder[ticketId].offerPrice;
    }

    // // function to buy the ticket 
    // function buy(uint256 ticketId) public payable isListed(ticketId){
    //     require(msg.value >= listedTickets[ticketId], "Insufficient money to buy the ticket");
    //     // transfer money to the prev owner 
    //     address payable recipient = address(uint160(ticketNFT.getPrevOwner(ticketId)));
    //     recipient.transfer(msg.value);
    //     ticketNFT.transferOwnership(ticketId, msg.sender);
    //     emit ticketBought(ticketId);
    // }

    // function for buyers to submit offer for ticket
    function offer(uint256 ticketId) public payable isListed(ticketId) {
        // Make sure that offer price < price cap
        uint256 ticketCategoryId = ticketNFT.getTicketCategory(ticketId);
        (,,,,,uint256 ticketPriceCap,,) = ticketFactory.getTicketCategory(ticketCategoryId);
        require(msg.value <= ticketPriceCap, "Price listing is over price cap!");

        // Check if other offers are present
        if (ticketOfferPresent[ticketId] == true) {

            // Check if bid beats the highest bidder so far
            // If same bid price, offer not registered due to first-come-first-serve for bidding
            uint256 highestPriceSoFar = ticketHighestBidder[ticketId].offerPrice;
            require(msg.value > highestPriceSoFar, "Offer price <= current highest bid price");

            // Return bidding value to previous sender
            address payable bidderAddress = address(ticketHighestBidder[ticketId].offerBidder);
            bidderAddress.transfer(ticketHighestBidder[ticketId].offerPrice);

        // Update offer
        } else {
            ticketOfferPresent[ticketId] = true;
        }

        // Make an offer for ticket
        ticketOffer memory offerToSubmit = ticketOffer(msg.sender, msg.value);
        ticketHighestBidder[ticketId] = offerToSubmit;
        emit offerSubmitted(ticketId, msg.value, msg.sender);
    }

    // function for sellers to settle offer (sell to highest bidder)
    function settleOfffer(uint256 ticketId) public ownerOnly(ticketId) isListed(ticketId) {

        // Require that there are offers for ticket
        require(ticketOfferPresent[ticketId] == true, "No offers to settle");

        // Get details of offer
        ticketOffer memory offerQueried = ticketHighestBidder[ticketId];

        // Transfer bid amount to ticket owner
        address payable tickerOwnerAddress = address(uint160(ticketNFT.getPrevOwner(ticketId)));
        tickerOwnerAddress.transfer(offerQueried.offerPrice);

        // Transfer ownership of ticket
        ticketNFT.transferOwnership(ticketId, offerQueried.offerBidder);

        // Emit successful event
        emit offersSettled(ticketId, offerQueried.offerPrice, offerQueried.offerBidder);
        
        // Delete offer
        delete ticketHighestBidder[ticketId];
        delete ticketOfferPresent[ticketId];
        
    }
}
