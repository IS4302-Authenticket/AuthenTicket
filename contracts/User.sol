pragma solidity ^0.5.0;

contract User {

    address contractMaster;

    // Enum of user types
    enum userType { user, admin, organiser } // Default value of eum in mapping = user

    // Mapping of address to user type
    mapping(address => userType) public userTypeMapping;

    // Events to be emitted
    event SetOrganiser(address senderAddress, address OrganiserRecipientAddress);
    event SetAdmin(address senderAddress, address AdminRecipientAddress);


    // Constructor which only allows address deploying contract to be master
    constructor() public {
        contractMaster = msg.sender;
        userTypeMapping[msg.sender] = userType.admin;
    }

    // Modifier which only allows admin to use functions
    modifier adminOnly() {
        require(userTypeMapping[msg.sender] == userType.admin);
        _;
    }

    // Modifier which only allows contract master to use functions
    modifier masterOnly() {
        require(msg.sender == contractMaster);
        _;
    }

    // Modifier which only allows organisers to use functions
    modifier organiserOnly() {
        require(userTypeMapping[msg.sender] == userType.organiser);
        _;
    }

    // Setter function to set admin
    function setAdmin(address addressInput) public masterOnly returns (bool) {
        userTypeMapping[addressInput] = userType.admin;
        emit SetAdmin(msg.sender, addressInput);
        return true;
    }

    // Setter Function to set organiser
    function setOrganiser(address addressInput) public adminOnly returns (bool) {
        userTypeMapping[addressInput] = userType.organiser;
        emit SetOrganiser(msg.sender, addressInput);
        return true;
    }

    // Getter function to check if person is admin
    function checkAdmin(address addressInput) public view returns (bool) {
        return (userTypeMapping[addressInput] == userType.admin);
    }

    // Getter function to check if person is organiser
    function checkOrganiser(address addressInput) public view returns (bool) {
        return (userTypeMapping[addressInput] == userType.organiser);
    }

    // Getter function to check if person is user
    function checkUser(address addressInput) public view returns (bool) {
        return (userTypeMapping[addressInput] == userType.user);
    }
    
}