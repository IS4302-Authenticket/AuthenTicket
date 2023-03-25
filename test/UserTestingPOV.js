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
contract ('Authenticket - User Testing POV', function(accounts){

    // waits for 2 contracts to be deployed before testing can occur
    before( async() => {
        userInstance = await User.deployed();
        eventInstance = await Event.deployed();
        ticketInstance = await TicketNFT.deployed();
    });

    console.log("Testing Authenticket application");

    
    // Test: Initialization stage where we create all the stuff 
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

        // Let account 2 create an Event
        let JayChouEvent = await eventInstance.createEvent(
            'JayChou', 100,
            {from: accounts[2]}
            );

    });

    // Test: Check that events are created with correct event owners
    it('Check event owners', async() =>{


    });

   

})