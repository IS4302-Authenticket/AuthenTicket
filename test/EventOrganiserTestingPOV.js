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

    it('Test 1: Check event can be created', async() =>{

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
        
        truffleAssert.eventEmitted(makeEvent, "EventCreated");
    });
    
    it('Test 2: Check event can be listed', async() =>{

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
    });

    it('Test 3: Check that ticket category can be created', async() =>{
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
 
         truffleAssert.eventEmitted(makeCategory, "TicketCreated");
     });


    it('Test 4: Check that ticket can be listed', async() =>{
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
    });

    it('Test 5: Check that ticket cannot be listed if event is not listed', async() =>{
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

        // Let organiser create an Event that won't be listed
        let makeEvent2 = await eventInstance.createEvent(
            // string memory eventNameInput, uint256 eventMaxCapacityInput
            'JayChou', 1000,
            {from: accounts[2]}
        );
        let eventNumber2 = makeEvent2['logs'][0]['args']['1'];
 
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

         // Create event category B where event is not created
        await truffleAssert.fails(
            ticketFactoryInstance.createTicketCategory(
                eventNumber2,     // btyes32 eventID,
                "B",            // string memory categoryName,
                oneEth,         // uint256 ticketPrice,
                1001,            // uint256 totalSupply,
                250,            // uint256 priceCap,
                true,           // bool isResellable,
                5,              // uint256 maxTixPerUser
                {from: accounts[2]}
            ),
            truffleAssert.ErrorType.REVERT
        );
     });
 

    it('Test 6: Check that ticket price is listed correctly', async() =>{
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

        // Check prices
        let price = new BigNumber(await marketInstance.checkPrice(categoryNumber));
        assert(price.isEqualTo(new BigNumber(oneEth)), "Listed ticket price is wrong");
    });

    it('Test 7: Check ticket can be unlisted', async() =>{
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

        // Unlist tickets
        let unlistTicket = await marketInstance.unlistTicket(eventNumber, categoryNumber, {from: accounts[2]});
        truffleAssert.eventEmitted(unlistTicket, "TicketUnlisted");
    });


    it('Test 8: Check event can be unlisted', async() =>{
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

        // Unlist event
        let unlistEvent = await marketInstance.unlistEvent(eventNumber, {from: accounts[2]});
        truffleAssert.eventEmitted(unlistEvent, "EventUnlisted");
    });
    

    it("Test 9: Check that more tickets cannot be created for a category if it exceeds event max capacity", async () => {
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

        // Create event category A where totalSupply <= eventMaxCapacityInput
        let makeCategory1 = await ticketFactoryInstance.createTicketCategory(
            eventNumber,     // btyes32 eventID,
            "A",            // string memory categoryName,
            oneEth,         // uint256 ticketPrice,
            1000,            // uint256 totalSupply,
            250,            // uint256 priceCap,
            true,           // bool isResellable,
            5,              // uint256 maxTixPerUser
            {from: accounts[2]}
        )
        let categoryNumber1 = new BigNumber(makeCategory1["logs"][0]["args"]["0"]);

        // List ticket from category A
        let listTicket = await marketInstance.listTicket(eventNumber, categoryNumber1, {from: accounts[2]});
        truffleAssert.eventEmitted(listTicket, "TicketListed");

        // Create event category B where totalSupply > eventMaxCapacityInput
        await truffleAssert.fails(
            ticketFactoryInstance.createTicketCategory(
                eventNumber,     // btyes32 eventID,
                "B",            // string memory categoryName,
                oneEth,         // uint256 ticketPrice,
                1001,            // uint256 totalSupply,
                250,            // uint256 priceCap,
                true,           // bool isResellable,
                5,              // uint256 maxTixPerUser
                {from: accounts[2]}
            ),
            truffleAssert.ErrorType.REVERT,
            'Cannot create ticket category: total supply > max supply'
        );
    }); 

    
})