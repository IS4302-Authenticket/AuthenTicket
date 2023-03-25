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

    // Mapping of ticketCategoryId to ticketPrice
    mapping(uint256 => uint256) listPrice; 

    // Mapping of eventId to eventName
    mapping(uint256 => string) listEventName;  

    constructor(TicketFactory ticketFactory, TicketNFT ticket, User user, Event newEvent) public {
        ticketFactoryContract = ticketFactory;
        ticketContract = ticket;
        userContract = user;
        eventContract = newEvent;
    }

    // // Modifier to ensure function only callable by ticket owner (which should be an organiser) 
    // modifier ownerOnly(uint256 ticketId) {
    //     address prevOwnerAddress = ticketContract.getPrevOwner(ticketId);
    //     require(prevOwnerAddress == msg.sender, "Sender is not ticket owner");
    //     require(userContract.checkOrganiser(msg.sender) == true, "Owner is not an organizer");
    //     _;
    // }

    // Modifier to ensure function only callable by event owner (which should be an organiser) 
    modifier eventOwnerOnly(uint256 eventId) {
        require(eventContract.checkEventOwner(eventId, msg.sender) == true, "Sender is not event owner");
        require(userContract.checkOrganiser(msg.sender) == true, "Owner is not an organizer");
        _;
    }

    // Modifier to ensure event is listed before listing tickets
    modifier listedEvent(uint256 eventId) {
        require(bytes(listEventName[eventId]).length != 0, "Event is not listed");
        _;
    }

    // event to list event successfully
    event EventListed(uint256 eventId);

    // event to unlist event successfully
    event EventUnlisted(uint256 eventId);

    // event to list ticket successfully
    event TicketListed(uint256 ticketCategoryId);

    // event to unlist ticket successfully
    event TicketUnlisted(uint256 ticketCategoryId);

    // event to refund ticket successfully
    event TicketRefunded(uint ticketId);


    // Listing and unlisting event
    function listEvent(uint256 eventId) eventOwnerOnly(eventId) public {
        listEventName[eventId] = eventContract.getEventName(eventId);
        emit EventListed(eventId);
    }

    function unlistEvent(uint256 eventId) eventOwnerOnly(eventId) public {
        listEventName[eventId] = "";
        emit EventUnlisted(eventId);
    }


    // List and unlisting ticket
    // function listTicket(uint256 ticketId) ownerOnly(ticketId) listedEvent(ticketId) public {
    //     uint256 ticketCategoryId = ticketContract.getTicketCategory(ticketId);
    //     (, , uint256 ticketPrice, , , ,,) = ticketFactoryContract.getTicketCategory(ticketCategoryId);
    //     listPrice[ticketId] = ticketPrice;
    //     emit TicketListed(ticketId);
    // }

    function listTicket(uint256 eventId, uint256 ticketCategoryId) eventOwnerOnly(eventId) listedEvent(eventId) public {
        (, , uint256 ticketPrice, , , ,,) = ticketFactoryContract.getTicketCategory(ticketCategoryId);
        listPrice[ticketCategoryId] = ticketPrice;
        emit TicketListed(ticketCategoryId);
    }

    function unlistTicket(uint256 eventId, uint256 ticketCategoryId) eventOwnerOnly(eventId) public {
       listPrice[ticketCategoryId] = 0;
       emit TicketUnlisted(ticketCategoryId);
    }


    // Buy tickets
    function buyTickets(uint256 eventId, uint256 ticketCategoryId, uint256 numTickets) public payable returns(uint256) {
        require(listPrice[ticketCategoryId] != 0, "Ticket is not listed");
        uint256 ticketId = ticketContract.purchaseTicket(eventId, ticketCategoryId, numTickets);        

        // Update remaining tickets
        for (int i = 0; i < int(numTickets); i++) {
            ticketFactoryContract.ticketSold(ticketCategoryId); 
        }

        address payable recipient = address(uint160(ticketContract.getTicketOwner(ticketId)));  
        recipient.transfer(msg.value);
        ticketContract.transferOwnership(ticketId, msg.sender);

        // Unlist tickets for a category if a catgory is sold out
        (, , , , uint256 newRemaining, , ,) = ticketFactoryContract.getTicketCategory(ticketCategoryId);
        if (newRemaining == 0) {
            unlistTicket(eventId, ticketCategoryId);
        }
        return ticketId;
    }


    // Refund tickets
    function refundTickets(uint256 ticketId) public payable {
        address payable recipient = address(uint160(ticketContract.getPrevOwner(ticketId)));
        recipient.transfer(msg.value);
        ticketContract.transferOwnership(ticketId, address(this));
        uint256 ticketCategoryId = ticketContract.getTicketCategory(ticketId);
        uint256 eventId = ticketContract.getTicketEvent(ticketId);
        ticketFactoryContract.ticketRefund(ticketCategoryId);
        listTicket(eventId, ticketCategoryId);
        emit TicketRefunded(ticketId);
    }


    // Check price of ticket
    function checkPrice(uint256 ticketCategoryId) public view returns (uint256) {
        require(listPrice[ticketCategoryId] != 0, "Ticket is not listed");
        return listPrice[ticketCategoryId];
    }

}