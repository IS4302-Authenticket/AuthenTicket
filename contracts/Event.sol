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
        uint256 numCategories; //when creating event i think you should alr know what categories to have 
    }

    constructor (User userContractAddress) public {
        userContractInstance = userContractAddress;
    }

    // Events
    event EventCreated(address organiser, uint256 eventID);

    // Modifier to ensure function is called by authorised organisers
    modifier organisersOnly() {
        require(userContractInstance.checkOrganiser(msg.sender) == true);
        _;
    }

    // Function to return num categories of an event
    function getTicketCategories(uint256 eventId) public view returns(uint256){
        return eventIdMappings[eventId].numCategories;
    }

    //added event category 
    function createEvent(string memory eventNameInput, uint256 eventMaxCapacityInput, uint8 numCategories) organisersOnly public {
        uint256 eventID = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender)));
        uniqueEvent memory newEvent = uniqueEvent(msg.sender, eventID, eventNameInput, eventMaxCapacityInput, numCategories);
        eventIdMappings[eventID] = newEvent;
        emit EventCreated(msg.sender, eventID);
    }

    function checkEventOwner(uint256 eventID, address organiserAddress) public view returns(bool) {
        uniqueEvent memory eventQueried = eventIdMappings[eventID];
        return (eventQueried.eventOrganiser == organiserAddress);
    }
}