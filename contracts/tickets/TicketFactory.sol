pragma solidity ^0.5.0;

import "../User.sol";
import "../Event.sol";

contract TicketFactory {
    User userContractInstance;
    Event eventContractInstance;

    constructor(User userAddress, Event eventAddress) public {
        userContractInstance = userAddress;
        eventContractInstance = eventAddress;
    }

    struct TicketCategory {
        uint256 eventID;
        string categoryName;
        uint256 ticketPrice;
        uint256 totalSupply;
        uint256 remaining;
        uint256 priceCap;
        bool isResellable;
        uint256 maxTixPerUser;
    }

    mapping(uint256 => TicketCategory) public ticketCategories;
    uint256 ticketCategoryID = 0;

    function createTicketCategory(
        uint256 eventID,
        string memory categoryName,
        uint256 ticketPrice,
        uint256 totalSupply,
        uint256 priceCap,
        bool isResellable,
        uint256 maxTixPerUser
    ) public returns (uint256) {

        // Create TicketCategory
        TicketCategory memory newTicketCategory = TicketCategory(
            eventID,
            categoryName,
            ticketPrice,
            totalSupply,
            totalSupply,
            priceCap,
            isResellable,
            maxTixPerUser
        );

        // Check if adding ticket supply from this category will exceed event maxCapacity
        uint256 currCapacityOccupied = eventContractInstance.getEventCapacityOccupied(eventID);
        uint256 maxCapacityOccupied = eventContractInstance.getEventMaxCapacity(eventID);
        require((currCapacityOccupied + totalSupply) <= maxCapacityOccupied, 'Cannot create ticket category: total supply > max supply');
        
        //uint256 ticketCategoryID = uint256(keccak256(abi.encodePacked(eventID, categoryName, ticketPrice, priceCap, isResellable)));
        ticketCategories[ticketCategoryID] = newTicketCategory;
        ticketCategoryID++;

        // Update event capacity occupied from event contract
        eventContractInstance.updateEventCapacityOccupied(eventID, totalSupply);

        return ticketCategoryID;
    }

    modifier validTicketCategory(uint256 id) {
        require(ticketCategories[id].eventID > 0, "Ticket category does not exist");
        _;
    }

    function getTicketCategory(uint256 id) validTicketCategory(id) public view returns (
        uint256, 
        string memory, 
        uint256, 
        uint256, 
        uint256, 
        uint256, 
        bool,
        uint256)
    {
        TicketCategory memory ticketCategory = ticketCategories[id];
        return (
            ticketCategory.eventID, 
            ticketCategory.categoryName, 
            ticketCategory.ticketPrice, 
            ticketCategory.totalSupply, 
            ticketCategory.remaining, 
            ticketCategory.priceCap, 
            ticketCategory.isResellable,
            ticketCategory.maxTixPerUser
        );
    }

    function ticketSold(uint256 categoryId) validTicketCategory(categoryId) public {
        ticketCategories[categoryId].remaining -= 1;
    }

    function ticketRefund(uint256 categoryId) validTicketCategory(categoryId) public {
        ticketCategories[categoryId].remaining += 1;
    }

}