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

// Establish testing
contract ('Authenticket', function(accounts){

    // waits for 2 contracts to be deployed before testing can occur
    before( async() => {
        userInstance = await User.deployed();
        eventInstance = await Event.deployed();
        ticketInstance = await TicketNFT.deployed();
    });

    console.log("Testing Authenticket application");

    // Test: Test that after deploying contract, deployer is master of user contract
    it('Test User contract master', async() =>{

        let masterTest = await userInstance.checkAdmin(
            accounts[0],
            {from: accounts[0]}
        );
        assert(masterTest == true, 'Test that deployer is User contract master failed');
    });

    // Test: Test User contract setAdmin
    it('Test User contract setAdmin', async() =>{

        let setAdmin = await userInstance.setAdmin(
            accounts[1],
            {from: accounts[0]}
        );
        let checkAdmin = await userInstance.checkAdmin(
            accounts[1],
            {from: accounts[0]}
        );
        assert(checkAdmin == true, 'Test User contract setAdmin failed');
    });

    // Test: Test User contract setOrganiser
    it('Test User contract setOrganiser', async() =>{

        let setOrganiser = await userInstance.setOrganiser(
            accounts[2],
            {from: accounts[1]}
        );
        let checkOrganiser = await userInstance.checkOrganiser(
            accounts[2],
            {from: accounts[1]}
        );
        assert(checkOrganiser == true, 'Test User contract setAdmin failed');
    });

    // Test: Test User contract checkOrganiser
    it('Test User contract setOrganiser', async() =>{

        let setOrganiser2 = await userInstance.setOrganiser(
            accounts[3],
            {from: accounts[1]}
        );
        let checkOrganiser2 = await userInstance.checkOrganiser(
            accounts[3],
            {from: accounts[1]}
        );
        assert(checkOrganiser2 == true, 'Test User contract setOrganiser failed');
    });

    // Test: Create events
    it('Create first 2 events', async() =>{

        // Let account 1 create an Event
        let makeEvent1 = await eventInstance.createEvent(
            'JayChou', 100,
            {from: accounts[2]}
        );

        truffleAssert.eventEmitted(makeEvent1, "EventCreated");

        // Let account 2 create an Event
        let makeEvent2 = await eventInstance.createEvent(
            'JJLin', 200,
            {from: accounts[3]}
        );
        truffleAssert.eventEmitted(makeEvent2, "EventCreated");

    });

    // Test: Check that events are created with correct event owners
    it('Check event owners', async() =>{

        // Assertions
        let checkResults1 = await eventInstance.checkEventOwner.call(1, accounts[2]);
        await assert(checkResults1 == true, 'Event 1 not created')

        let checkResults2 = await eventInstance.checkEventOwner.call(2, accounts[3]);
        await assert(checkResults2 == true, 'Event 2 not created')

    });

    // // Test: Check that zone details cannot be added if sender is not event organiser
    // it('Check that zone details cannot be added if sender is not event organiser', async() =>{

    //     // Assertions
    //     await truffleAssert.fails(
    //         // Add zone details for event 1 from account 2
    //         ticketInstance.addZoneDetails(
    //             1,
    //             'A',
    //             20,
    //             10,
    //             100,
    //             {from: accounts[3]}
    //         ),
    //         'VM Exception while processing transaction: revert Not event organiser'
    //     );

    // });

    // // Test: Add zone details twice for event 1
    // it('Add zone details twice for event 1', async() =>{

    //     // Add zone details from account 1
    //     let addZoneDetails1A = await ticketInstance.addZoneDetails(
    //         1,
    //         'A',
    //         20,
    //         10,
    //         100,
    //         {from: accounts[2]}
    //     );

    //     let addZoneDetails1B = await ticketInstance.addZoneDetails(
    //         1,
    //         'B',
    //         30,
    //         20,
    //         200,
    //         {from: accounts[2]}
    //     );

    //     // Assertions
    //     let getZoneACapacity = await ticketInstance.getZoneCapacity(1, 'A');
    //     let getZoneAPrice = await ticketInstance.getZonePrice(1, 'A');
    //     let getZoneAPriceCap = await ticketInstance.getZonePriceCap(1, 'A');
    //     await assert(getZoneACapacity == 20, 'Event 1 zone A capacity wrong');
    //     await assert(getZoneAPrice == 10, 'Event 1 zone A price wrong');
    //     await assert(getZoneAPriceCap == 100, 'Event 1 zone A price cap wrong');
        
    //     let getZoneBCapacity = await ticketInstance.getZoneCapacity(1, 'B');
    //     let getZoneBPrice = await ticketInstance.getZonePrice(1, 'B');
    //     let getZoneBPriceCap = await ticketInstance.getZonePriceCap(1, 'B');
    //     await assert(getZoneBCapacity == 30, 'Event 1 zone B capacity wrong');
    //     await assert(getZoneBPrice == 20, 'Event 1 zone B price wrong');
    //     await assert(getZoneBPriceCap == 200, 'Event 1 zone B price cap wrong');
    // });

})