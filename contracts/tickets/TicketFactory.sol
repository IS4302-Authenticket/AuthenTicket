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
        bytes32 eventID;
        string categoryName;
        uint256 ticketPrice;
        uint256 totalSupply;
        uint256 remaining;
        uint256 priceCap;
        bool isResellable;
        uint256 maxTixPerUser;
    }

    mapping(bytes32 => TicketCategory) public ticketCategories;

    event TicketCreated(bytes32 ticketCategory, uint256 ticketPrice);

    // Modifier to ensure function is called by authorised organisers
    modifier organisersOnly() {
        //require(userContractInstance.checkOrganiser(msg.sender) == true, "msg.sender not organiser");
        require(
            userContractInstance.checkOrganiser(tx.origin) == true,
            "msg.sender not organiser"
        );

        _;
    }

    function createTicketCategory(
        bytes32 eventID,
        string memory categoryName,
        uint256 ticketPrice,
        uint256 totalSupply,
        uint256 priceCap,
        bool isResellable,
        uint256 maxTixPerUser
    ) public organisersOnly returns (bytes32) {
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
        uint256 currCapacityOccupied = eventContractInstance
            .getEventCapacityOccupied(eventID);
        uint256 maxCapacityOccupied = eventContractInstance.getEventMaxCapacity(
            eventID
        );
        require(
            (currCapacityOccupied + totalSupply) <= maxCapacityOccupied,
            "Cannot create ticket category: total supply > max supply"
        );

        // create ticket category ID
        bytes32 ticketCategoryID = keccak256(
            abi.encodePacked(eventID, categoryName)
        );
        ticketCategories[ticketCategoryID] = newTicketCategory;

        // Update event capacity occupied from event contract
        eventContractInstance.updateEventCapacityOccupied(eventID, totalSupply);

        //emit event
        emit TicketCreated(ticketCategoryID, ticketPrice);
        return ticketCategoryID;
    }

    modifier validTicketCategory(bytes32 id) {
        require(
            ticketCategories[id].eventID > 0,
            "Ticket category does not exist"
        );
        _;
    }

    function getTicketCategory(
        bytes32 id
    )
        public
        view
        validTicketCategory(id)
        returns (
            bytes32,
            string memory,
            uint256,
            uint256,
            uint256,
            uint256,
            bool,
            uint256
        )
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

    function ticketSold(
        bytes32 categoryId
    ) public validTicketCategory(categoryId) {
        ticketCategories[categoryId].remaining -= 1;
    }

    function ticketRefund(
        bytes32 categoryId
    ) public validTicketCategory(categoryId) {
        ticketCategories[categoryId].remaining += 1;
    }
}
