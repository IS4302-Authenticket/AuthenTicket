pragma solidity ^0.5.0;

import "./User.sol";

contract Event {
    
    // Instantiate user contract here to ensure that only organisers can create events
    User userContractInstance;

    // All events are issued with an event ID, in ascending order starting from 1
    uint256 eventIdCount = 1;

    // Mapping of event ID to uniqueEvent struct that contains Event information
    mapping(uint256 => uniqueEvent) public eventIdMappings;

    // Struct to store unique event information
    struct uniqueEvent {
        address eventOrganiser;
        string eventName;
        uint256 eventMaxCapacity;
    }

    // Constructor
    constructor (User userContractAddress) public {
        userContractInstance = userContractAddress;
    }

    // Events
    event EventCreated(address organiser, uint256 eventID);

    // Modifier to ensure function is called by authorised organisers
    modifier OrganisersOnly() {
        require(userContractInstance.checkOrganiser(msg.sender) == true);
        _;
    }

    /**
     * @dev Function where organisers can create an Event
     * @param eventNameInput Event Name
     * @param eventMaxCapacityInput Max Capacity for event
     * @return Returns event ID that is created
     */
    function createEvent(
        string memory eventNameInput, 
        uint256 eventMaxCapacityInput
    ) OrganisersOnly public returns(uint256) {
        
        // Creates a new uniqueEvent struct
        uniqueEvent memory newEvent = uniqueEvent(
            msg.sender,
            eventNameInput,
            eventMaxCapacityInput
        );

        // Update mapping
        uint256 eventID = eventIdCount;
        eventIdMappings[eventID] = newEvent;
        eventIdCount += 1;
        
        // Emit event
        emit EventCreated(msg.sender, eventID);
        return eventID;
    }

    // Function to check if caller of function is event owner (for Ticket Contract)
    function checkEventOwner(uint256 eventID, address organiserAddress) public view returns(bool) {
        uniqueEvent memory eventQueried = eventIdMappings[eventID];
        return (eventQueried.eventOrganiser == organiserAddress);
    }

    // Getter to check current Event ID Count for testing
    function getCurrentEventID() public view returns(uint256) {
        return eventIdCount;
    }

}