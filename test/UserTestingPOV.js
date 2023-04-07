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
var ResellMarket = artifacts.require("../contracts/ResellMarket.sol");

// Testing with a POV of an Event Organiser
contract("Authenticket - User Testing POV", function (accounts) {
    // waits for 2 contracts to be deployed before testing can occur
    before(async () => {
        userInstance = await User.deployed();
        eventInstance = await Event.deployed();
        ticketInstance = await TicketNFT.deployed();
        ticketFactoryInstance = await TicketFactory.deployed();
        marketInstance = await Market.deployed();
        resellMarketInstance = await ResellMarket.deployed();
    });

    let jayChouEventID;
    let jayChouVipCatID;
    let jayChouVipTicketID;

    let jjLinEventID;
    let jjLinVipCatID;
    let jjLinVipTicketID;

    //Test 1: test that user can buy ticket
    it("Test 1: User can buy ticket", async () => {
        //set the admin
        let account1Admin = await userInstance.setAdmin(accounts[1], {
            from: accounts[0],
        });
        //Set the Organiser
        let account2Organiser = await userInstance.setOrganiser(accounts[2], {
            from: accounts[1],
        });

        //set the user
        let account3User = await userInstance.setUser(accounts[3], {
            from: accounts[1],
        });

        let account4User = await userInstance.setUser(accounts[4], {
            from: accounts[1],
        });

        // Create jaychou event
        let createJayChouEvent = await eventInstance.createEvent(
            "JayChou",
            1000,
            {
                from: accounts[2],
            }
        );
        truffleAssert.eventEmitted(createJayChouEvent, "EventCreated");

        jayChouEventID = createJayChouEvent["logs"][0]["args"]["1"];

        //List Event
        let listJayChouEvent = await marketInstance.listEvent(jayChouEventID, {
            from: accounts[2],
        });
        truffleAssert.eventEmitted(listJayChouEvent, "EventListed");

        //make the cat A ticket
        let createVIPCatForJayChou =
            await ticketFactoryInstance.createTicketCategory(
                jayChouEventID, // bytes32,
                "VIP", // string memory categoryName,
                oneEth, // uint256 ticketPrice,
                500, // uint256 totalSupply,
                oneEth.times(2), // uint256 priceCap,
                true, // bool isResellable,
                2, // uint256 maxTixPerUser
                { from: accounts[2] }
            );

        jayChouVipCatID = createVIPCatForJayChou["logs"][0]["args"]["0"];

        // list VIP ticket category in market
        let listVIPCatJayChou = await marketInstance.listTicket(
            jayChouEventID,
            jayChouVipCatID,
            { from: accounts[2] }
        );
        truffleAssert.eventEmitted(listVIPCatJayChou, "TicketListed");

        // acc3 buy cat VIP jay chou ticket
        // takes in eventId, ticketCategoryId, numTickets
        let acc3BuyJayChouVIPTicket = await marketInstance.buyTickets(
            jayChouEventID,
            jayChouVipCatID,
            2,
            { from: accounts[3], value: oneEth.times(2) }
        );
        truffleAssert.eventEmitted(acc3BuyJayChouVIPTicket, "TicketBought");
        jayChouVipTicketID = acc3BuyJayChouVIPTicket["logs"][0]["args"]["0"];
        let buyer = acc3BuyJayChouVIPTicket["logs"][0]["args"]["3"];
        assert.equal(buyer, accounts[3]);
    });

    it("Test 2: Correct amount of ether must be provided to buy tickets", async () => {
        //fail to buy ticket with only 1 eth provided
        await truffleAssert.fails(
            marketInstance.buyTickets(jayChouEventID, jayChouVipCatID, 2, {
                from: accounts[3],
                value: oneEth,
            }),
            truffleAssert.ErrorType.REVERT,
            "Incorrect amount of ether sent"
        );
    });

    it("Test 3: User cannot buy more tickets than the category's limit", async () => {
        // bought 2 tickets earlier on,
        // try to buy more tickets again
        await truffleAssert.fails(
            marketInstance.buyTickets(jayChouEventID, jayChouVipCatID, 2, {
                from: accounts[3],
                value: oneEth.times(2),
            }),
            truffleAssert.ErrorType.REVERT,
            "Max purchase limit for user reached"
        );
    });

    it("Test 4: User cannot buy an unlisted ticket on market", async () => {
        // Create event category which won't be listed
        let makeCategory2 = await ticketFactoryInstance.createTicketCategory(
            jayChouEventID, // btyes32 eventID,
            "STANDARD", // string memory categoryName,
            oneEth, // uint256 ticketPrice,
            500, // uint256 totalSupply,
            250, // uint256 priceCap,
            true, // bool isResellable,
            5, // uint256 maxTixPerUser
            { from: accounts[2] }
        );

        let categoryId = makeCategory2["logs"][0]["args"]["0"];
        await truffleAssert.fails(
            marketInstance.buyTickets(jayChouEventID, categoryId, 1, {
                from: accounts[4],
                value: oneEth,
            }),
            truffleAssert.ErrorType.REVERT,
            "Ticket is not listed"
        );
    });

    it("Test 5: User cannot buy more tickets than the remaining supply", async () => {
        // Create jjlin event with 10 tickets
        let createJJLinEvent = await eventInstance.createEvent("JJLIN", 1000, {
            from: accounts[2],
        });

        jjLinEventID = createJJLinEvent["logs"][0]["args"]["1"];

        //List Event
        let listJJLinEvent = await marketInstance.listEvent(jjLinEventID, {
            from: accounts[2],
        });

        // make the VIP ticket have 3 total supply only
        let createCatForJJLin =
            await ticketFactoryInstance.createTicketCategory(
                jjLinEventID, // bytes32,
                "VIP", // string memory categoryName,
                oneEth, // uint256 ticketPrice,
                3, // uint256 totalSupply,
                oneEth.times(2), // uint256 priceCap,
                true, // bool isResellable,
                5, // uint256 maxTixPerUser
                { from: accounts[2] }
            );

        jjLinVipCatID = createCatForJJLin["logs"][0]["args"]["0"];

        // list VIP ticket category in market
        let listCatJJLin = await marketInstance.listTicket(
            jjLinEventID,
            jjLinVipCatID,
            { from: accounts[2] }
        );

        truffleAssert.eventEmitted(listCatJJLin, "TicketListed");

        // buy 1 ticket
        let acc3BuyJJLinTicket = await marketInstance.buyTickets(
            jjLinEventID,
            jjLinVipCatID,
            1,
            { from: accounts[3], value: oneEth }
        );
        truffleAssert.eventEmitted(acc3BuyJJLinTicket, "TicketBought");
        jjLinVipTicketID = acc3BuyJJLinTicket["logs"][0]["args"]["0"];

        //fail to buy 3 more tickets
        await truffleAssert.fails(
            marketInstance.buyTickets(jjLinEventID, jjLinVipCatID, 3, {
                from: accounts[3],
                value: oneEth.times(3),
            }),
            truffleAssert.ErrorType.REVERT,
            "Not enough tickets remaining"
        );
    });

    it("Test 6: Check that tickets can be refunded", async () => {
        // Refund the first ticket
        let refundTicket = await marketInstance.refundTickets(
            jayChouVipTicketID,
            {
                from: accounts[3],
                value: oneEth,
            }
        );
        truffleAssert.eventEmitted(refundTicket, "TicketRefunded");
    });

    it("Test 7: Ticket can only be refunded by owner", async () => {
        await truffleAssert.fails(
            marketInstance.refundTickets(jayChouVipTicketID, {
                from: accounts[4],
                value: oneEth,
            }),
            truffleAssert.ErrorType.REVERT,
            "Wrong Owner!"
        );
    });

    it("Test 8: Buyer cannot resell ticket at a price higher than capped amount", async () => {
        // VIP category has a price cap of 2 eth
        await truffleAssert.fails(
            resellMarketInstance.list(jjLinVipTicketID, oneEth.times(3), {
                from: accounts[3],
            }),
            truffleAssert.ErrorType.REVERT,
            "Price listing is over price cap!"
        );
    });

    it("Test 9: Buyer cannot resell ticket that they did not buy", async () => {
        await truffleAssert.fails(
            resellMarketInstance.list(jjLinVipTicketID, oneEth, {
                from: accounts[4],
            }),
            truffleAssert.ErrorType.REVERT,
            "Wrong owner"
        );
    });

    it("Test 10: Buyer can list ticket in the resell market", async () => {
        let listTicketOnResellMarket = await resellMarketInstance.list(
            jjLinVipTicketID,
            oneEth,
            { from: accounts[3] }
        );

        truffleAssert.eventEmitted(listTicketOnResellMarket, "ticketListed");
    });

    it("Test 11: Buyer cannot resell a ticket that has been set to be unresellable by organisers", async () => {
        // create a special ticket category that cannot be resole
        let makeCategory = await ticketFactoryInstance.createTicketCategory(
            jjLinEventID, // btyes32 eventID,
            "SPECIAL", // string memory categoryName,
            oneEth, // uint256 ticketPrice,
            10, // uint256 totalSupply,
            oneEth, // uint256 priceCap,
            false, // bool isResellable,
            1, // uint256 maxTixPerUser
            { from: accounts[2] }
        );

        let specialCategoryID = makeCategory["logs"][0]["args"]["0"];

        // List tickets
        let listTicket = await marketInstance.listTicket(
            jjLinEventID,
            specialCategoryID,
            { from: accounts[2] }
        );
        truffleAssert.eventEmitted(listTicket, "TicketListed");

        // Buy tickets
        let buyTicket = await marketInstance.buyTickets(
            jjLinEventID,
            specialCategoryID,
            1,
            { from: accounts[3], value: oneEth }
        );

        truffleAssert.eventEmitted(buyTicket, "TicketBought");
        let ticketId = buyTicket["logs"][0]["args"][0];

        await truffleAssert.fails(
            resellMarketInstance.list(ticketId, oneEth, { from: accounts[3] }),
            truffleAssert.ErrorType.REVERT,
            "Ticket category is not resellable, ticket cannot be listed"
        );
    });

    it("Test 12: Non-ticket owner cannot unlist ticket from resell market", async () => {
        await truffleAssert.fails(
            resellMarketInstance.unlist(jjLinVipTicketID, {
                from: accounts[4],
            }),
            truffleAssert.ErrorType.REVERT,
            "Wrong owner"
        );
    });

    it("Test 13: Owner can unlist ticket on resell market", async () => {
        let unlistTicketOnResellMarket = await resellMarketInstance.unlist(
            jjLinVipTicketID,
            { from: accounts[3] }
        );
        truffleAssert.eventEmitted(
            unlistTicketOnResellMarket,
            "ticketUnlisted"
        );
    });

    it("Test 14: User cannot buy a ticket on the resell market with insufficient money", async () => {
        let listTicketOnResellMarket = await resellMarketInstance.list(
            jjLinVipTicketID,
            oneEth,
            { from: accounts[3] }
        );
        truffleAssert.eventEmitted(listTicketOnResellMarket, "ticketListed");

        await truffleAssert.fails(
            resellMarketInstance.buy(jjLinVipTicketID, {
                from: accounts[4],
                value: oneEth.dividedBy(10),
            }),
            truffleAssert.ErrorType.REVERT,
            "Insufficient money to buy the ticket"
        );
    });

    it("Test 15: User cannot buy a unlisted ticket on resell market", async () => {
        await truffleAssert.fails(
            resellMarketInstance.buy(jayChouVipTicketID, {
                from: accounts[4],
                value: oneEth,
            }),
            truffleAssert.ErrorType.REVERT,
            "Ticket not listed!"
        );
    });

    it("Test 16: Users can submit offers for a ticket on the resell market", async () => {
        let ticketOffer1 = await resellMarketInstance.offer(jjLinVipTicketID, {
            from: accounts[4],
            value: oneEth.dividedBy(5),
        });
        truffleAssert.eventEmitted(ticketOffer1, "offerSubmitted");
        let ticketOffer2 = await resellMarketInstance.offer(jjLinVipTicketID, {
            from: accounts[5],
            value: oneEth.dividedBy(2),
        });
        truffleAssert.eventEmitted(ticketOffer2, "offerSubmitted");
    });

    it("Test 17: Users cannot submit a lower bid", async () => {
        // highest bid should be 0.5 eth now
        let highestBid = await resellMarketInstance.checkHighestBidPrice.call(
            jjLinVipTicketID
        );
        assert.equal(highestBid.toString(), web3.utils.toWei("0.5", "ether"));
        await truffleAssert.fails(
            resellMarketInstance.offer(jjLinVipTicketID, {
                from: accounts[4],
                value: oneEth.dividedBy(5),
            }),
            truffleAssert.ErrorType.REVERT,
            "Offer price <= current highest bid price"
        );
    });

    it("Test 18: Original ticket owner can accept the highest bid", async () => {
        let acceptHighestBid = await resellMarketInstance.settleOffer(
            jjLinVipTicketID,
            { from: accounts[3] }
        );
        truffleAssert.eventEmitted(acceptHighestBid, "offersSettled");
        let newOwner = await ticketInstance.getTicketOwner.call(
            jjLinVipTicketID
        );
        assert.equal(newOwner, accounts[5]);
    });
});
