pragma solidity ^0.5.0;

import "./User.sol";

contract Event {
    // Instantiate user contract here to ensure that only organisers can create events
    User userContractInstance;

    // Mapping of event ID to uniqueEvent struct that contains Event information
    mapping(bytes32 => uniqueEvent) public eventIdMappings;

    // Struct to store unique event information
    struct uniqueEvent {
        address eventOrganiser;
        bytes32 eventID;
        string eventName;
        uint256 eventMaxCapacity;
        uint256 eventCapacityOccupied;
    }

    constructor(User userContractAddress) public {
        userContractInstance = userContractAddress;
    }

    // Events
    event EventCreated(address organiser, bytes32 eventID);
    event EventCapacityOccupiedUpdated(
        bytes32 eventID,
        uint256 eventCapacityAdded,
        uint256 eventNewCapacity
    );

    // Modifier to ensure function is called by organisers
    modifier organisersOnly() {
        //require(userContractInstance.checkOrganiser(msg.sender) == true, "msg.sender not organiser");
        require(
            userContractInstance.checkOrganiser(tx.origin) == true,
            "msg.sender not organiser"
        );
        _;
    }

    function createEvent(
        string memory eventNameInput,
        uint256 eventMaxCapacityInput
    ) public organisersOnly returns (bytes32) {
        bytes32 eventID = keccak256(
            abi.encodePacked(block.timestamp, tx.origin, eventNameInput)
        );

        uniqueEvent memory newEvent = uniqueEvent(
            tx.origin,
            eventID,
            eventNameInput,
            eventMaxCapacityInput,
            0
        );
        eventIdMappings[eventID] = newEvent;
        emit EventCreated(tx.origin, eventID);
        return eventID;
    }

    function checkEventOwner(
        bytes32 eventID,
        address organiserAddress
    ) public view returns (bool) {
        uniqueEvent memory eventQueried = eventIdMappings[eventID];
        return (eventQueried.eventOrganiser == organiserAddress);
    }

    // Getters
    function getEventName(bytes32 eventID) public view returns (string memory) {
        uniqueEvent memory eventQueried = eventIdMappings[eventID];
        return eventQueried.eventName;
    }

    function getEventCapacityOccupied(
        bytes32 eventID
    ) public view returns (uint256) {
        uniqueEvent memory eventQueried = eventIdMappings[eventID];
        return eventQueried.eventCapacityOccupied;
    }

    function getEventMaxCapacity(
        bytes32 eventID
    ) public view returns (uint256) {
        uniqueEvent memory eventQueried = eventIdMappings[eventID];
        return eventQueried.eventMaxCapacity;
    }

    // Setter to update EventCapacityOccupied
    function updateEventCapacityOccupied(
        bytes32 eventID,
        uint256 capacityIncreased
    ) public organisersOnly {
        // Check that adding event capacity wont exceed maxCapacity
        uint256 currentEventCapacityOccupied = eventIdMappings[eventID]
            .eventCapacityOccupied;
        uint256 newEventCapacityOccupied = currentEventCapacityOccupied +
            capacityIncreased;
        require(
            newEventCapacityOccupied <=
                eventIdMappings[eventID].eventMaxCapacity,
            "Cannot update event capacity (new capacity > max capacity)"
        );

        // Update mapping for event
        eventIdMappings[eventID]
            .eventCapacityOccupied = newEventCapacityOccupied;

        // Emit event
        emit EventCapacityOccupiedUpdated(
            eventID,
            capacityIncreased,
            newEventCapacityOccupied
        );
    }
}
