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

// Testing with a POV of an Admin 
contract ('Authenticket - Admin Testing POV', function(accounts){

    // waits for 2 contracts to be deployed before testing can occur
    before( async() => {
        userInstance = await User.deployed();
        eventInstance = await Event.deployed();
        ticketInstance = await TicketNFT.deployed();
    });

    function isRejected(promise) {
        return promise.then(() => false, () => true);
      }

    console.log("Testing Authenticket application from Admin user POV");

    it('Test 1: Test that contract master is the first account', async() => {
       /* let masterTest1 = await userInstance.checkAdmin(
            accounts[0],
            {from: accounts[0]}
        );
        let masterTest2 = await userInstance.checkOrganiser(
            accounts[0],
            {from: accounts[0]}
        );
        let masterTest3 = await userInstance.checkUser(
            accounts[0],
            {from: accounts[0]}
        );
        //master cannot be any of the above users 
        assert(masterTest1 == false, '1st test that deployer is User contract master failed');
        assert(masterTest2 == false, '2nd test that deployer is User contract master failed');
        assert(masterTest3 == false, '3rd test that deployer is User contract master failed');
        */
        //only master can set admin
        let setAdmin = await userInstance.setAdmin(
            accounts[1],
            {from: accounts[0]}
        );
        let checkAdmin = await userInstance.checkAdmin(
            accounts[1],
            {from: accounts[0]}
        );
        assert(checkAdmin == true, '4th test that deployer is User contract master failed');
    })
    // Test: Test User contract setAdmin
    it('Test 2: Test if setting admin works', async() =>{

        //only master can set admin 
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
    it('Test 3: Test if setting organiser works', async() =>{

        //Only admin can set organiser
        let setOrganiser = await userInstance.setOrganiser(
            accounts[2],
            {from: accounts[1]}
        );
        let checkOrganiser = await userInstance.checkOrganiser(
            accounts[2],
            {from: accounts[1]}
        );
        assert(checkOrganiser == true, 'Test User contract setOrganiser failed');
    });

    // Test: Test User contract set User
    it('Test 4: Test User contract set User', async() =>{

        let setUserByMaster = await userInstance.setUser(
            accounts[3],
            {from: accounts[0]}
        );
        let setUserByAdmin = await userInstance.setUser(
            accounts[3],
            {from: accounts[1]}
        );
        let setUserByOrganiser = await userInstance.setUser(
            accounts[3],
            {from: accounts[2]}
        );

        let checkUserByMaster = await userInstance.checkUser(
            accounts[3],
            {from: accounts[0]}
        );
        let checkUserByAdmin = await userInstance.checkUser(
            accounts[3],
            {from: accounts[1]}
        );
        let checkUserByOrganiser = await userInstance.checkUser(
            accounts[3],
            {from: accounts[2]}
        );
        assert(checkUserByMaster == true, 'Master supposed to be able to set user');
        assert(checkUserByAdmin == true, 'Admin supposed to be able to set user');
        assert(checkUserByOrganiser == true, 'Organiser supposed to be able to set user');
    });

    //if got time, check how to assert for modifier 
    /*it('Test 5: Check that only Master can set admin', async()=>{
        let setAdminByAdmin = await userInstance.setAdmin(
            accounts[4],
            {from: accounts[1]}
        );

        let setAdminByOrganiser = await userInstance.setAdmin(
            accounts[4],
            {from: accounts[2]}
        );

        let setAdminByUser = await userInstance.setAdmin(
            accounts[4],
            {from: accounts[3]}
        );

        assert.expect(setAdminByAdmin.to.be.rejected);

        let checkAdmin = await userInstance.checkAdmin(
            accounts[1],
            {from: accounts[0]}
        );
    })*/


})