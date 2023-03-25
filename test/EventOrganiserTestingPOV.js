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
contract ('Authenticket - Event Organiser Testing POV', function(accounts){

    // waits for 2 contracts to be deployed before testing can occur
    before( async() => {
        userInstance = await User.deployed();
        eventInstance = await Event.deployed();
        ticketInstance = await TicketNFT.deployed();
        ticketFactoryInstance = await TicketFactory.deployed();
        marketInstance = await Market.deployed();
    });

    console.log("Testing Authenticket application from Event Organiser POV");
    
    // Test: Check that event can be listed
    it('Check event can be listed', async() =>{

        // Set admin
        let setAdmin = await userInstance.setAdmin(accounts[1], {from: accounts[0]});

        // Only admin can set organiser
        let setOrganiser1 = await userInstance.setOrganiser(accounts[2], {from: accounts[1]});
        let setOrganiser2 = await userInstance.setOrganiser(accounts[3], {from: accounts[1]});

        // Let organiser 1 create an Event
        let makeEvent1 = await eventInstance.createEvent(
            // string memory eventNameInput, uint256 eventMaxCapacityInput
            'JayChou', 100,
            {from: accounts[2]}
        );
        let eventNumber1 = new BigNumber(makeEvent1['logs'][0]['args']['1']);

        // Let organiser 2 create an Event
        let makeEvent2 = await eventInstance.createEvent(
            'JJLin', 200,
            {from: accounts[3]}
        );
        let eventNumber2 = new BigNumber(makeEvent2['logs'][0]['args']['1']);

        // List events
        let listEvent1 = await marketInstance.listEvent(eventNumber1, {from: accounts[2]});
        truffleAssert.eventEmitted(listEvent1, "EventListed");

        let listEvent2 = await marketInstance.listEvent(eventNumber2, {from: accounts[3]});
        truffleAssert.eventEmitted(listEvent2, "EventListed");
    });


    // Test: Check that ticket can be listed
    it('Check that ticket can be listed', async() =>{
        let makeCategory1 = await ticketFactoryInstance.createTicketCategory(
            makeEvent1,     // uint256 eventID,
            "A",            // string memory categoryName,
            200,            // uint256 ticketPrice,
            500,            // uint256 totalSupply,
            250,            // uint256 priceCap,
            true,           // bool isResellable,
            5,              // uint256 maxTixPerUser
        )

        let makeCategory2 = await ticketFactoryInstance.createTicketCategory(
            makeEvent2,     // uint256 eventID,
            "B",            // string memory categoryName,
            300,            // uint256 ticketPrice,
            500,            // uint256 totalSupply,
            350,            // uint256 priceCap,
            true,           // bool isResellable,
            5,              // uint256 maxTixPerUser
        )

        // List tickets
        let listTicket1 = await marketInstance.listTicket(makeEvent1, makeCategory1, {from: accounts[2]});
        truffleAssert.eventEmitted(listTicket1, "TicketListed");

        let listTicket2 = await marketInstance.listTicket(makeEvent2, makeCategory2, {from: accounts[3]});
        truffleAssert.eventEmitted(listTicket2, "TicketListed");
    });


    // Test: Check that ticket prices are listed correctly
    it('Check that ticket price is listed correctly', async() =>{
        // Check prices
        assert(marketInstance.checkPrice(makeCategory1) == 200, "Listed ticket price is wrong");
        assert(marketInstance.checkPrice(makeCategory2) == 300, "Listed ticket price is wrong");
    });


    // Test: Check that tickets can be bought
    it('Check that tickets can be bought', async() =>{
        // Set user, who will be buyer
        let setUser = await userInstance.setUser(
            accounts[4],
            {from: accounts[1]}
        );

        // Buy tickets
        let buyTicket1 = await marketInstance.buyTickets(makeEvent1, makeCategory1, 2, {from: accounts[4]});
        let buyTicket2 = await marketInstance.buyTickets(makeEvent2, makeCategory2, 5, {from: accounts[4]});

        assert(ticketInstance.getTicketOwner(buyTicket1) == accounts[4], "Ticket owner is wrong");
        assert(ticketInstance.getTicketOwner(buyTicket2) == accounts[4], "Ticket owner is wrong");
    });


    // Test: Check that tickets can be refunded
    it('Check that tickets can be refunded', async() =>{
        // Refund tickets
        let refundTicket1 = await marketInstance.refundTickets(buyTicket1, {from: accounts[4]});
        truffleAssert.eventEmitted(refundTicket1, "TicketRefunded");

        let refundTicket2 = await marketInstance.refundTickets(buyTicket2, {from: accounts[4]});
        truffleAssert.eventEmitted(refundTicket2, "TicketRefunded");
    });


    // Test: Check that tickets can be unlisted
    it('Check ticket can be unlisted', async() =>{
        // Unlist tickets
        let unlistTicket1 = await marketInstance.unlistTicket(makeEvent1, makeCategory1, {from: accounts[2]});
        truffleAssert.eventEmitted(unlistTicket1, "TicketUnlisted");

        let unlistTicket2 = await marketInstance.unlistTicket(makeEvent2, makeCategory2, {from: accounts[3]});
        truffleAssert.eventEmitted(unlistTicket2, "TicketUnlisted");
    });


    // Test: Check that event can be unlisted
    it('Check event can be unlisted', async() =>{
        // Unlist events
        let unlistEvent1 = await marketInstance.unlistEvent(makeEvent1);
        truffleAssert.eventEmitted(unlistEvent1, "EventUnlisted");

        let unlistEvent2 = await marketInstance.unlistEvent(makeEvent2);
        truffleAssert.eventEmitted(unlistEvent2, "EventUnlisted");
    });


    // Test: Check that event can only be listed/unlisted by organiser (test modifier if got time?)
    
})