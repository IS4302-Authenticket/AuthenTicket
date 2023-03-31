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

    // Modifier to ensure function is called by organisers
    modifier organisersOnly() {
        require(userContractInstance.checkOrganiser(msg.sender) == true);
        _;
    }

    // Function to create event
    function createEvent(string memory eventNameInput, uint256 eventMaxCapacityInput) organisersOnly public {
        uint256 eventID = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender)));
        uniqueEvent memory newEvent = uniqueEvent(msg.sender, eventID, eventNameInput, eventMaxCapacityInput, 0);
        eventIdMappings[eventID] = newEvent;
        emit EventCreated(msg.sender, eventID);
    }

    // Function to update EventCapacityOccupied
    function updateEventCapacityOccupied(uint256 eventID, uint256 capacityIncreased) organisersOnly public {

        // Require that only organiser of particular event can update occupancy
        uniqueEvent memory eventQueried = eventIdMappings[eventID];
        require(tx.origin == eventQueried.eventOrganiser, 'Caller not organiser of particular event ID');

        // Check that adding event capacity wont exceed maxCapacity
        uint256 currentEventCapacityOccupied = eventQueried.eventCapacityOccupied;
        uint256 newEventCapacityOccupied = currentEventCapacityOccupied + capacityIncreased;
        require(newEventCapacityOccupied <= eventQueried.eventMaxCapacity, "Cannot update event capacity (new capacity > max capacity)");

        // Update mapping for event
        eventIdMappings[eventID].eventCapacityOccupied = newEventCapacityOccupied;

        // Emit event
        emit EventCapacityOccupiedUpdated(eventID, capacityIncreased, newEventCapacityOccupied);
    }
    
    // Getter function to check if organiserAddress is event owner of eventID
    function checkEventOwner(uint256 eventID, address organiserAddress) public view returns(bool) {
        uniqueEvent memory eventQueried = eventIdMappings[eventID];
        return (eventQueried.eventOrganiser == organiserAddress);
    }

    // Getter function to get eventName for given eventID
    function getEventName(uint256 eventID) public view returns(string memory) {
        uniqueEvent memory eventQueried = eventIdMappings[eventID];
        return eventQueried.eventName; 
    }

    // Getter function to get eventCapacityOccupied for given eventID
    function getEventCapacityOccupied(uint256 eventID) public view returns(uint256) {
        uniqueEvent memory eventQueried = eventIdMappings[eventID];
        return eventQueried.eventCapacityOccupied; 
    }

    // Getter function to get eventMaxCapacity for given eventID
    function getEventMaxCapacity(uint256 eventID) public view returns(uint256) {
        uniqueEvent memory eventQueried = eventIdMappings[eventID];
        return eventQueried.eventMaxCapacity; 
    }

}