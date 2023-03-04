pragma solidity ^0.5.0;

import "../User.sol";
import "../Event.sol";
import "./TicketFactory.sol";

contract TicketNFT {
    User userContract;
    Event eventContract;
    TicketFactory ticketFactory;

    constructor(User userAddress, Event eventAddress, TicketFactory ticketFactoryAddress) public {
        userContract = userAddress;
        eventContract = eventAddress;
        ticketFactory = ticketFactoryAddress;
    }

    // Ticket Token Metadata
    // TODO: confirm attributes
    struct Ticket {
        uint256 eventID;
        uint256 ticketCategoryID;
        bool isUsed;
        address owner;
    }

    // track ticket tokens
    mapping(uint256 => Ticket) public tickets;

    // create a new TicketNFT
    function mintTicket(
        uint256 eventID,
        uint256 ticketCategoryID,
        address owner
    ) public returns (uint256) {
        Ticket memory newTicket = Ticket(
            eventID,
            ticketCategoryID,
            false,
            owner
        );

        uint256 ticketTokenID = uint256(keccak256(abi.encodePacked(eventID, ticketCategoryID, owner, block.timestamp)));
        tickets[ticketTokenID] = newTicket;
        ticketFactory.ticketSold(ticketCategoryID);
        return ticketTokenID;
    }

    // purchase ticket token
    function purchaseTicket(
        uint256 eventID,
        uint256 ticketCategoryID
    ) public payable returns (uint256) {
        (, , uint256 ticketPrice, , uint256 remaining, ,) = ticketFactory.getTicketCategory(ticketCategoryID);
        require(msg.value == ticketPrice, "Incorrect amount sent");
        require(remaining > 0, "No tickets remaining");
        mintTicket(eventID, ticketCategoryID, msg.sender);
    }

}