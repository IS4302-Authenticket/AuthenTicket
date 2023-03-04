pragma solidity ^0.5.0;

contract User {

    address contractMaster;

    // Enum of user types
    enum userType { user, admin, organiser } // Default value of enum in mapping = user

    // Mapping of address to user type
    mapping(address => userType) public userTypeMapping;

    // Events to be emitted
    event newOrganiser(address setBy, address newOrganiser);
    event newAdmin(address setBy, address newAdmin);
    event newUser(address setBy, address newUser);


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

    function setAdmin(address addressInput) public masterOnly returns (bool) {
        userTypeMapping[addressInput] = userType.admin;
        emit newAdmin(msg.sender, addressInput);
        return true;
    }

    function setOrganiser(address addressInput) public adminOnly returns (bool) {
        userTypeMapping[addressInput] = userType.organiser;
        emit newOrganiser(msg.sender, addressInput);
        return true;
    }

    function setUser(address addressInput) public returns (bool) {
        userTypeMapping[addressInput] = userType.user;
        emit newOrganiser(msg.sender, addressInput);
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