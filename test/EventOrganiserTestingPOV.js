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
var Market = artifacts.require("../contracts/Market.sol");

// Testing with a POV of an Event Organiser 
contract ('Authenticket', function(accounts){

    // waits for 2 contracts to be deployed before testing can occur
    before( async() => {
        userInstance = await User.deployed();
        eventInstance = await Event.deployed();
        ticketInstance = await TicketNFT.deployed();
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
            'JayChou', 100,
            {from: accounts[2]}
        );

        // Let organiser 2 create an Event
        let makeEvent2 = await eventInstance.createEvent(
            'JJLin', 200,
            {from: accounts[3]}
        );

        // List events
        let listEvent1 = await marketInstance.listEvent(makeEvent1);
        truffleAssert.eventEmitted(listEvent1, "EventListed");

        let listEvent2 = await marketInstance.listEvent(makeEvent2);
        truffleAssert.eventEmitted(listEvent2, "EventListed");
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