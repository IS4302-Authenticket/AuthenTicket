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
contract("Authenticket - User Testing POV", function (accounts) {
  // waits for 2 contracts to be deployed before testing can occur
  before(async () => {
    userInstance = await User.deployed();
    eventInstance = await Event.deployed();
    ticketInstance = await TicketNFT.deployed();
    ticketFactoryInstance = await TicketFactory.deployed();
    marketInstance = await Market.deployed();
  });

  console.log("Testing Authenticket application");

  /*
    // Test 1: Initialization stage where we create all the stuff 
    it('Initialization Stage', async() =>{

        //set the admin 
        let account1Admin = await userInstance.setAdmin(
            accounts[1],
            {from: accounts[0]}
        );

        //Set the Organiser
        let account2Organiser = await userInstance.setOrganiser(
            accounts[2],
            {from: accounts[1]}
        );

        //set the user
        let account3User = await userInstance.setUser(
            accounts[3],
            {from: accounts[1]}
        );

        // Let account 2 create an Event, returns a uint256 but it is too big for js so need bn 
        let JayChouEvent = await eventInstance.createEvent(
            "JayChou", 1000,
            {from: accounts[2]}
            );
        
        truffleAssert.eventEmitted(JayChouEvent, "EventCreated");

        //cast event ID to BN because too big for JS 
        let JayChouEventBN = new BigNumber(JayChouEvent['logs'][0]['args']['1']);

        //list the event using BN, doesnt return anything just calls an event  
        let listJayChouEvent = await marketInstance.listEvent(JayChouEventBN, {from: accounts[2]});

        //make the cat A tickets, resellable, returns uint256 -> 1 
        let catAJayChouEvent = await ticketFactoryInstance.createTicketCategory(
            JayChouEventBN,     // uint256 eventID in BN,
            "A",            // string memory categoryName,
            20,            // uint256 ticketPrice,
            500,            // uint256 totalSupply,
            250,            // uint256 priceCap,
            true,           // bool isResellable,
            5,              // uint256 maxTixPerUser
            {from: accounts[2]}
        )

        truffleAssert.eventEmitted(catAJayChouEvent, "TicketCreated");
        //BN form of jaychou cat A ticket ID 
        let catAJayChouEventBN = new BigNumber(catAJayChouEvent['logs'][0]['args']['0']);

        let listCatAJayChou = await marketInstance.listTicket(JayChouEventBN, catAJayChouEventBN, {from: accounts[2]});
        truffleAssert.eventEmitted(listCatAJayChou, "TicketListed");

        
        //make the cat B tickets, not resellable
        let catBJayChouEvent = await ticketFactoryInstance.createTicketCategory(
            JayChouEventBN,     // uint256 eventID in BN,
            "B",            // string memory categoryName,
            20,            // uint256 ticketPrice,
            500,            // uint256 totalSupply,
            250,            // uint256 priceCap,
            false,           // bool isResellable,
            5,              // uint256 maxTixPerUser
            {from: accounts[2]}
        )
        truffleAssert.eventEmitted(catBJayChouEvent, "TicketCreated");
        //BN form of jaychou cat B ticket ID 
        let catBJayChouEventBN = new BigNumber(catBJayChouEvent['logs'][0]['args']['0']);

        let listCatBJayChou = await marketInstance.listTicket(JayChouEventBN, catBJayChouEventBN, {from: accounts[2]});
        truffleAssert.eventEmitted(listCatBJayChou, "TicketListed");
    });*/

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

    // Create jaychou event
    let createJayChouEvent = await eventInstance.createEvent("JayChou", 1000, {
      from: accounts[2],
    });
    truffleAssert.eventEmitted(createJayChouEvent, "EventCreated");

    let jayChouEventID = createJayChouEvent["logs"][0]["args"]["1"];
    //let str = web3.utils.asciiToHex(JayChouEventID);
    console.log("jaychoueventid: " + jayChouEventID);

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
        250, // uint256 priceCap,
        true, // bool isResellable,
        5, // uint256 maxTixPerUser
        { from: accounts[2] }
      );

    let jayChouVipCatID = new BigNumber(
      createVIPCatForJayChou["logs"][0]["args"]["0"]
    );
    console.log(jayChouVipCatID.toNumber());

    // list VIP ticket category in market
    let listVIPCatJayChou = await marketInstance.listTicket(
      jayChouEventID,
      jayChouVipCatID,
      { from: accounts[2] }
    );
    truffleAssert.eventEmitted(listVIPCatJayChou, "TicketListed");

    //console.log(listCatAJayChou);
    //acc3 buy cat A jay chou ticket , takes in eventId, ticketCategoryId, numTickets
    let acc3BuyJayChouVIPTicket = await marketInstance.buyTickets(
      jayChouEventID,
      jayChouVipCatID.toNumber(),
      2,
      { from: accounts[3], value: oneEth * 2 }
    );
    //truffleAssert.eventEmitted(acc3BuyJayChouVIPTicket,"TransferredOwnership");
    truffleAssert.eventEmitted(acc3BuyJayChouVIPTicket, "TicketBought");
  });

  //Test 2: User cannot buy more than number of tickets
  it("User cannot buy more than number of tickets avail for a category", async () => {
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

    // Create jaychou event
    let createJayChouEvent = await eventInstance.createEvent("JayChou", 1000, {
      from: accounts[2],
    });
    truffleAssert.eventEmitted(createJayChouEvent, "EventCreated");

    let jayChouEventID = createJayChouEvent["logs"][0]["args"]["1"];
    //let str = web3.utils.asciiToHex(JayChouEventID);
    console.log("jaychoueventid: " + jayChouEventID);

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
        1, // uint256 totalSupply,
        250, // uint256 priceCap,
        true, // bool isResellable,
        1, // uint256 maxTixPerUser
        { from: accounts[2] }
      );

    let jayChouVipCatID = new BigNumber(
      createVIPCatForJayChou["logs"][0]["args"]["0"]
    );
    //console.log(jayChouVipCatID.toNumber());

    // list VIP ticket category in market
    let listVIPCatJayChou = await marketInstance.listTicket(
      jayChouEventID,
      jayChouVipCatID,
      { from: accounts[2] }
    );
    truffleAssert.eventEmitted(listVIPCatJayChou, "TicketListed");

    //try to buy more tickets than is avaiable in the category
    truffleAssert.fails(
      marketInstance.buyTickets(jayChouEventID, jayChouVipCatID.toNumber(), 2, {
        from: accounts[3],
        value: oneEth * 2,
      }),
      truffleAssert.ErrorType.REVERT
    );
  });

  //more for event organiser user testing 
  it("cannot create more tickets for a category if it exceeds event max supply", async () => {
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

    // Create jaychou event with 10 tickets
    let createJayChouEvent = await eventInstance.createEvent("JayChou", 10, {
      from: accounts[2],
    });

    let jayChouEventID = createJayChouEvent["logs"][0]["args"]["1"];

    //List Event
    let listJayChouEvent = await marketInstance.listEvent(jayChouEventID, {
      from: accounts[2],
    });

    //make the VIP ticket with 10 total supply, equal to max supply
    let createVIPCatForJayChou =
      await ticketFactoryInstance.createTicketCategory(
        jayChouEventID, // bytes32,
        "VIP", // string memory categoryName,
        oneEth, // uint256 ticketPrice,
        5, // uint256 totalSupply,
        250, // uint256 priceCap,
        true, // bool isResellable,
        5, // uint256 maxTixPerUser
        { from: accounts[2] }
      );

    let jayChouVipCatID = new BigNumber(
      createVIPCatForJayChou["logs"][0]["args"]["0"]
    );

    // list VIP ticket category in market
    let listVIPCatJayChou = await marketInstance.listTicket(
      jayChouEventID,
      jayChouVipCatID,
      { from: accounts[2] }
    );

    //make the normal ticket with 10 total supply, 10 more than max supply

    //try to list normal category ticket which throws exceeds max supply
    truffleAssert.fails(
      ticketFactoryInstance.createTicketCategory(
        jayChouEventID, // bytes32,
        "Normal", // string memory categoryName,
        oneEth, // uint256 ticketPrice,
        10, // uint256 totalSupply,
        250, // uint256 priceCap,
        true, // bool isResellable,
        5, // uint256 maxTixPerUser
        { from: accounts[2] }
      ),
      truffleAssert.ErrorType.REVERT
    );

  });

  

  it("Initialization Stage", async () => {});
});
