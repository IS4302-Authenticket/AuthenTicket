const User = artifacts.require("User");
const Event = artifacts.require("Event");
const Ticket = artifacts.require("Ticket");
const TicketFactory = artifacts.require("TicketFactory");
const TicketNFT = artifacts.require("TicketNFT");
const Market = artifacts.require("Market");
const ResellMarket = artifacts.require("ResellMarket");


//need to deploy market and resell market 

module.exports = (deployer, network, accounts) => {
    deployer.deploy(User).then(
      function() {
        return deployer.deploy(Event, User.address);
      }
    ).then(
      function() {
        return deployer.deploy(Ticket, User.address, Event.address);
      }
    ).then(
      function(){
        return deployer.deploy(TicketFactory, User.address, Event.address);
      }
    ).then(
      function(){
        return deployer.deploy(TicketNFT, User.address, Event.address,TicketFactory.address );
      }
    ).then(
      function(){
        return deployer.deploy(Market, TicketFactory.address, TicketNFT.address, User.address, Event.address);
      }
    ).then(
      function(){
        return deployer.deploy(ResellMarket, TicketNFT.address, TicketFactory.address, User.address);
    
    });
  };