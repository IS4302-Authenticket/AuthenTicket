pragma solidity ^0.5.0;

import "./User.sol";
import "./Event.sol";

contract Ticket {

    User userContract;
    Event eventContract;

    // Constructor that takes in event address
    constructor(User userAddress, Event eventAddress) public {
        userContract = userAddress;
        eventContract = eventAddress;
    }

    // Mapping of event ID to mapping of Zone Name to uniqueZoneTicket struct
    mapping(bytes32 => mapping(string => uniqueZoneTicket)) public ticketMappings;

    // Struct to store ticket zone information
    struct uniqueZoneTicket {
        // To do: Add more attributes to tickets
        uint256 zoneCapacity; // Max number of tickets in zone
        uint256 zonePrice; // Issue price for tickets in zone
        // uint256 ticketExpiry; // Expiry date for tickets
        uint256 priceCap; // Max price ceiling for tickets
    }

    // Events to be emitted
    event ZoneDetailsAdded(address organiser, bytes32 eventID, string zoneName);
    event ZoneCapacityDecreased(
        uint256 eventID, 
        string zoneName, 
        uint256 zoneCapacityDecreased,
        uint256 zoneCapacityAfter
    );

    /**
     * @dev Function for event organisers to add zone details
     * NOTE: If zone is already present, then input will overwrite existing zone details
     */
    function addZoneDetails(
        bytes32 eventID,
        string memory zoneNameInput,
        uint256 zoneCapacityInput,
        uint256 zonePriceInput,
        uint256 priceCapInput
    ) public returns(bool) {

        // Check that msg.sender is event organiser
        require(eventContract.checkEventOwner(eventID, msg.sender), "Not event organiser");

        // Create a new uniqueZoneTicketStruct
        uniqueZoneTicket memory newZoneTicket = uniqueZoneTicket(
            zoneCapacityInput,
            zonePriceInput,
            priceCapInput
        );

        // Add zone details
        ticketMappings[eventID][zoneNameInput] = newZoneTicket;

        // Emit event
        emit ZoneDetailsAdded(msg.sender, eventID, zoneNameInput);

        return true;
    }

    // Getter function to get zone price
    function getZonePrice(bytes32 eventID, string memory zoneName) public view returns(uint256) {
        uniqueZoneTicket memory zoneTicketQueried = ticketMappings[eventID][zoneName];
        return zoneTicketQueried.zonePrice;
    }

    // Getter function to get zone capacity
    function getZoneCapacity(bytes32 eventID, string memory zoneName) public view returns(uint256) {
        uniqueZoneTicket memory zoneTicketQueried = ticketMappings[eventID][zoneName];
        return zoneTicketQueried.zoneCapacity;
    }

    // Getter function to get zone price cap
    function getZonePriceCap(bytes32 eventID, string memory zoneName) public view returns(uint256) {
        uniqueZoneTicket memory zoneTicketQueried = ticketMappings[eventID][zoneName];
        return zoneTicketQueried.priceCap;
    }

    // Function to decrease zoneCapacity as tickets are sold (TO BE WORKED ON)
    function decreaseZoneCapacity(
        // uint256 eventID,
        // string memory zoneName,
        // uint256 zoneCapacityDecrease
    ) public pure returns(bool) {

        return true;
        // // Emit event
        // emit ZoneCapacityDecreased();
    }

}