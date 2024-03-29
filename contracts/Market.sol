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
    mapping(bytes32 => uint256) listPrice;

    // Mapping of eventId to eventName
    mapping(bytes32 => string) listEventName;

    constructor(
        TicketFactory ticketFactory,
        TicketNFT ticket,
        User user,
        Event newEvent
    ) public {
        ticketFactoryContract = ticketFactory;
        ticketContract = ticket;
        userContract = user;
        eventContract = newEvent;
    }

    // Modifier to ensure function only callable by event owner (which should be an organiser)
    modifier eventOwnerOnly(bytes32 eventId) {
        require(
            eventContract.checkEventOwner(eventId, msg.sender) == true,
            "Sender is not event owner"
        );
        require(
            userContract.checkOrganiser(msg.sender) == true,
            "Owner is not an organizer"
        );
        _;
    }

    // Modifier to ensure event is listed before listing tickets
    modifier listedEvent(bytes32 eventId) {
        require(
            bytes(listEventName[eventId]).length != 0,
            "Event is not listed"
        );
        _;
    }

    // event to list event successfully
    event EventListed(bytes32 eventId);

    // event to unlist event successfully
    event EventUnlisted(bytes32 eventId);

    // event to list ticket successfully
    event TicketListed(bytes32 ticketCategoryId, uint256 ticketPrice);

    // event to unlist ticket successfully
    event TicketUnlisted(bytes32 ticketCategoryId);

    // event to refund ticket successfully
    event TicketRefunded(bytes32 ticketId);

    //event to buy ticket successfully
    event TicketBought(
        bytes32 ticketIdFirst,
        bytes32 ticketCategoryId,
        uint256 numTickets,
        address buyer
    );

    // Listing and unlisting event
    function listEvent(bytes32 eventId) public eventOwnerOnly(eventId) {
        listEventName[eventId] = eventContract.getEventName(eventId);
        emit EventListed(eventId);
    }

    function unlistEvent(bytes32 eventId) public eventOwnerOnly(eventId) {
        listEventName[eventId] = "";
        emit EventUnlisted(eventId);
    }

    function listTicket(
        bytes32 eventId,
        bytes32 ticketCategoryId
    ) public eventOwnerOnly(eventId) listedEvent(eventId) {
        (, , uint256 ticketPrice, , , , , ) = ticketFactoryContract
            .getTicketCategory(ticketCategoryId);
        listPrice[ticketCategoryId] = ticketPrice;
        emit TicketListed(ticketCategoryId, ticketPrice);
    }

    function unlistTicket(
        bytes32 eventId,
        bytes32 ticketCategoryId
    ) public eventOwnerOnly(eventId) {
        listPrice[ticketCategoryId] = 0;
        emit TicketUnlisted(ticketCategoryId);
    }

    // Buy tickets
    function buyTickets(
        bytes32 eventId,
        bytes32 ticketCategoryId,
        uint256 numTickets
    ) public payable returns (bytes32[] memory) {
        // Mint tickets
        require(listPrice[ticketCategoryId] != 0, "Ticket is not listed");
        require(
            msg.value == listPrice[ticketCategoryId] * numTickets,
            "Incorrect amount of ether sent"
        );
        bytes32[] memory ticketIds = ticketContract.purchaseTicket(
            tx.origin,
            eventId,
            ticketCategoryId,
            numTickets
        );

        bytes32 ticketIdFirst = ticketIds[0];
        address owner = ticketContract.getTicketOwner(ticketIdFirst);
        emit TicketBought(ticketIdFirst, ticketCategoryId, numTickets, owner);
        return ticketIds;
    }

    // Refund tickets
    function refundTickets(bytes32 ticketId) public payable {
        // ticket owner only
        require(
            ticketContract.getTicketOwner(ticketId) == msg.sender,
            "Wrong Owner!"
        );
        // Refund buyer and transfer ticket
        address payable recipient = address(
            uint160(ticketContract.getTicketOwner(ticketId))
        );
        recipient.transfer(msg.value);
        ticketContract.transferOwnership(ticketId, address(this));

        // Update remaining tickets
        bytes32 ticketCategoryId = ticketContract.getTicketCategory(ticketId);
        ticketFactoryContract.ticketRefund(ticketCategoryId);
        emit TicketRefunded(ticketId);
    }

    // Check price of ticket
    function checkPrice(
        bytes32 ticketCategoryId
    ) public view returns (uint256) {
        require(listPrice[ticketCategoryId] != 0, "Ticket is not listed");
        return listPrice[ticketCategoryId];
    }
}
