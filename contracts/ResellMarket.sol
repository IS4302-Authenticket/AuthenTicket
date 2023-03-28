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
        uint timeStamp;
    }

    // Mapping of TicketID to mapping of offerID to ticketOffer struct
    mapping(uint256 => mapping(uint256 => ticketOffer)) listedTicketOffers;
    
    // Mapping of ticketID to number of offers
    mapping(uint256 => uint256) numTicketOffers;

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
    event offerSubmitted(uint256 offerId, uint256 ticketId, uint256 offerPrice, address buyerAddress);

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
        require(msg.value > 0, "Please offer a bid > 0");
        require(msg.value <= ticketPriceCap, "Price listing is over price cap!");

        // Make an offer for ticket
        uint256 currOfferID = numTicketOffers[ticketId];
        ticketOffer memory offerToSubmit = ticketOffer(msg.sender, msg.value, now);
        listedTicketOffers[ticketId][currOfferID] = offerToSubmit;
        emit offerSubmitted(currOfferID, ticketId, msg.value, msg.sender);
        numTicketOffers[ticketId] += 1;
    }

    // function for sellers to settle offer (sell to highest bidder)
    function settleOfffer(uint256 ticketId) public ownerOnly(ticketId) isListed(ticketId) {

        // Require that there are offers for ticket
        uint256 numTicketOffersForTix = numTicketOffers[ticketId];
        require(numTicketOffersForTix > 0, "No offers to settle");

        // Loop through all offers to find highest offer
        uint256 highestPrice = 0;
        uint256 highestOfferId;
        uint256 highestOfferTimeStamp;

        for (uint256 i = 0; i < numTicketOffersForTix; i++) {
            ticketOffer memory offerQueried = listedTicketOffers[ticketId][i];
            uint256 currOfferPrice = offerQueried.offerPrice;
            uint256 currTimeStamp = offerQueried.timeStamp;

            // If offer price beats highest bidder
            if (currOfferPrice > highestPrice) {
                highestPrice = currOfferPrice;
                highestOfferId = i;
                highestOfferTimeStamp = currTimeStamp;
            
            // If offer price == highest bidder, check timestamp
            } else if (currOfferPrice == highestPrice) {

                // If timestamp earlier, update this to bid winner thus far
                if (currTimeStamp < highestOfferTimeStamp) {
                    highestPrice = currOfferPrice;
                    highestOfferId = i;
                    highestOfferTimeStamp = currTimeStamp;
                
                // If timestamp later, lose bid
                } else {
                    continue;
                }
            
            // If offer price < highest bidder, lose bid
            } else {
                continue;
            }
        }

        // Settle payments, transfer ticket to winner
        for (uint256 i = 0; i < numTicketOffersForTix; i++) {

            // Get details of offer
            ticketOffer memory offerQueried = listedTicketOffers[ticketId][i];
            uint256 bidderOfferPrice = offerQueried.offerPrice;
            address payable bidderAddress = address(offerQueried.offerBidder);

            // If offer is highest bigger
            if (i == highestOfferId) {

                // Transfer bid amount to ticket owner
                address payable recipient = address(uint160(ticketNFT.getPrevOwner(ticketId)));
                recipient.transfer(bidderOfferPrice);

                // Transfer ownership of ticket
                ticketNFT.transferOwnership(ticketId, bidderAddress);

                // Emit successful event
                emit offersSettled(ticketId, bidderOfferPrice, bidderAddress);
            
            // Else refund bid price to bidders
            } else {
                bidderAddress.transfer(bidderOfferPrice);
            }

            // Delete offer
            delete listedTicketOffers[ticketId][i];
            
        }
        // After everything, clear mapping
        numTicketOffers[ticketId] = 0;
    }
}
