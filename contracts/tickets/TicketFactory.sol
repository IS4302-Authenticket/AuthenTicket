pragma solidity ^0.5.0;

contract TicketFactory {
    address userContractAddress;
    address eventContractAddress;

    constructor(address userAddress, address eventAddress) public {
        userContractAddress = userAddress;
        eventContractAddress = eventAddress;
    }

    struct TicketCategory {
        uint256 eventID;
        string categoryName;
        uint256 ticketPrice;
        uint256 totalSupply;
        uint256 remaining;
        uint256 priceCap;
        bool isResellable;
    }

    mapping(uint256 => TicketCategory) public ticketCategories;
    uint256 ticketCategoryID = 0;

    function createTicketCategory(
        uint256 eventID,
        string memory categoryName,
        uint256 ticketPrice,
        uint256 totalSupply,
        uint256 priceCap,
        bool isResellable
    ) public returns (uint256) {
        TicketCategory memory newTicketCategory = TicketCategory(
            eventID,
            categoryName,
            ticketPrice,
            totalSupply,
            totalSupply,
            priceCap,
            isResellable
        );

        //uint256 ticketCategoryID = uint256(keccak256(abi.encodePacked(eventID, categoryName, ticketPrice, priceCap, isResellable)));
        ticketCategories[ticketCategoryID] = newTicketCategory;
        ticketCategoryID++;

        return ticketCategoryID;
    }

    modifier validTicketCategory(uint256 id) {
        require(ticketCategories[id].eventID > 0, "Ticket category does not exist");
        _;
    }

    function getTicketCategory(uint256 id) validTicketCategory(id) public view returns (uint256, string memory, uint256, uint256, uint256, uint256, bool) {
        TicketCategory memory ticketCategory = ticketCategories[id];
        return (ticketCategory.eventID, ticketCategory.categoryName, ticketCategory.ticketPrice, ticketCategory.totalSupply, ticketCategory.remaining, ticketCategory.priceCap, ticketCategory.isResellable);
    }

    function ticketSold(uint256 categoryId) validTicketCategory(categoryId) public {
        ticketCategories[categoryId].remaining -= 1;
    }

    function ticketRefund(uint256 categoryId) validTicketCategory(categoryId) public {
        ticketCategories[categoryId].remaining += 1;
    }

}