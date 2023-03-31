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
    mapping(bytes32 => Ticket) public tickets;

    // Emit event when tickets are sold
    event TicketPurchased(
        bytes32 eventID,
        uint256 ticketCategoryID,
        address ticketOwner,
        uint256 ticketsPurchased
    );

    event TicketMinted(
        bytes32 eventID,
        uint256 ticketCategoryID,
        address ticketOwner,
        bytes32 ticketID
    );

    event TransferredOwnership(
        bytes32 ticketId,
        address newOwner
    );

    // Ticket Token Metadata
    // TODO: confirm attributes
    struct Ticket {
        bytes32 eventID;
        uint256 ticketCategoryID;
        bool isUsed;
        address owner;
        // added variable
        address prevOwner; 
    }

    // NEWWW!!!! modifier for valid ticket
    modifier validTicketId(bytes32 ticketId){
        require(tickets[ticketId].owner != address(0) , "Ticket ID not valid!");
        _;
    }

    // NEW!!!!! modifier for owner only
    modifier ownerOnly(bytes32 ticketId){
        //require(tickets[ticketId].owner == msg.sender, "Wrong Owner!");
        require(tickets[ticketId].owner == tx.origin, "Wrong Owner!");
        _;
    }

    // create a new TicketNFT
    function mintTicket(
        bytes32 eventID,
        uint256 ticketCategoryID,
        address owner
    ) public returns (bytes32) {
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
        bytes32 ticketTokenID = keccak256(abi.encodePacked(eventID, ticketCategoryID, owner, block.timestamp));
        tickets[ticketTokenID] = newTicket;
        ticketFactory.ticketSold(ticketCategoryID);

        // Update mapping of tickets that user has purchased
        mappingCategoryUserTixNum[ticketCategoryID][owner] += 1;

        emit TicketMinted(eventID, ticketCategoryID, owner, ticketTokenID);
       
        return ticketTokenID;
    }

    // Purchase ticket token
    function purchaseTicket(
        address buyer,
        bytes32 eventID,
        uint256 ticketCategoryID,
        uint256 numTicketsPurchased
    ) public returns (bytes32[] memory) {
        (, , , , uint256 remaining, , ,uint256 maxTixPerUser) = ticketFactory.getTicketCategory(ticketCategoryID);

        // Checks before issuing tickets
        require(mappingCategoryUserTixNum[ticketCategoryID][buyer] + numTicketsPurchased <= maxTixPerUser, "Max purchase limit for user reached");
        require(remaining >= numTicketsPurchased, "Not enough tickets remaining");

        // initialize empty array of ticketIds
        bytes32[] memory ticketIds = new bytes32[](numTicketsPurchased);

        // Issue tickets and update remaining tickets
        for (uint256 i = 0 ; i < numTicketsPurchased; i++) {
            bytes32 ticketId = mintTicket(eventID, ticketCategoryID, buyer);
            ticketIds[i] = ticketId;
        }

        // Emit event for successful ticket purchase
        emit TicketPurchased(eventID, ticketCategoryID, msg.sender, numTicketsPurchased);
        return ticketIds;
    }

    // NEWWW!!!! transfer function
    function transferOwnership(bytes32 ticketId,address newOwner) public ownerOnly(ticketId) validTicketId(ticketId){
        tickets[ticketId].prevOwner = tickets[ticketId].owner;
        tickets[ticketId].owner = newOwner;
        emit TransferredOwnership(ticketId, newOwner);
    }

    // NEW!!!!!! getter functions
    function getTicketEvent(bytes32 ticketId) public view validTicketId(ticketId) returns(bytes32){
        return tickets[ticketId].eventID;
    }

    function getTicketCategory(bytes32 ticketId) public view validTicketId(ticketId) returns (uint256){
        return tickets[ticketId].ticketCategoryID;
    }

    function getTicketStatus(bytes32 ticketId) public view validTicketId(ticketId) returns (bool){
        return tickets[ticketId].isUsed;
    }

    function getTicketOwner(bytes32 ticketId) public view validTicketId(ticketId) returns (address){
        return tickets[ticketId].owner;
    }

    function getPrevOwner(bytes32 ticketId) public view validTicketId(ticketId) returns (address){
        return tickets[ticketId].prevOwner;
    }

}