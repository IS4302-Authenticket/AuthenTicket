pragma solidity ^0.5.0;

import "./User.sol";

contract Event {
    // Instantiate user contract here to ensure that only organisers can create events
    User userContractInstance;
    
    // Mapping of event ID to uniqueEvent struct that contains Event information
    mapping(uint256 => uniqueEvent) public eventIdMappings;

    // Struct to store unique event information
    struct uniqueEvent {
        address eventOrganiser;
        uint256 eventID;
        string eventName;
        uint256 eventMaxCapacity;
        uint256 eventCapacityOccupied;
    }

    constructor (User userContractAddress) public {
        userContractInstance = userContractAddress;
    }

    // Events
    event EventCreated(address organiser, uint256 eventID);
    event EventCapacityOccupiedUpdated(uint256 eventID, uint256 eventCapacityAdded, uint256 eventNewCapacity);

    // Modifier to ensure function is called by authorised organisers
    modifier organisersOnly() {
        //require(userContractInstance.checkOrganiser(msg.sender) == true, "msg.sender not organiser");
        require(userContractInstance.checkOrganiser(tx.origin) == true, "msg.sender not organiser");

        _;
    }

    function createEvent(string memory eventNameInput, uint256 eventMaxCapacityInput) organisersOnly public returns(uint256) {
        uint256 eventID = uint256(keccak256(abi.encodePacked(block.timestamp, tx.origin)));
        //bytes32 hashVal = keccak256(abi.encodePacked(block.timestamp, msg.sender));
        //uint256 eventID = uint256(hashVal);
        //uint256 eventID = uint256(eventMaxCapacityInput);

        uniqueEvent memory newEvent = uniqueEvent(tx.origin, eventID, eventNameInput, eventMaxCapacityInput, 0);
        eventIdMappings[eventID] = newEvent;
        emit EventCreated(tx.origin, eventID);
        return eventID;
    }

    function checkEventOwner(uint256 eventID, address organiserAddress) public view returns(bool) {
        uniqueEvent memory eventQueried = eventIdMappings[eventID];
        return (eventQueried.eventOrganiser == organiserAddress);
    }
    
    // Getters
    function getEventName(uint256 eventID) public view returns(string memory) {
        uniqueEvent memory eventQueried = eventIdMappings[eventID];
        return eventQueried.eventName; 
    }

    function getEventCapacityOccupied(uint256 eventID) public view returns(uint256) {
        uniqueEvent memory eventQueried = eventIdMappings[eventID];
        return eventQueried.eventCapacityOccupied; 
    }

    function getEventMaxCapacity(uint256 eventID) public view returns(uint256) {
        uniqueEvent memory eventQueried = eventIdMappings[eventID];
        return eventQueried.eventMaxCapacity; 
    }
    
    // Setter to update EventCapacityOccupied
    function updateEventCapacityOccupied(uint256 eventID, uint256 capacityIncreased) organisersOnly public {

        // Check that adding event capacity wont exceed maxCapacity
        uint256 currentEventCapacityOccupied = eventIdMappings[eventID].eventCapacityOccupied;
        uint256 newEventCapacityOccupied = currentEventCapacityOccupied + capacityIncreased;
        require(newEventCapacityOccupied <= eventIdMappings[eventID].eventMaxCapacity, "Cannot update event capacity (new capacity > max capacity)");

        // Update mapping for event
        eventIdMappings[eventID].eventCapacityOccupied = newEventCapacityOccupied;

        // Emit event
        emit EventCapacityOccupiedUpdated(eventID, capacityIncreased, newEventCapacityOccupied);
    }

}