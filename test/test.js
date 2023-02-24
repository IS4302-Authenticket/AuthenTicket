// require contracts to be deployed
const _deploy_contracts = require("../migrations/2_deploy_contracts");

// require assertion frameworks to be correctly initialised
const truffleAssert = require("truffle-assertions");
const BigNumber = require('bignumber.js'); // npm install bignumber.js
var assert = require("assert");

// BigNumber is an object that safely allows mathematical operations on number of any magnitude
const oneEth = new BigNumber(1000000000000000000); // 1 eth

// create variables to represent contracts
var Event = artifacts.require("../contracts/Event.sol");
var Ticket = artifacts.require("../contracts/Ticket.sol");

// Establish testing
contract ('Authenticket', function(accounts){

    // waits for 2 contracts to be deployed before testing can occur
    before( async() => {
        eventInstance = await Event.deployed();
        ticketInstance = await Ticket.deployed();
    });

    console.log("Testing Authenticket application");

    // Test case 1: Create eventa
    it('Create first 2 events', async() =>{

        // Let account 1 create an Event
        let makeEvent1 = await eventInstance.createEvent(
            'JayChou', 100,
            {from: accounts[1]}
        );

        truffleAssert.eventEmitted(makeEvent1, "EventCreated");

        // Let account 2 create an Event
        let makeEvent2 = await eventInstance.createEvent(
            'JJLin', 200,
            {from: accounts[2]}
        );
        truffleAssert.eventEmitted(makeEvent2, "EventCreated");

    });

    // Test case 2: Check that events are created with correct event owners
    it('Check event owners', async() =>{

        // Assertions
        let checkResults1 = await eventInstance.checkEventOwner.call(1, accounts[1]);
        await assert(checkResults1 == true, 'Event 1 not created')

        let checkResults2 = await eventInstance.checkEventOwner.call(2, accounts[2]);
        await assert(checkResults2 == true, 'Event 2 not created')

    });

    // Test case 3: Check that zone details cannot be added if sender is not event organiser
    it('Check that zone details cannot be added if sender is not event organiser', async() =>{

        // Assertions
        await truffleAssert.fails(
            // Add zone details for event 1 from account 2
            ticketInstance.addZoneDetails(
                1,
                'A',
                20,
                10,
                100,
                {from: accounts[2]}
            ),
            'VM Exception while processing transaction: revert Not event organiser'
        );

    });

    // Test case 4: Add zone details twice for event 1
    it('Add zone details twice for event 1', async() =>{

        // Add zone details from account 1
        let addZoneDetails1A = await ticketInstance.addZoneDetails(
            1,
            'A',
            20,
            10,
            100,
            {from: accounts[1]}
        );

        let addZoneDetails1B = await ticketInstance.addZoneDetails(
            1,
            'B',
            30,
            20,
            200,
            {from: accounts[1]}
        );

        // Assertions
        let getZoneACapacity = await ticketInstance.getZoneCapacity(1, 'A');
        let getZoneAPrice = await ticketInstance.getZonePrice(1, 'A');
        let getZoneAPriceCap = await ticketInstance.getZonePriceCap(1, 'A');
        await assert(getZoneACapacity == 20, 'Event 1 zone A capacity wrong');
        await assert(getZoneAPrice == 10, 'Event 1 zone A price wrong');
        await assert(getZoneAPriceCap == 100, 'Event 1 zone A price cap wrong');
        
        let getZoneBCapacity = await ticketInstance.getZoneCapacity(1, 'B');
        let getZoneBPrice = await ticketInstance.getZonePrice(1, 'B');
        let getZoneBPriceCap = await ticketInstance.getZonePriceCap(1, 'B');
        await assert(getZoneBCapacity == 30, 'Event 1 zone B capacity wrong');
        await assert(getZoneBPrice == 20, 'Event 1 zone B price wrong');
        await assert(getZoneBPriceCap == 200, 'Event 1 zone B price cap wrong');
    });


})