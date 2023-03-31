pragma solidity ^0.5.0;

contract User {

    // Address of contract master
    address contractMaster;

    // Enum of user types
    enum userType { user, admin, organiser } // Default value of enum in mapping = user

    // Mapping of address to user type
    mapping(address => userType) public userTypeMapping;

    // Events to be emitted
    event NewOrganiser(address setBy, address newOrganiser);
    event NewAdmin(address setBy, address newAdmin);
    event NewUser(address setBy, address newUser);

    // Constructor which only allows address deploying contract to be master
    constructor() public {
        contractMaster = msg.sender;
        userTypeMapping[msg.sender] = userType.admin;
    }

    // Modifier which only allows contract master to use functions
    modifier masterOnly() {
        require(msg.sender == contractMaster);
        _;
    }

    // Modifier which only allows admin to use functions
    modifier adminOnly() {
        require(userTypeMapping[msg.sender] == userType.admin);
        _;
    }

    // Modifier which only allows organisers to use functions
    modifier organiserOnly() {
        require(userTypeMapping[msg.sender] == userType.organiser);
        _;
    }
    
    // Setter function that allows master to delegate Administrator rights
    function setAdmin(address addressInput) public masterOnly returns (bool) {
        userTypeMapping[addressInput] = userType.admin;
        emit NewAdmin(msg.sender, addressInput);
        return true;
    }

    // Setter function that allows admins to delegate Organiser rights
    function setOrganiser(address addressInput) public adminOnly returns (bool) {
        userTypeMapping[addressInput] = userType.organiser;
        emit NewOrganiser(msg.sender, addressInput);
        return true;
    }

    // Setter function that allows admins to delegate User rights
    function setUser(address addressInput) public adminOnly returns (bool) {
        userTypeMapping[addressInput] = userType.user;
        emit NewUser(msg.sender, addressInput);
        return true;
    }

    // Getter function to check if person is admin / master (admin by default)
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