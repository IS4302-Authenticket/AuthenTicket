pragma solidity ^0.5.0;

import "./Tickets/TicketNFT.sol";
import "./Tickets/TicketFactory.sol";
import "./User.sol";

// ticket will have to transfer ownership to market?....

contract ResellMarket{

    TicketNFT ticketNFT;
    TicketFactory ticketFactory;
    User user;
    // mapping of TicketID to the price of the Ticket
    mapping(bytes32 => uint256) listedTickets;

    constructor(TicketNFT ticketContract, TicketFactory ticketFactoryContract, User userContract) public {
        ticketNFT = ticketContract;
        ticketFactory = ticketFactoryContract;
        user = userContract;
    }

    // modifier to see if the ticket is used
    modifier ticketResellable(bytes32 ticketId){
        require(ticketNFT.getTicketStatus(ticketId) == false, "Ticket is already used. Cannot be listed");
        uint256 ticketCategoryId = ticketNFT.getTicketCategory(ticketId);
        (,,,,,,bool isTicketResellable,) = ticketFactory.getTicketCategory(ticketCategoryId);
        require(isTicketResellable == true, "Ticket category is not resellable, ticket cannot be listed");
        _;
    }

    // modifier to ensure function only callable by owner (which should be an user) 
    modifier ownerOnly(bytes32 ticketId){
        //address prevOwnerAddress = ticketNFT.getPrevOwner(ticketId);
        //require(prevOwnerAddress == tx.origin, "Wrong owner");
        address owner = ticketNFT.getTicketOwner(ticketId);
        require(owner == tx.origin, "Wrong owner");
        require(user.checkUser(owner) == true, "User is not a consumer! Cannot list in resell market");
        _;
    }

    // modifier to ensure price listed do not exceed max price
    modifier priceExceed(bytes32 ticketId, uint256 price){
        uint256 ticketCategoryId = ticketNFT.getTicketCategory(ticketId);
        (,,,,,uint256 ticketPriceCap,,) = ticketFactory.getTicketCategory(ticketCategoryId);
        require( price <= ticketPriceCap, "Price listing is over price cap!");
        _;
    }

    // modifier to ensure ticket is listed
    modifier isListed(bytes32 ticketId){
        require(listedTickets[ticketId] != 0, "Ticket not listed!");
        _;
    }

    //event to list successfully
    event ticketListed(bytes32 ticketId);

    //event to unlist successfully
    event ticketUnlisted(bytes32 ticketId);

    // event to buy successfully
    event ticketBought(bytes32 ticketId);

    // function to list ticket
    function list(bytes32 ticketId, uint256 price) public ownerOnly(ticketId) ticketResellable(ticketId) priceExceed(ticketId, price){
        listedTickets[ticketId] = price;
        emit ticketListed(ticketId);
    }

    // function to unlist ticket
    function unlist(bytes32 ticketId) public ownerOnly(ticketId) isListed(ticketId){
        listedTickets[ticketId] = 0;
        emit ticketUnlisted(ticketId);
    }

    // function to check the price of the ticket
    function checkPrice(bytes32 ticketId) public view isListed(ticketId) returns (uint256) {
        return listedTickets[ticketId];
    }

    // function to buy the ticket 
    function buy(bytes32 ticketId) public payable isListed(ticketId){
        require(msg.value >= listedTickets[ticketId], "Insufficient money to buy the ticket");
        // transfer money to the prev owner 
        //address payable recipient = address(uint160(ticketNFT.getPrevOwner(ticketId)));
        address payable recipient = address(uint160(ticketNFT.getTicketOwner(ticketId)));
        recipient.transfer(msg.value);
        ticketNFT.transferOwnershipResell(ticketId, tx.origin);
        emit ticketBought(ticketId);
    }
}