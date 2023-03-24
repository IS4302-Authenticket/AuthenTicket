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

    // Mapping of Categories -> User -> Number of tickets
    mapping(uint256 => mapping(address => uint256)) mappingCategoryUserTixNum;
    // track ticket tokens
    mapping(uint256 => Ticket) public tickets;

    // Emit event when tickets are sold
    event TicketPurchased(
        uint256 eventID,
        uint256 ticketCategoryID,
        address ticketOwner,
        uint256 ticketsPurchased
    );

    // Ticket Token Metadata
    // TODO: confirm attributes
    struct Ticket {
        uint256 eventID;
        uint256 ticketCategoryID;
        bool isUsed;
        address owner;
        // added variable
        address prevOwner; 
    }

    // NEWWW!!!! modifier for valid ticket
    modifier validTicketId(uint256 ticketId){
        require(tickets[ticketId].owner != address(0) , "Ticket ID not valid!");
        _;
    }

    // NEW!!!!! modifier for owner only
    modifier ownerOnly(uint ticketId){
        require(tickets[ticketId].owner == msg.sender, "Wrong Owner!");
        _;
    }

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
            owner,
             // new variable
            address(0)
        );

        // validate ticket categories 
        require(ticketCategoryID > 0, "ticketCategoryID must be more than 0");
        
        //obtain unique hash value to use as key
        uint256 ticketTokenID = uint256(keccak256(abi.encodePacked(eventID, ticketCategoryID, owner, block.timestamp)));
        tickets[ticketTokenID] = newTicket;
        //ticketFactory.ticketSold(ticketCategoryID);

        // Update mapping of tickets that user has purchased
        mappingCategoryUserTixNum[ticketCategoryID][owner] += 1;

        return ticketTokenID;
    }

    // Purchase ticket token
    function purchaseTicket(
        uint256 eventID,
        uint256 ticketCategoryID,
        uint256 numTicketsPurchased
    ) public payable returns (uint256) {
        (, , uint256 ticketPrice, , uint256 remaining, , ,uint256 maxTixPerUser) = ticketFactory.getTicketCategory(ticketCategoryID);

        // Checks before issuing tickets
        require(mappingCategoryUserTixNum[ticketCategoryID][msg.sender] + numTicketsPurchased <= maxTixPerUser, "Max purchase limit for user reached");
        require(msg.value == ticketPrice * numTicketsPurchased, "Incorrect amount sent");
        require(remaining >= numTicketsPurchased, "Not enough tickets remaining");

        // Issue tickets
        for (uint256 i = 0 ; i < numTicketsPurchased; i++) {
            mintTicket(eventID, ticketCategoryID, msg.sender);
        }
        
        // Emit event for successful ticket purchase
        emit TicketPurchased(eventID, ticketCategoryID, msg.sender, numTicketsPurchased);
    }

    // NEWWW!!!! transfer function
    function transferOwnership(uint ticketId,address newOwner) public ownerOnly(ticketId) validTicketId(ticketId){
        tickets[ticketId].prevOwner = tickets[ticketId].owner;
        tickets[ticketId].owner = newOwner;
    }

    // NEW!!!!!! getter functions
    function getTicketEvent(uint256 ticketId) public view validTicketId(ticketId) returns(uint256){
        return tickets[ticketId].eventID;
    }

    function getTicketCategory(uint256 ticketId) public view validTicketId(ticketId) returns (uint256){
        return tickets[ticketId].ticketCategoryID;
    }

    function getTicketStatus(uint ticketId) public view validTicketId(ticketId) returns (bool){
        return tickets[ticketId].isUsed;
    }

    function getTicketOwner(uint ticketId) public view validTicketId(ticketId) returns (address){
        return tickets[ticketId].owner;
    }

    function getPrevOwner(uint ticketId) public view validTicketId(ticketId) returns (address){
        return tickets[ticketId].prevOwner;
    }

}