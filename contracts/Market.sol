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
    mapping(bytes32 => string) listEventName;  

    constructor(TicketFactory ticketFactory, TicketNFT ticket, User user, Event newEvent) public {
        ticketFactoryContract = ticketFactory;
        ticketContract = ticket;
        userContract = user;
        eventContract = newEvent;
    }

    // Modifier to ensure function only callable by event owner (which should be an organiser) 
    modifier eventOwnerOnly(bytes32 eventId) {
        require(eventContract.checkEventOwner(eventId, msg.sender) == true, "Sender is not event owner");
        require(userContract.checkOrganiser(msg.sender) == true, "Owner is not an organizer");
        _;
    }

    // Modifier to ensure event is listed before listing tickets
    modifier listedEvent(bytes32 eventId) {
        require(bytes(listEventName[eventId]).length != 0, "Event is not listed");
        _;
    }

    // event to list event successfully
    event EventListed(bytes32 eventId);

    // event to unlist event successfully
    event EventUnlisted(bytes32 eventId);

    // event to list ticket successfully
    event TicketListed(uint256 ticketCategoryId, uint256 ticketPrice);

    // event to unlist ticket successfully
    event TicketUnlisted(uint256 ticketCategoryId);

    // event to refund ticket successfully
    event TicketRefunded(bytes32 ticketId);

    //event to buy ticket successfully 
    event TicketBought(uint256 ticketCategoryId, uint256 numTickets);

    // Listing and unlisting event
    function listEvent(bytes32 eventId) eventOwnerOnly(eventId) public {
        listEventName[eventId] = eventContract.getEventName(eventId);
        emit EventListed(eventId);
    }

    function unlistEvent(bytes32 eventId) eventOwnerOnly(eventId) public {
        listEventName[eventId] = "";
        emit EventUnlisted(eventId);
    }

    function listTicket(bytes32 eventId, uint256 ticketCategoryId) eventOwnerOnly(eventId) listedEvent(eventId) public {
        (, , uint256 ticketPrice, , , ,,) = ticketFactoryContract.getTicketCategory(ticketCategoryId);
        listPrice[ticketCategoryId] = ticketPrice;
        emit TicketListed(ticketCategoryId, ticketPrice);
    }

    function unlistTicket(bytes32 eventId, uint256 ticketCategoryId) eventOwnerOnly(eventId) public {
       listPrice[ticketCategoryId] = 0;
       emit TicketUnlisted(ticketCategoryId);
    }


    // Buy tickets
    function buyTickets(bytes32 eventId, uint256 ticketCategoryId, uint256 numTickets) public payable returns(bytes32[] memory) {
        // Mint tickets
        require(listPrice[ticketCategoryId] != 0, "Ticket is not listed");
        require(msg.value == listPrice[ticketCategoryId] * numTickets, "Incorrect amount of ether sent");
        //bytes32[] memory ticketIds = ticketContract.purchaseTicket(msg.sender, eventId, ticketCategoryId, numTickets);
        bytes32[] memory ticketIds = ticketContract.purchaseTicket(tx.origin, eventId, ticketCategoryId, numTickets);

        emit TicketBought(ticketCategoryId, numTickets);        
        return ticketIds;
        /*
        address recepient = address(this);
        address payable recepient2 = address(uint160(recepient));
        recepient2.transfer(msg.value);
        //address payable recipient = address(uint160(address(this)));  
        //recipient.transfer(msg.value);

        for (uint256 i = 0; i < ticketIds.length; i++) {
            bytes32 ticketId = ticketIds[i];
            //ticketContract.transferOwnership(ticketId, msg.sender);
            ticketContract.transferOwnership(ticketId, tx.origin);
        }
        emit TicketBought(ticketCategoryId, numTickets);
        return ticketIds;*/
    }


    // Refund tickets
    function refundTickets(bytes32 ticketId) public payable {
        // Refund buyer and transfer ticket
        address payable recipient = address(uint160(ticketContract.getTicketOwner(ticketId)));
        recipient.transfer(msg.value);
        ticketContract.transferOwnership(ticketId, address(this));
        
        // Update remaining tickets
        uint256 ticketCategoryId = ticketContract.getTicketCategory(ticketId);
        ticketFactoryContract.ticketRefund(ticketCategoryId);
        emit TicketRefunded(ticketId);
    }


    // Check price of ticket
    function checkPrice(uint256 ticketCategoryId) public view returns (uint256) {
        require(listPrice[ticketCategoryId] != 0, "Ticket is not listed");
        return listPrice[ticketCategoryId];
    }

}