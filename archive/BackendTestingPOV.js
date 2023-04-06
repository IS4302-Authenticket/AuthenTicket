// require contracts to be deployed
const _deploy_contracts = require("../migrations/2_deploy_contracts");

// require assertion frameworks to be correctly initialised
const truffleAssert = require("truffle-assertions");
const BigNumber = require('bignumber.js'); // npm install bignumber.js
var assert = require("assert");

// BigNumber is an object that safely allows mathematical operations on number of any magnitude
const oneEth = new BigNumber(1000000000000000000); // 1 eth

// create variables to represent contracts
var User = artifacts.require("../contracts/User.sol");
var Event = artifacts.require("../contracts/Event.sol");
var TicketNFT = artifacts.require("../contracts/TicketNFT.sol");
var TicketFactory = artifacts.require("../contracts/TicketFactory.sol");
var Market = artifacts.require("../contracts/Market.sol");

// Testing with a POV of an Event Organiser 
contract ('Authenticket - Backend Testing POV', function(accounts){

    // waits for 2 contracts to be deployed before testing can occur
    before( async() => {
        userInstance = await User.deployed();
        eventInstance = await Event.deployed();
        ticketInstance = await TicketNFT.deployed();
        ticketFactoryInstance = await TicketFactory.deployed();
        marketInstance = await Market.deployed();
    });

    console.log("Testing Authenticket application from Backend POV");
    
    it('Test 1: Check that ticket can be minted', async() =>{
        // Set admin
        let setAdmin = await userInstance.setAdmin(accounts[1], {from: accounts[0]});

        // Only admin can set organiser
        let setOrganiser = await userInstance.setOrganiser(accounts[2], {from: accounts[1]});

        // Let organiser create an Event
        let makeEvent = await eventInstance.createEvent(
            // string memory eventNameInput, uint256 eventMaxCapacityInput
            'JayChou', 1000,
            {from: accounts[2]}
        );
        let eventNumber = makeEvent['logs'][0]['args']['1'];

        // List event
        let listEvent = await marketInstance.listEvent(eventNumber, {from: accounts[2]});
        truffleAssert.eventEmitted(listEvent, "EventListed");

        // Create event category A where event is created
        let makeCategory = await ticketFactoryInstance.createTicketCategory(
            eventNumber,     // btyes32 eventID,
            "A",            // string memory categoryName,
            oneEth,         // uint256 ticketPrice,
            500,            // uint256 totalSupply,
            250,            // uint256 priceCap,
            true,           // bool isResellable,
            5,              // uint256 maxTixPerUser
            {from: accounts[2]}
        )

        let categoryNumber = new BigNumber(makeCategory["logs"][0]["args"]["0"]);

        // List tickets
        let listTicket = await marketInstance.listTicket(eventNumber, categoryNumber, {from: accounts[2]});
        truffleAssert.eventEmitted(listTicket, "TicketListed");

        // Assuming that accounts[3] is buyer
        let mintTicket = await ticketInstance.mintTicket(eventNumber, categoryNumber, accounts[3]);
        truffleAssert.eventEmitted(mintTicket, "TicketMinted");
    });


    it('Test 2: Check that ticket can be purchased', async() =>{
       // Set admin
       let setAdmin = await userInstance.setAdmin(accounts[1], {from: accounts[0]});

       // Only admin can set organiser
       let setOrganiser = await userInstance.setOrganiser(accounts[2], {from: accounts[1]});

       // Let organiser create an Event
       let makeEvent = await eventInstance.createEvent(
           // string memory eventNameInput, uint256 eventMaxCapacityInput
           'JayChou', 1000,
           {from: accounts[2]}
       );
       let eventNumber = makeEvent['logs'][0]['args']['1'];

       // List event
       let listEvent = await marketInstance.listEvent(eventNumber, {from: accounts[2]});
       truffleAssert.eventEmitted(listEvent, "EventListed");

        // Create event categories
        let makeCategory = await ticketFactoryInstance.createTicketCategory(
            eventNumber,     // btyes32 eventID,
            "A",            // string memory categoryName,
            oneEth,         // uint256 ticketPrice,
            500,            // uint256 totalSupply,
            250,            // uint256 priceCap,
            true,           // bool isResellable,
            5,              // uint256 maxTixPerUser
            {from: accounts[2]}
        )

        let categoryNumber = new BigNumber(makeCategory["logs"][0]["args"]["0"]);

        // List tickets
        let listTicket = await marketInstance.listTicket(eventNumber, categoryNumber, {from: accounts[2]});
        truffleAssert.eventEmitted(listTicket, "TicketListed");

        // Assuming that accounts[3] is buyer
        let purchaseTicket = await ticketInstance.purchaseTicket(accounts[3], eventNumber, categoryNumber, 2);
        truffleAssert.eventEmitted(purchaseTicket, "TicketPurchased");
    });
    
})