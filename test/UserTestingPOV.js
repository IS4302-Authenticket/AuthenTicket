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

    let account4User = await userInstance.setUser(accounts[4], {
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
  it("Test 2: User cannot buy more than number of tickets avail for a category", async () => {

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
    await truffleAssert.fails(
      marketInstance.buyTickets(jayChouEventID, jayChouVipCatID.toNumber(), 2, {
        from: accounts[3],
        value: oneEth * 2,
      }),
      truffleAssert.ErrorType.REVERT,
      "Max purchase limit for user reached"
    );
  });

  // possible Test 3: User cannot buy an unlisted ticket on market
//   it("Test 3: User cannot buy an unlisted ticket on market", async () => {
//     // Let organiser create an Event
//     let makeEvent = await eventInstance.createEvent(
//         // string memory eventNameInput, uint256 eventMaxCapacityInput
//         'JayChou', 1000,
//         {from: accounts[2]}
//     );
//     let eventNumber = makeEvent['logs'][0]['args']['1'];

//     // List event
//     let listEvent = await marketInstance.listEvent(eventNumber, {from: accounts[2]});
//     truffleAssert.eventEmitted(listEvent, "EventListed");

//      // Create event category A which will be listed
//      let makeCategory = await ticketFactoryInstance.createTicketCategory(
//          eventNumber,     // btyes32 eventID,
//          "A",            // string memory categoryName,
//          oneEth,         // uint256 ticketPrice,
//          500,            // uint256 totalSupply,
//          250,            // uint256 priceCap,
//          true,           // bool isResellable,
//          5,              // uint256 maxTixPerUser
//          {from: accounts[2]}
//      )

//      let categoryNumber = new BigNumber(makeCategory["logs"][0]["args"]["0"]);

//      // List tickets
//      let listTicket = await marketInstance.listTicket(eventNumber, categoryNumber, {from: accounts[2]});

//      // Buy tickets
//      let buyTicket = await marketInstance.buyTickets(
//         eventNumber,
//         categoryNumber.toNumber(),
//         1,
//         { from: accounts[4], value: oneEth }
//       );
//      truffleAssert.eventEmitted(buyTicket, "TicketBought");

//      // Create event category B which won't be listed
//      let makeCategory2 = await ticketFactoryInstance.createTicketCategory(
//         eventNumber,     // btyes32 eventID,
//         "B",            // string memory categoryName,
//         oneEth,         // uint256 ticketPrice,
//         500,            // uint256 totalSupply,
//         250,            // uint256 priceCap,
//         true,           // bool isResellable,
//         5,              // uint256 maxTixPerUser
//         {from: accounts[2]}
//     )

//     let categoryNumber2 = new BigNumber(makeCategory2["logs"][0]["args"]["0"]);

//     await truffleAssert.fails(
//         marketInstance.buyTickets(eventNumber, categoryNumber2.toNumber(), 1, {
//           from: accounts[4],
//           value: oneEth,
//         }),
//         truffleAssert.ErrorType.REVERT,
//         "Ticket is not listed"
//       );
//   });


  it("Test 3: User cannot buy more tickets than the capped amount", async () => {

    // Create jaychou event with 10 tickets
    let createJayChouEvent = await eventInstance.createEvent("JayChou", 1000, {
      from: accounts[2],
    });

    let jayChouEventID = createJayChouEvent["logs"][0]["args"]["1"];

    //List Event
    let listJayChouEvent = await marketInstance.listEvent(jayChouEventID, {
      from: accounts[2],
    });

    //make the VIP ticket with 5 total supply, equal to max supply
    let createVIPCatForJayChou =
      await ticketFactoryInstance.createTicketCategory(
        jayChouEventID, // bytes32,
        "VIP", // string memory categoryName,
        oneEth, // uint256 ticketPrice,
        900, // uint256 totalSupply,
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

    truffleAssert.eventEmitted(listVIPCatJayChou, "TicketListed");

    //buy 5 tickets, the max amount
    let acc3BuyJayChouVIPTicket = await marketInstance.buyTickets(
      jayChouEventID, 
      jayChouVipCatID.toNumber(),
      1,
      { from: accounts[3], value: oneEth }
    );
    truffleAssert.eventEmitted(acc3BuyJayChouVIPTicket, "TicketBought");

    //fail to buy 10 more tickets
    await truffleAssert.fails(
      marketInstance.buyTickets(jayChouEventID, jayChouVipCatID.toNumber(), 10, 
      {
        from: accounts[3],
        value: oneEth*10,
      }),
      truffleAssert.ErrorType.REVERT
      //"Max purchase limit for user reached"
    );
  });

  it("Test 4: correct amount of money must be provided for user to buy tickets", async () => {

    // Create jaychou event with 10 tickets
    let createJayChouEvent = await eventInstance.createEvent("JayChou", 100, {
      from: accounts[2],
    });

    let jayChouEventID = createJayChouEvent["logs"][0]["args"]["1"];

    //List Event
    let listJayChouEvent = await marketInstance.listEvent(jayChouEventID, {
      from: accounts[2],
    });

    //create a VIP ticket with each ticket price = 2 eth
    let createVIPCatForJayChou =
      await ticketFactoryInstance.createTicketCategory(
        jayChouEventID, // bytes32,
        "VIP", // string memory categoryName,
        oneEth, // uint256 ticketPrice,
        50, // uint256 totalSupply,
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

    //fail to buy ticket with only 1 eth provided
    await truffleAssert.fails(
      marketInstance.buyTickets(jayChouEventID, jayChouVipCatID.toNumber(), 1, 
      {
        from: accounts[3],
        value: oneEth/2,
      }),
      truffleAssert.ErrorType.REVERT
      //"Incorrect amount of ether sent"
    );
  }) 

  it('Test 5: Check that tickets can be refunded', async() =>{
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
            eventNumber,    // btyes32 eventID,
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

        // Buy tickets
        let buyTicket = await marketInstance.buyTickets(eventNumber, categoryNumber.toNumber(), 1, {from: accounts[3], value: oneEth});
        console.log(buyTicket['logs'][0]['args'][0]);
        //console.log(buyTicket['logs'][0]['args'])

      
        truffleAssert.eventEmitted(buyTicket, "TicketBought");
        let ticketId = buyTicket['logs'][0]['args'][0];

        //let ticketId = web3.utils.padLeft(web3.utils.numberToHex(ticketIdBN.toNumber()), 64);  // convert to bytes
      
        // Refund the first ticket
        let refundTicket = await marketInstance.refundTickets(ticketId, {from: accounts[3], value: oneEth});
        truffleAssert.eventEmitted(refundTicket, "TicketRefunded");
     });
      
     it('Test 6: ticket that does not belong to buyer cannot be refunded', async() =>{
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
        eventNumber,    // btyes32 eventID,
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

    // Buy tickets
    let acc3buyTicket = await marketInstance.buyTickets(eventNumber, categoryNumber.toNumber(), 1, {from: accounts[3], value: oneEth});
  
    //truffleAssert.eventEmitted(buyTicket, "TicketBought");
    let acc3ticketId = acc3buyTicket['logs'][0]['args'][0];
  
    // Refund the first ticket
    await truffleAssert.fails(
      marketInstance.refundTickets(acc3ticketId, {from: accounts[4], value: oneEth}),
      truffleAssert.ErrorType.REVERT,
      "Wrong Owner!"
    );

 });

  it("Test 7: Buyer can list ticket in resell market", async () => {
  
    // Let organiser create an Event
    let makeEvent = await eventInstance.createEvent(
      // string memory eventNameInput, uint256 eventMaxCapacityInput
      "JayChou",
      1000,
      { from: accounts[2] }
    );
    let eventNumber = makeEvent["logs"][0]["args"]["1"];

    // List event
    let listEvent = await marketInstance.listEvent(eventNumber, {
      from: accounts[2],
    });
    truffleAssert.eventEmitted(listEvent, "EventListed");

    // Create event categories
    let makeCategory = await ticketFactoryInstance.createTicketCategory(
      eventNumber, // btyes32 eventID,
      "A", // string memory categoryName,
      oneEth, // uint256 ticketPrice,
      500, // uint256 totalSupply,
      oneEth, // uint256 priceCap,
      true, // bool isResellable,
      100, // uint256 maxTixPerUser
      { from: accounts[2] }
    );

    let categoryNumber = new BigNumber(makeCategory["logs"][0]["args"]["0"]);

    // List tickets
    let listTicket = await marketInstance.listTicket(
      eventNumber,
      categoryNumber,
      { from: accounts[2] }
    );
    truffleAssert.eventEmitted(listTicket, "TicketListed");

    // Buy tickets
    let buyTicket = await marketInstance.buyTickets(
      eventNumber,
      categoryNumber.toNumber(),
      1,
      { from: accounts[3], value: oneEth }
    );
    //console.log(buyTicket["logs"][0]["args"][0]);

    truffleAssert.eventEmitted(buyTicket, "TicketBought");
    let ticketId = buyTicket["logs"][0]["args"][0];

    let listTicketOnResellMarket = await resellMarketInstance.list(ticketId, oneEth.dividedBy(10), {from:accounts[3]})
    truffleAssert.eventEmitted(listTicketOnResellMarket, "ticketListed");
  });

  it("Test 8: Buyer cannot list more than capped amount for ticket in resell market", async () => {

    // Let organiser create an Event
    let makeEvent = await eventInstance.createEvent("JayChou",1000,{ from: accounts[2] });
    let eventNumber = makeEvent["logs"][0]["args"]["1"];

    // List event
    let listEvent = await marketInstance.listEvent(eventNumber, {from: accounts[2],});
    truffleAssert.eventEmitted(listEvent, "EventListed");

    // Create event categories
    let makeCategory = await ticketFactoryInstance.createTicketCategory(
      eventNumber, // btyes32 eventID,
      "A", // string memory categoryName,
      oneEth, // uint256 ticketPrice,
      500, // uint256 totalSupply,
      oneEth.dividedBy(10), // uint256 priceCap,
      true, // bool isResellable,
      100, // uint256 maxTixPerUser
      { from: accounts[2] }
    );

    let categoryNumber = new BigNumber(makeCategory["logs"][0]["args"]["0"]);

    // List tickets
    let listTicket = await marketInstance.listTicket(eventNumber,categoryNumber,{ from: accounts[2] });
    truffleAssert.eventEmitted(listTicket, "TicketListed");

    // Buy tickets
    let buyTicket = await marketInstance.buyTickets(
      eventNumber,
      categoryNumber.toNumber(),
      1,
      { from: accounts[3], value: oneEth }
    );

    truffleAssert.eventEmitted(buyTicket, "TicketBought");
    let ticketId = buyTicket["logs"][0]["args"][0];

    await truffleAssert.fails(
      resellMarketInstance.list(ticketId, oneEth, {from:accounts[3]}),
      truffleAssert.ErrorType.REVERT,
      "Price listing is over price cap!"
    );
  });
  
  it("Test 9: Buyer cannot list unresellable ticket", async () => {

    // Let organiser create an Event
    let makeEvent = await eventInstance.createEvent("JayChou",1000,{ from: accounts[2] });
    let eventNumber = makeEvent["logs"][0]["args"]["1"];

    // List event
    let listEvent = await marketInstance.listEvent(eventNumber, {from: accounts[2],});
    truffleAssert.eventEmitted(listEvent, "EventListed");

    // Create event categories
    let makeCategory = await ticketFactoryInstance.createTicketCategory(
      eventNumber, // btyes32 eventID,
      "A", // string memory categoryName,
      oneEth, // uint256 ticketPrice,
      500, // uint256 totalSupply,
      oneEth, // uint256 priceCap,
      false, // bool isResellable,
      100, // uint256 maxTixPerUser
      { from: accounts[2] }
    );

    let categoryNumber = new BigNumber(makeCategory["logs"][0]["args"]["0"]);

    // List tickets
    let listTicket = await marketInstance.listTicket(eventNumber,categoryNumber,{ from: accounts[2] });
    truffleAssert.eventEmitted(listTicket, "TicketListed");

    // Buy tickets
    let buyTicket = await marketInstance.buyTickets(
      eventNumber,
      categoryNumber.toNumber(),
      1,
      { from: accounts[3], value: oneEth }
    );

    truffleAssert.eventEmitted(buyTicket, "TicketBought");
    let ticketId = buyTicket["logs"][0]["args"][0];

    await truffleAssert.fails(
      resellMarketInstance.list(ticketId, oneEth, {from:accounts[3]}),
      truffleAssert.ErrorType.REVERT,
      "Ticket category is not resellable, ticket cannot be listed"
    );
  });

  it("Test 10: Buyer cannot list ticket that they did not buy", async () => {

    // Let organiser create an Event
    let makeEvent = await eventInstance.createEvent("JayChou",1000,{ from: accounts[2] });
    let eventNumber = makeEvent["logs"][0]["args"]["1"];

    // List event
    let listEvent = await marketInstance.listEvent(eventNumber, {from: accounts[2],});
    truffleAssert.eventEmitted(listEvent, "EventListed");

    // Create event categories
    let makeCategory = await ticketFactoryInstance.createTicketCategory(
      eventNumber, // btyes32 eventID,
      "A", // string memory categoryName,
      oneEth, // uint256 ticketPrice,
      500, // uint256 totalSupply,
      oneEth, // uint256 priceCap,
      true, // bool isResellable,
      100, // uint256 maxTixPerUser
      { from: accounts[2] }
    );

    let categoryNumber = new BigNumber(makeCategory["logs"][0]["args"]["0"]);

    // List tickets
    let listTicket = await marketInstance.listTicket(eventNumber,categoryNumber,{ from: accounts[2] });
    truffleAssert.eventEmitted(listTicket, "TicketListed");

    // Buy tickets
    let buyTicket = await marketInstance.buyTickets(
      eventNumber,
      categoryNumber.toNumber(),
      1,
      { from: accounts[3], value: oneEth }
    );

    truffleAssert.eventEmitted(buyTicket, "TicketBought");
    let ticketId = buyTicket["logs"][0]["args"][0];

    await truffleAssert.fails(
      resellMarketInstance.list(ticketId, oneEth, {from:accounts[4]}),
      truffleAssert.ErrorType.REVERT,
      "Wrong owner"
    );
  });
  
  it("Test 11: Buyer can unlist ticket", async () => {
     
    // Let organiser create an Event
    let makeEvent = await eventInstance.createEvent("JayChou",1000,{ from: accounts[2] });
    let eventNumber = makeEvent["logs"][0]["args"]["1"];

    // List event
    let listEvent = await marketInstance.listEvent(eventNumber, {from: accounts[2],});
    truffleAssert.eventEmitted(listEvent, "EventListed");

    // Create event categories
    let makeCategory = await ticketFactoryInstance.createTicketCategory(
      eventNumber, // btyes32 eventID,
      "A", // string memory categoryName,
      oneEth, // uint256 ticketPrice,
      500, // uint256 totalSupply,
      oneEth, // uint256 priceCap,
      true, // bool isResellable,
      100, // uint256 maxTixPerUser
      { from: accounts[2] }
    );

    let categoryNumber = new BigNumber(makeCategory["logs"][0]["args"]["0"]);

    // List tickets
    let listTicket = await marketInstance.listTicket(eventNumber,categoryNumber,{ from: accounts[2] });
    truffleAssert.eventEmitted(listTicket, "TicketListed");

    // Buy tickets
    let buyTicket = await marketInstance.buyTickets(
      eventNumber,
      categoryNumber.toNumber(),
      1,
      { from: accounts[3], value: oneEth }
    );

    truffleAssert.eventEmitted(buyTicket, "TicketBought");
    let ticketId = buyTicket["logs"][0]["args"][0];
    
    let listTicketOnResellMarket = await resellMarketInstance.list(ticketId, oneEth.dividedBy(10), {from:accounts[3]});
    truffleAssert.eventEmitted(listTicketOnResellMarket, "ticketListed");

    let unlistTicketOnResellMarket = await resellMarketInstance.unlist(ticketId, {from:accounts[3]});
    truffleAssert.eventEmitted(unlistTicketOnResellMarket, "ticketUnlisted");

  });

  it("Test 12: Only Buyer can unlist ticket", async () => {
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
   // Let organiser create an Event
   let makeEvent = await eventInstance.createEvent("JayChou",1000,{ from: accounts[2] });
   let eventNumber = makeEvent["logs"][0]["args"]["1"];

   // List event
   let listEvent = await marketInstance.listEvent(eventNumber, {from: accounts[2],});
   truffleAssert.eventEmitted(listEvent, "EventListed");

   // Create event categories
   let makeCategory = await ticketFactoryInstance.createTicketCategory(
     eventNumber, // btyes32 eventID,
     "A", // string memory categoryName,
     oneEth, // uint256 ticketPrice,
     500, // uint256 totalSupply,
     oneEth, // uint256 priceCap,
     true, // bool isResellable,
     100, // uint256 maxTixPerUser
     { from: accounts[2] }
   );

   let categoryNumber = new BigNumber(makeCategory["logs"][0]["args"]["0"]);

   // List tickets
   let listTicket = await marketInstance.listTicket(eventNumber,categoryNumber,{ from: accounts[2] });
   truffleAssert.eventEmitted(listTicket, "TicketListed");

   // Buy tickets
   let buyTicket = await marketInstance.buyTickets(
     eventNumber,
     categoryNumber.toNumber(),
     1,
     { from: accounts[3], value: oneEth }
   );

   truffleAssert.eventEmitted(buyTicket, "TicketBought");
   let ticketId = buyTicket["logs"][0]["args"][0];
   
   let listTicketOnResellMarket = await resellMarketInstance.list(ticketId, oneEth.dividedBy(10), {from:accounts[3]});
   truffleAssert.eventEmitted(listTicketOnResellMarket, "ticketListed");

   await truffleAssert.fails(
    resellMarketInstance.unlist(ticketId, {from:accounts[4]}),
    truffleAssert.ErrorType.REVERT,
    "Wrong owner"
    );
 });

  it("Test 13: Buyer can only list ticket that they bought", async () => {
   
    // Let organiser create an Event
    let makeEvent = await eventInstance.createEvent("JayChou", 1000, {
      from: accounts[2],
    });
    let eventNumber = makeEvent["logs"][0]["args"]["1"];

    // List event
    let listEvent = await marketInstance.listEvent(eventNumber, {
      from: accounts[2],
    });
    truffleAssert.eventEmitted(listEvent, "EventListed");

    // Create event categories
    let makeCategory = await ticketFactoryInstance.createTicketCategory(
      eventNumber, // btyes32 eventID,
      "A", // string memory categoryName,
      oneEth, // uint256 ticketPrice,
      500, // uint256 totalSupply,
      oneEth, // uint256 priceCap,
      true, // bool isResellable,
      100, // uint256 maxTixPerUser
      { from: accounts[2] }
    );

    let categoryNumber = new BigNumber(makeCategory["logs"][0]["args"]["0"]);

    // List tickets
    let listTicket = await marketInstance.listTicket(
      eventNumber,
      categoryNumber,
      { from: accounts[2] }
    );
    truffleAssert.eventEmitted(listTicket, "TicketListed");

    // Buy tickets
    let buyTicket = await marketInstance.buyTickets(
      eventNumber,
      categoryNumber.toNumber(),
      1,
      { from: accounts[3], value: oneEth }
    );

    truffleAssert.eventEmitted(buyTicket, "TicketBought");
    let ticketId = buyTicket["logs"][0]["args"][0];

    await truffleAssert.fails(
      resellMarketInstance.list(
        ticketId,
        oneEth.dividedBy(10),
        { from: accounts[4] }
      ),
      truffleAssert.ErrorType.REVERT,
      "Wrong owner"
      );
  });

  it("Test 14: Buyer can buy a ticket on the resell market", async () => {
   
    // Let organiser create an Event
    let makeEvent = await eventInstance.createEvent("JayChou", 1000, {
      from: accounts[2],
    });
    let eventNumber = makeEvent["logs"][0]["args"]["1"];

    // List event
    let listEvent = await marketInstance.listEvent(eventNumber, {
      from: accounts[2],
    });
    truffleAssert.eventEmitted(listEvent, "EventListed");

    // Create event categories
    let makeCategory = await ticketFactoryInstance.createTicketCategory(
      eventNumber, // btyes32 eventID,
      "A", // string memory categoryName,
      oneEth, // uint256 ticketPrice,
      500, // uint256 totalSupply,
      oneEth, // uint256 priceCap,
      true, // bool isResellable,
      100, // uint256 maxTixPerUser
      { from: accounts[2] }
    );

    let categoryNumber = new BigNumber(makeCategory["logs"][0]["args"]["0"]);

    // List tickets
    let listTicket = await marketInstance.listTicket(
      eventNumber,
      categoryNumber,
      { from: accounts[2] }
    );
    truffleAssert.eventEmitted(listTicket, "TicketListed");

    // Buy tickets
    let buyTicket = await marketInstance.buyTickets(
      eventNumber,
      categoryNumber.toNumber(),
      1,
      { from: accounts[3], value: oneEth }
    );

    truffleAssert.eventEmitted(buyTicket, "TicketBought");
    let ticketId = buyTicket["logs"][0]["args"][0];

    let listTicketOnResellMarket = await resellMarketInstance.list(ticketId, oneEth.dividedBy(10), {from:accounts[3]});
    truffleAssert.eventEmitted(listTicketOnResellMarket, "ticketListed");

    let buyTicketonResellMarket = await resellMarketInstance.buy(ticketId, {from:accounts[4], value:oneEth.dividedBy(10)});
    truffleAssert.eventEmitted(buyTicketonResellMarket, "ticketBought");
  });

  it("Test 15: Buyer cannot buy a ticket on resell market with insufficient money", async () => {
  
    // Let organiser create an Event
    let makeEvent = await eventInstance.createEvent("JayChou", 1000, {
      from: accounts[2],
    });
    let eventNumber = makeEvent["logs"][0]["args"]["1"];

    // List event
    let listEvent = await marketInstance.listEvent(eventNumber, {
      from: accounts[2],
    });
    truffleAssert.eventEmitted(listEvent, "EventListed");

    // Create event categories
    let makeCategory = await ticketFactoryInstance.createTicketCategory(
      eventNumber, // btyes32 eventID,
      "A", // string memory categoryName,
      oneEth, // uint256 ticketPrice,
      500, // uint256 totalSupply,
      oneEth, // uint256 priceCap,
      true, // bool isResellable,
      100, // uint256 maxTixPerUser
      { from: accounts[2] }
    );

    let categoryNumber = new BigNumber(makeCategory["logs"][0]["args"]["0"]);

    // List tickets
    let listTicket = await marketInstance.listTicket(
      eventNumber,
      categoryNumber,
      { from: accounts[2] }
    );
    truffleAssert.eventEmitted(listTicket, "TicketListed");

    // Buy tickets
    let buyTicket = await marketInstance.buyTickets(
      eventNumber,
      categoryNumber.toNumber(),
      1,
      { from: accounts[3], value: oneEth }
    );

    truffleAssert.eventEmitted(buyTicket, "TicketBought");
    let ticketId = buyTicket["logs"][0]["args"][0];

    let listTicketOnResellMarket = await resellMarketInstance.list(ticketId, oneEth.dividedBy(10), {from:accounts[3]});
    truffleAssert.eventEmitted(listTicketOnResellMarket, "ticketListed");

    await truffleAssert.fails(
      resellMarketInstance.buy(ticketId, {from:accounts[4], value:oneEth.dividedBy(100)}),
      truffleAssert.ErrorType.REVERT,
      "Insufficient money to buy the ticket"
      );
    
  });

  it("Test 16: Buyer cannot buy a unlisted ticket on resell market", async () => {
   
    // Let organiser create an Event
    let makeEvent = await eventInstance.createEvent("JayChou", 1000, {
      from: accounts[2],
    });
    let eventNumber = makeEvent["logs"][0]["args"]["1"];

    // List event
    let listEvent = await marketInstance.listEvent(eventNumber, {
      from: accounts[2],
    });
    truffleAssert.eventEmitted(listEvent, "EventListed");

    // Create event categories
    let makeCategory = await ticketFactoryInstance.createTicketCategory(
      eventNumber, // btyes32 eventID,
      "A", // string memory categoryName,
      oneEth, // uint256 ticketPrice,
      500, // uint256 totalSupply,
      oneEth, // uint256 priceCap,
      true, // bool isResellable,
      100, // uint256 maxTixPerUser
      { from: accounts[2] }
    );

    let categoryNumber = new BigNumber(makeCategory["logs"][0]["args"]["0"]);

    // List tickets
    let listTicket = await marketInstance.listTicket(
      eventNumber,
      categoryNumber,
      { from: accounts[2] }
    );
    truffleAssert.eventEmitted(listTicket, "TicketListed");

    // Buy tickets
    let buyTicket = await marketInstance.buyTickets(
      eventNumber,
      categoryNumber.toNumber(),
      1,
      { from: accounts[3], value: oneEth }
    );

    truffleAssert.eventEmitted(buyTicket, "TicketBought");
    let ticketId = buyTicket["logs"][0]["args"][0];


    await truffleAssert.fails(
      resellMarketInstance.buy(ticketId, {from:accounts[4], value:oneEth}),
      truffleAssert.ErrorType.REVERT,
      "Ticket not listed!"
      );

    });
});
