// require contracts to be deployed
const _deploy_contracts = require("../migrations/2_deploy_contracts");

// require assertion frameworks to be correctly initialised
const truffleAssert = require("truffle-assertions");
const BigNumber = require("bignumber.js"); // npm install bignumber.js
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
contract("Authenticket - Event Organiser Testing POV", function (accounts) {
    // waits for 2 contracts to be deployed before testing can occur
    before(async () => {
        userInstance = await User.deployed();
        eventInstance = await Event.deployed();
        ticketInstance = await TicketNFT.deployed();
        ticketFactoryInstance = await TicketFactory.deployed();
        marketInstance = await Market.deployed();
    });

    console.log("Testing Authenticket application from Event Organiser POV");

    let eventId;
    let ticketCategoryId;
    let ticketId;

    it("Test 1: Create 'JayChou' Event", async () => {
        // Set admin
        let setAdmin = await userInstance.setAdmin(accounts[1], {
            from: accounts[0],
        });

        // Only admin can set organiser
        let setOrganiser = await userInstance.setOrganiser(accounts[2], {
            from: accounts[1],
        });

        // Let organiser create an Event
        let makeEvent = await eventInstance.createEvent(
            // string memory eventNameInput, uint256 eventMaxCapacityInput
            "JayChou",
            1000,
            { from: accounts[2] }
        );
        eventId = makeEvent["logs"][0]["args"]["1"];

        truffleAssert.eventEmitted(makeEvent, "EventCreated");
    });

    it("Test 2: List 'JayChou' Event", async () => {
        // List event
        let listEvent = await marketInstance.listEvent(eventId, {
            from: accounts[2],
        });
        truffleAssert.eventEmitted(listEvent, "EventListed");
    });

    it("Test 3: Create a new 'VIP' ticket category for event", async () => {
        // Create event categories
        let makeCategory = await ticketFactoryInstance.createTicketCategory(
            eventId, // btyes32 eventID,
            "VIP", // string memory categoryName,
            oneEth, // uint256 ticketPrice,
            500, // uint256 totalSupply,
            250, // uint256 priceCap,
            true, // bool isResellable,
            5, // uint256 maxTixPerUser
            { from: accounts[2] }
        );

        truffleAssert.eventEmitted(makeCategory, "TicketCreated");
        ticketCategoryId = makeCategory["logs"][0]["args"]["0"];
    });

    it("Test 4: List 'VIP' ticket category for sales", async () => {
        // List tickets
        let listTicket = await marketInstance.listTicket(
            eventId,
            ticketCategoryId,
            { from: accounts[2] }
        );
        truffleAssert.eventEmitted(listTicket, "TicketListed");
    });

    it("Test 5: Ticket category cannot be listed if event is not listed", async () => {
        // Let organiser create an Event that won't be listed
        let makeEvent2 = await eventInstance.createEvent(
            // string memory eventNameInput, uint256 eventMaxCapacityInput
            "JJLIN",
            1000,
            { from: accounts[2] }
        );
        let eventId2 = makeEvent2["logs"][0]["args"]["1"];

        truffleAssert.eventEmitted(makeEvent2, "EventCreated");

        // Create event category A where event is created
        let makeCategory = await ticketFactoryInstance.createTicketCategory(
            eventId2, // btyes32 eventID,
            "BACKSTAGE", // string memory categoryName,
            oneEth, // uint256 ticketPrice,
            500, // uint256 totalSupply,
            250, // uint256 priceCap,
            true, // bool isResellable,
            5, // uint256 maxTixPerUser
            { from: accounts[2] }
        );

        let ticketCategoryId2 = makeCategory["logs"][0]["args"]["0"];

        // List tickets
        await truffleAssert.reverts(
            marketInstance.listTicket(eventId2, ticketCategoryId2, {
                from: accounts[2],
            }),
            "Event is not listed"
        );
    });

    it("Test 6: Check that ticket price is listed correctly", async () => {
        // ticket category was previously listed for oneEth
        let price = new BigNumber(
            await marketInstance.checkPrice(ticketCategoryId)
        );

        assert(price.isEqualTo(oneEth), "Listed ticket price is wrong");
    });

    it("Test 7: Unlist Ticket", async () => {
        // Unlist tickets
        let unlistTicket = await marketInstance.unlistTicket(
            eventId,
            ticketCategoryId,
            { from: accounts[2] }
        );
        truffleAssert.eventEmitted(unlistTicket, "TicketUnlisted");
    });

    it("Test 8: Unlist Event", async () => {
        // Unlist event
        let unlistEvent = await marketInstance.unlistEvent(eventId, {
            from: accounts[2],
        });
        truffleAssert.eventEmitted(unlistEvent, "EventUnlisted");
    });

    it("Test 9: Check that ticket category supply should not exceed event max capacity", async () => {
        // Ticket Category 'VIP' was previously created with totalSupply = 500
        // Event 'JayChou' was previously created with eventMaxCapacity = 1000
        // Create another category where totalSupply > eventMaxCapacityInput
        await truffleAssert.reverts(
            ticketFactoryInstance.createTicketCategory(
                eventId, // btyes32 eventID,
                "BACKSTAGE", // string memory categoryName,
                oneEth, // uint256 ticketPrice,
                600, // uint256 totalSupply,
                250, // uint256 priceCap,
                true, // bool isResellable,
                5, // uint256 maxTixPerUser
                { from: accounts[2] }
            ),
            "Cannot create ticket category: total supply > max supply"
        );
    });
});
