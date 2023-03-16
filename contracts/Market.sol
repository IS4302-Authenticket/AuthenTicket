pragma solidity ^0.5.0;

import "./tickets/TicketFactory.sol";
import "./tickets/TicketNFT.sol";
import "./User.sol";
import "./Event.sol";

contract Market {

    TicketFactory ticketFactoryContract;
    TicketNFT ticketContract;
    User userContract;
    Event eventContract;

    // Mapping of ticketId to ticketPrice
    mapping(uint256 => uint256) listPrice; 

    // Mapping of eventId to eventName
    mapping(uint256 => string) listEventName;  

    constructor(TicketFactory ticketFactory, TicketNFT ticket, User user, Event newEvent) public {
        ticketFactoryContract = ticketFactory;
        ticketContract = ticket;
        userContract = user;
        eventContract = newEvent;
    }

    // Modifier to ensure function only callable by ticket owner (which should be an organiser) 
    modifier ownerOnly(uint256 ticketId) {
        address prevOwnerAddress = ticketContract.getPrevOwner(ticketId);
        require(prevOwnerAddress == msg.sender, "Sender is not ticket owner");
        require(userContract.checkOrganiser(msg.sender) == true, "Owner is not an organizer");
        _;
    }

    // Modifier to ensure function only callable by event owner (which should be an organiser) 
    modifier eventOwnerOnly(uint256 eventId) {
        require(eventContract.checkEventOwner(eventId, msg.sender) == true, "Sender is not event owner");
        require(userContract.checkOrganiser(msg.sender) == true, "Owner is not an organizer");
        _;
    }

    // Modifier to ensure event is listed before listing tickets
    modifier listedEvent(uint256 ticketId) {
        uint256 eventId = ticketContract.getTicketEvent(ticketId);
        require(bytes(listEventName[eventId]).length != 0, "Event is not listed");
        _;
    }

    // event to list event successfully
    event eventListed(uint256 eventId);

    // event to unlist event successfully
    event eventUnlisted(uint256 eventId);

    // event to list ticket successfully
    event ticketListed(uint256 ticketId);

    // event to unlist ticket successfully
    event ticketUnlisted(uint256 ticketId);

    // event to buy ticket successfully
    event ticketBought(uint ticketId);

    // event to refund ticket successfully
    event ticketRefunded(uint ticketId);


    // Listing and unlisting event
    function listEvent(uint256 eventId) eventOwnerOnly(eventId) public {
        listEventName[eventId] = eventContract.getEventName(eventId);
    }

    function unlistEvent(uint256 eventId) eventOwnerOnly(eventId) public {
        listEventName[eventId] = "";
    }


    // List and unlisting ticket
    function listTicket(uint256 ticketId) ownerOnly(ticketId) listedEvent(ticketId) public {
        uint256 ticketCategoryId = ticketContract.getTicketCategory(ticketId);
        (, , uint256 ticketPrice, , , ,) = ticketFactoryContract.getTicketCategory(ticketCategoryId);
        listPrice[ticketId] = ticketPrice;
        emit ticketListed(ticketId);
    }

    function unlistTicket(uint256 ticketId) ownerOnly(ticketId) public {
       listPrice[ticketId] = 0;
       emit ticketUnlisted(ticketId);
    }


    // Buy tickets
    function buyTickets(uint256 eventId, uint256 ticketCategoryId/*, uint256 numTickets*/) public payable {
        // (, , uint256 ticketPrice, , uint256 remaining, uint256 priceCap, bool isResellable) = ticketFactoryContract.getTicketCategory(ticketCategoryId);
        uint256 ticketId = ticketContract.purchaseTicket(eventId, ticketCategoryId);
        
        require(listPrice[ticketId] != 0, "Ticket is not listed");
        // require(msg.value == ticketPrice * numTickets, "Invalid amount sent");
        // require(remaining >= numTickets, "Not enough tickets available");

        // Update remaining tickets
        // for (int i = 0; i < numTickets; i++) {
        //     ticketFactoryContract.ticketSold(ticketCategoryId); 
        // }

        address payable recipient = address(uint160(ticketContract.getPrevOwner(ticketId)));
        recipient.transfer(msg.value);
        ticketContract.transferOwnership(ticketId, msg.sender);
        unlistTicket(ticketId);
        emit ticketBought(ticketId);
    }


    // Refund tickets
    function refundTickets(uint256 ticketId) public payable {
        address payable recipient = address(uint160(ticketContract.getPrevOwner(ticketId)));
        recipient.transfer(msg.value);
        ticketContract.transferOwnership(ticketId, address(this));
        listTicket(ticketId);
        uint256 ticketCategoryId = ticketContract.getTicketCategory(ticketId);
        ticketFactoryContract.ticketRefund(ticketCategoryId);
        emit ticketRefunded(ticketId);
    }


    // Check price of ticket
    function checkPrice(uint256 ticketId) public view returns (uint256) {
        require(listPrice[ticketId] != 0, "Ticket is not listed");
        return listPrice[ticketId];
    }

}